import { Dataset } from '../types/dashboard';
import {
  BusinessTemplateId,
  ForecastConfiguration,
  ForecastMode,
  ForecastRecord,
  ForecastReliability,
} from '../types/forecast';
import { parseFlexibleDateIso, parseFlexibleNumeric } from './forecastAccuracy';

export interface GroupVolumeRank {
  groupValue: string;
  totalVolume: number;
  rowCount: number;
  uniqueDatesCount: number;
}

export interface GroupForecastBatchItem {
  groupValue: string;
  status: 'completed' | 'skipped' | 'failed';
  skipReason?: string;
  forecastId?: string;
  forecast?: ForecastRecord;
  lastActual?: number | null;
  forecastTotal?: number | null;
  changePct?: number | null;
  reliability?: ForecastReliability | null;
}

/**
 * Extracts up to `limit` (default 50) distinct non-empty values for `groupColumn`
 * ranked descending by total target volume.
 */
export function rankTopGroupsByVolume(
  dataset: Dataset | null,
  dateColumn: string,
  targetColumn: string,
  groupColumn: string,
  limit = 50,
): GroupVolumeRank[] {
  if (!dataset || !dateColumn || !targetColumn || !groupColumn) return [];
  const rows = Array.isArray(dataset.cleanedData) ? dataset.cleanedData : dataset.data;
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const buckets = new Map<string, { volume: number; rowCount: number; dates: Set<string> }>();

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const rawGroup = row[groupColumn];
    if (rawGroup === null || rawGroup === undefined) continue;
    const groupVal = String(rawGroup).trim();
    if (!groupVal) continue;

    let entry = buckets.get(groupVal);
    if (!entry) {
      entry = { volume: 0, rowCount: 0, dates: new Set<string>() };
      buckets.set(groupVal, entry);
    }
    entry.rowCount += 1;

    const dt = parseFlexibleDateIso(row[dateColumn]);
    const num = parseFlexibleNumeric(row[targetColumn]);
    if (dt && num !== null) {
      entry.dates.add(dt);
      entry.volume += Math.abs(num);
    }
  }

  return Array.from(buckets.entries())
    .map(([groupValue, info]) => ({
      groupValue,
      totalVolume: info.volume,
      rowCount: info.rowCount,
      uniqueDatesCount: info.dates.size,
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume || b.rowCount - a.rowCount)
    .slice(0, limit);
}

export async function runBatchGroupForecasts(params: {
  dataset: Dataset;
  baseName: string;
  mode: ForecastMode;
  businessTemplate: BusinessTemplateId | null;
  config: ForecastConfiguration;
  maxConcurrentJobs?: number;
  signal?: AbortSignal;
  runGroupForecast: (
    payload: {
      name: string;
      mode: ForecastMode;
      businessTemplate: BusinessTemplateId | null;
      datasetId: string;
      configuration: ForecastConfiguration;
      runImmediately: true;
    },
    signal?: AbortSignal,
  ) => Promise<ForecastRecord>;
  onProgress?: (completed: number, total: number, currentGroup?: string) => void;
}): Promise<GroupForecastBatchItem[]> {
  const {
    dataset,
    baseName,
    mode,
    businessTemplate,
    config,
    maxConcurrentJobs = 3,
    signal,
    runGroupForecast,
    onProgress,
  } = params;

  const groupColumn = config.groupColumn;
  if (!groupColumn) return [];

  const rankedGroups = rankTopGroupsByVolume(
    dataset,
    config.dateColumn,
    config.targetColumn,
    groupColumn,
    50,
  );
  if (rankedGroups.length === 0) return [];

  const results: Array<GroupForecastBatchItem | undefined> = new Array(rankedGroups.length);
  const workerLimit = Math.max(1, Math.min(2, maxConcurrentJobs));
  let nextIdx = 0;
  let completedCount = 0;

  onProgress?.(0, rankedGroups.length, rankedGroups[0]?.groupValue);

  async function worker() {
    while (true) {
      if (signal?.aborted) break;
      const idx = nextIdx++;
      if (idx >= rankedGroups.length) break;
      const g = rankedGroups[idx];

      if (g.uniqueDatesCount < 4) {
        results[idx] = {
          groupValue: g.groupValue,
          status: 'skipped',
          skipReason: `Insufficient history (${g.uniqueDatesCount} valid dated observations; at least 4 required).`,
        };
        completedCount += 1;
        onProgress?.(completedCount, rankedGroups.length, g.groupValue);
        continue;
      }

      try {
        const fc = await runGroupForecast(
          {
            name: `${baseName} · ${g.groupValue}`,
            mode,
            businessTemplate,
            datasetId: dataset.id,
            configuration: {
              ...config,
              groupColumn,
              groupValue: g.groupValue,
            },
            runImmediately: true,
          },
          signal,
        );
        const latest = fc.latestResult;
        results[idx] = {
          groupValue: g.groupValue,
          status: 'completed',
          forecastId: fc.id,
          forecast: fc,
          lastActual: latest?.summary?.lastActualValue ?? null,
          forecastTotal: latest?.summary?.totalForecastedValue ?? null,
          changePct: latest?.summary?.projectedChangePct ?? null,
          reliability: latest?.reliability ?? null,
        };
      } catch (err: any) {
        if (err?.name === 'AbortError' || signal?.aborted) {
          break;
        }
        const code = err?.code;
        const msg = err?.message || 'Could not forecast this group.';
        const isInsufficient =
          code === 'INSUFFICIENT_HISTORY' ||
          code === 'TOO_MANY_MISSING_PERIODS' ||
          code === 'INSUFFICIENT_SEASONAL_HISTORY' ||
          code === 'NEEDS_FREQUENCY_OVERRIDE' ||
          /at least \d+|insufficient/i.test(msg);

        results[idx] = {
          groupValue: g.groupValue,
          status: isInsufficient ? 'skipped' : 'failed',
          skipReason: msg,
        };
      }
      completedCount += 1;
      onProgress?.(completedCount, rankedGroups.length, g.groupValue);
    }
  }

  await Promise.all(Array.from({ length: Math.min(workerLimit, rankedGroups.length) }, () => worker()));
  return results.filter((item): item is GroupForecastBatchItem => Boolean(item));
}
