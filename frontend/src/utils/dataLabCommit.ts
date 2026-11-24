import { Dataset } from '../types/dashboard';
import { QueryModel } from '../types/dataCleaning';
import { evaluatePipeline, isCellError } from './transformationEngine';

export const DATA_LAB_SAVE_TIMEOUT_MS = 90_000;

/**
 * Returns true if the query has steps beyond the initial Source step or is newly created/not yet in initialIds.
 */
export function hasQueryChanges(
  query: QueryModel,
  initialIds: Set<string>,
  alreadyPersistedIds?: Set<string>
): boolean {
  const datasetId = query.originalDatasetId || query.id;
  const hasAddedSteps = query.steps.some((s) => s.type !== 'source');
  if (hasAddedSteps) return true;
  if (!initialIds.has(datasetId) && !alreadyPersistedIds?.has(datasetId)) {
    return true;
  }
  return false;
}

/**
 * Evaluates a single QueryModel and constructs the PostgreSQL-ready Dataset payload:
 * - Cleaned rows with cell errors sanitized to null
 * - Row keys and `columns` array strictly ordered according to the evaluated pipeline columns
 * - Full cleaningPipeline log (appended to any prior pipeline from baseDataset)
 * - Preserves `uploadedAt` and metadata on existing datasets so nothing is overwritten needlessly
 * - Clears `cleanedData: null` so `data` is the single source of truth and payload size is not doubled
 */
export function buildCleanedDatasetPayload(query: QueryModel, baseDataset?: Dataset): Dataset {
  const finalEval = evaluatePipeline(
    query.rawRows,
    query.steps,
    query.steps[query.steps.length - 1]?.id
  );

  const orderedColumnNames = finalEval.columns.map((c) => c.name);

  const sanitizedRows = finalEval.rows.map((row) => {
    const cleanRow: Record<string, any> = {};
    for (const colName of orderedColumnNames) {
      const v = row[colName];
      cleanRow[colName] = isCellError(v) ? null : v;
    }
    return cleanRow;
  });

  const cols = finalEval.columns.map((col) => {
    const isNum = ['Whole Number', 'Decimal Number', 'Percentage', 'Currency'].includes(col.dataType);
    const isDt = ['Date', 'Date/Time', 'Time'].includes(col.dataType);
    return {
      name: col.name,
      type: isNum ? ('number' as const) : isDt ? ('date' as const) : ('string' as const),
      sampleValue: sanitizedRows[0]?.[col.name] ?? null,
    };
  });

  const prior = baseDataset?.cleaningPipeline || [];
  const sessionSteps = query.steps
    .filter((st) => st.type !== 'source')
    .map(({ id, name, type, description, params }) => ({ id, name, type, description, params }));

  const nextPipeline = sessionSteps.length > 0 ? [...prior, ...sessionSteps] : prior;

  return {
    ...(baseDataset || {}),
    id: query.originalDatasetId || query.id,
    name: query.name,
    rowCount: sanitizedRows.length,
    columnCount: cols.length,
    columns: cols,
    data: sanitizedRows,
    cleanedData: null as any,
    uploadedAt: baseDataset?.uploadedAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
    sourceType: query.sourceType,
    cleaningPipeline: nextPipeline,
  };
}

/**
 * Selects only the dirty or newly created queries that must be persisted to the database.
 * Excludes untouched datasets and datasets already persisted in an earlier partial batch (unless explicitly retried).
 */
export function selectDirtyDatasetsToSave(params: {
  queries: QueryModel[];
  initialDatasets: Dataset[];
  alreadySavedIds?: Set<string>;
  alreadyPersistedImportIds?: Set<string>;
  specificIdsToSave?: string[];
}): Dataset[] {
  const { queries, initialDatasets, alreadySavedIds, alreadyPersistedImportIds, specificIdsToSave } = params;
  const initialById = new Map(initialDatasets.map((d) => [d.id, d]));
  const initialIds = new Set(initialDatasets.map((d) => d.id));
  const specificSet = specificIdsToSave && specificIdsToSave.length > 0 ? new Set(specificIdsToSave) : null;

  const targets: Dataset[] = [];
  for (const q of queries) {
    const datasetId = q.originalDatasetId || q.id;
    if (specificSet) {
      if (!specificSet.has(datasetId)) continue;
    } else {
      if (alreadySavedIds?.has(datasetId)) continue;
      if (!hasQueryChanges(q, initialIds, alreadyPersistedImportIds)) continue;
    }
    const base = initialById.get(datasetId);
    targets.push(buildCleanedDatasetPayload(q, base));
  }
  return targets;
}

export interface CommitFailure {
  id: string;
  name: string;
  message: string;
}

export interface CommitBatchResult {
  succeeded: Dataset[];
  failures: CommitFailure[];
}

/**
 * Persists a batch of dirty datasets sequentially with per-request AbortController timeout,
 * live progress updates, and resilient partial-failure reporting.
 */
export async function commitDirtyDatasets(params: {
  targets: Dataset[];
  saveFn: (dataset: Dataset, signal: AbortSignal) => Promise<Dataset>;
  timeoutMs?: number;
  timeoutMessage: string;
  fallbackErrorMessage: string;
  onProgress?: (current: number, total: number, dataset: Dataset) => void;
}): Promise<CommitBatchResult> {
  const {
    targets,
    saveFn,
    timeoutMs = DATA_LAB_SAVE_TIMEOUT_MS,
    timeoutMessage,
    fallbackErrorMessage,
    onProgress,
  } = params;

  const succeeded: Dataset[] = [];
  const failures: CommitFailure[] = [];

  for (let i = 0; i < targets.length; i++) {
    const targetDs = targets[i];
    onProgress?.(i + 1, targets.length, targetDs);

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      const savedFromDb = await saveFn(targetDs, controller.signal);
      succeeded.push(savedFromDb);
    } catch (err: any) {
      const isAbort = timedOut || err?.name === 'AbortError';
      const msg = isAbort ? timeoutMessage : err?.message || fallbackErrorMessage;
      failures.push({
        id: targetDs.id,
        name: targetDs.name,
        message: msg,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return { succeeded, failures };
}

/**
 * Pure helper for updating global datasets state with DB-returned records without touching untouched datasets.
 */
export function mergeUpdatedDatasets(existing: Dataset[], committed: Dataset[]): Dataset[] {
  if (committed.length === 0) return existing;
  const byId = new Map(committed.map((d) => [d.id, d]));
  const existingIds = new Set(existing.map((d) => d.id));
  const merged = existing.map((d) => byId.get(d.id) || d);
  for (const ds of committed) {
    if (!existingIds.has(ds.id)) {
      merged.push(ds);
    }
  }
  return merged;
}

/**
 * Pure helper for updating a dashboard's dataset references ONLY when the dashboard canvas is open
 * and one of its datasets was updated. Returns null if no dashboard datasets were affected.
 */
export function mergeDashboardDatasetsIfAffected(
  dashboardDatasets: Dataset[] | undefined,
  selectedDatasetIds: string[] | undefined,
  committed: Dataset[]
): Dataset[] | null {
  if (committed.length === 0) return null;
  const byId = new Map(committed.map((d) => [d.id, d]));
  const currentList = dashboardDatasets || [];
  const existingIds = new Set(currentList.map((d) => d.id));
  const selectedIds = new Set(selectedDatasetIds || []);

  let changed = currentList.some((d) => byId.has(d.id));
  const nextList = currentList.map((d) => byId.get(d.id) || d);

  for (const ds of committed) {
    if (!existingIds.has(ds.id) && selectedIds.has(ds.id)) {
      nextList.push(ds);
      changed = true;
    }
  }

  return changed ? nextList : null;
}

/**
 * Generates a unique step identifier once so `step.id` and `selectedStepId` always match.
 */
export function createUniqueStepId(prefix = 'step_source'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Removes a tab from the open query list and picks the adjacent neighbor if closing the active tab.
 */
export function closeQueryTab(
  queries: QueryModel[],
  activeId: string,
  idToClose: string
): { remaining: QueryModel[]; nextActiveId: string } {
  const idx = queries.findIndex((q) => q.id === idToClose);
  const remaining = queries.filter((q) => q.id !== idToClose);
  let nextActiveId = activeId;
  if (activeId === idToClose) {
    const nextActive = remaining[idx] || remaining[idx - 1] || remaining[0];
    nextActiveId = nextActive?.id || '';
  }
  return { remaining, nextActiveId };
}

/**
 * Resolves which dataset(s) should open initially as tabs when launching the Data Lab:
 * - Specific dataset ("Open in Data Lab"): opens ONLY that dataset.
 * - Dashboard ("Open Data Lab"): opens ONLY that dashboard's datasets.
 * - Fallback: all global datasets.
 */
export function resolveDataLabInitialDatasets(params: {
  targetDatasetId?: string;
  activePage: string;
  globalDatasets: Dataset[];
  dashboardDatasets: Dataset[];
}): Dataset[] {
  const { targetDatasetId, activePage, globalDatasets, dashboardDatasets } = params;
  if (targetDatasetId) {
    const match =
      globalDatasets.find((d) => d.id === targetDatasetId) ||
      dashboardDatasets.find((d) => d.id === targetDatasetId);
    return match ? [match] : [];
  }
  if (activePage === 'bench') {
    return dashboardDatasets;
  }
  return globalDatasets;
}
