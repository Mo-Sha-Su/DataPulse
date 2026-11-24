/**
 * Express application factory for Data Pulse.
 * Configures security headers (Helmet/CSP), CORS, cache-control, cross-site mutation guards,
 * rate limiters, API routing (/api/*), and centralized error handling.
 * Does NOT start listening on a port so tests and the root Vite+Express dev server can mount it directly.
 */
import compression from 'compression';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import apiRouter from './routes/index';
import { errorHandler, requestContext } from './middleware/errors';
import { crossSiteGuard, noStore } from './middleware/security';

const limiterBase = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down and try again shortly.', code: 'rate_limited' },
};

export interface CreateAppOptions {
  /** Optional readiness gate invoked before non-health API requests until migrations complete. */
  waitForReady?: () => Promise<void>;
}

/** Builds and configures the Express application instance. */
export function createApp(options?: CreateAppOptions): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(requestContext);

  if (config.cspMode !== 'off') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          reportOnly: config.cspMode === 'report-only',
          useDefaults: false,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            fontSrc: ["'self'", 'data:'],
            connectSrc: ["'self'", '*'],
            workerSrc: ["'self'", 'blob:'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'", 'https:', 'http:'],
          },
        },
        frameguard: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
      })
    );
  } else {
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false, frameguard: false }));
  }

  app.use(compression());

  if (config.allowedOrigins.length > 0) {
    app.use('/api', cors({ origin: config.allowedOrigins, credentials: false, maxAge: 600 }));
  }

  app.use('/api', noStore);
  app.use('/api', crossSiteGuard);
  app.use('/api', express.json({ limit: config.maxBodyBytes }));

  if (!config.isTest) {
    app.use('/api', rateLimit({ ...limiterBase, windowMs: 15 * 60_000, limit: 3000 }));
    app.use('/api/auth/login', rateLimit({ ...limiterBase, windowMs: 15 * 60_000, limit: 10, skipSuccessfulRequests: true }));
    app.use('/api/auth/register', rateLimit({ ...limiterBase, windowMs: 60 * 60_000, limit: 10 }));
  }

  if (options?.waitForReady) {
    app.use('/api', (req, _res, next) => {
      if (req.path === '/health' || req.path === '/ready') return next();
      options.waitForReady!().then(() => next(), next);
    });
  }

  app.use('/api', apiRouter);
  app.use(errorHandler);
  return app;
}

export default createApp;
