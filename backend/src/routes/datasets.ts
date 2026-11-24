/**
 * Dataset CRUD, Data Lab transformation version snapshots, and column profiling routes (/api/datasets/*).
 * Datasets act as the single source of truth for rows across Data Lab, Dashboards, and Forecast Studio.
 */
import { Router } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, validate } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';
import { datasetSchema, datasetUpdateSchema, versionSchema } from '../schemas';
import * as repo from '../repositories/datasets';
import { notFound } from '../lib/errors';
import { tx } from '../db';

const router = Router();
router.use(requireAuth);

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

router.get('/', asyncHandler(async (req, res) => {
  res.json({ success: true, datasets: await repo.listDatasets(req.workspaceId!) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const dataset = await repo.getDataset(req.workspaceId!, req.params.id);
  if (!dataset) throw notFound('Dataset not found');
  res.json({ success: true, dataset });
}));

router.post('/', validate(datasetSchema), asyncHandler(async (req, res) => {
  const ws = req.workspaceId!;
  const result = await tx(async (client) => {
    const isNew = !(await repo.getDataset(ws, req.body.id, client));
    const dataset = await repo.upsertDataset(ws, req.body, client);
    let version = null;
    if (isNew) version = await repo.addVersion(ws, dataset.id, { transformation_steps: dataset.cleaningPipeline }, req.user!.id, client);
    return { dataset: version ? await repo.getDataset(ws, dataset.id, client) : dataset, version };
  });
  res.status(201).json({ success: true, dataset: result.dataset, version: result.version });
}));

router.put('/:id', validate(datasetUpdateSchema), asyncHandler(async (req, res) => {
  const ws = req.workspaceId!;
  const dataset = await tx(async (client) => {
    const existing = await repo.getDataset(ws, req.params.id, client);
    if (!existing) throw notFound('Dataset not found');
    const p = req.body;
    const merged = {
      ...existing,
      ...p,
      id: existing.id,
      data: p.data ?? existing.data,
      cleanedData: p.cleanedData !== undefined ? p.cleanedData : existing.cleanedData,
      cleaningPipeline: p.cleaningPipeline !== undefined ? p.cleaningPipeline : existing.cleaningPipeline,
      current_version_id: existing.current_version_id ?? undefined,
    };
    let saved = await repo.upsertDataset(ws, merged, client);
    if (p.cleaningPipeline && !same(p.cleaningPipeline, existing.cleaningPipeline)) {
      await repo.addVersion(ws, existing.id, { transformation_steps: p.cleaningPipeline, row_count: saved.row_count, column_count: saved.column_count }, req.user!.id, client);
      saved = (await repo.getDataset(ws, existing.id, client))!;
    }
    return saved;
  });
  res.json({ success: true, dataset });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const ok = await repo.deleteDataset(req.workspaceId!, req.params.id);
  if (!ok) throw notFound('Dataset not found');
  res.json({ success: true, message: 'Dataset deleted' });
}));

router.get('/:id/versions', asyncHandler(async (req, res) => {
  const versions = await repo.listVersions(req.workspaceId!, req.params.id);
  if (!versions) throw notFound('Dataset not found');
  res.json({ success: true, versions });
}));

router.post('/:id/versions', validate(versionSchema), asyncHandler(async (req, res) => {
  const version = await repo.addVersion(req.workspaceId!, req.params.id, req.body, req.user!.id);
  if (!version) throw notFound('Dataset not found');
  res.status(201).json({ success: true, version });
}));

router.get('/:id/preview', asyncHandler(async (req, res) => {
  const ds = await repo.getDataset(req.workspaceId!, req.params.id);
  if (!ds) throw notFound('Dataset not found');
  const rows: Record<string, any>[] = ds.cleanedData && ds.cleanedData.length > 0 ? ds.cleanedData : ds.data;
  const profiling = ds.columns.map((col: any) => {
    const values = rows.map((r) => r?.[col.name]);
    const empty = values.filter((v) => v === null || v === undefined || v === '').length;
    const valid = values.length ? Math.round(((values.length - empty) / values.length) * 100) : 0;
    return { column: col.name, type: col.type, validPercentage: valid, errorPercentage: 0, emptyPercentage: 100 - valid, distinctCount: new Set(values).size };
  });
  res.json({
    success: true,
    preview: {
      id: ds.id, name: ds.name, row_count: ds.row_count, column_count: ds.column_count, columns: ds.columns,
      current_version_id: ds.current_version_id, sampleRows: rows.slice(0, 50), profiling,
    },
  });
}));

export default router;
