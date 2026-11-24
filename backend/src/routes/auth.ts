/**
 * Authentication routes (/api/auth/register, /login, /logout, /me).
 * Issues HMAC-signed JWTs via httpOnly session cookies plus response body fallback for Bearer clients.
 */
import { Router } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, validate } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';
import { loginSchema, registerSchema } from '../schemas';
import { burnPasswordCheck, hashPassword, verifyPassword } from '../lib/password';
import { signToken } from '../lib/tokens';
import { clearSessionCookie, setSessionCookie } from '../lib/session';
import { createUser, findByEmailWithHash, updatePasswordHash } from '../repositories/users';
import { unauthorized } from '../lib/errors';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof registerSchema>;
    const user = await createUser({
      email: b.email,
      firstName: b.first_name || b.email.split('@')[0],
      lastName: b.last_name || '',
      passwordHash: await hashPassword(b.password),
      role: b.role || 'Analyst',
    });
    const token = signToken(user.id);
    setSessionCookie(res, token);
    res.status(201).json({ success: true, user, token, message: 'Account created' });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const found = await findByEmailWithHash(email);
    if (!found) {
      await burnPasswordCheck(password); // keep timing similar for unknown emails
      throw unauthorized('Invalid email or password');
    }
    const result = await verifyPassword(password, found.hash);
    if (!result.ok) throw unauthorized('Invalid email or password');
    if (result.needsRehash) await updatePasswordHash(found.user.id, await hashPassword(password));
    const token = signToken(found.user.id);
    setSessionCookie(res, token);
    res.json({ success: true, user: found.user, token, message: 'Login successful' });
  })
);

// Tokens are stateless; logout expires the session cookie in the browser.
router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

router.get(
  '/me',
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    res.json({ success: true, user: req.user });
  })
);

export default router;
