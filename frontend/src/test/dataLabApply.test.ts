import { describe, it, expect, vi } from 'vitest';
import { Dataset } from '../types/dashboard';
import { QueryModel } from '../types/dataCleaning';
import {
  hasQueryChanges,
  buildCleanedDatasetPayload,
  selectDirtyDatasetsToSave,
  commitDirtyDatasets,
  mergeUpdatedDatasets,
  mergeDashboardDatasetsIfAffected,
} from '../utils/dataLabCommit';

const makeDataset = (id: string, name: string, extra: Partial<Dataset> = {}): Dataset => ({
  id,
  name,
  rowCount: 2,
  columnCount: 2,
  columns: [
    { name: 'Region', type: 'string', sampleValue: 'East' },
    { name: 'Sales', type: 'number', sampleValue: 10 },
  ],
  data: [
    { Region: 'East', Sales: 10 },
    { Region: 'West', Sales: 20 },
  ],
  uploadedAt: '2026-01-01 09:00',
  sourceType: 'csv',
  ...extra,
});

const makeQuery = (id: string, name: string, hasTransform = false): QueryModel => ({
  id,
  name,
  sourceType: 'csv',
  originalDatasetId: id,
  rawRows: [
    { Region: 'East', Sales: 10 },
    { Region: 'West', Sales: 20 },
  ],
  steps: hasTransform
    ? [
        { id: 's0', name: 'Source', type: 'source', description: '', mFormula: '', params: {} },
        {
          id: 's1',
          name: 'Moved column',
          type: 'move_column',
          description: '',
          mFormula: '',
          params: { column: 'Sales', direction: 'left' },
        },
      ]
    : [{ id: 's0', name: 'Source', type: 'source', description: '', mFormula: '', params: {} }],
  selectedStepId: hasTransform ? 's1' : 's0',
});

describe('Data Lab Apply & close commit pipeline', () => {
  it('selects only changed or newly created datasets, skipping untouched ones', () => {
    const d1 = makeDataset('ds_1', 'Untouched');
    const d2 = makeDataset('ds_2', 'Changed');
    const q1 = makeQuery('ds_1', 'Untouched', false);
    const q2 = makeQuery('ds_2', 'Changed', true);
    const qNew = makeQuery('ds_new', 'New Blank', false);

    expect(hasQueryChanges(q1, new Set(['ds_1', 'ds_2']))).toBe(false);
    expect(hasQueryChanges(q2, new Set(['ds_1', 'ds_2']))).toBe(true);
    expect(hasQueryChanges(qNew, new Set(['ds_1', 'ds_2']))).toBe(true);

    const targets = selectDirtyDatasetsToSave({
      queries: [q1, q2, qNew],
      initialDatasets: [d1, d2],
    });
    expect(targets.map((t) => t.id)).toEqual(['ds_2', 'ds_new']);
  });

  it('preserves column order, cleaning pipeline log, and existing uploadedAt without doubling payload', () => {
    const base = makeDataset('ds_2', 'Changed', {
      uploadedAt: '2025-11-05 14:22',
      cleanedData: [{ Region: 'Old', Sales: 999 }],
      cleaningPipeline: [{ id: 'prior_1', name: 'Trim', type: 'text_transform', description: '', params: {} }],
    });
    const q2 = makeQuery('ds_2', 'Changed', true);

    const payload = buildCleanedDatasetPayload(q2, base);
    expect(payload.uploadedAt).toBe('2025-11-05 14:22');
    expect(payload.columns.map((c) => c.name)).toEqual(['Sales', 'Region']);
    expect(Object.keys(payload.data[0])).toEqual(['Sales', 'Region']);
    expect(payload.cleanedData).toBeNull();
    expect(payload.cleaningPipeline?.map((s: any) => s.id)).toEqual(['prior_1', 's1']);
  });

  it('saves sequentially with progress, keeps succeeded saves on failure, and retries only failures', async () => {
    const targets = [
      makeDataset('ds_1', 'First'),
      makeDataset('ds_2', 'TooLarge'),
      makeDataset('ds_3', 'Third'),
    ];
    const progressCalls: Array<[number, number, string]> = [];

    const firstAttempt = await commitDirtyDatasets({
      targets,
      timeoutMessage: 'Timeout',
      fallbackErrorMessage: 'Failed',
      onProgress: (cur, tot, ds) => progressCalls.push([cur, tot, ds.id]),
      saveFn: async (ds) => {
        if (ds.id === 'ds_2') {
          throw new Error('Payload too large. Try a smaller file.');
        }
        return { ...ds, current_version_id: `v_${ds.id}` } as Dataset;
      },
    });

    expect(progressCalls).toEqual([
      [1, 3, 'ds_1'],
      [2, 3, 'ds_2'],
      [3, 3, 'ds_3'],
    ]);
    expect(firstAttempt.succeeded.map((s) => s.id)).toEqual(['ds_1', 'ds_3']);
    expect(firstAttempt.failures).toEqual([
      { id: 'ds_2', name: 'TooLarge', message: 'Payload too large. Try a smaller file.' },
    ]);

    // When retrying, ds_1 and ds_3 are skipped because they are already in alreadySavedIds
    const retryTargets = selectDirtyDatasetsToSave({
      queries: [
        makeQuery('ds_1', 'First', true),
        makeQuery('ds_2', 'TooLarge', true),
        makeQuery('ds_3', 'Third', true),
      ],
      initialDatasets: targets,
      alreadySavedIds: new Set(firstAttempt.succeeded.map((s) => s.id)),
      specificIdsToSave: firstAttempt.failures.map((f) => f.id),
    });
    expect(retryTargets.map((t) => t.id)).toEqual(['ds_2']);
  });

  it('aborts slow save requests cleanly on timeout with the timeout message', async () => {
    vi.useFakeTimers();
    try {
      const targets = [makeDataset('ds_slow', 'SlowDataset')];
      const promise = commitDirtyDatasets({
        targets,
        timeoutMs: 90_000,
        timeoutMessage: 'Request timed out after 90 seconds',
        fallbackErrorMessage: 'Fallback',
        saveFn: (_ds, signal) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => {
              const err = new Error('Aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }),
      });

      await vi.advanceTimersByTimeAsync(90_000);
      const res = await promise;
      expect(res.succeeded).toEqual([]);
      expect(res.failures).toEqual([
        { id: 'ds_slow', name: 'SlowDataset', message: 'Request timed out after 90 seconds' },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('updates global datasets with DB records and leaves unrelated dashboards untouched', () => {
    const untouched = makeDataset('ds_1', 'Untouched', { uploadedAt: '2025-01-01 00:00' });
    const oldEdited = makeDataset('ds_2', 'Edited', { rowCount: 2 });
    const dbReturned = makeDataset('ds_2', 'Edited', { rowCount: 1, current_version_id: 'v2' });

    const nextGlobal = mergeUpdatedDatasets([untouched, oldEdited], [dbReturned]);
    expect(nextGlobal[0]).toBe(untouched);
    expect(nextGlobal[1]).toBe(dbReturned);

    // Dashboard referencing ds_1 only should NOT be marked changed when ds_2 updates
    expect(mergeDashboardDatasetsIfAffected([untouched], ['ds_1'], [dbReturned])).toBeNull();

    // Dashboard referencing ds_2 IS updated with dbReturned without dropping ds_1
    const nextDash = mergeDashboardDatasetsIfAffected([untouched, oldEdited], ['ds_1', 'ds_2'], [dbReturned]);
    expect(nextDash).toEqual([untouched, dbReturned]);
  });
});
