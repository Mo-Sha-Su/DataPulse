import fs from 'fs';
import path from 'path';
import express from 'express';
import { config } from './config';
import { createApp } from './app';
import { closePool, ping } from './db';
import { runMigrations } from './migrations';
import { rescueEmbeddedDatasets } from './repositories/rescue';
import { logger, errorMeta } from './lib/logger';
import { errorHandler } from './middleware/errors';

export async function startServer() {
  await ping().catch((err) => {
    logger.error('Cannot reach the database. Check DATABASE_URL.', errorMeta(err));
    process.exit(1);
  });

  if (config.autoMigrate) {
    const applied = await runMigrations();
    logger.info(applied.length ? 'Migrations applied' : 'Database schema up to date', { applied });
    await rescueEmbeddedDatasets();
  }

  // Data in transit to a hosted database must be encrypted.
  if (config.isProd && !/sslmode=(require|verify-full|verify-ca)|ssl=true/i.test(config.databaseUrl) && !/@(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(config.databaseUrl)) {
    logger.warn('DATABASE_URL does not enable TLS (add ?sslmode=require). Data would travel unencrypted.');
  }

  const app = createApp();

  // The frontend is built and deployed separately (frontend/). In development it runs on its own Vite
  // server and proxies /api here. If a built copy is available (the Docker image ships one in ./public,
  // or point STATIC_DIR at frontend/dist) this server also hosts it so a single container can serve both.
  const staticDir = path.resolve(process.env.STATIC_DIR || path.join(process.cwd(), 'public'));
  if (fs.existsSync(path.join(staticDir, 'index.html'))) {
    app.use(
      express.static(staticDir, {
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
      res.sendFile(path.join(staticDir, 'index.html'));
    });
    app.use(errorHandler);
    logger.info('Serving frontend', { staticDir });
  }

  const server = app.listen(config.port, config.host, () => {
    logger.info('Data Pulse server started', { url: `http://${config.host}:${config.port}`, env: config.nodeEnv });
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
    // Don't wait on idle keep-alive sockets; give in-flight requests a few seconds, then cut them.
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

export default startServer;
