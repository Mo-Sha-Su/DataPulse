import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { unauthorized } from '../lib/errors';
import { verifyToken } from '../lib/tokens';
import { readCookie, SESSION_COOKIE } from '../lib/session';
import { findById } from '../repositories/users';
import { getOrCreateWorkspaceId } from '../repositories/workspaces';

export function extractToken(req: AuthenticatedRequest): string {
  // Browser sessions use the httpOnly cookie; the Bearer header stays available for scripts/API clients.
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) return h.slice(7).trim();
  return readCookie(req, SESSION_COOKIE);
}

/** Requires a valid signed JWT for an existing user. No guest fallback. */
export async function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    const userId = token ? verifyToken(token) : null;
    if (!userId) throw unauthorized();
    const user = await findById(userId);
    if (!user) throw unauthorized('Account no longer exists');
    req.user = user;
    req.workspaceId = await getOrCreateWorkspaceId(user.id);
    next();
  } catch (err) {
    next(err);
  }
}
