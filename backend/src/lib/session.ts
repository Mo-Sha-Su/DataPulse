import jwt from 'jsonwebtoken';
import { CookieOptions, Request, Response } from 'express';
import { config } from '../config';

export const SESSION_COOKIE = 'dp_session';

function baseOptions(): CookieOptions {
  return {
    httpOnly: true, // not readable from JavaScript: nothing session-related lives in browser storage
    secure: config.isProd,
    sameSite: 'lax', // blocks cross-site POST/PUT/DELETE from carrying the cookie (CSRF)
    path: '/',
  };
}

/** Starts a browser session: signed JWT in an httpOnly cookie that expires together with the token. */
export function setSessionCookie(res: Response, token: string) {
  const exp = (jwt.decode(token) as { exp?: number } | null)?.exp;
  const maxAge = exp ? Math.max(0, exp * 1000 - Date.now()) : undefined;
  res.cookie(SESSION_COOKIE, token, { ...baseOptions(), maxAge });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, baseOptions());
}

/** Minimal Cookie header parser (avoids an extra dependency). */
export function readCookie(req: Request, name: string): string {
  const header = req.headers.cookie;
  if (!header) return '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return '';
      }
    }
  }
  return '';
}
