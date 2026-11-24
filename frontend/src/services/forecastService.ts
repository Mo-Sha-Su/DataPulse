/**
 * Client API helpers for Forecast Studio (/api/forecasts/*).
 * Handles frequency detection, forecast CRUD/execution, runtime limits, and What-If scenarios.
 */
import { getAuthHeaders } from './authService';
import {
  ForecastConfiguration,
  ForecastLimits,
  ForecastMode,
  ForecastRecord,
  ForecastScenarioAssumptions,
  ForecastScenarioRecord,
  FrequencyDetectionResponse,
  BusinessTemplateId,
} from '../types/forecast';

/** Structured API error preserving backend machine code, HTTP status, and hint metadata. */
export class ForecastApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'ForecastApiError';
  }
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    throw new ForecastApiError(`Server returned status ${res.status}`, 'HTTP_ERROR', res.status);
  }
  if (!res.ok || body?.success === false) {
    throw new ForecastApiError(
      body?.message || `Request failed (${res.status})`,
      body?.code,
      res.status,
      body?.details,
    );
  }
  return body as T;
}

/** Fetches server-enforced observation, horizon, and concurrency limits for forecasting. */
export async function fetchForecastLimits(): Promise<ForecastLimits> {
  const res = await fetch('/api/forecasts/limits', { headers: getAuthHeaders() });
  const data = await parseJsonOrThrow<{ limits: ForecastLimits }>(res);
  return data.limits;
}

/** Lists all saved forecasts for the authenticated workspace (with latest run summary). */
export async function listForecasts(): Promise<ForecastRecord[]> {
  const res = await fetch('/api/forecasts', { headers: getAuthHeaders() });
  const data = await parseJsonOrThrow<{ forecasts: ForecastRecord[] }>(res);
  return data.forecasts || [];
}

/** Retrieves a single saved forecast together with its latest result payload and scenarios. */
export async function getForecastById(id: string): Promise<ForecastRecord> {
  const res = await fetch(`/api/forecasts/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
  const data = await parseJsonOrThrow<{ forecast: ForecastRecord }>(res);
  return data.forecast;
}

/** Inspects a dataset date/target pair via the Python engine to detect cadence before running. */
export async function detectForecastFrequency(
  payload: {
    datasetId: string;
    dateColumn: string;
    targetColumn: string;
    aggregation: string;
    groupColumn?: string | null;
    groupValue?: string | null;
  },
  signal?: AbortSignal,
): Promise<FrequencyDetectionResponse> {
  const res = await fetch('/api/forecasts/detect-frequency', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
  const data = await parseJsonOrThrow<{ detection: FrequencyDetectionResponse }>(res);
  return data.detection;
}

/** Creates a forecast definition in Neon PostgreSQL and optionally runs the Python engine immediately. */
export async function createAndRunForecast(
  payload: {
    id?: string;
    name: string;
    mode: ForecastMode;
    businessTemplate?: BusinessTemplateId | null;
    datasetId: string;
    configuration: ForecastConfiguration;
    runImmediately?: boolean;
  },
  signal?: AbortSignal,
): Promise<ForecastRecord> {
  const res = await fetch('/api/forecasts', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
  const data = await parseJsonOrThrow<{ forecast: ForecastRecord }>(res);
  return data.forecast;
}

/** Updates saved forecast metadata or configuration without discarding its existing run history. */
export async function updateForecastMeta(
  id: string,
  payload: {
    name?: string;
    mode?: ForecastMode;
    businessTemplate?: BusinessTemplateId | null;
    datasetId?: string;
    configuration?: Partial<ForecastConfiguration>;
  },
): Promise<ForecastRecord> {
  const res = await fetch(`/api/forecasts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow<{ forecast: ForecastRecord }>(res);
  return data.forecast;
}

/** Executes (or re-runs) the Python forecasting engine for an existing saved forecast. */
export async function runForecastById(
  id: string,
  configuration?: Partial<ForecastConfiguration>,
  signal?: AbortSignal,
): Promise<ForecastRecord> {
  const res = await fetch(`/api/forecasts/${encodeURIComponent(id)}/run`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ configuration }),
    signal,
  });
  const data = await parseJsonOrThrow<{ forecast: ForecastRecord }>(res);
  return data.forecast;
}

/** Deletes a saved forecast and its child results/scenarios (via DB cascade). */
export async function deleteForecastById(id: string): Promise<void> {
  const res = await fetch(`/api/forecasts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await parseJsonOrThrow<{ success: boolean }>(res);
}

/** Evaluates and persists a new What-If scenario overlay for a completed forecast. */
export async function createForecastScenario(
  forecastId: string,
  payload: {
    id?: string;
    name: string;
    assumptions: ForecastScenarioAssumptions;
  },
  signal?: AbortSignal,
): Promise<ForecastScenarioRecord> {
  const res = await fetch(`/api/forecasts/${encodeURIComponent(forecastId)}/scenarios`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
  const data = await parseJsonOrThrow<{ scenario: ForecastScenarioRecord }>(res);
  return data.scenario;
}

/** Removes a saved What-If scenario from a forecast. */
export async function deleteForecastScenario(forecastId: string, scenarioId: string): Promise<void> {
  const res = await fetch(
    `/api/forecasts/${encodeURIComponent(forecastId)}/scenarios/${encodeURIComponent(scenarioId)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    },
  );
  await parseJsonOrThrow<{ success: boolean }>(res);
}
