import { Pool, PoolClient, QueryResultRow } from 'pg';
import { config } from './config';
import { logger } from './lib/logger';

/**
 * PostgreSQL / Neon connection pool and transaction helpers.
 * Connection poolers (Neon's "-pooler" endpoints, PgBouncer, Supabase) run in transaction mode and reject
 * unknown startup parameters such as `statement_timeout`. A client-side `query_timeout` works everywhere,
 * so it is always set; the server-side timeout is only added for direct (non-pooled) connections.
 */
const usesPooler = /-pooler\.|pgbouncer=true|:6432\b|pooler\.supabase\./i.test(config.databaseUrl);

// `sslmode=require|prefer|verify-ca` are already treated as `verify-full` by pg; say so explicitly (no behaviour change, no warning).
const connectionString = config.databaseUrl.replace(/sslmode=(require|prefer|verify-ca)\b/i, 'sslmode=verify-full');

const TRANSIENT_DISCONNECT_RE = /ECONNRESET|ETIMEDOUT|EPIPE|Connection terminated/i;

function isTransientDisconnect(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = String((err as any).code || '');
  const message = String((err as any).message || '');
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'EPIPE' ||
    code === '57P01' ||
    TRANSIENT_DISCONNECT_RE.test(message)
  );
}

export const pool = new Pool({
  connectionString,
  max: config.databasePoolMax,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 15_000, // Neon may need a few seconds to wake a suspended compute
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  query_timeout: 35_000,
  ...(usesPooler ? {} : { statement_timeout: 30_000 }),
});

// Neon serverless computes and transaction poolers drop idle TCP sockets cleanly between bursts.
// Log routine idle disconnects as warnings (pg automatically evicts the client and opens a fresh one).
pool.on('error', (err) => {
  if (isTransientDisconnect(err)) {
    logger.warn('Idle Postgres client disconnected cleanly; pool will open a fresh connection on next query', {
      err: err.message,
    });
    return;
  }
  logger.error('Idle Postgres client error', { err: err.message });
});

type Queryable = Pick<Pool | PoolClient, 'query'>;

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: unknown[] = [],
  client: Queryable = pool
): Promise<T[]> {
  const res = await client.query<T>(text, params as any[]);
  return res.rows;
}

export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function ping(): Promise<number> {
  const t = Date.now();
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    if (!isTransientDisconnect(err)) throw err;
    await pool.query('SELECT 1');
  }
  return Date.now() - t;
}

export async function closePool() {
  await pool.end();
}
