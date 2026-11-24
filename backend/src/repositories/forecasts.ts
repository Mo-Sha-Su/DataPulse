/**
 * Forecast persistence repository (workspace-scoped).
 * Manages `forecasts`, `forecast_results`, and `forecast_scenarios` tables with transactional run persistence.
 */
import crypto from 'crypto';
import { PoolClient } from 'pg';
import { query, tx } from '../db';
import { resolveDbId } from '../lib/ids';
import { toJson } from '../lib/json';
import { toIsoTimestamp } from '../lib/dates';
import { notFound } from '../lib/errors';

export interface ForecastConfiguration {
  dateColumn: string;
  targetColumn: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  frequency: 'auto' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  horizonDays: number;
  horizonSteps?: number;
  model:
    | 'auto'
    | 'naive'
    | 'seasonal_naive'
    | 'moving_average'
    | 'ets'
    | 'holt_winters'
    | 'arima'
    | 'sarima'
    | 'linear_regression'
    | 'tsb';
  groupColumn?: string | null;
  groupValue?: string | null;
  confidenceLevel: '80' | '90' | '95';
  calendarEffects?: {
    enabled: boolean;
    country?: 'EG' | 'SA' | 'AE' | 'US' | 'GB';
  };
}

export interface ForecastRecord {
  id: string;
  name: string;
  mode: 'general' | 'business';
  businessTemplate: string | null;
  datasetId: string;
  datasetVersionId: string | null;
  configuration: ForecastConfiguration;
  selectedModel: string | null;
  status: 'draft' | 'running' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  latestResult?: ForecastResultRecord | null;
  scenarios?: ForecastScenarioRecord[];
}

export interface ForecastResultRecord {
  id: string;
  forecastId: string;
  datasetVersionId: string | null;
  selectedModel: string;
  selectedModelLabel?: string;
  frequency: string;
  horizonDays: number;
  horizonSteps: number;
  trainingPeriod?: {
    start: string;
    end: string;
    observedPeriods: number;
    calendarPeriods: number;
  };
  historicalData: Array<{ date: string; value: number; isObserved: boolean }>;
  predictedData: Array<{
    date: string;
    value: number;
    lower80: number;
    upper80: number;
    lower90: number;
    upper90: number;
    lower95: number;
    upper95: number;
  }>;
  predictionIntervals: Record<string, Array<{ lower: number; upper: number }>>;
  summary: Record<string, any>;
  evaluationMetrics: Record<string, any>;
  modelMetadata: Record<string, any>;
  reliability?: Record<string, any> | null;
  calendarEffects?: Record<string, any> | null;
  dataQuality: Record<string, any>;
  warnings: string[];
  notes: string[];
  createdAt: string;
}

export interface ForecastScenarioRecord {
  id: string;
  forecastId: string;
  name: string;
  assumptions: Record<string, number>;
  scenarioResults: Record<string, any>;
  baselineResultId?: string | null;
  isStale?: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapForecast(row: any, latestResult?: ForecastResultRecord | null, scenarios?: ForecastScenarioRecord[]): ForecastRecord {
  return {
    id: row.client_id || String(row.id),
    name: row.name,
    mode: (row.mode || 'general') as 'general' | 'business',
    businessTemplate: row.business_template || null,
    datasetId: String(row.dataset_id),
    datasetVersionId: row.dataset_version_id || null,
    configuration: row.configuration || {},
    selectedModel: row.selected_model || null,
    status: (row.status || 'draft') as ForecastRecord['status'],
    errorMessage: row.error_message || null,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
    ...(latestResult !== undefined ? { latestResult } : {}),
    ...(scenarios !== undefined ? { scenarios } : {}),
  };
}

function mapResult(row: any, forecastClientId: string): ForecastResultRecord {
  const modelMeta = row.model_metadata || {};
  const evalMetrics = row.evaluation_metrics || {};
  const selectedCand = Array.isArray(evalMetrics.candidates)
    ? evalMetrics.candidates.find((c: any) => c.model === row.selected_model)
    : null;

  return {
    id: String(row.id),
    forecastId: forecastClientId,
    datasetVersionId: row.dataset_version_id || null,
    selectedModel: row.selected_model,
    selectedModelLabel: selectedCand?.label || row.selected_model,
    frequency: row.frequency,
    horizonDays: Number(row.horizon_days),
    horizonSteps: Number(row.horizon_steps),
    ...(modelMeta.trainingPeriod ? { trainingPeriod: modelMeta.trainingPeriod } : {}),
    historicalData: row.historical_data || [],
    predictedData: row.predicted_data || [],
    predictionIntervals: row.prediction_intervals || {},
    summary: row.summary || {},
    evaluationMetrics: evalMetrics,
    modelMetadata: modelMeta,
    ...(modelMeta.reliability ? { reliability: modelMeta.reliability } : {}),
    ...(modelMeta.calendarEffects ? { calendarEffects: modelMeta.calendarEffects } : {}),
    dataQuality: row.data_quality || {},
    warnings: row.warnings || [],
    notes: row.notes || [],
    createdAt: toIsoTimestamp(row.created_at),
  };
}

function mapScenario(row: any, forecastClientId: string, latestResultId?: string | null): ForecastScenarioRecord {
  const baselineResultId = row.baseline_result_id ? String(row.baseline_result_id) : null;
  const isStale = Boolean(latestResultId && baselineResultId && baselineResultId !== latestResultId);
  return {
    id: row.client_id || String(row.id),
    forecastId: forecastClientId,
    name: row.name,
    assumptions: row.assumptions || {},
    scenarioResults: row.scenario_results || {},
    baselineResultId,
    isStale,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}

export async function listForecasts(workspaceId: string): Promise<ForecastRecord[]> {
  const rows = await query(
    `SELECT f.*,
       lr.id AS lr_id, lr.dataset_version_id AS lr_dataset_version_id,
       lr.selected_model AS lr_selected_model, lr.frequency AS lr_frequency,
       lr.horizon_days AS lr_horizon_days, lr.horizon_steps AS lr_horizon_steps,
       lr.summary AS lr_summary, lr.evaluation_metrics AS lr_evaluation_metrics,
       lr.model_metadata AS lr_model_metadata,
       lr.created_at AS lr_created_at
     FROM forecasts f
     LEFT JOIN LATERAL (
       SELECT * FROM forecast_results r
       WHERE r.forecast_id = f.id AND r.workspace_id = f.workspace_id
       ORDER BY r.created_at DESC LIMIT 1
     ) lr ON true
     WHERE f.workspace_id = $1::uuid
     ORDER BY f.updated_at DESC`,
    [workspaceId],
  );

  return rows.map((row) => {
    const fcId = row.client_id || String(row.id);
    const lrMeta = row.lr_model_metadata || {};
    const summaryResult: ForecastResultRecord | null = row.lr_id
      ? {
          id: String(row.lr_id),
          forecastId: fcId,
          datasetVersionId: row.lr_dataset_version_id || row.dataset_version_id || null,
          selectedModel: row.lr_selected_model,
          frequency: row.lr_frequency,
          horizonDays: Number(row.lr_horizon_days),
          horizonSteps: Number(row.lr_horizon_steps),
          ...(lrMeta.trainingPeriod ? { trainingPeriod: lrMeta.trainingPeriod } : {}),
          historicalData: [],
          predictedData: [],
          predictionIntervals: {},
          summary: row.lr_summary || {},
          evaluationMetrics: row.lr_evaluation_metrics || {},
          modelMetadata: lrMeta,
          ...(lrMeta.reliability ? { reliability: lrMeta.reliability } : {}),
          ...(lrMeta.calendarEffects ? { calendarEffects: lrMeta.calendarEffects } : {}),
          dataQuality: {},
          warnings: [],
          notes: [],
          createdAt: toIsoTimestamp(row.lr_created_at),
        }
      : null;
    return mapForecast(row, summaryResult);
  });
}

export async function getForecast(workspaceId: string, id: string, client?: PoolClient): Promise<ForecastRecord | null> {
  const { dbId } = resolveDbId(workspaceId, id);
  const runQuery = (sql: string, params: unknown[]) =>
    client ? client.query(sql, params).then((r) => r.rows) : query(sql, params);

  const rows = await runQuery(`SELECT * FROM forecasts WHERE id = $1::uuid AND workspace_id = $2::uuid LIMIT 1`, [
    dbId,
    workspaceId,
  ]);
  if (!rows[0]) return null;
  const row = rows[0];
  const fcId = row.client_id || String(row.id);

  const resultRows = await runQuery(
    `SELECT * FROM forecast_results WHERE forecast_id = $1::uuid AND workspace_id = $2::uuid ORDER BY created_at DESC LIMIT 1`,
    [row.id, workspaceId],
  );
  const scenarioRows = await runQuery(
    `SELECT * FROM forecast_scenarios WHERE forecast_id = $1::uuid AND workspace_id = $2::uuid ORDER BY created_at ASC`,
    [row.id, workspaceId],
  );

  const latestResult = resultRows[0] ? mapResult(resultRows[0], fcId) : null;
  const scenarios = scenarioRows.map((s) => mapScenario(s, fcId, latestResult?.id || null));
  return mapForecast(row, latestResult, scenarios);
}

export async function createOrUpdateForecast(
  workspaceId: string,
  userId: string,
  input: {
    id?: string;
    name: string;
    mode: 'general' | 'business';
    businessTemplate?: string | null;
    datasetId: string;
    datasetVersionId?: string | null;
    configuration: ForecastConfiguration;
    status?: 'draft' | 'running' | 'completed' | 'failed';
    selectedModel?: string | null;
    errorMessage?: string | null;
  },
  client?: PoolClient,
): Promise<ForecastRecord> {
  const rawId = input.id || `fc_${crypto.randomUUID()}`;
  const { dbId, clientId } = resolveDbId(workspaceId, rawId);

  const sql = `
    INSERT INTO forecasts (
      id, workspace_id, user_id, client_id, name, mode, business_template,
      dataset_id, dataset_version_id, configuration, selected_model, status, error_message
    )
    VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      mode = EXCLUDED.mode,
      business_template = EXCLUDED.business_template,
      dataset_id = EXCLUDED.dataset_id,
      dataset_version_id = COALESCE(EXCLUDED.dataset_version_id, forecasts.dataset_version_id),
      configuration = EXCLUDED.configuration,
      selected_model = EXCLUDED.selected_model,
      status = EXCLUDED.status,
      error_message = EXCLUDED.error_message,
      updated_at = now()
    WHERE forecasts.workspace_id = EXCLUDED.workspace_id
    RETURNING *`;

  const params = [
    dbId,
    workspaceId,
    userId,
    clientId,
    input.name,
    input.mode,
    input.businessTemplate ?? null,
    input.datasetId,
    input.datasetVersionId ?? null,
    toJson(input.configuration),
    input.selectedModel ?? null,
    input.status ?? 'draft',
    input.errorMessage ?? null,
  ];
  const rows = client ? (await client.query(sql, params)).rows : await query(sql, params);
  if (!rows[0]) throw notFound('Forecast not found');
  return mapForecast(rows[0]);
}

export type ExecutionClaimResult =
  | { claimed: true; forecast: ForecastRecord; executionToken: string }
  | { claimed: false; reason: 'not_found' | 'already_running' };

/**
 * Atomically creates/updates a forecast and claims a single-writer execution lease in PostgreSQL.
 * Replaces process-local locks so concurrent requests across workers/instances cannot double-execute,
 * while expired leases from crashed servers automatically recover after `leaseMs`.
 */
export async function claimCreateAndRunForecast(
  workspaceId: string,
  userId: string,
  input: {
    id?: string;
    name: string;
    mode: 'general' | 'business';
    businessTemplate?: string | null;
    datasetId: string;
    datasetVersionId?: string | null;
    configuration: ForecastConfiguration;
  },
  leaseMs: number,
): Promise<ExecutionClaimResult> {
  const rawId = input.id || `fc_${crypto.randomUUID()}`;
  const { dbId, clientId } = resolveDbId(workspaceId, rawId);
  const executionToken = crypto.randomUUID();

  return tx(async (c) => {
    const upsertRes = await c.query(
      `INSERT INTO forecasts (
        id, workspace_id, user_id, client_id, name, mode, business_template,
        dataset_id, dataset_version_id, configuration, status, error_message,
        execution_token, execution_started_at
      )
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10::jsonb, 'running', NULL, $11, now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        mode = EXCLUDED.mode,
        business_template = EXCLUDED.business_template,
        dataset_id = EXCLUDED.dataset_id,
        dataset_version_id = COALESCE(EXCLUDED.dataset_version_id, forecasts.dataset_version_id),
        configuration = EXCLUDED.configuration,
        status = 'running',
        error_message = NULL,
        execution_token = EXCLUDED.execution_token,
        execution_started_at = now(),
        updated_at = now()
      WHERE forecasts.workspace_id = EXCLUDED.workspace_id
        AND (
          forecasts.status <> 'running'
          OR forecasts.execution_started_at IS NULL
          OR forecasts.execution_started_at < now() - ($12::bigint * interval '1 millisecond')
        )
      RETURNING *`,
      [
        dbId,
        workspaceId,
        userId,
        clientId,
        input.name,
        input.mode,
        input.businessTemplate ?? null,
        input.datasetId,
        input.datasetVersionId ?? null,
        toJson(input.configuration),
        executionToken,
        Math.max(1000, Math.floor(leaseMs)),
      ],
    );

    if (upsertRes.rows[0]) {
      return { claimed: true, forecast: mapForecast(upsertRes.rows[0]), executionToken };
    }

    const existing = await c.query(`SELECT status FROM forecasts WHERE id = $1::uuid AND workspace_id = $2::uuid LIMIT 1`, [
      dbId,
      workspaceId,
    ]);
    if (!existing.rows[0]) {
      return { claimed: false, reason: 'not_found' };
    }
    return { claimed: false, reason: 'already_running' };
  });
}

/**
 * Atomically claims an execution lease on an existing forecast row in PostgreSQL.
 */
export async function claimForecastRun(
  workspaceId: string,
  forecastId: string,
  datasetVersionId: string | null,
  configuration: ForecastConfiguration,
  leaseMs: number,
): Promise<ExecutionClaimResult> {
  const { dbId } = resolveDbId(workspaceId, forecastId);
  const executionToken = crypto.randomUUID();

  return tx(async (c) => {
    const updRes = await c.query(
      `UPDATE forecasts
       SET dataset_version_id = COALESCE($3, dataset_version_id),
           configuration = $4::jsonb,
           status = 'running',
           error_message = NULL,
           execution_token = $5,
           execution_started_at = now(),
           updated_at = now()
       WHERE id = $1::uuid
         AND workspace_id = $2::uuid
         AND (
           status <> 'running'
           OR execution_started_at IS NULL
           OR execution_started_at < now() - ($6::bigint * interval '1 millisecond')
         )
       RETURNING *`,
      [
        dbId,
        workspaceId,
        datasetVersionId,
        toJson(configuration),
        executionToken,
        Math.max(1000, Math.floor(leaseMs)),
      ],
    );

    if (updRes.rows[0]) {
      return { claimed: true, forecast: mapForecast(updRes.rows[0]), executionToken };
    }

    const existing = await c.query(`SELECT status FROM forecasts WHERE id = $1::uuid AND workspace_id = $2::uuid LIMIT 1`, [
      dbId,
      workspaceId,
    ]);
    if (!existing.rows[0]) {
      return { claimed: false, reason: 'not_found' };
    }
    return { claimed: false, reason: 'already_running' };
  });
}

export async function saveForecastRunSuccess(
  workspaceId: string,
  forecastId: string,
  datasetVersionId: string | null,
  engineOutput: Record<string, any>,
  executionToken?: string,
  evaluatedConfiguration?: ForecastConfiguration,
): Promise<ForecastRecord> {
  const { dbId } = resolveDbId(workspaceId, forecastId);
  return tx(async (c) => {
    const fcRes = await c.query(
      `UPDATE forecasts
       SET status = 'completed',
           selected_model = $3,
           dataset_version_id = $4,
           error_message = NULL,
           execution_token = NULL,
           execution_started_at = NULL,
           updated_at = now()
       WHERE id = $1::uuid
         AND workspace_id = $2::uuid
         AND ($5::varchar IS NULL OR execution_token = $5)
       RETURNING *`,
      [dbId, workspaceId, engineOutput.selectedModel, datasetVersionId, executionToken ?? null],
    );
    if (!fcRes.rows[0]) throw notFound('Forecast run lease expired or forecast not found');

    const resultId = crypto.randomUUID();
    await c.query(
      `INSERT INTO forecast_results (
        id, forecast_id, workspace_id, dataset_version_id, selected_model,
        frequency, horizon_days, horizon_steps, historical_data, predicted_data,
        prediction_intervals, summary, evaluation_metrics, model_metadata, data_quality,
        warnings, notes
      )
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb)`,
      [
        resultId,
        dbId,
        workspaceId,
        datasetVersionId,
        engineOutput.selectedModel,
        engineOutput.frequency,
        Number(engineOutput.horizonDays),
        Number(engineOutput.horizonSteps),
        toJson(engineOutput.historicalData || []),
        toJson(engineOutput.predictedData || []),
        toJson(engineOutput.predictionIntervals || {}),
        toJson(engineOutput.summary || {}),
        toJson(engineOutput.evaluationMetrics || {}),
        toJson({
          ...(engineOutput.modelMetadata || {}),
          ...(engineOutput.trainingPeriod ? { trainingPeriod: engineOutput.trainingPeriod } : {}),
          ...(engineOutput.reliability ? { reliability: engineOutput.reliability } : {}),
          ...(engineOutput.calendarEffects ? { calendarEffects: engineOutput.calendarEffects } : {}),
          ...(evaluatedConfiguration ? { evaluatedConfiguration } : {}),
        }),
        toJson(engineOutput.dataQuality || {}),
        toJson(engineOutput.warnings || []),
        toJson(engineOutput.notes || []),
      ],
    );

    const updated = await getForecast(workspaceId, forecastId, c);
    return updated!;
  });
}

export async function markForecastRunFailed(
  workspaceId: string,
  forecastId: string,
  message: string,
  executionToken?: string,
): Promise<void> {
  const { dbId } = resolveDbId(workspaceId, forecastId);
  await query(
    `UPDATE forecasts
     SET status = 'failed',
         error_message = $3,
         execution_token = NULL,
         execution_started_at = NULL,
         updated_at = now()
     WHERE id = $1::uuid
       AND workspace_id = $2::uuid
       AND ($4::varchar IS NULL OR execution_token = $4 OR execution_token IS NULL)`,
    [dbId, workspaceId, message, executionToken ?? null],
  );
}

export async function deleteForecast(workspaceId: string, id: string): Promise<boolean> {
  const { dbId } = resolveDbId(workspaceId, id);
  const rows = await query(`DELETE FROM forecasts WHERE id = $1::uuid AND workspace_id = $2::uuid RETURNING id`, [
    dbId,
    workspaceId,
  ]);
  return rows.length > 0;
}

export async function saveForecastScenario(
  workspaceId: string,
  userId: string,
  forecastId: string,
  input: {
    id?: string;
    name: string;
    assumptions: Record<string, number>;
    scenarioResults: Record<string, any>;
    baselineResultId?: string | null;
  },
): Promise<ForecastScenarioRecord> {
  const { dbId: forecastDbId } = resolveDbId(workspaceId, forecastId);
  const owned = await query(`SELECT id, client_id FROM forecasts WHERE id = $1::uuid AND workspace_id = $2::uuid`, [
    forecastDbId,
    workspaceId,
  ]);
  if (!owned[0]) throw notFound('Forecast not found');
  const fcClientId = owned[0].client_id || String(owned[0].id);

  const rawScenId = input.id || `fcs_${crypto.randomUUID()}`;
  const { dbId: scenDbId, clientId: scenClientId } = resolveDbId(workspaceId, rawScenId);

  const rows = await query(
    `INSERT INTO forecast_scenarios (id, forecast_id, workspace_id, user_id, client_id, name, assumptions, scenario_results, baseline_result_id)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7::jsonb, $8::jsonb, $9::uuid)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       assumptions = EXCLUDED.assumptions,
       scenario_results = EXCLUDED.scenario_results,
       baseline_result_id = EXCLUDED.baseline_result_id,
       updated_at = now()
     WHERE forecast_scenarios.workspace_id = EXCLUDED.workspace_id
     RETURNING *`,
    [
      scenDbId,
      forecastDbId,
      workspaceId,
      userId,
      scenClientId,
      input.name,
      toJson(input.assumptions),
      toJson(input.scenarioResults),
      input.baselineResultId ?? null,
    ],
  );
  if (!rows[0]) throw notFound('Forecast scenario not found');
  return mapScenario(rows[0], fcClientId, input.baselineResultId ?? null);
}

export async function listForecastScenarios(workspaceId: string, forecastId: string): Promise<ForecastScenarioRecord[] | null> {
  const { dbId: forecastDbId } = resolveDbId(workspaceId, forecastId);
  const owned = await query(`SELECT id, client_id FROM forecasts WHERE id = $1::uuid AND workspace_id = $2::uuid`, [
    forecastDbId,
    workspaceId,
  ]);
  if (!owned[0]) return null;
  const fcClientId = owned[0].client_id || String(owned[0].id);
  const latestRes = await query(
    `SELECT id FROM forecast_results WHERE forecast_id = $1::uuid AND workspace_id = $2::uuid ORDER BY created_at DESC LIMIT 1`,
    [forecastDbId, workspaceId],
  );
  const latestResultId = latestRes[0]?.id ? String(latestRes[0].id) : null;
  const rows = await query(
    `SELECT * FROM forecast_scenarios WHERE forecast_id = $1::uuid AND workspace_id = $2::uuid ORDER BY created_at ASC`,
    [forecastDbId, workspaceId],
  );
  return rows.map((r) => mapScenario(r, fcClientId, latestResultId));
}

export async function deleteForecastScenario(workspaceId: string, forecastId: string, scenarioId: string): Promise<boolean> {
  const { dbId: forecastDbId } = resolveDbId(workspaceId, forecastId);
  const { dbId: scenDbId } = resolveDbId(workspaceId, scenarioId);
  const rows = await query(
    `DELETE FROM forecast_scenarios WHERE id = $1::uuid AND forecast_id = $2::uuid AND workspace_id = $3::uuid RETURNING id`,
    [scenDbId, forecastDbId, workspaceId],
  );
  return rows.length > 0;
}
