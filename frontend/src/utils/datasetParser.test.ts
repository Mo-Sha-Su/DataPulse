import { describe, expect, it } from 'vitest';
import { parseCanonicalNumber, normalizeHeaders, inferColumnTypes, parseDatasetBuffer } from './datasetParser';

describe('datasetParser data fidelity', () => {
  it('preserves leading zeros and keeps non-canonical numbers as strings', () => {
    // "007" must NOT become 7
    expect(parseCanonicalNumber('007')).toEqual({ isNumber: false, value: '007' });
    expect(parseCanonicalNumber('01234')).toEqual({ isNumber: false, value: '01234' });

    // Canonical zero is number 0
    expect(parseCanonicalNumber('0')).toEqual({ isNumber: true, value: 0 });
    // Canonical numbers convert
    expect(parseCanonicalNumber('42')).toEqual({ isNumber: true, value: 42 });
    expect(parseCanonicalNumber('-15.75')).toEqual({ isNumber: true, value: -15.75 });
    expect(parseCanonicalNumber('1.5e3')).toEqual({ isNumber: true, value: 1500 });
  });

  it('keeps long digit strings (>=16 digits) as text to protect IEEE 754 precision', () => {
    const cc = '4532015698421054';
    expect(parseCanonicalNumber(cc)).toEqual({ isNumber: false, value: cc });
    const tracking = '9400111899562548712345';
    expect(parseCanonicalNumber(tracking)).toEqual({ isNumber: false, value: tracking });
  });

  it('renames blank and duplicate headers correctly without overwriting', () => {
    const raw = ['id', 'name', 'name', '', 'name', '  '];
    const cleaned = normalizeHeaders(raw);
    expect(cleaned).toEqual(['id', 'name', 'name (2)', 'Column 4', 'name (3)', 'Column 6']);
  });

  it('strips BOM from first header', () => {
    const raw = ['\uFEFFid', 'product'];
    const cleaned = normalizeHeaders(raw);
    expect(cleaned[0]).toBe('id');
  });

  it('infers column types from ALL rows, not only the first row', () => {
    const headers = ['mixed', 'pure_nums', 'pure_dates'];
    const rows = [
      { mixed: 100, pure_nums: 1, pure_dates: '2026-01-01' },
      { mixed: 200, pure_nums: 2, pure_dates: '2026-01-02' },
      { mixed: 'N/A', pure_nums: 3, pure_dates: '2026-01-03' }, // row 3 has string in 'mixed'
    ];
    const cols = inferColumnTypes(headers, rows);
    const mixedCol = cols.find((c) => c.name === 'mixed');
    const numsCol = cols.find((c) => c.name === 'pure_nums');
    const datesCol = cols.find((c) => c.name === 'pure_dates');

    // 'mixed' must be 'string' because row 3 is 'N/A', even though row 1 was a number!
    expect(mixedCol?.type).toBe('string');
    expect(numsCol?.type).toBe('number');
    expect(datesCol?.type).toBe('date');
  });

  it('parses full CSV buffer end-to-end with proper encoding and typing', async () => {
    const csvContent = 'id,code,amount,created_at\n1,007,450.50,2026-02-15\n2,008,1200,2026-02-16\n';
    const bytes = new TextEncoder().encode(csvContent);
    const result = await parseDatasetBuffer(bytes, 'sales.csv');

    expect(result.rowCount).toBe(2);
    expect(result.columnCount).toBe(4);
    // Code "007" remains string
    expect(result.rows[0].code).toBe('007');
    expect(typeof result.rows[0].code).toBe('string');
    // Amount is canonical number
    expect(result.rows[0].amount).toBe(450.5);
    expect(typeof result.rows[0].amount).toBe('number');
  });
});
