import crypto from 'crypto';
import request from 'supertest';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Regression: a database created by an older app version (tables already exist, created_at/updated_at are
 * NOT NULL without defaults, plus extra required columns) must still work after migrations.
 * Uses a throwaway database so it never touches the main test database.
 */
const baseUrl = process.env.DATABASE_URL!;
const dbName = `dp_legacy_${crypto.randomBytes(4).toString('hex')}`;
const withDb = (name: string) => {
  const u = new URL(baseUrl);
  u.pathname = `/${name}`;
  return u.toString();
};

let app: any;
let closePool: () => Promise<void>;

beforeAll(async () => {
  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${dbName}`);
  await admin.end();

  const legacy = new Client({ connectionString: withDb(dbName) });
  await legacy.connect();
  await legacy.query(`
    CREATE TABLE users (id uuid PRIMARY KEY, email varchar NOT NULL, hashed_password text, full_name varchar,
      created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, legacy_flag boolean NOT NULL);
    CREATE TABLE workspaces (id uuid PRIMARY KEY, owner_id uuid NOT NULL, name varchar,
      created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
    CREATE TABLE datasets (id uuid PRIMARY KEY, workspace_id uuid NOT NULL, name varchar NOT NULL,
      created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, old_required text NOT NULL);
    CREATE TABLE dashboards (id uuid PRIMARY KEY, workspace_id uuid NOT NULL, name varchar NOT NULL,
      created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL);
  `);
  await legacy.end();

  process.env.DATABASE_URL = withDb(dbName); // must be set before the app modules load
  const { runMigrations } = await import('../migrations');
  const db = await import('../db');
  const { createApp } = await import('../app');
  closePool = db.closePool;
  await runMigrations();
  app = createApp();
});

afterAll(async () => {
  await closePool?.();
  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
  await admin.end();
});

describe('legacy schema upgrade', () => {
  it('registers, logs in and stores dashboards/datasets on a pre-existing old-style schema', async () => {
    const email = `legacy-${crypto.randomBytes(4).toString('hex')}@example.com`;
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'correct-horse-9', first_name: 'L', last_name: 'S' });
    expect(reg.status).toBe(201);
    const cookie = String(([] as string[]).concat(reg.headers['set-cookie'] as unknown as string[])[0]).split(';')[0];

    expect((await request(app).post('/api/auth/login').send({ email, password: 'correct-horse-9' })).status).toBe(200);

    const dash = await request(app).post('/api/dashboards').set('Cookie', cookie)
      .send({ id: 'dash_l', name: 'Legacy', type: 'dashboard', widgets: [], datasets: [], canvas: { presetName: 'x', width: 1, height: 1 } });
    expect(dash.status).toBeLessThan(300);

    const ds = await request(app).post('/api/datasets').set('Cookie', cookie)
      .send({ id: 'ds_l', name: 'Legacy data', columns: [{ name: 'a', type: 'number', sampleValue: 1 }], data: [{ a: 1 }] });
    expect(ds.status).toBeLessThan(300);
    expect((await request(app).get('/api/datasets').set('Cookie', cookie)).body.datasets).toHaveLength(1);
  });
});
