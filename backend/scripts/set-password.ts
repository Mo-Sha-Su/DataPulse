/**
 * Admin utility: set a new password for an existing account (there is no self-service reset flow yet).
 *   npx tsx scripts/set-password.ts user@example.com 'a-new-strong-password'
 */
import { closePool, query } from '../src/db';
import { hashPassword } from '../src/lib/password';

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.error("Usage: npx tsx scripts/set-password.ts <email> '<password (min 8 chars)>'");
    process.exit(1);
  }
  const rows = await query<{ id: string }>(
    `UPDATE users SET hashed_password = $2, updated_at = now() WHERE lower(email) = lower($1) RETURNING id`,
    [email, await hashPassword(password)]
  );
  console.log(rows.length ? `Password updated for ${email}` : `No account found for ${email}`);
  await closePool();
  process.exit(rows.length ? 0 : 2);
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
