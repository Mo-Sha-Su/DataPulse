import { describe, expect, it } from 'vitest';
import { detectColumnType, evaluatePipeline, generateMFormula } from './transformationEngine';
import { DataCleaningStep } from '../types/dataCleaning';

const step = (id: string, type: string, params: Record<string, any>): DataCleaningStep =>
  ({ id, name: id, type, description: '', mFormula: '', params } as DataCleaningStep);

const rows = () => [
  { region: 'North', sales: 100, city: 'A' },
  { region: 'North', sales: 100, city: 'A' },
  { region: 'South', sales: 250, city: 'B' },
  { region: null as any, sales: 40, city: 'C' },
];

describe('detectColumnType', () => {
  it('detects numbers and text', () => {
    expect(detectColumnType([1, 2, 3])).toMatch(/number/i);
    expect(detectColumnType(['a', 'b', 'c'])).toBe('Text');
  });
});

describe('evaluatePipeline', () => {
  it('returns an empty result for empty input without throwing', () => {
    const r = evaluatePipeline([], [step('s1', 'remove_duplicates', {})]);
    expect(r).toMatchObject({ rows: [], columns: [], totalRows: 0, totalColumns: 0 });
  });

  it('with no steps returns the source rows unchanged', () => {
    const r = evaluatePipeline(rows(), []);
    expect(r.totalRows).toBe(4);
    expect(r.columns.map((c) => c.name)).toEqual(['region', 'sales', 'city']);
  });

  it('removes duplicate rows', () => {
    const r = evaluatePipeline(rows(), [step('d', 'remove_duplicates', {})]);
    expect(r.totalRows).toBe(3);
  });

  it('removes duplicates by a subset of columns', () => {
    const r = evaluatePipeline(rows(), [step('d', 'remove_duplicates', { columns: ['city'] })]);
    expect(r.rows.map((x) => x.city)).toEqual(['A', 'B', 'C']);
  });

  it('renames a column in both schema and rows', () => {
    const r = evaluatePipeline(rows(), [step('r', 'rename_column', { oldName: 'sales', newName: 'revenue' })]);
    expect(r.columns.map((c) => c.name)).toContain('revenue');
    expect(r.columns.map((c) => c.name)).not.toContain('sales');
    expect(r.rows[0].revenue).toBe(100);
    expect(r.rows[0]).not.toHaveProperty('sales');
  });

  it('ignores a rename to the same name or with missing params', () => {
    const r = evaluatePipeline(rows(), [step('r', 'rename_column', { oldName: 'sales', newName: 'sales' })]);
    expect(r.columns.map((c) => c.name)).toEqual(['region', 'sales', 'city']);
  });

  it('removes columns', () => {
    const r = evaluatePipeline(rows(), [step('x', 'remove_columns', { columns: ['city', 'sales'] })]);
    expect(r.columns.map((c) => c.name)).toEqual(['region']);
    expect(Object.keys(r.rows[0])).toEqual(['region']);
  });

  it('replaces values and leaves nulls alone', () => {
    const r = evaluatePipeline(rows(), [step('v', 'replace_values', { column: 'region', findValue: 'North', replaceValue: 'N', matchEntire: true })]);
    expect(r.rows.map((x) => x.region)).toEqual(['N', 'N', 'South', null]);
  });

  it('fills down missing values', () => {
    const r = evaluatePipeline(rows(), [step('f', 'fill_down', { column: 'region' })]);
    expect(r.rows[3].region).toBe('South');
  });

  it('filters rows by a list of selected values', () => {
    const r = evaluatePipeline(rows(), [step('f', 'filter_rows', { column: 'region', selectedValues: ['South'] })]);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].city).toBe('B');
  });

  it('does not mutate the caller\'s data', () => {
    const input = rows();
    const snapshot = JSON.stringify(input);
    evaluatePipeline(input, [
      step('a', 'rename_column', { oldName: 'sales', newName: 'x' }),
      step('b', 'remove_duplicates', {}),
      step('c', 'fill_down', { column: 'region' }),
    ]);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('stops at targetStepId (used for step-by-step preview)', () => {
    const steps = [step('a', 'remove_duplicates', {}), step('b', 'remove_columns', { columns: ['city'] })];
    expect(evaluatePipeline(rows(), steps, 'a').columns.map((c) => c.name)).toContain('city');
    expect(evaluatePipeline(rows(), steps, 'b').columns.map((c) => c.name)).not.toContain('city');
  });
});

describe('single-cell operations (targetRowIndex & edit_cell)', () => {
  it('edit_cell updates only the targeted cell and leaves all other rows/columns untouched', () => {
    const r = evaluatePipeline(rows(), [
      step('e1', 'edit_cell', { column: 'region', targetRowIndex: 1, value: 'East' }),
      step('e2', 'edit_cell', { column: 'sales', targetRowIndex: 2, value: null }),
    ]);
    expect(r.rows.map((x) => x.region)).toEqual(['North', 'East', 'South', null]);
    expect(r.rows.map((x) => x.sales)).toEqual([100, 100, null, 40]);
    expect(r.rows.map((x) => x.city)).toEqual(['A', 'A', 'B', 'C']);
  });

  it('scopes text_transform (uppercase, trim, prefix) to a single row when targetRowIndex is set', () => {
    const data = [
      { name: '  alice ', tag: 'x' },
      { name: '  bob ', tag: 'y' },
      { name: '  carol ', tag: 'z' },
    ];
    const r = evaluatePipeline(data, [
      step('t1', 'text_transform', { column: 'name', action: 'trim', targetRowIndex: 1 }),
      step('t2', 'text_transform', { column: 'name', action: 'uppercase', targetRowIndex: 1 }),
      step('t3', 'text_transform', { column: 'name', action: 'prefix', prefix: 'VIP-', targetRowIndex: 1 }),
    ]);
    expect(r.rows[0].name).toBe('  alice ');
    expect(r.rows[1].name).toBe('VIP-BOB');
    expect(r.rows[2].name).toBe('  carol ');
  });

  it('scopes number_transform and date_transform to targetRowIndex without touching sibling rows', () => {
    const data = [
      { amount: 10.456, when: '2025-03-15' },
      { amount: 10.456, when: '2025-03-15' },
      { amount: 20.4, when: '2024-07-04' },
    ];
    const r = evaluatePipeline(data, [
      step('n1', 'number_transform', { column: 'amount', action: 'multiply', value: 2, targetRowIndex: 0 }),
      step('n2', 'number_transform', { column: 'amount', action: 'round', decimals: 1, targetRowIndex: 0 }),
      step('d1', 'date_transform', { column: 'when', action: 'year', targetRowIndex: 1 }),
    ]);
    expect(r.rows[0].amount).toBe(20.9);
    expect(r.rows[1].amount).toBe(10.456);
    expect(r.rows[2].amount).toBe(20.4);
    expect(r.rows[0].when).toBe('2025-03-15');
    expect(r.rows[1].when).toBe(2025);
    expect(r.rows[2].when).toBe('2024-07-04');
  });

  it('scopes replace_values and replace_errors to targetRowIndex', () => {
    const data = [
      { status: 'North', code: { __isError: true, rawValue: 'bad', message: 'err' } },
      { status: 'North', code: { __isError: true, rawValue: 'bad', message: 'err' } },
    ];
    const r = evaluatePipeline(data, [
      step('rv', 'replace_values', { column: 'status', findValue: 'North', replaceValue: 'N', matchEntire: true, targetRowIndex: 0 }),
      step('re', 'replace_errors', { column: 'code', replaceValue: 'FIXED', targetRowIndex: 1 }),
    ]);
    expect(r.rows[0].status).toBe('N');
    expect(r.rows[1].status).toBe('North');
    expect((r.rows[0].code as any).__isError).toBe(true);
    expect(r.rows[1].code).toBe('FIXED');
  });

  it('scopes replace_nulls (average and fill_down/fill_up) to targetRowIndex while computing stats over the full column', () => {
    const data = [
      { val: 10, label: 'First' },
      { val: null as any, label: null as any },
      { val: null as any, label: null as any },
      { val: 30, label: 'Last' },
    ];
    const r = evaluatePipeline(data, [
      step('rn1', 'replace_nulls', { column: 'val', action: 'replace_avg', targetRowIndex: 1 }),
      step('fd1', 'fill_down', { column: 'label', targetRowIndex: 1 }),
      step('fu1', 'fill_up', { column: 'label', targetRowIndex: 2 }),
    ]);
    expect(r.rows[1].val).toBe(20);
    expect(r.rows[2].val).toBeNull();
    expect(r.rows[1].label).toBe('First');
    expect(r.rows[2].label).toBe('Last');
  });

  it('scopes fill_down to targetRowIndex without filling earlier or later blank cells', () => {
    const data = [
      { region: 'Alpha' },
      { region: null as any },
      { region: 'Beta' },
      { region: null as any },
    ];
    const r = evaluatePipeline(data, [
      step('fd', 'fill_down', { column: 'region', targetRowIndex: 3 }),
    ]);
    expect(r.rows[1].region).toBeNull();
    expect(r.rows[3].region).toBe('Beta');
  });

  it('generates readable M formulas for edit_cell and targetRowIndex steps', () => {
    const mEdit = generateMFormula(
      step('e', 'edit_cell', { column: 'Region', targetRowIndex: 2, value: 'West' }),
      'Source'
    );
    expect(mEdit).toBe('= Table.ReplaceValueAt(Source, 3, "Region", "West")');

    const mTrim = generateMFormula(
      step('t', 'text_transform', { column: 'Region', action: 'uppercase', targetRowIndex: 0 }),
      'Source'
    );
    expect(mTrim).toContain('/* Row 1 only */');
  });
});

