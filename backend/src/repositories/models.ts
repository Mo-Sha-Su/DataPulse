/**
 * Semantic Data Model persistence repository (workspace-scoped).
 * Stores standalone data models as well as dashboard-linked models synchronized inside dashboard transactions.
 */
import { PoolClient } from 'pg';
import { toJson } from '../lib/json';
import { toIsoTimestamp } from '../lib/dates';
import { query } from '../db';
import { resolveDbId } from '../lib/ids';
import { notFound } from '../lib/errors';

function toApi(r: any) {
  const id = r.client_id || String(r.id);
  if (r.state && typeof r.state === 'object') return { ...r.state, id };
  return {
    id,
    name: r.name,
    factTables: r.fact_tables || [],
    dimensionTables: r.dimension_tables || [],
    relationships: r.relationships || [],
    measures: r.measures || [],
    hierarchies: r.hierarchies || [],
    versions: r.versions || [],
    createdAt: toIsoTimestamp(r.created_at),
    updatedAt: toIsoTimestamp(r.updated_at),
  };
}

const COLS = `id, client_id, name, fact_tables, dimension_tables, relationships, measures, hierarchies, versions, state, created_at, updated_at`;

export async function listModels(workspaceId: string) {
  const rows = await query(`SELECT ${COLS} FROM data_models WHERE workspace_id = $1::uuid ORDER BY updated_at DESC`, [workspaceId]);
  return rows.map(toApi);
}

export async function getModel(workspaceId: string, id: string) {
  const { dbId } = resolveDbId(workspaceId, id);
  const rows = await query(`SELECT ${COLS} FROM data_models WHERE id = $1::uuid AND workspace_id = $2::uuid LIMIT 1`, [dbId, workspaceId]);
  return rows[0] ? toApi(rows[0]) : null;
}

export async function upsertModel(workspaceId: string, m: Record<string, any>) {
  const { dbId, clientId } = resolveDbId(workspaceId, String(m.id));
  const res = await query(
    `INSERT INTO data_models (id, workspace_id, client_id, dashboard_id, name, fact_tables, dimension_tables,
       relationships, measures, hierarchies, versions, state)
     VALUES ($1::uuid, $2::uuid, $3, NULL, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, fact_tables = EXCLUDED.fact_tables, dimension_tables = EXCLUDED.dimension_tables,
       relationships = EXCLUDED.relationships, measures = EXCLUDED.measures, hierarchies = EXCLUDED.hierarchies,
       versions = EXCLUDED.versions, state = EXCLUDED.state, updated_at = now()
     WHERE data_models.workspace_id = EXCLUDED.workspace_id
     RETURNING ${COLS}`,
    [
      dbId, workspaceId, clientId, m.name || 'Data Model',
      toJson(m.factTables || []), toJson(m.dimensionTables || []), toJson(m.relationships || []),
      toJson(m.measures || []), toJson(m.hierarchies || []), toJson(m.versions || []),
      toJson(m),
    ]
  );
  if (!res[0]) throw notFound('Data model not found');
  return toApi(res[0]);
}

export async function deleteModel(workspaceId: string, id: string): Promise<boolean> {
  const { dbId } = resolveDbId(workspaceId, id);
  const res = await query<{ id: string }>(
    `DELETE FROM data_models WHERE id = $1::uuid AND workspace_id = $2::uuid RETURNING id`,
    [dbId, workspaceId]
  );
  return res.length > 0;
}

/**
 * Keeps the relational `data_models` row of a dashboard in step with the model embedded in the dashboard payload,
 * inside the same transaction as the dashboard save. One row per dashboard (deterministic id), linked through
 * dashboard_id so it is removed with the dashboard; a dashboard saved without a model has no row.
 */
export async function syncDashboardModel(
  c: PoolClient,
  workspaceId: string,
  dashboardDbId: string,
  dashboardClientId: string,
  model: unknown
): Promise<void> {
  if (!model || typeof model !== 'object' || Array.isArray(model)) {
    await c.query(`DELETE FROM data_models WHERE dashboard_id = $1::uuid AND workspace_id = $2::uuid`, [dashboardDbId, workspaceId]);
    return;
  }
  const m = model as Record<string, any>;
  const { dbId, clientId } = resolveDbId(workspaceId, `model:${dashboardClientId}`);
  await c.query(
    `INSERT INTO data_models (id, workspace_id, client_id, dashboard_id, name, fact_tables, dimension_tables,
       relationships, measures, hierarchies, versions, state)
     VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       dashboard_id = EXCLUDED.dashboard_id, name = EXCLUDED.name, fact_tables = EXCLUDED.fact_tables,
       dimension_tables = EXCLUDED.dimension_tables, relationships = EXCLUDED.relationships, measures = EXCLUDED.measures,
       hierarchies = EXCLUDED.hierarchies, versions = EXCLUDED.versions, state = EXCLUDED.state, updated_at = now()
     WHERE data_models.workspace_id = EXCLUDED.workspace_id`,
    [
      dbId, workspaceId, clientId, dashboardDbId, m.name || 'Data Model',
      toJson(m.factTables || []), toJson(m.dimensionTables || []), toJson(m.relationships || []),
      toJson(m.measures || []), toJson(m.hierarchies || []), toJson(m.versions || []),
      toJson(m),
    ]
  );
}
