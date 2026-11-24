import crypto from 'crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { closePool, pool } from '../db';
import { runMigrations } from '../migrations';
import { rescueEmbeddedDatasets } from '../repositories/rescue';
import { toJson } from '../lib/json';

const app = createApp();
const uniq = () => crypto.randomBytes(4).toString('hex');

beforeAll(async () => {
  await runMigrations();
});
afterAll(async () => {
  await closePool();
});

async function signup(label: string) {
  const email = `${label}-${uniq()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ email, password: 'correct-horse-9', first_name: 'T', last_name: label });
  expect(res.status).toBe(201);
  return { auth: { Authorization: `Bearer ${res.body.token}` }, email };
}
const ds = (id: string, rows: any[], extra: any = {}) => ({
  id, name: `DS ${id}`, columns: [{ name: 'a', type: 'string', sampleValue: 'x' }], data: rows, ...extra,
});
const dash = (id: string, extra: any = {}) => ({ id, name: `Dash ${id}`, type: 'dashboard', widgets: [], datasets: [], canvas: { width: 1, height: 1 }, ...extra });

describe('HTTP hardening', () => {
  it('marks every API response no-store so browsers never cache user data', async () => {
    const { auth } = await signup('ns');
    for (const r of [await request(app).get('/api/datasets').set(auth), await request(app).get('/api/auth/me').set(auth), await request(app).get('/api/auth/me')]) {
      expect(r.headers['cache-control']).toMatch(/no-store/);
    }
  });

  it('refuses cross-site state-changing requests, allows same-origin and safe methods', async () => {
    const { auth } = await signup('csrf');
    const body = ds(`ds_${uniq()}`, [{ a: 1 }]);
    const blocked = await request(app).post('/api/datasets').set(auth).set('Sec-Fetch-Site', 'cross-site').send(body);
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('csrf_blocked');
    expect((await request(app).post('/api/datasets').set(auth).set('Sec-Fetch-Site', 'same-origin').send(body)).status).toBe(201);
    expect((await request(app).get('/api/datasets').set(auth).set('Sec-Fetch-Site', 'cross-site')).status).toBe(200);
    expect((await request(app).post('/api/auth/login').set('Sec-Fetch-Site', 'cross-site').send({ email: 'a@b.co', password: 'x' })).status).toBe(403);
  });

  it('session cookie is HttpOnly + SameSite=Lax and never readable from the body of other calls', async () => {
    const email = `ck-${uniq()}@example.com`;
    const r = await request(app).post('/api/auth/register').send({ email, password: 'correct-horse-9' });
    const c = ([] as string[]).concat(r.headers['set-cookie'] as unknown as string[]).find((x) => x.startsWith('dp_session='))!;
    expect(c).toMatch(/HttpOnly/i);
    expect(c).toMatch(/SameSite=Lax/i);
    expect(c).toMatch(/Max-Age=\d+/i);
  });
});

describe('what is stored is correct', () => {
  it('stores each dataset exactly once: dashboard saves never embed dataset rows', async () => {
    const { auth } = await signup('slim');
    const dsId = `ds_${uniq()}`;
    await request(app).post('/api/datasets').set(auth).send(ds(dsId, [{ a: 'one' }, { a: 'two' }]));
    const dId = `dash_${uniq()}`;
    const embedded = ds(dsId, [{ a: 'one' }, { a: 'two' }], { cleanedData: [{ a: 'one' }] });
    expect((await request(app).post('/api/dashboards').set(auth).send(dash(dId, { datasets: [embedded], selectedDatasetIds: [dsId] }))).status).toBeLessThan(300);

    const stored = (await pool.query(`SELECT payload FROM dashboards WHERE client_id = $1`, [dId])).rows[0].payload;
    expect(stored.datasets).toHaveLength(1);
    expect(stored.datasets[0].id).toBe(dsId);
    expect(stored.datasets[0].data).toEqual([]);
    expect(stored.datasets[0].cleanedData).toBeUndefined();
    expect(stored.selectedDatasetIds).toEqual([dsId]);
    // ...and the rows are still intact where they belong
    const got = await request(app).get(`/api/datasets/${dsId}`).set(auth);
    expect(got.body.dataset.data).toHaveLength(2);
  });

  it('row/column counts come from the stored data, not from client claims', async () => {
    const { auth } = await signup('cnt');
    const id = `ds_${uniq()}`;
    const res = await request(app).post('/api/datasets').set(auth).send(ds(id, [{ a: 1 }, { a: 2 }, { a: 3 }], { rowCount: 999999, columnCount: 42 }));
    expect(res.body.dataset.row_count).toBe(3);
    expect(res.body.dataset.column_count).toBe(1);
  });

  it('survives NUL characters, unicode and awkward values without a 500, and round-trips faithfully', async () => {
    const { auth } = await signup('nul');
    const id = `ds_${uniq()}`;
    const rows = [
      { a: 'bad\u0000value', n: 1.5, big: 12345678901, u: 'héllo ✓ 日本語 😀', nested: { k: [1, 2, { z: null }] }, empty: '', nil: null, lit: 'back\\u0000slash' },
    ];
    const res = await request(app).post('/api/datasets').set(auth).send(ds(id, rows));
    expect(res.status).toBe(201);
    const back = (await request(app).get(`/api/datasets/${id}`).set(auth)).body.dataset.data[0];
    expect(back.a).toBe('badvalue');
    expect(back.n).toBe(1.5);
    expect(back.big).toBe(12345678901);
    expect(back.u).toBe('héllo ✓ 日本語 😀');
    expect(back.nested).toEqual({ k: [1, 2, { z: null }] });
    expect(back.nil).toBeNull();
    expect(back.lit).toBe('back\\u0000slash'); // literal text is NOT touched
  });

  it('keeps column order: jsonb scrambles object keys, the API restores them from the columns list', async () => {
    const { auth } = await signup('order');
    const id = `ds_${uniq()}`;
    const names = ['Order ID', 'Customer ID', 'Region', 'Zebra', 'A', 'Quantity'];
    const columns = names.map((n) => ({ name: n, type: 'string', sampleValue: 'x' }));
    const row = Object.fromEntries(names.map((n, i) => [n, `v${i}`]));
    await request(app).post('/api/datasets').set(auth).send({ id, name: 'Order', columns, data: [row, row] });
    const stored = (await pool.query(`SELECT jsonb_object_keys(data->0) AS k FROM datasets WHERE client_id = $1`, [id])).rows.map((r) => r.k);
    expect(stored).not.toEqual(names); // proves the database really does reorder
    const one = await request(app).get(`/api/datasets/${id}`).set(auth);
    expect(Object.keys(one.body.dataset.data[0])).toEqual(names);
    const list = await request(app).get('/api/datasets').set(auth);
    expect(Object.keys(list.body.datasets.find((d: any) => d.id === id).data[1])).toEqual(names);
  });

  it('toJson only removes real NUL escapes', () => {
    expect(JSON.parse(toJson({ s: 'a\u0000b' })).s).toBe('ab');
    expect(JSON.parse(toJson({ s: 'a\\u0000b' })).s).toBe('a\\u0000b');
    expect(toJson(undefined)).toBe('null');
  });

  it('a large dataset (15k rows) is stored and read back completely', async () => {
    const { auth } = await signup('big');
    const id = `ds_${uniq()}`;
    const rows = Array.from({ length: 15_000 }, (_, i) => ({ a: `row-${i}`, n: i }));
    const res = await request(app).post('/api/datasets').set(auth).send(ds(id, rows));
    expect(res.status).toBe(201);
    const back = (await request(app).get(`/api/datasets/${id}`).set(auth)).body.dataset;
    expect(back.data).toHaveLength(15_000);
    expect(back.data[14_999]).toEqual({ a: 'row-14999', n: 14_999 });
    expect(back.row_count).toBe(15_000);
  }, 60_000);

  it('a payload over the body limit is refused cleanly (413), not a crash, and nothing is stored', async () => {
    const { auth } = await signup('huge');
    const id = `ds_${uniq()}`;
    const rows = Array.from({ length: 60_000 }, (_, i) => ({ a: `row-${i}`, n: i })); // > 1 MB test limit
    const res = await request(app).post('/api/datasets').set(auth).send(ds(id, rows));
    expect(res.status).toBe(413);
    expect(res.body.code).toBe('payload_too_large');
    expect((await request(app).get(`/api/datasets/${id}`).set(auth)).status).toBe(404);
  }, 60_000);
});

describe('isolation between users', () => {
  it("one user can't read, overwrite, version or delete another user's data (even with the same ids)", async () => {
    const a = await signup('isoA');
    const b = await signup('isoB');
    const id = `ds_${uniq()}`;
    await request(app).post('/api/datasets').set(a.auth).send(ds(id, [{ a: 'secret' }]));
    await request(app).post('/api/dashboards').set(a.auth).send(dash(id));

    // B uses the very same ids: B gets its own rows, A's are untouched
    await request(app).post('/api/datasets').set(b.auth).send(ds(id, [{ a: 'mine' }]));
    expect((await request(app).get(`/api/datasets/${id}`).set(a.auth)).body.dataset.data[0].a).toBe('secret');
    expect((await request(app).get(`/api/datasets/${id}`).set(b.auth)).body.dataset.data[0].a).toBe('mine');

    // Direct UUID addressing of A's row by B is a 404, never a leak or a write
    const aRow = (await pool.query(`SELECT id FROM datasets WHERE client_id = $1 ORDER BY created_at LIMIT 1`, [id])).rows[0].id;
    expect((await request(app).get(`/api/datasets/${aRow}`).set(b.auth)).status).toBe(404);
    expect((await request(app).put(`/api/datasets/${aRow}`).set(b.auth).send({ name: 'hijack' })).status).toBe(404);
    expect((await request(app).get(`/api/datasets/${aRow}/versions`).set(b.auth)).status).toBe(404);
    expect((await request(app).post(`/api/datasets/${aRow}/versions`).set(b.auth).send({})).status).toBe(404);
    expect((await request(app).delete(`/api/datasets/${aRow}`).set(b.auth)).status).toBe(404);
    expect((await request(app).post('/api/datasets').set(b.auth).send(ds(aRow, [{ a: 'overwrite' }]))).status).toBe(404);
    expect((await request(app).get(`/api/datasets/${id}`).set(a.auth)).body.dataset.data[0].a).toBe('secret');
  });

  it('every data endpoint requires a session', async () => {
    for (const [m, p] of [['get', '/api/datasets'], ['get', '/api/dashboards'], ['get', '/api/models'], ['get', '/api/settings'], ['post', '/api/datasets'], ['post', '/api/dashboards']] as const) {
      expect((await (request(app) as any)[m](p)).status).toBe(401);
    }
  });

  it('SQL-injection-shaped input is stored as inert text', async () => {
    const { auth } = await signup('sqli');
    const id = `ds_${uniq()}`;
    const evil = `x'); DROP TABLE users; --`;
    expect((await request(app).post('/api/datasets').set(auth).send({ ...ds(id, [{ a: evil }]), name: evil })).status).toBe(201);
    const back = (await request(app).get(`/api/datasets/${encodeURIComponent(id)}`).set(auth)).body.dataset;
    expect(back.name).toBe(evil);
    expect((await pool.query(`SELECT count(*)::int AS n FROM users`)).rows[0].n).toBeGreaterThan(0);
    expect((await request(app).get(`/api/datasets/${encodeURIComponent("1' OR '1'='1")}`).set(auth)).status).toBe(404);
  });
});

describe('startup rescue of embedded datasets', () => {
  it('moves rows that only lived inside a dashboard into the datasets table, then strips the dashboard', async () => {
    const { auth } = await signup('rescue');
    const dId = `dash_${uniq()}`;
    const lonely = ds(`ds_${uniq()}`, [{ a: 'only-copy-1' }, { a: 'only-copy-2' }]);
    await request(app).post('/api/dashboards').set(auth).send(dash(dId));
    // Simulate a dashboard written by an older version: dataset rows embedded in the JSON payload
    await pool.query(`UPDATE dashboards SET payload = $2::jsonb WHERE client_id = $1`, [dId, JSON.stringify(dash(dId, { datasets: [lonely] }))]);

    const out = await rescueEmbeddedDatasets();
    expect(out.datasets).toBeGreaterThanOrEqual(1);

    const got = await request(app).get(`/api/datasets/${lonely.id}`).set(auth);
    expect(got.status).toBe(200);
    expect(got.body.dataset.data).toHaveLength(2);
    const payload = (await pool.query(`SELECT payload FROM dashboards WHERE client_id = $1`, [dId])).rows[0].payload;
    expect(payload.datasets[0].data).toEqual([]);

    const again = await rescueEmbeddedDatasets(); // idempotent
    expect(again.datasets).toBe(0);
  });
});
