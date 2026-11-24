/**
 * Dataset persistence repository (workspace-scoped).
 * Handles dataset CRUD, deterministic client-id UUID mapping, and atomic dataset_versions snapshots.
 */
import { PoolClient } from 'pg';
import { toJson } from '../lib/json';
import { orderRowKeys } from '../lib/rows';
import { toIsoTimestamp } from '../lib/dates';
import { query, tx } from '../db';
import { resolveDbId } from '../lib/ids';
import { notFound } from '../lib/errors';

export interface DatasetInput {
  id: string;
  name: string;
  description?: string;
  sourceType?: string;
  source_type?: string;
  sourceFile?: string;
  source_file?: string;
  columns?: any[];
  data?: Record<string, any>[];
  cleanedData?: Record<string, any>[] | null;
  cleaningPipeline?: any[];
  tags?: string[];
  current_version_id?: string;
  [k: string]: unknown;
}

function toApi(row: any) {
  const clientId = row.client_id as string | null;
  const columns = Array.isArray(row.columns_config) ? row.columns_config : [];
  const data = orderRowKeys(Array.isArray(row.data) ? row.data : [], columns);
  const rowCount = row.row_count ?? data.length;
  const columnCount = row.column_count ?? columns.length;
  const createdAt = toIsoTimestamp(row.created_at);
  return {
    id: clientId || String(row.id),
    name: row.name,
    description: row.description || '',
    source_type: row.source_type || 'custom',
    sourceType: row.source_type || 'custom',
    source_file: row.file_name,
    sourceFile: row.file_name,
    row_count: rowCount,
    rowCount,
    column_count: columnCount,
    columnCount,
    columns,
    created_at: createdAt,
    updated_at: toIsoTimestamp(row.updated_at),
    current_version_id: row.current_version_id || null,
    tags: row.tags || ['Neon DB'],
    uploadedAt: createdAt.replace('T', ' ').substring(0, 16),
    data,
    cleanedData: Array.isArray(row.cleaned_data) ? orderRowKeys(row.cleaned_data, columns) : (row.cleaned_data ?? undefined),
    cleaningPipeline: row.cleaning_pipeline || [],
  };
}

const COLS = `id, workspace_id, client_id, name, file_name, row_count, column_count, created_at, updated_at,
  data, cleaned_data, cleaning_pipeline, current_version_id, tags, columns_config, description, source_type`;

export async function listDatasets(workspaceId: string) {
  const rows = await query(`SELECT ${COLS} FROM datasets WHERE workspace_id = $1::uuid ORDER BY updated_at DESC`, [workspaceId]);
  return rows.map(toApi);
}

export async function getDataset(workspaceId: string, id: string, client?: PoolClient) {
  const { dbId } = resolveDbId(workspaceId, id);
  const sql = `SELECT ${COLS} FROM datasets WHERE id = $1::uuid AND workspace_id = $2::uuid LIMIT 1`;
  const rows = client ? (await client.query(sql, [dbId, workspaceId])).rows : await query(sql, [dbId, workspaceId]);
  return rows[0] ? toApi(rows[0]) : null;
}

/** Insert or update. Never touches a row owned by another workspace. */
export async function upsertDataset(workspaceId: string, d: DatasetInput, client?: PoolClient) {
  const { dbId, clientId } = resolveDbId(workspaceId, d.id);
  const data = d.data ?? [];
  const columns = d.columns ?? [];
  // Counts are derived from what is actually stored, never trusted from the client.
  const rowCount = d.cleanedData ? d.cleanedData.length : data.length;
  const columnCount = columns.length;
  const sql = `
    INSERT INTO datasets (id, workspace_id, client_id, name, file_name, storage_path, row_count, column_count, status,
      data, cleaned_data, cleaning_pipeline, current_version_id, tags, columns_config, description, source_type)
    VALUES ($1::uuid, $2::uuid, $3, $4, $5, 'db', $6, $7, 'ready', $8::jsonb, $9::jsonb, $10::jsonb, $11, $12::jsonb, $13::jsonb, $14, $15)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, file_name = EXCLUDED.file_name, row_count = EXCLUDED.row_count,
      column_count = EXCLUDED.column_count, data = EXCLUDED.data, cleaned_data = EXCLUDED.cleaned_data,
      cleaning_pipeline = EXCLUDED.cleaning_pipeline,
      current_version_id = COALESCE(EXCLUDED.current_version_id, datasets.current_version_id),
      tags = EXCLUDED.tags, columns_config = EXCLUDED.columns_config, description = EXCLUDED.description,
      source_type = EXCLUDED.source_type, updated_at = now()
    WHERE datasets.workspace_id = EXCLUDED.workspace_id
    RETURNING ${COLS}`;
  const params = [
    dbId, workspaceId, clientId, d.name, d.sourceFile || d.source_file || d.name, rowCount, columnCount,
    toJson(data), d.cleanedData ? toJson(d.cleanedData) : null,
    toJson(d.cleaningPipeline ?? []), d.current_version_id ?? null,
    toJson(d.tags ?? ['Custom']), toJson(columns), d.description ?? '',
    d.sourceType || d.source_type || 'custom',
  ];
  const res = client ? (await client.query(sql, params)).rows : await query(sql, params);
  if (!res[0]) throw notFound('Dataset not found'); // id exists but belongs to another workspace
  return toApi(res[0]);
}

export async function deleteDataset(workspaceId: string, id: string): Promise<boolean> {
  const { dbId } = resolveDbId(workspaceId, id);
  return tx(async (c) => {
    const del = await c.query(`DELETE FROM datasets WHERE id = $1::uuid AND workspace_id = $2::uuid`, [dbId, workspaceId]);
    if (!del.rowCount) return false;
    await c.query(`DELETE FROM dataset_versions WHERE dataset_id = $1`, [dbId]);
    return true;
  });
}

export interface VersionRow {
  id: string;
  dataset_id: string;
  version_number: number;
  transformation_steps: any[];
  row_count: number;
  column_count: number;
  created_at: string;
  created_by: string;
}

const toVersion = (r: any): VersionRow => ({
  id: String(r.id),
  dataset_id: String(r.dataset_id),
  version_number: Number(r.version_number),
  transformation_steps: r.transformation_steps || [],
  row_count: Number(r.row_count),
  column_count: Number(r.column_count),
  created_at: toIsoTimestamp(r.created_at),
  created_by: r.created_by || 'User',
});

export async function listVersions(workspaceId: string, id: string): Promise<VersionRow[] | null> {
  const { dbId } = resolveDbId(workspaceId, id);
  const owned = await query(`SELECT 1 FROM datasets WHERE id = $1::uuid AND workspace_id = $2::uuid`, [dbId, workspaceId]);
  if (!owned.length) return null;
  const rows = await query(`SELECT * FROM dataset_versions WHERE dataset_id = $1 ORDER BY version_number ASC`, [dbId]);
  return rows.map(toVersion);
}

/** Records a version snapshot and points the dataset at it, atomically. */
export async function addVersion(
  workspaceId: string,
  id: string,
  v: { transformation_steps?: any[]; row_count?: number; column_count?: number },
  userId: string,
  client?: PoolClient
): Promise<VersionRow | null> {
  const { dbId } = resolveDbId(workspaceId, id);
  const run = async (c: PoolClient): Promise<VersionRow | null> => {
    const ds = await c.query(
      `SELECT row_count, column_count, cleaning_pipeline FROM datasets WHERE id = $1::uuid AND workspace_id = $2::uuid FOR UPDATE`,
      [dbId, workspaceId]
    );
    if (!ds.rows[0]) return null;
    const next = await c.query(`SELECT COALESCE(MAX(version_number), 0) + 1 AS n FROM dataset_versions WHERE dataset_id = $1`, [dbId]);
    const n = Number(next.rows[0].n);
    const versionId = `v_${dbId}_${n}_${Date.now()}`;
    const steps = v.transformation_steps ?? ds.rows[0].cleaning_pipeline ?? [];
    const ins = await c.query(
      `INSERT INTO dataset_versions (id, dataset_id, version_number, transformation_steps, row_count, column_count, created_by)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7) RETURNING *`,
      [versionId, dbId, n, toJson(steps), v.row_count ?? ds.rows[0].row_count ?? 0, v.column_count ?? ds.rows[0].column_count ?? 0, userId]
    );
    await c.query(`UPDATE datasets SET current_version_id = $2, updated_at = now() WHERE id = $1::uuid`, [dbId, versionId]);
    return toVersion(ins.rows[0]);
  };
  return client ? run(client) : tx(run);
}
