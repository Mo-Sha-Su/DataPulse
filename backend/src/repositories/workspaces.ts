import crypto from 'crypto';
import { query, tx } from '../db';

/**
 * Returns the workspace owned by `userId`, creating it if the account has none yet.
 * There is intentionally NO fallback to another user's workspace.
 */
export async function getOrCreateWorkspaceId(userId: string): Promise<string> {
  const found = await query<{ id: string }>(
    `SELECT id FROM workspaces WHERE owner_id = $1::uuid ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  if (found[0]) return String(found[0].id);

  return tx(async (c) => {
    // Serialize concurrent first requests for the same user.
    await c.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`ws:${userId}`]);
    const again = await c.query(`SELECT id FROM workspaces WHERE owner_id = $1::uuid ORDER BY created_at ASC LIMIT 1`, [userId]);
    if (again.rows[0]) return String(again.rows[0].id);
    const id = crypto.randomUUID();
    await c.query(`INSERT INTO workspaces (id, owner_id, name) VALUES ($1::uuid, $2::uuid, 'My Workspace')`, [id, userId]);
    return id;
  });
}
