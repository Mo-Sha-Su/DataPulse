/**
 * Forecast Studio API routes (/api/forecasts/*).
 * Enforces workspace authorization, source row caps, single in-flight run locking,
 * HTTP client abort propagation to Python subprocesses, and What-If scenario evaluation.
 */
import { Router } from 'express';
import { asyncHandler, validate } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';
import {
  forecastCreateSchema,
  forecastDetectSchema,
  forecastRunSchema,
  forecastScenarioSchema,
  forecastUpdateSchema,
} from '../schemas';
import * as datasetRepo from '../repositories/datasets';
import * as forecastRepo from '../repositories/forecasts';
import { FORECAST_LIMITS, runPythonEngine } from '../services/forecastRunner';
import { HttpError, badRequest, notFound } from '../lib/errors';

const router = Router();
router.use(requireAuth);

const EXECUTION_LEASE_MS = Math.max(FORECAST_LIMITS.timeoutMs + 15_000, 60_000);

/** Prefers Data Lab cleaned rows whenever cleanedData array exists (including intentional 0-row filter outputs). */
function getActiveRows(ds: NonNullable<Awaited<ReturnType<typeof datasetRepo.getDataset>>>) {
  return Array.isArray(ds.cleanedData) ? ds.cleanedData : ds.data;
}

/** Rejects excessively large datasets early before spawning a Python worker process. */
function assertDatasetRowLimit(rows: any[]) {
  const maxSourceRows = FORECAST_LIMITS.maxObservations * 5;
  if (rows.length > maxSourceRows) {
    throw new HttpError(
      400,
      `Dataset exceeds the forecasting limit of ${maxSourceRows.toLocaleString()} source rows (found ${rows.length.toLocaleString()}).`,
      'DATASET_TOO_LARGE',
      { rowCount: rows.length, maxSourceRows },
    );
  }
}

/** Sanitizes failure messages stored on `forecasts.error_message` to avoid leaking internal stack traces. */
function toSafeStoredError(err: any): string {
  if (err instanceof HttpError && err.status >= 400 && err.status < 500) {
    return err.message;
  }
  return 'Forecast execution failed.';
}

/** Ties an AbortController to premature HTTP response close so client cancellations kill Python subprocesses. */
function attachAbortSignal(_req: any, res: any): AbortController {
  const ac = new AbortController();
  res?.on?.('close', () => {
    if (!res.writableFinished) {
      ac.abort();
    }
  });
  return ac;
}

router.get('/limits', (_req, res) => {
  res.json({ success: true, limits: FORECAST_LIMITS });
});

router.post('/detect-frequency', validate(forecastDetectSchema), asyncHandler(async (req, res) => {
  const ws = req.workspaceId!;
  const ds = await datasetRepo.getDataset(ws, req.body.datasetId);
  if (!ds) throw notFound('Dataset not found');

  const rows = getActiveRows(ds);
  assertDatasetRowLimit(rows);
  const ac = attachAbortSignal(req, res);
  const detection = await runPythonEngine(
    {
      action: 'detect_frequency',
      rows,
      dateColumn: req.body.dateColumn,
      targetColumn: req.body.targetColumn,
      aggregation: req.body.aggregation,
      groupColumn: req.body.groupColumn ?? null,
      groupValue: req.body.groupValue ?? null,
    },
    { signal: ac.signal },
  );

  res.json({ success: true, detection });
}));

router.get('/', asyncHandler(async (req, res) => {
  const forecasts = await forecastRepo.listForecasts(req.workspaceId!);
  res.json({ success: true, forecasts });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const forecast = await forecastRepo.getForecast(req.workspaceId!, req.params.id);
  if (!forecast) throw notFound('Forecast not found');
  res.json({ success: true, forecast });
}));

router.post('/', validate(forecastCreateSchema), asyncHandler(async (req, res) => {
  const ws = req.workspaceId!;
  const userId = req.user!.id;
  const ds = await datasetRepo.getDataset(ws, req.body.datasetId);
  if (!ds) throw notFound('Dataset not found');

  const rows = getActiveRows(ds);
  if (req.body.runImmediately) {
    assertDatasetRowLimit(rows);
  }

  if (!req.body.runImmediately) {
    const forecast = await forecastRepo.createOrUpdateForecast(ws, userId, {
      id: req.body.id,
      name: req.body.name,
      mode: req.body.mode,
      businessTemplate: req.body.businessTemplate ?? null,
      datasetId: ds.id,
      datasetVersionId: ds.current_version_id ?? null,
      configuration: req.body.configuration,
      status: 'draft',
    });
    return res.status(201).json({ success: true, forecast });
  }

  const claim = await forecastRepo.claimCreateAndRunForecast(
    ws,
    userId,
    {
      id: req.body.id,
      name: req.body.name,
      mode: req.body.mode,
      businessTemplate: req.body.businessTemplate ?? null,
      datasetId: ds.id,
      datasetVersionId: ds.current_version_id ?? null,
      configuration: req.body.configuration,
    },
    EXECUTION_LEASE_MS,
  );

  if (!('forecast' in claim)) {
    if (claim.reason === 'not_found') throw notFound('Forecast not found');
    throw new HttpError(
      409,
      'A forecast run is already in progress for this forecast.',
      'FORECAST_ALREADY_RUNNING',
    );
  }

  const { forecast, executionToken } = claim;
  const ac = attachAbortSignal(req, res);
  try {
    const engineResult = await runPythonEngine(
      {
        action: 'run_forecast',
        rows,
        dateColumn: forecast.configuration.dateColumn,
        targetColumn: forecast.configuration.targetColumn,
        aggregation: forecast.configuration.aggregation,
        frequency: forecast.configuration.frequency,
        horizonDays: forecast.configuration.horizonDays,
        horizonSteps: forecast.configuration.horizonSteps ?? null,
        model: forecast.configuration.model,
        groupColumn: forecast.configuration.groupColumn ?? null,
        groupValue: forecast.configuration.groupValue ?? null,
        businessTemplate: forecast.businessTemplate,
        calendarEffects: forecast.configuration.calendarEffects ?? null,
      },
      { signal: ac.signal },
    );

    const completed = await forecastRepo.saveForecastRunSuccess(
      ws,
      forecast.id,
      ds.current_version_id ?? null,
      engineResult,
      executionToken,
      forecast.configuration,
    );
    return res.status(201).json({ success: true, forecast: completed });
  } catch (err: any) {
    await forecastRepo.markForecastRunFailed(ws, forecast.id, toSafeStoredError(err), executionToken);
    throw err;
  }
}));

router.put('/:id', validate(forecastUpdateSchema), asyncHandler(async (req, res) => {
  const ws = req.workspaceId!;
  const userId = req.user!.id;
  const existing = await forecastRepo.getForecast(ws, req.params.id);
  if (!existing) throw notFound('Forecast not found');

  let datasetId = existing.datasetId;
  let datasetVersionId = existing.datasetVersionId;
  const datasetChanged = Boolean(req.body.datasetId && req.body.datasetId !== existing.datasetId);
  if (datasetChanged) {
    const ds = await datasetRepo.getDataset(ws, req.body.datasetId);
    if (!ds) throw notFound('Dataset not found');
    datasetId = ds.id;
    datasetVersionId = ds.current_version_id ?? null;
  }

  const incomingCfg = req.body.configuration || {};
  const mergedUpdateCfg = {
    ...existing.configuration,
    ...incomingCfg,
    ...(incomingCfg.horizonDays !== undefined && incomingCfg.horizonSteps === undefined
      ? { horizonSteps: undefined }
      : {}),
  };

  const updated = await forecastRepo.createOrUpdateForecast(ws, userId, {
    id: existing.id,
    name: req.body.name ?? existing.name,
    mode: req.body.mode ?? existing.mode,
    businessTemplate: req.body.businessTemplate !== undefined ? req.body.businessTemplate : existing.businessTemplate,
    datasetId,
    datasetVersionId,
    configuration: mergedUpdateCfg,
    status: datasetChanged ? 'draft' : existing.status,
    selectedModel: datasetChanged ? null : existing.selectedModel,
    errorMessage: datasetChanged ? null : existing.errorMessage,
  });

  const full = await forecastRepo.getForecast(ws, updated.id);
  res.json({ success: true, forecast: full });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const ok = await forecastRepo.deleteForecast(req.workspaceId!, req.params.id);
  if (!ok) throw notFound('Forecast not found');
  res.json({ success: true, message: 'Forecast deleted' });
}));

router.post('/:id/run', validate(forecastRunSchema), asyncHandler(async (req, res) => {
  const ws = req.workspaceId!;
  const existing = await forecastRepo.getForecast(ws, req.params.id);
  if (!existing) throw notFound('Forecast not found');

  const ds = await datasetRepo.getDataset(ws, existing.datasetId);
  if (!ds) throw notFound('Source dataset no longer exists');

  const rows = getActiveRows(ds);
  assertDatasetRowLimit(rows);

  const incomingRunCfg = req.body.configuration || {};
  const mergedConfig = {
    ...existing.configuration,
    ...incomingRunCfg,
    ...(incomingRunCfg.horizonDays !== undefined && incomingRunCfg.horizonSteps === undefined
      ? { horizonSteps: undefined }
      : {}),
  };

  const claim = await forecastRepo.claimForecastRun(
    ws,
    existing.id,
    ds.current_version_id ?? null,
    mergedConfig,
    EXECUTION_LEASE_MS,
  );
  if (!('forecast' in claim)) {
    if (claim.reason === 'not_found') throw notFound('Forecast not found');
    throw new HttpError(
      409,
      'A forecast run is already in progress for this forecast.',
      'FORECAST_ALREADY_RUNNING',
    );
  }

  const { executionToken } = claim;
  const ac = attachAbortSignal(req, res);

  try {
    const engineResult = await runPythonEngine(
      {
        action: 'run_forecast',
        rows,
        dateColumn: mergedConfig.dateColumn,
        targetColumn: mergedConfig.targetColumn,
        aggregation: mergedConfig.aggregation,
        frequency: mergedConfig.frequency,
        horizonDays: mergedConfig.horizonDays,
        horizonSteps: mergedConfig.horizonSteps ?? null,
        model: mergedConfig.model,
        groupColumn: mergedConfig.groupColumn ?? null,
        groupValue: mergedConfig.groupValue ?? null,
        businessTemplate: existing.businessTemplate,
        calendarEffects: mergedConfig.calendarEffects ?? null,
      },
      { signal: ac.signal },
    );

    const completed = await forecastRepo.saveForecastRunSuccess(
      ws,
      existing.id,
      ds.current_version_id ?? null,
      engineResult,
      executionToken,
      mergedConfig,
    );
    res.json({ success: true, forecast: completed });
  } catch (err: any) {
    await forecastRepo.markForecastRunFailed(ws, existing.id, toSafeStoredError(err), executionToken);
    throw err;
  }
}));

router.get('/:id/scenarios', asyncHandler(async (req, res) => {
  const scenarios = await forecastRepo.listForecastScenarios(req.workspaceId!, req.params.id);
  if (!scenarios) throw notFound('Forecast not found');
  res.json({ success: true, scenarios });
}));

router.post('/:id/scenarios', validate(forecastScenarioSchema), asyncHandler(async (req, res) => {
  const ws = req.workspaceId!;
  const userId = req.user!.id;
  const forecast = await forecastRepo.getForecast(ws, req.params.id);
  if (!forecast) throw notFound('Forecast not found');
  if (!forecast.latestResult || !forecast.latestResult.predictedData?.length) {
    throw badRequest('Run the baseline forecast before creating a What-If scenario.');
  }

  const nonNegative = Boolean(
    forecast.latestResult.modelMetadata?.nonNegativeClamped ??
      ((forecast.latestResult.dataQuality?.negativeCount ?? 0) === 0 && forecast.businessTemplate !== 'profit'),
  );

  const ac = attachAbortSignal(req, res);
  const scenarioResults = await runPythonEngine(
    {
      action: 'run_scenario',
      predictedData: forecast.latestResult.predictedData,
      assumptions: req.body.assumptions,
      businessTemplate: forecast.businessTemplate,
      nonNegative,
    },
    { signal: ac.signal },
  );

  const scenario = await forecastRepo.saveForecastScenario(ws, userId, forecast.id, {
    id: req.body.id,
    name: req.body.name,
    assumptions: req.body.assumptions,
    scenarioResults,
    baselineResultId: forecast.latestResult.id,
  });

  res.status(201).json({ success: true, scenario });
}));

router.delete('/:id/scenarios/:scenarioId', asyncHandler(async (req, res) => {
  const ok = await forecastRepo.deleteForecastScenario(req.workspaceId!, req.params.id, req.params.scenarioId);
  if (!ok) throw notFound('Scenario not found');
  res.json({ success: true, message: 'Scenario deleted' });
}));

export default router;
