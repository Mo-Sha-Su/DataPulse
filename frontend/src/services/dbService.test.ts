import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveDashboardToDb, fetchDashboardsFromDb, toDashboardPayload, consumeDroppedFilterCount } from './dbService';
import { salesDs } from '../test/modelFixtures';

afterEach(() => vi.unstubAllGlobals());

const dash: any = { id: 'dash_1', name: 'D', type: 'dashboard', widgets: [], canvas: {}, datasets: [{ ...salesDs, cleanedData: [{ a: 1 }] }], selectedDatasetIds: ['ds_sales'] };

describe('dashboard persistence', () => {
  it('sends dataset references only: no rows are embedded in the dashboard', () => {
    const p = toDashboardPayload(dash);
    expect(p.datasets[0].id).toBe('ds_sales');
    expect(p.datasets[0].columns.length).toBeGreaterThan(0);
    expect(p.datasets[0].data).toEqual([]);
    expect((p.datasets[0] as any).cleanedData).toBeUndefined();
    expect(p.selectedDatasetIds).toEqual(['ds_sales']);
    expect(dash.datasets[0].data.length).toBeGreaterThan(0); // input not mutated
  });

  it('writes to the API only (same-origin /api, cookie session) and reports failures instead of hiding them', async () => {
    const calls: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
      calls.push({ url, init });
      return { ok: false, status: 503, json: async () => ({ message: 'database unavailable' }) } as any;
    }));
    await expect(saveDashboardToDb(dash)).rejects.toThrow(/database unavailable/);
    await expect(fetchDashboardsFromDb()).rejects.toThrow();
    expect(calls.every((c) => String(c.url).startsWith('/api/'))).toBe(true);
    expect(calls.every((c) => !c.init?.headers?.Authorization)).toBe(true); // no token handled by page code
    expect(JSON.parse(calls[0].init.body).datasets[0].data).toEqual([]);
  });

  it('normalizes legacy globalFilters and ignores legacy widget.config.filters on load', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        dashboards: [
          {
            id: 'dash_legacy',
            name: 'Legacy',
            type: 'dashboard',
            canvas: {},
            datasets: [],
            globalFilters: [
              { id: 'f1', column: 'Country', operator: 'equals', value: 'US' },
              { id: 'f2', column: 'Notes', operator: 'contains', value: 'abc' },
            ],
            widgets: [
              {
                id: 'w1',
                type: 'kpi',
                category: 'analytics',
                title: 'KPI',
                position: { x: 0, y: 0, width: 300, height: 200, zIndex: 1 },
                config: { datasetId: 'ds_sales', xAxisField: '', yAxisField: 'Amount', aggregation: 'sum', numberFormat: 'number', title: 'KPI', titleColor: '#000', primaryColor: '#000', colorPalette: [], backgroundColor: '#fff', filters: [{ id: 'wf', column: 'Amount', operator: 'greater_than', value: 10 }] },
              },
            ],
          },
        ],
      }),
    } as any)));

    const loaded = await fetchDashboardsFromDb();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].globalFilters).toEqual([{ id: 'f1', column: 'Country', values: ['US'] }]);
    expect('filters' in loaded[0].widgets[0].config).toBe(false);
    expect(consumeDroppedFilterCount('dash_legacy')).toBe(1);
    expect(consumeDroppedFilterCount('dash_legacy')).toBe(0); // one-time consumption
  });
});
