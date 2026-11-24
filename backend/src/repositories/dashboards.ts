/**
 * Dashboard persistence repository (workspace-scoped).
 * Strips embedded dataset rows (`slimDashboard`) so dashboards reference datasets cleanly without duplication,
 * and atomically synchronizes embedded semantic Data Models via `syncDashboardModel`.
 */
import { query, tx } from '../db';
import { toJson } from '../lib/json';
import { toIsoTimestamp } from '../lib/dates';
import { resolveDbId } from '../lib/ids';
import { syncDashboardModel } from './models';
import { notFound } from '../lib/errors';

/**
 * A dashboard references datasets, it does not own their rows: those live once, in the `datasets` table.
 * Embedding them duplicated every dataset into every dashboard save (slow, hits the body limit, and goes stale
 * after cleaning). Keep the metadata (id, name, columns, counts) and drop the rows.
 */
export function slimDashboard<T extends Record<string, any>>(d: T): T {
  if (!d || !Array.isArray(d.datasets)) return d;
  const datasets = d.datasets.map((ds: any) => {
    if (!ds || typeof ds !== 'object') return ds;
    const { cleanedData: _cleaned, ...meta } = ds;
    return { ...meta, data: [] };
  });
  return { ...d, datasets };
}

function toApi(r: any) {
  const id = r.client_id || String(r.id);
  const updatedAt = toIsoTimestamp(r.updated_at);
  if (r.payload && typeof r.payload === 'object') {
    return { ...r.payload, id, name: r.name || r.payload.name, description: r.description ?? r.payload.description ?? '', updatedAt };
  }
  return {
    id,
    name: r.name || 'Untitled Dashboard',
    description: r.description || '',
    usedFor: r.used_for || '',
    thumbnail: r.thumbnail || '📊',
    widgets: [],
    datasets: [],
    canvas: r.canvas_state || {},
    globalFilters: r.filters || [],
    createdAt: toIsoTimestamp(r.created_at),
    updatedAt,
  };
}

const COLS = `id, client_id, name, description, thumbnail, used_for, filters, canvas_state, payload, created_at, updated_at`;

export async function listDashboards(workspaceId: string) {
  const rows = await query(`SELECT ${COLS} FROM dashboards WHERE workspace_id = $1::uuid ORDER BY updated_at DESC`, [workspaceId]);
  return rows.map(toApi);
}

export async function getDashboard(workspaceId: string, id: string) {
  const { dbId } = resolveDbId(workspaceId, id);
  const rows = await query(`SELECT ${COLS} FROM dashboards WHERE id = $1::uuid AND workspace_id = $2::uuid LIMIT 1`, [dbId, workspaceId]);
  return rows[0] ? toApi(rows[0]) : null;
}

export async function upsertDashboard(workspaceId: string, d: Record<string, any>) {
  const { dbId, clientId } = resolveDbId(workspaceId, String(d.id));
  return tx(async (c) => {
    const res = await c.query(
      `INSERT INTO dashboards (id, workspace_id, client_id, name, description, thumbnail, used_for, filters, canvas_state, payload)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::json, $9::json, $10::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, description = EXCLUDED.description, thumbnail = EXCLUDED.thumbnail,
         used_for = EXCLUDED.used_for, filters = EXCLUDED.filters, canvas_state = EXCLUDED.canvas_state,
         payload = EXCLUDED.payload, updated_at = now()
       WHERE dashboards.workspace_id = EXCLUDED.workspace_id
       RETURNING ${COLS}`,
      [
        dbId, workspaceId, clientId, d.name || 'Untitled', d.description || '', d.thumbnail || '📊', d.usedFor || '',
        toJson(d.globalFilters || []), toJson(d.canvas || {}), toJson(slimDashboard(d)),
      ]
    );
    if (!res.rows[0]) throw notFound('Dashboard not found'); // id belongs to another workspace
    // The Data Model is part of the dashboard: store it relationally in the same transaction.
    await syncDashboardModel(c, workspaceId, dbId, String(d.id), d.dataModel);
    return toApi(res.rows[0]);
  });
}

export async function deleteDashboard(workspaceId: string, id: string): Promise<boolean> {
  const { dbId } = resolveDbId(workspaceId, id);
  return tx(async (c) => {
    const del = await c.query(`DELETE FROM dashboards WHERE id = $1::uuid AND workspace_id = $2::uuid`, [dbId, workspaceId]);
    if (!del.rowCount) return false;
    await c.query(`DELETE FROM data_models WHERE dashboard_id = $1::uuid AND workspace_id = $2::uuid`, [dbId, workspaceId]);
    return true;
  });
}
