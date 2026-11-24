import { Router } from 'express';
import { asyncHandler, validate } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';
import { settingsSchema } from '../schemas';
import * as repo from '../repositories/settings';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  res.json({ success: true, settings: await repo.getSettings(req.user!.id) });
}));

router.put('/', validate(settingsSchema), asyncHandler(async (req, res) => {
  res.json({ success: true, settings: await repo.saveSettings(req.user!.id, req.body) });
}));

export default router;
