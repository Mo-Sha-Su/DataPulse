import crypto from 'crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { closePool, pool } from '../db';
import { runMigrations } from '../migrations';

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
  return { Authorization: `Bearer ${res.body.token}` };
}

const model = (name = 'Sales Model') => ({
  id: 'model_abc',
  name,
  factTables: [{ id: 'f1', name: 'FACT_SALES', datasetId: 'ds1', foreignKeys: ['CustomerID'], measures: ['Amount'] }],
  dimensionTables: [{ id: 'd1', name: 'DIM_CUSTOMER', datasetId: 'ds2', primaryKey: 'CustomerID', attributes: ['Country'] }],
  relationships: [{ id: 'r1', fromTableId: 'd1', fromColumn: 'CustomerID', toTableId: 'f1', toColumn: 'CustomerID', cardinality: '1:*', isActive: true }],
  measures: [{ id: 'm1', name: 'Total Amount', aggregation: 'sum', targetTable: 'FACT_SALES', targetColumn: 'Amount' }],
  hierarchies: [],
  versions: [],
});
const dash = (id: string, dataModel?: unknown) => ({ id, name: `Dash ${id}`, type: 'dashboard', widgets: [], datasets: [], canvas: { width: 1, height: 1 }, ...(dataModel ? { dataModel } : {}) });
const rows = async (dashboardClientId: string) =>
  (await pool.query(`SELECT * FROM data_models WHERE client_id = $1`, [`model:${dashboardClientId}`])).rows;

describe('data model persistence', () => {
  it('round-trips with the dashboard AND is stored relationally, linked to it', async () => {
    const a = await signup('dm1');
    const id = `dash_${uniq()}`;
    const saved = await request(app).post('/api/dashboards').set(a).send(dash(id, model()));
    expect(saved.status).toBeLessThan(300);

    const fetched = await request(app).get('/api/dashboards').set(a);
    const got = fetched.body.dashboards.find((d: any) => d.id === id);
    expect(got.dataModel.relationships).toHaveLength(1);
    expect(got.dataModel.factTables[0].name).toBe('FACT_SALES');

    const r = await rows(id);
    expect(r).toHaveLength(1);
    expect(r[0].dashboard_id).not.toBeNull();
    expect(r[0].fact_tables[0].name).toBe('FACT_SALES');
    expect(r[0].relationships).toHaveLength(1);
  });

  it('updates in place on every save (one row per dashboard) and appears in /api/models', async () => {
    const a = await signup('dm2');
    const id = `dash_${uniq()}`;
    await request(app).post('/api/dashboards').set(a).send(dash(id, model('v1')));
    await request(app).post('/api/dashboards').set(a).send(dash(id, model('v2')));
    const r = await rows(id);
    expect(r).toHaveLength(1);
    expect(r[0].name).toBe('v2');
    const list = await request(app).get('/api/models').set(a);
    expect(list.body.models.some((m: any) => m.name === 'v2')).toBe(true);
  });

  it('removes the row when the model is dropped or the dashboard is deleted', async () => {
    const a = await signup('dm3');
    const id = `dash_${uniq()}`;
    await request(app).post('/api/dashboards').set(a).send(dash(id, model()));
    expect(await rows(id)).toHaveLength(1);
    await request(app).post('/api/dashboards').set(a).send(dash(id)); // saved without a model
    expect(await rows(id)).toHaveLength(0);
    await request(app).post('/api/dashboards').set(a).send(dash(id, model()));
    expect(await rows(id)).toHaveLength(1);
    expect((await request(app).delete(`/api/dashboards/${id}`).set(a)).status).toBe(200);
    expect(await rows(id)).toHaveLength(0);
  });

  it('keeps models private per user, even with identical client ids', async () => {
    const a = await signup('dm4a');
    const b = await signup('dm4b');
    const id = 'dash_shared_name';
    await request(app).post('/api/dashboards').set(a).send(dash(id, model('A model')));
    await request(app).post('/api/dashboards').set(b).send(dash(id, model('B model')));
    const la = await request(app).get('/api/models').set(a);
    const lb = await request(app).get('/api/models').set(b);
    expect(la.body.models.map((m: any) => m.name)).toEqual(['A model']);
    expect(lb.body.models.map((m: any) => m.name)).toEqual(['B model']);
  });
});
