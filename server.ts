import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './backend/src/app';
import { config } from './backend/src/config';
import { ping, closePool } from './backend/src/db';
import { runMigrations } from './backend/src/migrations';
import { rescueEmbeddedDatasets } from './backend/src/repositories/rescue';
import { logger, errorMeta } from './backend/src/lib/logger';
import { errorHandler } from './backend/src/middleware/errors';

export async function startServer() {
  const dbReady = (async () => {
    let dbConnected = false;
    try {
      await ping();
      dbConnected = true;
      logger.info('Connected to PostgreSQL database');
    } catch (err) {
      logger.warn('PostgreSQL database offline on startup. Starting in offline/degraded mode.', errorMeta(err));
    }

    if (dbConnected && config.autoMigrate) {
      try {
        const applied = await runMigrations();
        logger.info(applied.length ? 'Migrations applied' : 'Database schema up to date', { applied });
        await rescueEmbeddedDatasets();
      } catch (err) {
        logger.warn('Migrations skipped or failed:', errorMeta(err));
      }
    }

    if (dbConnected && config.isProd && !/sslmode=(require|verify-full|verify-ca)|ssl=true/i.test(config.databaseUrl) && !/@(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(config.databaseUrl)) {
      logger.warn('DATABASE_URL does not enable TLS (add ?sslmode=require). Data would travel unencrypted.');
    }
  })();

  const app = createApp({ waitForReady: () => dbReady });

  if (process.env.NODE_ENV !== 'production') {
    const frontendDir = path.resolve(process.cwd(), 'frontend');
    const vite = await createViteServer({
      configFile: path.join(frontendDir, 'vite.config.ts'),
      root: frontendDir,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'frontend/dist');
    if (fs.existsSync(distPath)) {
      app.use(
        express.static(distPath, {
          index: false,
          setHeaders(res, filePath) {
            if (filePath.includes(`${path.sep}assets${path.sep}`)) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
          },
        })
      );
      app.get(/^(?!\/api\/).*/, (_req, res) => {
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.use(errorHandler);

  const server = app.listen(config.port, config.host, () => {
    logger.info('Data Pulse server started', {
      url: `http://${config.host}:${config.port}`,
      env: config.nodeEnv,
    });
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('Shutting down', { signal });
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    server.close(async () => {
      await closePool().catch(() => {});
      process.exit(0);
    });
    server.closeIdleConnections();
    setTimeout(() => server.closeAllConnections(), 5_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error('unhandledRejection', errorMeta(reason)));
  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', errorMeta(err));
    shutdown('uncaughtException');
  });

  return { app, server };
}

startServer().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal: server failed to start', err);
  process.exit(1);
});
