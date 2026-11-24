import crypto from 'crypto';
import { query, tx } from '../db';
import { AuthenticatedUser } from '../types';
import { conflict } from '../lib/errors';
import { isUuid } from '../lib/ids';

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  hashed_password?: string | null;
}

export function toUser(row: UserRow): AuthenticatedUser {
  const names = (row.full_name || '').trim().split(/\s+/);
  return {
    id: String(row.id),
    email: row.email,
    first_name: names[0] || 'User',
    last_name: names.slice(1).join(' '),
    role: row.role || 'Analyst',
  };
}

export async function findByEmailWithHash(email: string) {
  const rows = await query<UserRow>(
    `SELECT id, email, full_name, role, hashed_password FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email]
  );
  return rows[0] ? { user: toUser(rows[0]), hash: rows[0].hashed_password ?? null } : null;
}

export async function findById(id: string): Promise<AuthenticatedUser | null> {
  if (!isUuid(id)) return null;
  const rows = await query<UserRow>(`SELECT id, email, full_name, role FROM users WHERE id = $1::uuid LIMIT 1`, [id]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function createUser(input: {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: string;
}): Promise<AuthenticatedUser> {
  const id = crypto.randomUUID();
  const wsId = crypto.randomUUID();
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  try {
    await tx(async (c) => {
      await c.query(
        `INSERT INTO users (id, email, hashed_password, full_name, role) VALUES ($1::uuid, $2, $3, $4, $5)`,
        [id, input.email, input.passwordHash, fullName, input.role]
      );
      await c.query(`INSERT INTO workspaces (id, owner_id, name) VALUES ($1::uuid, $2::uuid, 'My Workspace')`, [wsId, id]);
    });
  } catch (err: any) {
    if (err?.code === '23505') throw conflict('An account with this email already exists');
    throw err;
  }
  return { id, email: input.email, first_name: input.firstName, last_name: input.lastName, role: input.role };
}

export async function updatePasswordHash(id: string, hash: string) {
  await query(`UPDATE users SET hashed_password = $2, updated_at = now() WHERE id = $1::uuid`, [id, hash]);
}
