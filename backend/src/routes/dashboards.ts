import { Router } from 'express';
import { asyncHandler, validate } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';
import { dashboardSchema } from '../schemas';
import * as repo from '../repositories/dashboards';
import { notFound } from '../lib/errors';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  res.json({ success: true, dashboards: await repo.listDashboards(req.workspaceId!) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const dashboard = await repo.getDashboard(req.workspaceId!, req.params.id);
  if (!dashboard) throw notFound('Dashboard not found');
  res.json({ success: true, dashboard });
}));

router.post('/', validate(dashboardSchema), asyncHandler(async (req, res) => {
  const dashboard = await repo.upsertDashboard(req.workspaceId!, req.body);
  res.json({ success: true, dashboard });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const ok = await repo.deleteDashboard(req.workspaceId!, req.params.id);
  if (!ok) throw notFound('Dashboard not found');
  res.json({ success: true, message: 'Dashboard deleted' });
}));

export default router;
