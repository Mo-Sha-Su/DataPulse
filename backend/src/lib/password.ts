import crypto from 'crypto';
import { promisify } from 'util';

const pbkdf2 = promisify(crypto.pbkdf2);

/** OWASP (2023) recommendation for PBKDF2-HMAC-SHA512. */
export const CURRENT_ITERATIONS = 210_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await pbkdf2(password, salt, CURRENT_ITERATIONS, 64, 'sha512')).toString('hex');
  return `$pbkdf2$${CURRENT_ITERATIONS}$${salt}$${hash}`;
}

function parse(stored: string) {
  const parts = stored.split('$'); // ['', 'pbkdf2', iterations, salt, hash]
  if (parts.length !== 5 || parts[1] !== 'pbkdf2') return null;
  const iterations = parseInt(parts[2], 10);
  if (!Number.isFinite(iterations) || iterations < 1000 || iterations > 5_000_000) return null;
  if (!/^[0-9a-f]+$/i.test(parts[4]) || parts[4].length % 2 !== 0) return null;
  return { iterations, salt: parts[3], hash: Buffer.from(parts[4], 'hex') };
}

/** Returns whether the password matches and whether the stored hash should be upgraded. */
export async function verifyPassword(
  password: string,
  stored: string | null | undefined
): Promise<{ ok: boolean; needsRehash: boolean }> {
  const parsed = stored ? parse(stored) : null;
  if (!parsed) {
    // Unknown / unsupported hash formats (incl. old "$argon2id$" placeholders) never authenticate.
    return { ok: false, needsRehash: false };
  }
  const computed = await pbkdf2(password, parsed.salt, parsed.iterations, parsed.hash.length, 'sha512');
  const ok = computed.length === parsed.hash.length && crypto.timingSafeEqual(computed, parsed.hash);
  return { ok, needsRehash: ok && parsed.iterations < CURRENT_ITERATIONS };
}

// Used to keep login timing similar whether or not the email exists.
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword('dummy-password-for-timing');
  await verifyPassword(password, await dummyHash);
}
