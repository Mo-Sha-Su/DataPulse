import jwt from 'jsonwebtoken';
import { config } from '../config';

const ISSUER = 'datapulse';

export function signToken(userId: string): string {
  return jwt.sign({}, config.jwtSecret, {
    subject: userId,
    issuer: ISSUER,
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/** Returns the user id (sub) or null when the token is invalid/expired. */
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: ISSUER });
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
