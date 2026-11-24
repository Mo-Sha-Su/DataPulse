import { Router } from 'express';
import { asyncHandler, validate } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';
import { modelSchema } from '../schemas';
import * as repo from '../repositories/models';
import { notFound } from '../lib/errors';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  res.json({ success: true, models: await repo.listModels(req.workspaceId!) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const model = await repo.getModel(req.workspaceId!, req.params.id);
  if (!model) throw notFound('Data model not found');
  res.json({ success: true, model });
}));

router.post('/', validate(modelSchema), asyncHandler(async (req, res) => {
  res.json({ success: true, model: await repo.upsertModel(req.workspaceId!, req.body) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const ok = await repo.deleteModel(req.workspaceId!, req.params.id);
  if (!ok) throw notFound('Data model not found');
  res.json({ success: true, message: 'Data model deleted' });
}));

export default router;
