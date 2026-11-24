import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { closePool, pool } from '../db';
import { runMigrations } from '../migrations';

const app = createApp();
const uniq = () => crypto.randomBytes(5).toString('hex');

async function signup(label = 'user') {
  const email = `${label}-${uniq()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ email, password: 'correct-horse-9', first_name: 'Test', last_name: label });
  expect(res.status).toBe(201);
  return { email, token: res.body.token as string, id: res.body.user.id as string, auth: { Authorization: `Bearer ${res.body.token}` } };
}

const ds = (id: string, extra: Record<string, unknown> = {}) => ({
  id, name: `Dataset ${id}`, columns: [{ name: 'a', type: 'number', sampleValue: 1 }], data: [{ a: 1 }, { a: 2 }], ...extra,
});

beforeAll(async () => {
  await runMigrations();
});
afterAll(async () => {
  await closePool();
});

describe('infrastructure', () => {
  it('health and readiness work and leak nothing', async () => {
    expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' });
    const ready = await request(app).get('/api/ready');
    expect(ready.status).toBe(200);
    expect(JSON.stringify(ready.body)).not.toMatch(/neon|postgres:\/\//i);
  });
  it('migrations are idempotent', async () => {
    expect(await runMigrations()).toEqual([]);
  });
  it('unknown api routes return JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
  it('rejects malformed JSON and oversized bodies without leaking internals', async () => {
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{oops');
    expect(bad.status).toBe(400);
    const big = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(2 * 1024 * 1024) });
    expect(big.status).toBe(413);
  });
});

describe('authentication', () => {
  it('registers, rejects duplicates, weak passwords and bad emails', async () => {
    const u = await signup('dup');
    const dup = await request(app).post('/api/auth/register').send({ email: u.email.toUpperCase(), password: 'another-pass-1' });
    expect(dup.status).toBe(409);
    expect((await request(app).post('/api/auth/register').send({ email: `x-${uniq()}@e.com`, password: 'short' })).status).toBe(400);
    expect((await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'long-enough-1' })).status).toBe(400);
  });

  it('registering an existing email does NOT overwrite its password (no account takeover)', async () => {
    const u = await signup('takeover');
    await request(app).post('/api/auth/register').send({ email: u.email, password: 'attacker-pass-1' });
    expect((await request(app).post('/api/auth/login').send({ email: u.email, password: 'attacker-pass-1' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: u.email, password: 'correct-horse-9' })).status).toBe(200);
  });

  it('logs in with the right password only', async () => {
    const u = await signup('login');
    expect((await request(app).post('/api/auth/login').send({ email: u.email, password: 'wrong-password' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'whatever-1' })).status).toBe(401);
    const ok = await request(app).post('/api/auth/login').send({ email: u.email, password: 'correct-horse-9' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
  });

  it('cookie session: httpOnly cookie authenticates /me and datasets; logout clears it', async () => {
    const u = await signup('cookie');
    const login = await request(app).post('/api/auth/login').send({ email: u.email, password: 'correct-horse-9' });
    const setCookie = ([] as string[]).concat(login.headers['set-cookie'] as unknown as string[]);
    const raw = setCookie.find((c) => c.startsWith('dp_session='))!;
    expect(raw).toBeTruthy();
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Lax/i);
    const cookie = raw.split(';')[0];

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(u.email);
    expect((await request(app).get('/api/datasets').set('Cookie', cookie)).status).toBe(200);
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Cookie', 'dp_session=garbage')).status).toBe(401);

    const out = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(out.status).toBe(200);
    expect(([] as string[]).concat(out.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/dp_session=;/);
  });

  it('legacy "$argon2id$" placeholder hashes can no longer log in with any password', async () => {
    const u = await signup('legacy');
    await pool.query(`UPDATE users SET hashed_password = '$argon2id$v=19$m=65536,t=3,p=4$placeholder' WHERE id = $1::uuid`, [u.id]);
    expect((await request(app).post('/api/auth/login').send({ email: u.email, password: 'anything-at-all' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: u.email, password: 'correct-horse-9' })).status).toBe(401);
  });

  it('upgrades old PBKDF2 hashes on login', async () => {
    const u = await signup('rehash');
    const salt = 'abcd1234abcd1234';
    const hash = crypto.pbkdf2Sync('correct-horse-9', salt, 100000, 64, 'sha512').toString('hex');
    await pool.query(`UPDATE users SET hashed_password = $2 WHERE id = $1::uuid`, [u.id, `$pbkdf2$100000$${salt}$${hash}`]);
    expect((await request(app).post('/api/auth/login').send({ email: u.email, password: 'correct-horse-9' })).status).toBe(200);
    const { rows } = await pool.query('SELECT hashed_password FROM users WHERE id = $1::uuid', [u.id]);
    expect(rows[0].hashed_password).toContain('$pbkdf2$210000$');
  });

  it('protected routes need a valid signed token (no guest fallback, no forged tokens)', async () => {
    const victim = await signup('victim');
    for (const path of ['/api/datasets', '/api/dashboards', '/api/models', '/api/settings', '/api/auth/me']) {
      expect((await request(app).get(path)).status).toBe(401);
    }
    const forged = [
      `token_${victim.id}`,
      `token_${victim.id}_deadbeef`,
      'token_demo_analyst',
      jwt.sign({}, 'wrong-secret-wrong-secret-wrong-secret-1', { subject: victim.id, issuer: 'datapulse' }),
      jwt.sign({}, 'x', { algorithm: 'none' as any, subject: victim.id }),
      jwt.sign({}, 'test-secret-test-secret-test-secret-123456', { subject: victim.id }), // missing issuer
      jwt.sign({}, 'test-secret-test-secret-test-secret-123456', { subject: victim.id, issuer: 'datapulse', expiresIn: -10 }),
    ];
    for (const t of forged) {
      expect((await request(app).get('/api/datasets').set('Authorization', `Bearer ${t}`)).status).toBe(401);
    }
    expect((await request(app).get('/api/auth/me').set(victim.auth)).body.user.email).toBe(victim.email);
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const u = await signup('deleted');
    await pool.query('DELETE FROM users WHERE id = $1::uuid', [u.id]);
    expect((await request(app).get('/api/datasets').set(u.auth)).status).toBe(401);
  });
});

describe('tenant isolation', () => {
  it('a new user never sees another tenant\'s data', async () => {
    const a = await signup('a');
    await request(app).post('/api/datasets').set(a.auth).send(ds('ds_private'));
    await request(app).post('/api/dashboards').set(a.auth).send({ id: 'dash_private', name: 'Secret' });
    const b = await signup('b');
    expect((await request(app).get('/api/datasets').set(b.auth)).body.datasets).toEqual([]);
    expect((await request(app).get('/api/dashboards').set(b.auth)).body.dashboards).toEqual([]);
  });

  it('cannot read, overwrite or delete another tenant\'s rows by id', async () => {
    const a = await signup('owner');
    const b = await signup('intruder');
    const uuid = crypto.randomUUID();
    await request(app).post('/api/datasets').set(a.auth).send(ds(uuid, { name: 'Mine' }));
    await request(app).post('/api/dashboards').set(a.auth).send({ id: uuid, name: 'Mine' });
    await request(app).post('/api/models').set(a.auth).send({ id: uuid, name: 'Mine' });

    for (const kind of ['datasets', 'dashboards', 'models']) {
      expect((await request(app).get(`/api/${kind}/${uuid}`).set(b.auth)).status).toBe(404);
      expect((await request(app).post(`/api/${kind}`).set(b.auth).send({ ...ds(uuid), name: 'Hijacked' })).status).toBe(404);
      expect((await request(app).delete(`/api/${kind}/${uuid}`).set(b.auth)).status).toBe(404);
    }
    expect((await request(app).put(`/api/datasets/${uuid}`).set(b.auth).send({ name: 'Hijacked' })).status).toBe(404);
    expect((await request(app).get(`/api/datasets/${uuid}/versions`).set(b.auth)).status).toBe(404);
    expect((await request(app).post(`/api/datasets/${uuid}/versions`).set(b.auth).send({})).status).toBe(404);
    expect((await request(app).get(`/api/datasets/${uuid}/preview`).set(b.auth)).status).toBe(404);

    const mine = await request(app).get(`/api/datasets/${uuid}`).set(a.auth);
    expect(mine.body.dataset.name).toBe('Mine');
    expect((await request(app).get(`/api/dashboards/${uuid}`).set(a.auth)).body.dashboard.name).toBe('Mine');
  });

  it('identical client ids in different workspaces stay independent', async () => {
    const a = await signup('same1');
    const b = await signup('same2');
    await request(app).post('/api/datasets').set(a.auth).send(ds('ds_1', { name: 'A data' }));
    await request(app).post('/api/datasets').set(b.auth).send(ds('ds_1', { name: 'B data' }));
    expect((await request(app).get('/api/datasets/ds_1').set(a.auth)).body.dataset.name).toBe('A data');
    expect((await request(app).get('/api/datasets/ds_1').set(b.auth)).body.dataset.name).toBe('B data');
    await request(app).delete('/api/datasets/ds_1').set(b.auth);
    expect((await request(app).get('/api/datasets/ds_1').set(a.auth)).status).toBe(200);
  });

  it('settings are per user', async () => {
    const a = await signup('set1');
    const b = await signup('set2');
    await request(app).put('/api/settings').set(a.auth).send({ theme: 'dark', preferences: { x: 1 } });
    expect((await request(app).get('/api/settings').set(a.auth)).body.settings.theme).toBe('dark');
    expect((await request(app).get('/api/settings').set(b.auth)).body.settings.theme).toBe('light');
  });
});

describe('datasets', () => {
  it('keeps client ids stable and does not duplicate on repeated saves', async () => {
    const u = await signup('stable');
    for (let i = 0; i < 3; i++) await request(app).post('/api/datasets').set(u.auth).send(ds('ds_123', { name: `v${i}` }));
    const list = (await request(app).get('/api/datasets').set(u.auth)).body.datasets;
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('ds_123');
    expect(list[0].name).toBe('v2');
    expect(list[0].rowCount).toBe(2);
  });

  it('creates version 1, then a new version when the cleaning pipeline changes', async () => {
    const u = await signup('versions');
    const created = await request(app).post('/api/datasets').set(u.auth).send(ds('ds_v'));
    expect(created.body.version.version_number).toBe(1);
    const pipeline = [{ id: 's1', type: 'remove_duplicates' }];
    const put = await request(app).put('/api/datasets/ds_v').set(u.auth).send({ cleaningPipeline: pipeline, cleanedData: [{ a: 1 }] });
    expect(put.status).toBe(200);
    expect(put.body.dataset.rowCount).toBe(1);
    expect(put.body.dataset.data).toHaveLength(2); // raw data preserved
    const versions = (await request(app).get('/api/datasets/ds_v/versions').set(u.auth)).body.versions;
    expect(versions.map((v: any) => v.version_number)).toEqual([1, 2]);
    // saving the same pipeline again must not create another version
    await request(app).put('/api/datasets/ds_v').set(u.auth).send({ cleaningPipeline: pipeline });
    expect((await request(app).get('/api/datasets/ds_v/versions').set(u.auth)).body.versions).toHaveLength(2);
  });

  it('never invents fake rows for datasets without data', async () => {
    const u = await signup('nofake');
    await request(app).post('/api/datasets').set(u.auth).send({ id: 'ds_empty', name: 'Empty', columns: [{ name: 'n', type: 'number' }] });
    expect((await request(app).get('/api/datasets/ds_empty').set(u.auth)).body.dataset.data).toEqual([]);
  });

  it('validates input', async () => {
    const u = await signup('valid');
    expect((await request(app).post('/api/datasets').set(u.auth).send({ id: 'x' })).status).toBe(400);
    expect((await request(app).post('/api/datasets').set(u.auth).send({ id: 'x', name: 'n', data: 'nope' })).status).toBe(400);
  });

  it('returns a preview with profiling', async () => {
    const u = await signup('preview');
    await request(app).post('/api/datasets').set(u.auth).send(ds('ds_p', { data: [{ a: 1 }, { a: '' }] }));
    const p = (await request(app).get('/api/datasets/ds_p/preview').set(u.auth)).body.preview;
    expect(p.profiling[0].emptyPercentage).toBe(50);
  });

  it('persists Data Lab cleaned rows, reordered columns, and cleaning log while preserving created_at and rejecting oversized payloads', async () => {
    const u = await signup('datalab_apply');
    const created = await request(app)
      .post('/api/datasets')
      .set(u.auth)
      .send({
        id: 'ds_lab',
        name: 'Lab Orders',
        columns: [
          { name: 'Region', type: 'string', sampleValue: 'East' },
          { name: 'Sales', type: 'number', sampleValue: 10 },
        ],
        data: [
          { Region: 'East', Sales: 10 },
          { Region: 'West', Sales: 20 },
        ],
        cleanedData: [
          { Region: 'East', Sales: 10 },
          { Region: 'West', Sales: 20 },
        ],
      });
    expect(created.status).toBe(201);
    const originalCreatedAt = created.body.dataset.created_at;
    const originalUploadedAt = created.body.dataset.uploadedAt;

    const pipeline = [
      { id: 's1', name: 'Moved column (Sales)', type: 'move_column', description: '', params: { column: 'Sales', direction: 'left' } },
      { id: 's2', name: 'Removed row 2', type: 'remove_rows', description: '', params: { action: 'remove_indices', rowIndices: [1] } },
    ];
    const putOk = await request(app)
      .put('/api/datasets/ds_lab')
      .set(u.auth)
      .send({
        columns: [
          { name: 'Sales', type: 'number', sampleValue: 10 },
          { name: 'Region', type: 'string', sampleValue: 'East' },
        ],
        data: [{ Sales: 10, Region: 'East' }],
        cleanedData: null,
        cleaningPipeline: pipeline,
      });
    expect(putOk.status).toBe(200);
    expect(putOk.body.dataset.rowCount).toBe(1);
    expect(putOk.body.dataset.created_at).toBe(originalCreatedAt);
    expect(putOk.body.dataset.uploadedAt).toBe(originalUploadedAt);
    expect(putOk.body.dataset.columns.map((c: any) => c.name)).toEqual(['Sales', 'Region']);
    expect(Object.keys(putOk.body.dataset.data[0])).toEqual(['Sales', 'Region']);
    expect(putOk.body.dataset.cleaningPipeline).toHaveLength(2);

    // Oversized payload fails cleanly with 413 and does not corrupt the saved dataset in PostgreSQL
    const hugeRes = await request(app)
      .put('/api/datasets/ds_lab')
      .set(u.auth)
      .send({ data: [{ Sales: 'x'.repeat(2 * 1024 * 1024) }] });
    expect(hugeRes.status).toBe(413);
    expect(hugeRes.body.message).toMatch(/too large/i);

    const afterFail = await request(app).get('/api/datasets/ds_lab').set(u.auth);
    expect(afterFail.status).toBe(200);
    expect(afterFail.body.dataset.rowCount).toBe(1);
    expect(afterFail.body.dataset.data).toEqual([{ Sales: 10, Region: 'East' }]);
  });
});

describe('dashboards and models', () => {
  it('round-trips a dashboard payload under its client id and deletes it', async () => {
    const u = await signup('dash');
    const body = { id: 'dash_1', name: 'Sales', widgets: [{ id: 'w1', type: 'kpi' }], canvas: { width: 1920 }, globalFilters: [] };
    await request(app).post('/api/dashboards').set(u.auth).send(body);
    await request(app).post('/api/dashboards').set(u.auth).send({ ...body, name: 'Sales v2' });
    const list = (await request(app).get('/api/dashboards').set(u.auth)).body.dashboards;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 'dash_1', name: 'Sales v2', widgets: [{ id: 'w1', type: 'kpi' }] });
    expect((await request(app).delete('/api/dashboards/dash_1').set(u.auth)).status).toBe(200);
    expect((await request(app).get('/api/dashboards/dash_1').set(u.auth)).status).toBe(404);
    expect((await request(app).delete('/api/dashboards/dash_1').set(u.auth)).status).toBe(404);
  });

  it('round-trips a data model', async () => {
    const u = await signup('model');
    await request(app).post('/api/models').set(u.auth).send({ id: 'model_1', name: 'M', factTables: [{ id: 'f' }] });
    const m = (await request(app).get('/api/models/model_1').set(u.auth)).body.model;
    expect(m).toMatchObject({ id: 'model_1', name: 'M', factTables: [{ id: 'f' }] });
  });
});
