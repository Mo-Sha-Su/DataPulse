import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { HttpError } from '../lib/errors';

/**
 * API responses carry private user data: tell browsers and proxies never to keep a copy
 * (no HTTP cache entry, no back/forward cache). Together with the in-memory-only frontend this keeps
 * user data out of anything stored on the device.
 */
export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth on top of the SameSite=Lax session cookie: browsers label every request with
 * Sec-Fetch-Site. A state-changing request that a *different site* triggered is refused, unless its Origin is
 * explicitly allowed (ALLOWED_ORIGINS). Same-origin traffic, the dev proxy and non-browser clients are unaffected.
 */
export function crossSiteGuard(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host && (origin === `http://${host}` || origin === `https://${host}`)) {
    return next();
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    if (!origin || !config.allowedOrigins.includes(origin)) {
      return next(new HttpError(403, 'Cross-site request blocked', 'csrf_blocked'));
    }
  }
  next();
}
