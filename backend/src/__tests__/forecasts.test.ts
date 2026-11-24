import crypto from 'crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { closePool, query } from '../db';
import { runMigrations } from '../migrations';
import { getActiveForecastJobs, runPythonEngine } from '../services/forecastRunner';

const app = createApp();
const uniq = () => crypto.randomBytes(5).toString('hex');
const createdUserIds: string[] = [];

async function signup(label = 'fc') {
  const email = `${label}-${uniq()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({
    email,
    password: 'forecast-pass-9',
    first_name: 'Forecast',
    last_name: label,
  });
  expect(res.status).toBe(201);
  createdUserIds.push(res.body.user.id as string);
  return {
    id: res.body.user.id as string,
    token: res.body.token as string,
    auth: { Authorization: `Bearer ${res.body.token}` },
  };
}

function buildDailyDataset(id: string, days = 24) {
  const rows = [];
  const start = new Date(Date.UTC(2025, 0, 1));
  for (let i = 0; i < days; i++) {
    const dt = new Date(start.getTime() + i * 86400_000);
    rows.push({
      date: dt.toISOString().slice(0, 10),
      sales: Math.round(500 + 12 * i + 35 * Math.sin((2 * Math.PI * i) / 7)),
      region: i % 2 === 0 ? 'East' : 'West',
    });
  }
  return {
    id,
    name: `Sales ${id}`,
    columns: [
      { name: 'date', type: 'date', sampleValue: '2025-01-01' },
      { name: 'sales', type: 'number', sampleValue: 500 },
      { name: 'region', type: 'string', sampleValue: 'East' },
    ],
    data: rows,
  };
}

beforeAll(async () => {
  await runMigrations();
});

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await query('DELETE FROM forecasts WHERE user_id = ANY($1::uuid[])', [createdUserIds]).catch(() => {});
    await query(
      'DELETE FROM datasets WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = ANY($1::uuid[]))',
      [createdUserIds],
    ).catch(() => {});
    await query('DELETE FROM workspaces WHERE owner_id = ANY($1::uuid[])', [createdUserIds]).catch(() => {});
    await query('DELETE FROM users WHERE id = ANY($1::uuid[])', [createdUserIds]).catch(() => {});
  }
  await closePool();
});

describe('Forecast Studio API', () => {
  it('enforces authentication across all /api/forecasts endpoints', async () => {
    expect((await request(app).get('/api/forecasts')).status).toBe(401);
    expect((await request(app).post('/api/forecasts').send({})).status).toBe(401);
    expect((await request(app).post('/api/forecasts/fc_1/run').send({})).status).toBe(401);
    expect((await request(app).post('/api/forecasts/fc_1/scenarios').send({})).status).toBe(401);
  });

  it('creates, runs, persists, links dataset_version_id, creates What-If scenarios, and deletes forecasts', async () => {
    const owner = await signup('owner');
    const dsId = `ds_${uniq()}`;
    const dsRes = await request(app).post('/api/datasets').set(owner.auth).send(buildDailyDataset(dsId, 28));
    expect(dsRes.status).toBe(201);
    const versionId = dsRes.body.dataset.current_version_id;
    expect(versionId).toBeTruthy();

    // Detect frequency
    const detRes = await request(app)
      .post('/api/forecasts/detect-frequency')
      .set(owner.auth)
      .send({ datasetId: dsId, dateColumn: 'date', targetColumn: 'sales', aggregation: 'sum' });
    expect(detRes.status).toBe(200);
    expect(detRes.body.detection.detectedFrequency).toBe('daily');

    // Create and run forecast immediately
    const createRes = await request(app)
      .post('/api/forecasts')
      .set(owner.auth)
      .send({
        name: 'Q1 Sales Forecast',
        mode: 'business',
        businessTemplate: 'sales',
        datasetId: dsId,
        runImmediately: true,
        configuration: {
          dateColumn: 'date',
          targetColumn: 'sales',
          aggregation: 'sum',
          frequency: 'auto',
          horizonDays: 7,
          model: 'auto',
          confidenceLevel: '95',
        },
      });
    expect(createRes.status).toBe(201);
    const fc = createRes.body.forecast;
    expect(fc.status).toBe('completed');
    expect(fc.datasetVersionId).toBe(versionId);
    expect(fc.latestResult.predictedData.length).toBe(7);
    expect(fc.latestResult.historicalData.length).toBe(28);
    expect(fc.latestResult.evaluationMetrics.candidates.length).toBe(8);

    // List and fetch persisted forecast
    const listRes = await request(app).get('/api/forecasts').set(owner.auth);
    expect(listRes.status).toBe(200);
    expect(listRes.body.forecasts.some((f: any) => f.id === fc.id)).toBe(true);

    const getRes = await request(app).get(`/api/forecasts/${fc.id}`).set(owner.auth);
    expect(getRes.status).toBe(200);
    expect(getRes.body.forecast.latestResult.predictedData.length).toBe(7);
    expect(getRes.body.forecast.latestResult.trainingPeriod).toMatchObject({
      observedPeriods: 28,
      calendarPeriods: 28,
    });

    // Update name and re-run with manual model
    const updRes = await request(app)
      .put(`/api/forecasts/${fc.id}`)
      .set(owner.auth)
      .send({ name: 'Q1 Sales Forecast Updated' });
    expect(updRes.status).toBe(200);
    expect(updRes.body.forecast.name).toBe('Q1 Sales Forecast Updated');

    const rerunRes = await request(app)
      .post(`/api/forecasts/${fc.id}/run`)
      .set(owner.auth)
      .send({ configuration: { model: 'ets', horizonDays: 30 } });
    expect(rerunRes.status).toBe(200);
    expect(rerunRes.body.forecast.selectedModel).toBe('ets');
    expect(rerunRes.body.forecast.latestResult.predictedData.length).toBe(30);

    // Dataset version advances when dataset is cleaned -> re-running forecast updates datasetVersionId
    const dsUpd = await request(app)
      .put(`/api/datasets/${dsId}`)
      .set(owner.auth)
      .send({
        cleaningPipeline: [{ id: 'step_1', type: 'trim_whitespace', column: 'region' }],
      });
    expect(dsUpd.status).toBe(200);
    const v2Id = dsUpd.body.dataset.current_version_id;
    expect(v2Id).toBeTruthy();
    expect(v2Id).not.toBe(versionId);

    const v2Run = await request(app)
      .post(`/api/forecasts/${fc.id}/run`)
      .set(owner.auth)
      .send({ configuration: { horizonDays: 7 } });
    expect(v2Run.status).toBe(200);
    expect(v2Run.body.forecast.datasetVersionId).toBe(v2Id);

    // Create What-If scenario (baseline unchanged)
    const scenRes = await request(app)
      .post(`/api/forecasts/${fc.id}/scenarios`)
      .set(owner.auth)
      .send({
        name: 'Promo +15% Sales',
        assumptions: {
          growthRateDeltaPct: 1,
          salesDeltaPct: 15,
          priceChangePct: 0,
          demandDeltaPct: 0,
          expenseDeltaPct: 0,
        },
      });
    expect(scenRes.status).toBe(201);
    expect(scenRes.body.scenario.scenarioResults.summary.totalDelta).toBeGreaterThan(0);

    const scenListRes = await request(app).get(`/api/forecasts/${fc.id}/scenarios`).set(owner.auth);
    expect(scenListRes.status).toBe(200);
    expect(scenListRes.body.scenarios.length).toBe(1);

    // Cross-workspace isolation: another user cannot read, run, delete, or reference owner's dataset
    const intruder = await signup('intruder');
    expect((await request(app).get(`/api/forecasts/${fc.id}`).set(intruder.auth)).status).toBe(404);
    expect((await request(app).post(`/api/forecasts/${fc.id}/run`).set(intruder.auth).send({})).status).toBe(404);
    expect((await request(app).delete(`/api/forecasts/${fc.id}`).set(intruder.auth)).status).toBe(404);
    const intruderDsRes = await request(app)
      .post('/api/forecasts')
      .set(intruder.auth)
      .send({
        name: 'Stolen Dataset Attempt',
        mode: 'general',
        datasetId: dsId,
        runImmediately: false,
        configuration: {
          dateColumn: 'date',
          targetColumn: 'sales',
          aggregation: 'sum',
          frequency: 'auto',
          horizonDays: 7,
          model: 'auto',
          confidenceLevel: '95',
        },
      });
    expect(intruderDsRes.status).toBe(404);

    // Duplicate concurrent run guard on same forecast id
    const [r1, r2] = await Promise.all([
      request(app).post(`/api/forecasts/${fc.id}/run`).set(owner.auth).send({ configuration: { model: 'ets', horizonDays: 7 } }),
      request(app).post(`/api/forecasts/${fc.id}/run`).set(owner.auth).send({ configuration: { model: 'ets', horizonDays: 7 } }),
    ]);
    const statuses = [r1.status, r2.status].sort((a, b) => a - b);
    expect(statuses).toEqual([200, 409]);

    // Owner deletes scenario & forecast cleanly
    const delScen = await request(app)
      .delete(`/api/forecasts/${fc.id}/scenarios/${scenRes.body.scenario.id}`)
      .set(owner.auth);
    expect(delScen.status).toBe(200);

    const delFc = await request(app).delete(`/api/forecasts/${fc.id}`).set(owner.auth);
    expect(delFc.status).toBe(200);
    expect((await request(app).get(`/api/forecasts/${fc.id}`).set(owner.auth)).status).toBe(404);
  }, 60000);

  it('rejects invalid requests, non-date columns, and incompatible horizons cleanly without crashing', async () => {
    const user = await signup('errors');
    const dsId = `ds_err_${uniq()}`;
    await request(app)
      .post('/api/datasets')
      .set(user.auth)
      .send({
        id: dsId,
        name: 'Bad Dates',
        columns: [
          { name: 'label', type: 'string' },
          { name: 'amount', type: 'number' },
        ],
        data: [
          { label: 'not-date-1', amount: 10 },
          { label: 'not-date-2', amount: 20 },
          { label: 'not-date-3', amount: 30 },
          { label: 'not-date-4', amount: 40 },
          { label: 'not-date-5', amount: 50 },
        ],
      });

    const badDateRun = await request(app)
      .post('/api/forecasts')
      .set(user.auth)
      .send({
        name: 'Invalid Date Test',
        mode: 'general',
        datasetId: dsId,
        runImmediately: true,
        configuration: {
          dateColumn: 'label',
          targetColumn: 'amount',
          aggregation: 'sum',
          frequency: 'auto',
          horizonDays: 30,
          model: 'auto',
          confidenceLevel: '95',
        },
      });
    expect(badDateRun.status).toBe(400);
    expect(badDateRun.body.success).toBe(false);
    expect(badDateRun.body.message).toMatch(/date\/time/i);

    // Monthly series with incompatible 7-day horizon
    const monthlyId = `ds_m_${uniq()}`;
    await request(app)
      .post('/api/datasets')
      .set(user.auth)
      .send({
        id: monthlyId,
        name: 'Monthly Revenue',
        columns: [
          { name: 'month', type: 'date' },
          { name: 'rev', type: 'number' },
        ],
        data: Array.from({ length: 12 }, (_, i) => ({
          month: `2024-${String(i + 1).padStart(2, '0')}-01`,
          rev: 1000 + i * 50,
        })),
      });

    const badHorizon = await request(app)
      .post('/api/forecasts')
      .set(user.auth)
      .send({
        name: 'Incompatible Horizon',
        mode: 'business',
        businessTemplate: 'revenue',
        datasetId: monthlyId,
        runImmediately: true,
        configuration: {
          dateColumn: 'month',
          targetColumn: 'rev',
          aggregation: 'sum',
          frequency: 'monthly',
          horizonDays: 7,
          model: 'auto',
          confidenceLevel: '95',
        },
      });
    expect(badHorizon.status).toBe(400);
    expect(badHorizon.body.code).toBe('INCOMPATIBLE_HORIZON');
  }, 20000);

  it('enforces execution timeout limit cleanly and frees job slot', async () => {
    await expect(
      runPythonEngine(
        {
          action: 'detect_frequency',
          rows: [{ date: '2025-01-01', value: 10 }],
          dateColumn: 'date',
          targetColumn: 'value',
          aggregation: 'sum',
        },
        { timeoutMs: 1 },
      ),
    ).rejects.toMatchObject({ status: 504, code: 'FORECAST_TIMEOUT' });
    expect(getActiveForecastJobs()).toBe(0);
  });

  it('handles Python service failures safely without leaking internal paths and marks forecast failed', async () => {
    const user = await signup('pyfail');
    const dsId = `ds_pyfail_${uniq()}`;
    await request(app).post('/api/datasets').set(user.auth).send(buildDailyDataset(dsId, 12));

    const prevBin = process.env.FORECAST_PYTHON_BIN;
    process.env.FORECAST_PYTHON_BIN = '/nonexistent/secret-bin/python3';
    try {
      const failRes = await request(app)
        .post('/api/forecasts')
        .set(user.auth)
        .send({
          name: 'Engine Failure Test',
          mode: 'general',
          datasetId: dsId,
          runImmediately: true,
          configuration: {
            dateColumn: 'date',
            targetColumn: 'sales',
            aggregation: 'sum',
            frequency: 'auto',
            horizonDays: 7,
            model: 'auto',
            confidenceLevel: '95',
          },
        });
      expect(failRes.status).toBe(500);
      expect(failRes.body.code).toBe('ENGINE_SPAWN_ERROR');
      expect(failRes.body.message).not.toContain('/nonexistent');
      expect(getActiveForecastJobs()).toBe(0);

      const listRes = await request(app).get('/api/forecasts').set(user.auth);
      expect(listRes.status).toBe(200);
      const failedFc = listRes.body.forecasts.find((f: any) => f.name === 'Engine Failure Test');
      expect(failedFc).toBeTruthy();
      expect(failedFc.status).toBe('failed');
      expect(failedFc.errorMessage).toBe('Forecast execution failed.');
    } finally {
      if (prevBin === undefined) delete process.env.FORECAST_PYTHON_BIN;
      else process.env.FORECAST_PYTHON_BIN = prevBin;
    }
  });

  it('tracks scenario baseline staleness, evaluatedConfiguration, dataset swap reset, empty cleanedData, and stale lease recovery', async () => {
    const user = await signup('audit');
    const ds1Id = `ds_a1_${uniq()}`;
    const ds2Id = `ds_a2_${uniq()}`;
    await request(app).post('/api/datasets').set(user.auth).send(buildDailyDataset(ds1Id, 20));
    await request(app).post('/api/datasets').set(user.auth).send(buildDailyDataset(ds2Id, 20));

    // Create & run forecast on dataset 1
    const createRes = await request(app)
      .post('/api/forecasts')
      .set(user.auth)
      .send({
        name: 'Audit Trail Forecast',
        mode: 'general',
        datasetId: ds1Id,
        runImmediately: true,
        configuration: {
          dateColumn: 'date',
          targetColumn: 'sales',
          aggregation: 'sum',
          frequency: 'daily',
          horizonDays: 7,
          model: 'ets',
          confidenceLevel: '95',
        },
      });
    expect(createRes.status).toBe(201);
    const fc = createRes.body.forecast;
    const firstResultId = fc.latestResult.id;
    expect(fc.latestResult.modelMetadata.evaluatedConfiguration).toMatchObject({
      dateColumn: 'date',
      targetColumn: 'sales',
      model: 'ets',
      horizonDays: 7,
    });

    // Scenario tied to first result starts fresh (isStale: false)
    const scenRes = await request(app)
      .post(`/api/forecasts/${fc.id}/scenarios`)
      .set(user.auth)
      .send({
        name: 'Baseline Growth',
        assumptions: {
          growthRateDeltaPct: 0,
          salesDeltaPct: 10,
          priceChangePct: 0,
          demandDeltaPct: 0,
          expenseDeltaPct: 0,
        },
      });
    expect(scenRes.status).toBe(201);
    expect(scenRes.body.scenario.baselineResultId).toBe(firstResultId);
    expect(scenRes.body.scenario.isStale).toBe(false);

    // Re-running baseline marks existing scenario isStale: true
    const rerunRes = await request(app)
      .post(`/api/forecasts/${fc.id}/run`)
      .set(user.auth)
      .send({ configuration: { horizonDays: 30 } });
    expect(rerunRes.status).toBe(200);
    expect(rerunRes.body.forecast.latestResult.id).not.toBe(firstResultId);
    expect(rerunRes.body.forecast.scenarios[0].isStale).toBe(true);

    // Simulate stale crashed worker lock older than lease TTL -> next /run recovers cleanly
    await query(
      `UPDATE forecasts
       SET status = 'running',
           execution_token = 'crashed-worker',
           execution_started_at = now() - interval '10 minutes'
       WHERE client_id = $1`,
      [fc.id],
    );
    const recoveredRun = await request(app)
      .post(`/api/forecasts/${fc.id}/run`)
      .set(user.auth)
      .send({ configuration: { horizonDays: 7 } });
    expect(recoveredRun.status).toBe(200);
    expect(recoveredRun.body.forecast.status).toBe('completed');

    // Switching dataset via PUT resets status/selectedModel to draft
    const switchedRes = await request(app)
      .put(`/api/forecasts/${fc.id}`)
      .set(user.auth)
      .send({ datasetId: ds2Id });
    expect(switchedRes.status).toBe(200);
    expect(switchedRes.body.forecast.status).toBe('draft');
    expect(switchedRes.body.forecast.selectedModel).toBeNull();

    // Intentional empty cleanedData: [] must NOT silently fall back to raw data
    const emptyCleanedId = `ds_emptyclean_${uniq()}`;
    await request(app).post('/api/datasets').set(user.auth).send({
      ...buildDailyDataset(emptyCleanedId, 12),
      cleanedData: [],
    });
    const emptyCleanDet = await request(app)
      .post('/api/forecasts/detect-frequency')
      .set(user.auth)
      .send({ datasetId: emptyCleanedId, dateColumn: 'date', targetColumn: 'sales', aggregation: 'sum' });
    expect(emptyCleanDet.status).toBe(400);
  }, 60000);

  it('supports period-based horizonSteps, rejects inapplicable scenario drivers (400), supports priceElasticity, and persists nonNegativeClamped', async () => {
    const user = await signup('phase1');
    const monthlyId = `ds_p1_m_${uniq()}`;
    await request(app)
      .post('/api/datasets')
      .set(user.auth)
      .send({
        id: monthlyId,
        name: 'Monthly Sales Series',
        columns: [
          { name: 'month', type: 'date' },
          { name: 'sales', type: 'number' },
        ],
        data: Array.from({ length: 24 }, (_, i) => ({
          month: `2023-${String((i % 12) + 1).padStart(2, '0')}-01`.replace(
            '2023-',
            `${2023 + Math.floor(i / 12)}-`,
          ),
          sales: Math.max(50, 1200 - 35 * i),
        })),
      });

    // Monthly forecast with horizonSteps: 6
    const createRes = await request(app)
      .post('/api/forecasts')
      .set(user.auth)
      .send({
        name: 'Phase 1 Monthly Sales',
        mode: 'business',
        businessTemplate: 'sales',
        datasetId: monthlyId,
        runImmediately: true,
        configuration: {
          dateColumn: 'month',
          targetColumn: 'sales',
          aggregation: 'sum',
          frequency: 'monthly',
          horizonSteps: 6,
          model: 'ets',
          confidenceLevel: '95',
        },
      });
    expect(createRes.status).toBe(201);
    const fc = createRes.body.forecast;
    expect(fc.latestResult.frequency).toBe('monthly');
    expect(fc.latestResult.horizonSteps).toBe(6);
    expect(fc.latestResult.predictedData.length).toBe(6);
    expect(typeof fc.latestResult.modelMetadata.nonNegativeClamped).toBe('boolean');
    expect(fc.latestResult.modelMetadata.nonNegativeClamped).toBe(true);

    // Reject costDeltaPct +10% and expenseDeltaPct +10% on sales with 400 SCENARIO_DRIVER_NOT_APPLICABLE
    const badCost = await request(app)
      .post(`/api/forecasts/${fc.id}/scenarios`)
      .set(user.auth)
      .send({
        name: 'Invalid Cost Driver',
        assumptions: {
          growthRateDeltaPct: 0,
          volumeDeltaPct: 0,
          costDeltaPct: 10,
        },
      });
    expect(badCost.status).toBe(400);
    expect(badCost.body.code).toBe('SCENARIO_DRIVER_NOT_APPLICABLE');

    const badLegacyExpense = await request(app)
      .post(`/api/forecasts/${fc.id}/scenarios`)
      .set(user.auth)
      .send({
        name: 'Invalid Legacy Expense Driver',
        assumptions: {
          expenseDeltaPct: 10,
        },
      });
    expect(badLegacyExpense.status).toBe(400);
    expect(badLegacyExpense.body.code).toBe('SCENARIO_DRIVER_NOT_APPLICABLE');

    // Canonical volumeDeltaPct + priceChangePct + priceElasticity accepted on sales
    const goodScen = await request(app)
      .post(`/api/forecasts/${fc.id}/scenarios`)
      .set(user.auth)
      .send({
        name: 'Elasticity Pricing Test',
        assumptions: {
          growthRateDeltaPct: 0,
          volumeDeltaPct: 10,
          priceChangePct: 10,
          priceElasticity: -1.5,
        },
      });
    expect(goodScen.status).toBe(201);
    expect(
      goodScen.body.scenario.scenarioResults.notes.some((n: string) =>
        /elasticity/i.test(n),
      ),
    ).toBe(true);
  }, 60000);
});

