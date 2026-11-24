import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import crypto from 'crypto';
import { HttpError } from '../lib/errors';
import { logger, errorMeta } from '../lib/logger';
import { AuthenticatedRequest } from '../types';

export const asyncHandler =
  <R extends Request = AuthenticatedRequest>(fn: (req: R, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req as R, res, next).catch(next);

export function requestContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string)?.slice(0, 64) || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  const start = Date.now();
  res.on('finish', () => {
    if (!req.path.startsWith('/api')) return;
    logger.info('request', {
      id, method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start, user: req.user?.id,
    });
  });
  next();
}

export function validate<T>(schema: ZodType<T>, source: 'body' | 'query' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).slice(0, 5).join('; ');
      return next(new HttpError(400, `Invalid request: ${msg}`, 'validation_error'));
    }
    (req as any)[source] = parsed.data;
    next();
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: AuthenticatedRequest, res: Response, _next: NextFunction) {
  if (res.headersSent) return;
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, message: 'Invalid request', code: 'validation_error' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Payload too large. Try a smaller file.', code: 'payload_too_large' });
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ success: false, message: 'Malformed JSON body', code: 'bad_json' });
  }
  logger.error('Unhandled error', { id: req.requestId, path: req.path, ...errorMeta(err) });
  return res.status(500).json({ success: false, message: 'Internal server error', requestId: req.requestId });
}
