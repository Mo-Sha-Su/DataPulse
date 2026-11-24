import crypto from 'crypto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

/** RFC 4122 UUID v5 (SHA-1, name-based). Deterministic, so the same input always maps to the same id. */
export function uuidV5(name: string, namespace: string): string {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const hash = crypto.createHash('sha1').update(ns).update(name, 'utf8').digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const h = hash.subarray(0, 16).toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/**
 * The client generates ids like "ds_1699999999" / "dash_17..." that are not UUIDs.
 * We map them to a deterministic UUID scoped to the workspace, so
 *  - the same client id always resolves to the same row,
 *  - two tenants can never collide on (or overwrite) each other's rows.
 * The original id is stored in `client_id` and returned to the client unchanged.
 */
export function resolveDbId(workspaceId: string, clientId: string): { dbId: string; clientId: string | null } {
  if (isUuid(clientId)) return { dbId: clientId.toLowerCase(), clientId: null };
  return { dbId: uuidV5(clientId, workspaceId), clientId };
}
