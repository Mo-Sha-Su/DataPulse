import { query, tx } from '../db';
import { logger } from '../lib/logger';
import { toJson } from '../lib/json';
import { resolveDbId } from '../lib/ids';
import { addVersion, upsertDataset } from './datasets';
import { slimDashboard } from './dashboards';

/**
 * One-time data fix (idempotent): older versions embedded full dataset rows inside dashboards, and datasets uploaded
 * from within a dashboard existed ONLY there. Copy any such dataset into the `datasets` table, then strip the rows from
 * the dashboard so the data is stored exactly once. Datasets that already exist are left untouched.
 */
export async function rescueEmbeddedDatasets(): Promise<{ dashboards: number; datasets: number }> {
  const rows = await query(
    `SELECT id, workspace_id, payload FROM dashboards
     WHERE jsonb_path_exists(payload, '$.datasets[*] ? (exists(@.data[0]))')`
  );
  let datasetsMoved = 0;
  const created: { workspaceId: string; id: string; steps: any[] }[] = [];

  for (const r of rows) {
    const payload = r.payload;
    await tx(async (c) => {
      for (const ds of payload.datasets as any[]) {
        if (!ds || !Array.isArray(ds.data) || ds.data.length === 0 || !ds.id) continue;
        const { dbId } = resolveDbId(r.workspace_id, String(ds.id));
        const exists = await c.query(`SELECT 1 FROM datasets WHERE id = $1::uuid`, [dbId]);
        if (exists.rowCount) continue; // already stored (or owned by someone else): never overwrite
        await upsertDataset(r.workspace_id, { ...ds, name: ds.name || 'Recovered dataset' }, c);
        created.push({ workspaceId: r.workspace_id, id: String(ds.id), steps: ds.cleaningPipeline || [] });
        datasetsMoved++;
      }
      await c.query(`UPDATE dashboards SET payload = $2::jsonb WHERE id = $1::uuid`, [r.id, toJson(slimDashboard(payload))]);
    });
  }
  for (const d of created) {
    await addVersion(d.workspaceId, d.id, { transformation_steps: d.steps }, 'migration').catch(() => null);
  }
  if (rows.length) logger.info('Moved embedded dashboard datasets into the datasets table', { dashboards: rows.length, datasets: datasetsMoved });
  return { dashboards: rows.length, datasets: datasetsMoved };
}
