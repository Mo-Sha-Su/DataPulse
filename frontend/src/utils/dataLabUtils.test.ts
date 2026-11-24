import { describe, expect, it } from 'vitest';
import { evaluatePipeline, executeStep, tracePipeline } from './transformationEngine';
import { profileColumn, qualityScore, suggestFixes, tableIssues } from './columnProfile';
import { DataCleaningStep } from '../types/dataCleaning';

const rows = [
  { id: 'a1', city: ' Paris ', status: 'Shipped', qty: '3', price: 10, when: '2025-01-02' },
  { id: 'a2', city: 'Berlin', status: 'shipped', qty: '4', price: null, when: '2025-02-03' },
  { id: 'a3', city: 'Berlin', status: 'Pending', qty: '5', price: 30, when: '2025-03-04' },
  { id: 'a3', city: 'Berlin', status: 'Pending', qty: '5', price: 30, when: '2025-03-04' }, // exact duplicate
  { id: 'a4', city: '', status: 'PENDING', qty: '6', price: 50, when: '12/25/2025' },
];
const step = (id: string, type: DataCleaningStep['type'], params: any): DataCleaningStep => ({ id, name: id, type, description: '', mFormula: '', params });
const evalAll = (r = rows) => evaluatePipeline(r, [step('s0', 'source', {})]);

describe('profileColumn', () => {
  it('counts valid / empty / distinct and ranks top values', () => {
    const p = profileColumn(rows, 'city');
    expect(p.total).toBe(5);
    expect(p.empty).toBe(1);
    expect(p.valid).toBe(4);
    expect(p.top[0]).toEqual({ value: 'Berlin', count: 3 });
    expect(p.distinct).toBe(2 + 0); // ' Paris ' and 'Berlin'
  });
  it('computes numeric stats only for numeric columns', () => {
    const p = profileColumn(rows, 'price');
    expect(p.numeric).toEqual({ min: 10, max: 50, mean: 30, median: 30 });
    expect(profileColumn(rows, 'status').numeric).toBeUndefined();
  });
  it('flags identifiers by uniqueness', () => {
    expect(profileColumn(rows, 'id').uniqueness).toBeCloseTo(4 / 5);
  });
});

describe('suggestFixes: found from the data, applied as real steps', () => {
  const cols = evalAll().columns;
  const col = (n: string) => cols.find((c) => c.name === n)!;

  it('suggests trimming only when there is padding', () => {
    const s = suggestFixes(col('city'), rows);
    expect(s.find((x) => x.id.startsWith('trim'))?.affected).toBe(1);
    expect(suggestFixes(col('id'), rows).some((x) => x.id.startsWith('trim'))).toBe(false);
  });

  it('chooses the casing action that actually merges the variants', () => {
    const s = suggestFixes(col('status'), rows).find((x) => x.id.startsWith('case'))!;
    expect(s.step.params.action).toBe('lowercase'); // Shipped/shipped + Pending/PENDING cannot be unified by title case
    const out = executeStep({ columns: cols, rows: rows.map((r) => ({ ...r })) }, { ...step('x', s.step.type, s.step.params) });
    expect(new Set(out.rows.map((r) => r.status)).size).toBe(2);
  });

  it('uses Title Case when only first letters differ', () => {
    const r2 = [{ s: 'north' }, { s: 'North' }, { s: 'south' }];
    const c = evaluatePipeline(r2, [step('s0', 'source', {})]).columns[0];
    expect(suggestFixes(c, r2).find((x) => x.id.startsWith('case'))!.step.params.action).toBe('capitalize');
  });

  it('detects numbers and dates stored as text, and empty cells', () => {
    expect(suggestFixes(col('qty'), rows).find((x) => x.id.startsWith('type'))?.step.params.newType).toBe('Whole Number');
    expect(suggestFixes(col('when'), rows).find((x) => x.id.startsWith('type'))?.step.params.newType).toBe('Date');
    const nulls = suggestFixes(col('price'), rows).find((x) => x.id.startsWith('nulls'))!;
    expect(nulls.affected).toBe(1);
    const filled = executeStep({ columns: cols, rows: rows.map((r) => ({ ...r })) }, step('n', nulls.step.type, nulls.step.params));
    expect(filled.rows.filter((r) => r.price === null || r.price === '').length).toBe(0);
  });

  it('finds duplicate and blank rows at table level', () => {
    expect(tableIssues(cols, rows).find((x) => x.id === 'dupes')?.affected).toBe(1);
    const withBlank = [...rows, { id: '', city: '', status: '', qty: '', price: null, when: '' }];
    expect(tableIssues(evalAll(withBlank).columns, withBlank).some((x) => x.id === 'blank-rows')).toBe(true);
  });

  it('every suggestion step really runs in the engine', () => {
    for (const c of cols) for (const s of suggestFixes(c, rows)) {
      expect(() => executeStep({ columns: cols, rows: rows.map((r) => ({ ...r })) }, step('t', s.step.type, s.step.params))).not.toThrow();
    }
  });
});

describe('tracePipeline', () => {
  it('reports size after each step in one pass and matches evaluatePipeline', () => {
    const steps = [
      step('s0', 'source', {}),
      step('s1', 'remove_duplicates', { columns: ['id', 'city', 'status', 'qty', 'price', 'when'] }),
      step('s2', 'remove_columns', { columns: ['when'] }),
    ];
    const t = tracePipeline(rows, steps);
    expect(t.map((x) => x.rows)).toEqual([5, 4, 4]);
    expect(t.map((x) => x.columns)).toEqual([6, 6, 5]);
    steps.forEach((s, i) => {
      const e = evaluatePipeline(rows, steps, s.id);
      expect(t[i].rows).toBe(e.totalRows);
      expect(t[i].columns).toBe(e.totalColumns);
    });
  });
  it('handles an empty source', () => {
    expect(tracePipeline([], [step('s0', 'source', {})])[0].rows).toBe(0);
  });
});

describe('qualityScore', () => {
  it('is the share of valid cells', () => {
    expect(qualityScore(evalAll().columns)).toBeGreaterThan(90);
    expect(qualityScore([])).toBe(100);
  });
});

import { detectColumnType, looksLikeDate } from './transformationEngine';
import { impactChips } from '../components/DataLab/stepMeta';

describe('date detection is not fooled by identifiers', () => {
  it('accepts real date shapes', () => {
    for (const d of ['2025-03-14', '2025-03-14T10:22:00Z', '3/14/2025', '12 Mar 2025', 'Mar 12, 2025', '2025-03-14 10:22', '03/14/2025 10:22 PM']) {
      expect(looksLikeDate(d), d).toBe(true);
    }
  });
  it('rejects ids, codes and prose that Date.parse would accept', () => {
    for (const d of ['SO-1000', 'INV-2024-17', 'Room 12, 4', 'A-12345', 'order 5/6', 'hello, world 2']) {
      expect(looksLikeDate(d), d).toBe(false);
    }
  });
  it('types a column of order ids as Text and a column of dates as Date', () => {
    expect(detectColumnType(['SO-1000', 'SO-1001', 'SO-1002'])).toBe('Text');
    expect(detectColumnType(['2025-01-01', '2025-02-01', '3/4/2025'])).toBe('Date');
  });
});

describe('impactChips', () => {
  it('describes row, column, error and empty-cell changes', () => {
    const a = { rows: 10, columns: 5, errors: 2, empty: 8 };
    expect(impactChips(null, a)).toEqual([]);
    expect(impactChips(a, { ...a, rows: 7 }).map((c) => c.text)).toEqual(['−3 rows']);
    expect(impactChips(a, { ...a, columns: 6 }).map((c) => c.text)).toEqual(['+1 col']);
    expect(impactChips(a, { ...a, empty: 0 }).map((c) => c.text)).toEqual(['8 empty filled']);
    expect(impactChips(a, { ...a, errors: 0 }).map((c) => c.text)).toEqual(['2 errors fixed']);
    expect(impactChips(a, a)).toEqual([]);
  });
});
