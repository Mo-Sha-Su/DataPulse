import { DashboardState } from '../types/dashboard';
import { getAuthHeaders } from './authService';
import { buildApiError } from './apiClient';
import { normalizeDashboardFilters } from '../utils/filterMigration';

/**
 * Dashboards live in PostgreSQL only. There is no localStorage cache or offline fallback:
 * if the database can't be reached these functions throw, so the UI can show the real state.
 */
const API_BASE = '/api/dashboards';

const SAMPLE_DASH_IDS = new Set(['dash_exec_overview', 'report_annual_summary']);
const droppedFilterCounts = new Map<string, number>();

export function consumeDroppedFilterCount(dashboardId: string): number {
  const count = droppedFilterCounts.get(dashboardId) || 0;
  droppedFilterCounts.delete(dashboardId);
  return count;
}

function isSampleDashboard(d: any): boolean {
  if (!d) return false;
  if (SAMPLE_DASH_IDS.has(d.id)) return true;
  const name = String(d.name || '').trim().toLowerCase();
  return (
    name.includes('executive revenue & performance suite') ||
    name.includes('annual business & financial report')
  );
}

/** Fetches all dashboards and reports belonging to the signed-in user's workspace. */
export async function fetchDashboardsFromDb(): Promise<DashboardState[]> {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() });
  if (!res.ok) throw await buildApiError(res, 'Loading dashboards');
  const data = await res.json();
  if (!data.success || !Array.isArray(data.dashboards)) throw new Error('Unexpected response while loading dashboards');
  return data.dashboards
    .filter((d: any) => !isSampleDashboard(d))
    .map((d: DashboardState) => {
      const { dashboard, dropped } = normalizeDashboardFilters(d);
      if (dropped > 0 && dashboard.id) {
        droppedFilterCounts.set(dashboard.id, dropped);
      }
      return dashboard;
    });
}

/**
 * Strips raw dataset rows before saving a dashboard so datasets remain single-source-of-truth
 * in the `datasets` table while keeping column metadata and counts attached.
 */
export function toDashboardPayload(dashboard: DashboardState): DashboardState {
  const { dashboard: clean } = normalizeDashboardFilters(dashboard);
  return {
    ...clean,
    datasets: (clean.datasets || []).map((d) => {
      const { cleanedData: _cleaned, ...meta } = d as any;
      return { ...meta, data: [] };
    }),
  };
}

/** Creates or updates a dashboard/report and synchronizes its semantic data model transactionally. */
export async function saveDashboardToDb(dashboard: DashboardState): Promise<DashboardState> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(toDashboardPayload(dashboard)),
  });
  if (!res.ok) throw await buildApiError(res, 'Saving dashboard');
  const data = await res.json();
  if (!data.success || !data.dashboard) throw new Error('Unexpected response while saving dashboard');
  droppedFilterCounts.delete(dashboard.id);
  return normalizeDashboardFilters(data.dashboard).dashboard;
}

/** Permanently deletes a dashboard/report (and its relational data model) by id. */
export async function deleteDashboardFromDb(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await buildApiError(res, 'Deleting dashboard');
  const data = await res.json();
  return !!data.success;
}
