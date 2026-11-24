import { Router } from 'express';
import { ping } from '../db';
import authRouter from './auth';
import datasetsRouter from './datasets';
import dashboardsRouter from './dashboards';
import modelsRouter from './models';
import settingsRouter from './settings';
import forecastsRouter from './forecasts';
import { notFoundHandler } from '../middleware/errors';

const apiRouter = Router();

// Liveness: process is up. Readiness: database reachable. Neither leaks infrastructure details.
apiRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));
apiRouter.get('/ready', async (_req, res) => {
  try {
    res.json({ status: 'ready', dbLatencyMs: await ping() });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});
// Kept for the existing status badge in the UI.
apiRouter.get('/neon/status', async (_req, res) => {
  try {
    res.json({ success: true, neon: { connected: true, provider: 'PostgreSQL', latencyMs: await ping() } });
  } catch {
    res.status(503).json({ success: false, neon: { connected: false, provider: 'PostgreSQL', error: 'Database unavailable' } });
  }
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/datasets', datasetsRouter);
apiRouter.use('/dashboards', dashboardsRouter);
apiRouter.use('/models', modelsRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/forecasts', forecastsRouter);
apiRouter.use(notFoundHandler);

export default apiRouter;
