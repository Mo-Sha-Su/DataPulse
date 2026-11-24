import { afterEach, describe, expect, it, vi } from 'vitest';
import * as dataProcessor from './dataProcessor';
import { applyFilters } from './dataProcessor';
import { normalizeFilters, normalizeDashboardFilters } from './filterMigration';
import { queryWidgetData } from './semanticQueryEngine';
import { baseConfig, datasets, model, salesDs } from '../test/modelFixtures';
import { DataFilter } from '../types/dashboard';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('applyFilters', () => {
  const rows = [
    { Country: 'US', Category: 'Tech', Amount: 100, Qty: '2' },
    { Country: 'uk', Category: ' Office ', Amount: 250, Qty: 5 },
    { Country: 'DE', Category: 'Tech', Amount: 400, Qty: 'N/A' },
    { Country: 'FR', Category: 'Furniture', Amount: '', Qty: null },
  ];

  it('matches values case-insensitively with trimming', () => {
    const res = applyFilters(rows, [
      { id: 'f1', column: 'Country', values: [' us ', 'UK'] },
    ]);
    expect(res.map((r) => r.Country)).toEqual(['US', 'uk']);

    const trimmedRes = applyFilters(rows, [
      { id: 'f2', column: 'Category', values: ['office'] },
    ]);
    expect(trimmedRes.map((r) => r.Country)).toEqual(['uk']);
  });

  it('matches numeric equality across number and string representations', () => {
    const res = applyFilters(rows, [
      { id: 'f1', column: 'Amount', values: ['250'] },
    ]);
    expect(res.map((r) => r.Country)).toEqual(['uk']);

    const res2 = applyFilters(rows, [
      { id: 'f2', column: 'Qty', values: [2] },
    ]);
    expect(res2.map((r) => r.Country)).toEqual(['US']);
  });

  it('supports min only, max only, and both min & max inclusively', () => {
    const minOnly = applyFilters(rows, [{ id: 'f1', column: 'Amount', min: 250 }]);
    expect(minOnly.map((r) => r.Country)).toEqual(['uk', 'DE']);

    const maxOnly = applyFilters(rows, [{ id: 'f2', column: 'Amount', max: 250 }]);
    expect(maxOnly.map((r) => r.Country)).toEqual(['US', 'uk']);

    const both = applyFilters(rows, [{ id: 'f3', column: 'Amount', min: 100, max: 250 }]);
    expect(both.map((r) => r.Country)).toEqual(['US', 'uk']);
  });

  it('excludes non-numeric values (empty strings, text, null) when a range is active', () => {
    const res = applyFilters(rows, [{ id: 'f1', column: 'Qty', min: 1, max: 10 }]);
    expect(res.map((r) => r.Country)).toEqual(['US', 'uk']);

    const amtRes = applyFilters(rows, [{ id: 'f2', column: 'Amount', min: 0 }]);
    expect(amtRes.map((r) => r.Country)).toEqual(['US', 'uk', 'DE']);
  });

  it('ignores empty filters (empty values and no min/max) and combines multiple filters with AND', () => {
    const empty = applyFilters(rows, [
      { id: 'f1', column: 'Country', values: [] },
      { id: 'f2', column: 'Amount' },
    ]);
    expect(empty).toHaveLength(4);

    const combined = applyFilters(rows, [
      { id: 'f1', column: 'Category', values: ['tech'] },
      { id: 'f2', column: 'Amount', min: 200 },
    ]);
    expect(combined.map((r) => r.Country)).toEqual(['DE']);
  });
});

describe('normalizeFilters & legacy migration', () => {
  it('converts all supported legacy operators and drops disabled or unsupported ones', () => {
    const legacyRaw = [
      { id: 'l1', datasetId: 'ds_cust', column: 'Country', operator: 'equals', value: 'US', enabled: true },
      { id: 'l2', column: 'Amount', operator: 'between', value: 10, value2: '200', enabled: true },
      { id: 'l3', column: 'Qty', operator: 'greater_than', value: '5' },
      { id: 'l4', column: 'Price', operator: 'greater_equal', value: 1 },
      { id: 'l5', column: 'Discount', operator: 'less_than', value: 50 },
      { id: 'l6', column: 'Tax', operator: 'less_equal', value: '15' },
      { id: 'l7', column: 'ZeroVal', operator: 'equals', value: 0 },
      { id: 'l8', column: 'Country', operator: 'equals', value: 'DE', enabled: false },
      { id: 'l9', column: 'Name', operator: 'contains', value: 'foo' },
      { id: 'l10', column: 'Status', operator: 'not_equals', value: 'Closed' },
      { id: 'l11', column: 'Other', operator: 'regex', value: '.*' },
    ];

    const { filters, dropped } = normalizeFilters(legacyRaw);

    expect(dropped).toBe(4);
    expect(filters).toEqual([
      { id: 'l1', datasetId: 'ds_cust', column: 'Country', values: ['US'] },
      { id: 'l2', column: 'Amount', min: 10, max: 200 },
      { id: 'l3', column: 'Qty', min: 5 },
      { id: 'l4', column: 'Price', min: 1 },
      { id: 'l5', column: 'Discount', max: 50 },
      { id: 'l6', column: 'Tax', max: 15 },
      { id: 'l7', column: 'ZeroVal', values: [0] },
    ]);
  });

  it('passes the new DataFilter shape through unchanged', () => {
    const modern: DataFilter[] = [
      { id: 'm1', datasetId: 'ds_1', column: 'Region', values: ['NA', 'EU'] },
      { id: 'm2', column: 'Revenue', min: 100, max: 500 },
    ];
    const { filters, dropped } = normalizeFilters(modern);
    expect(dropped).toBe(0);
    expect(filters).toEqual(modern);
  });

  it('strips legacy widget.config.filters during normalizeDashboardFilters', () => {
    const legacyDash: any = {
      id: 'd1',
      name: 'Old Dash',
      globalFilters: [
        { id: 'g1', column: 'Country', operator: 'equals', value: 'US' },
        { id: 'g2', column: 'Notes', operator: 'contains', value: 'abc' },
      ],
      widgets: [
        {
          id: 'w1',
          type: 'kpi',
          category: 'analytics',
          title: 'KPI',
          position: { x: 0, y: 0, width: 300, height: 200, zIndex: 1 },
          config: { ...baseConfig(), filters: [{ id: 'wf1', column: 'Amount', operator: 'greater_than', value: 10 }] },
        },
      ],
      datasets: [],
      canvas: {},
      updatedAt: '2026-01-01',
    };

    const { dashboard, dropped } = normalizeDashboardFilters(legacyDash);
    expect(dropped).toBe(1);
    expect(dashboard.globalFilters).toEqual([{ id: 'g1', column: 'Country', values: ['US'] }]);
    expect('filters' in dashboard.widgets[0].config).toBe(false);
  });
});

describe('single-pass widget filtering', () => {
  it('filters a widget exactly once per query in raw mode and model mode', () => {
    const spy = vi.spyOn(dataProcessor, 'applyFilters');
    const kpi = baseConfig({ xAxisField: '', yAxisField: 'Amount' });
    const factFilter: DataFilter = { id: 'f_amt', datasetId: 'ds_sales', column: 'Amount', min: 100 };

    // Raw mode (no data model)
    const rawRes = queryWidgetData({
      config: kpi,
      dataset: salesDs,
      datasets,
      globalFilters: [factFilter],
    });
    expect(rawRes.modelUsed).toBe(false);
    expect(rawRes.data[0].y).toBe(700); // 100 + 200 + 400 (excludes 50)
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();

    // Model mode (direct fact filter)
    const modelRes = queryWidgetData({
      config: kpi,
      dataset: salesDs,
      dataModel: model,
      datasets,
      globalFilters: [factFilter],
    });
    expect(modelRes.modelUsed).toBe(true);
    expect(modelRes.data[0].y).toBe(700);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();

    // Model mode (dimension filter propagated to fact table)
    const dimRes = queryWidgetData({
      config: kpi,
      dataset: salesDs,
      dataModel: model,
      datasets,
      globalFilters: [{ id: 'f_country', datasetId: 'ds_cust', column: 'Country', values: ['US'] }],
    });
    expect(dimRes.modelUsed).toBe(true);
    expect(dimRes.data[0].y).toBe(350);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
