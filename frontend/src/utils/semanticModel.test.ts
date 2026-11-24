import { describe, expect, it } from 'vitest';
import { queryWidgetData, hasActiveDataModel } from './semanticQueryEngine';
import { syncModelWithUsedDatasets } from './dataModelingEngine';
import { baseConfig, countryFilter, customerDs, datasets, model, salesDs } from '../test/modelFixtures';

const byX = (rows: { x: any; y: number }[]) => Object.fromEntries(rows.map((r) => [String(r.x), r.y]));

describe('the Data Model changes what widgets compute', () => {
  const cfg = baseConfig({ xAxisField: 'Country', yAxisField: 'Amount' });

  it('joins fact to dimension: revenue by a dimension attribute', () => {
    const res = queryWidgetData({ config: cfg, dataset: salesDs, dataModel: model, datasets });
    expect(res.modelUsed).toBe(true);
    expect(byX(res.data)).toEqual({ US: 350, DE: 400 });
  });

  it('without a model the same widget cannot see the dimension (everything lands in one bucket)', () => {
    const res = queryWidgetData({ config: cfg, dataset: salesDs, datasets });
    expect(res.modelUsed).toBe(false);
    expect(byX(res.data)).toEqual({ Unspecified: 750 });
  });

  it('table-qualified references resolve to the same result', () => {
    const res = queryWidgetData({ config: { ...cfg, xAxisField: 'DIM_CUSTOMER.Country' }, dataset: salesDs, dataModel: model, datasets });
    expect(byX(res.data)).toEqual({ US: 350, DE: 400 });
  });

  it('a global filter on a dimension attribute propagates through the relationship to the facts', () => {
    const kpi = baseConfig({ xAxisField: '', yAxisField: 'Amount' });
    const withModel = queryWidgetData({ config: kpi, dataset: salesDs, dataModel: model, datasets, globalFilters: [countryFilter('US')] });
    expect(withModel.data[0].y).toBe(350);
    const raw = queryWidgetData({ config: kpi, dataset: salesDs, datasets, globalFilters: [countryFilter('US')] });
    expect(raw.data[0].y).toBe(750); // no model -> the filter cannot reach the sales table
  });

  it('model measures (including DIVIDE ratios) are evaluated from the model definition', () => {
    const total = queryWidgetData({ config: baseConfig({ yAxisField: 'Total Amount' }), dataset: salesDs, dataModel: model, datasets });
    expect(total.data[0].y).toBe(750);
    const ratio = queryWidgetData({ config: baseConfig({ xAxisField: 'Country', yAxisField: 'Amount per Unit' }), dataset: salesDs, dataModel: model, datasets });
    const r = byX(ratio.data);
    expect(r.US).toBeCloseTo(350 / 6, 5);
    expect(r.DE).toBeCloseTo(100, 5);
  });

  it('an inactive relationship breaks the join, and the widget says why instead of showing wrong numbers', () => {
    const broken = { ...model, relationships: model.relationships.map((r) => ({ ...r, isActive: false })) };
    const res = queryWidgetData({ config: cfg, dataset: salesDs, dataModel: broken, datasets });
    expect(res.data).toEqual([]);
    expect(res.error).toMatch(/relationship/i);
  });

  it('a missing dataset behind a model table is reported', () => {
    const res = queryWidgetData({ config: cfg, dataset: salesDs, dataModel: model, datasets: [salesDs] });
    expect(res.data).toEqual([]);
    expect(res.error).toMatch(/dataset/i);
  });

  it('an empty model leaves widgets in raw mode', () => {
    const empty = { ...model, factTables: [], dimensionTables: [] };
    expect(hasActiveDataModel(empty)).toBe(false);
  });
});

describe('the model is built from the attached datasets', () => {
  it('creates tables and relationships, with a starter measure that really exists', () => {
    const m = syncModelWithUsedDatasets(undefined, datasets, 'Sales');
    expect(hasActiveDataModel(m)).toBe(true);
    expect(m.factTables.length + m.dimensionTables.length).toBeGreaterThanOrEqual(2);
    const allCols = new Set(datasets.flatMap((d) => d.columns.map((c) => c.name)));
    m.measures.forEach((x) => expect(allCols.has(x.targetColumn)).toBe(true));
    expect(m.measures.some((x) => x.id === 'meas_default_sales')).toBe(false);
  });

  it('is stable: syncing an up-to-date model returns the same object (no render loops)', () => {
    const m = syncModelWithUsedDatasets(undefined, datasets, 'Sales');
    expect(syncModelWithUsedDatasets(m, datasets, 'Sales')).toBe(m);
  });

  it('removes the old hard-coded Total Sales measure that pointed at a non-existent column', () => {
    const legacy = {
      ...model,
      measures: [
        ...model.measures,
        { id: 'meas_default_sales', name: 'Total Sales', expression: 'SUM(FACT_SALES[Sales_Amount])', aggregation: 'sum' as const, targetTable: 'FACT_SALES', targetColumn: 'Sales_Amount', format: 'currency' as const },
      ],
    };
    const cleaned = syncModelWithUsedDatasets(legacy, datasets, 'Sales');
    expect(cleaned.measures.map((x) => x.id)).not.toContain('meas_default_sales');
    expect(cleaned.measures.map((x) => x.id)).toContain('m1');
    expect(syncModelWithUsedDatasets(cleaned, datasets, 'Sales')).toBe(cleaned);
  });

  it('adds tables when a new dataset is attached to an existing model', () => {
    const only = syncModelWithUsedDatasets(undefined, [salesDs], 'Sales');
    const grown = syncModelWithUsedDatasets(only, [salesDs, customerDs], 'Sales');
    expect(grown.factTables.length + grown.dimensionTables.length).toBeGreaterThan(only.factTables.length + only.dimensionTables.length);
  });
});
