import { describe, it, expect } from 'vitest';
import { CleaningColumn } from '../types/dataCleaning';
import {
  isEditableElement,
  computeRowSelectionAfterClick,
  getNextCellNavigation,
  formatSelectionSummary,
  formatActingOnTarget,
  formatSelectionAsTsv,
  computeSelectionStats,
  getTargetRowIndices,
} from '../utils/gridSelection';
import { executeStep, generateMFormula } from '../utils/transformationEngine';

const sampleColumns: CleaningColumn[] = [
  { name: 'Region', dataType: 'Text', validCount: 5, errorCount: 0, emptyCount: 0, distinctCount: 3 },
  { name: 'Sales', dataType: 'Whole Number', validCount: 5, errorCount: 0, emptyCount: 0, distinctCount: 5 },
  { name: 'City', dataType: 'Text', validCount: 5, errorCount: 0, emptyCount: 0, distinctCount: 4 },
];

const sampleRows = [
  { Region: 'North', Sales: 10, City: 'London' },
  { Region: 'South', Sales: 20, City: 'Paris' },
  { Region: 'West', Sales: 30, City: 'Berlin' },
  { Region: 'North', Sales: 40, City: 'Madrid' },
  { Region: 'East', Sales: 50, City: 'Rome' },
];

describe('Data Lab selection logic & transformations', () => {
  it('detects editable elements cleanly so manually typed cells are not hijacked', () => {
    expect(isEditableElement({ tagName: 'INPUT', type: 'text' })).toBe(true);
    expect(isEditableElement({ tagName: 'INPUT', type: 'checkbox' })).toBe(false);
    expect(isEditableElement({ tagName: 'INPUT', type: 'radio' })).toBe(false);
    expect(isEditableElement({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isEditableElement({ tagName: 'SELECT' })).toBe(true);
    expect(isEditableElement({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(
      isEditableElement({
        tagName: 'SPAN',
        closest: (sel: string) => (sel.includes('data-editable-cell') ? {} : null),
      })
    ).toBe(true);
    expect(isEditableElement({ tagName: 'TD' })).toBe(false);
    expect(isEditableElement(null)).toBe(false);
  });

  it('computes row selection for single click, Shift+range, and Ctrl/Cmd+toggle', () => {
    // Single click selects row 1
    const s1 = computeRowSelectionAfterClick(new Set(), null, 1, {});
    expect(Array.from(s1.rows)).toEqual([1]);
    expect(s1.anchor).toBe(1);

    // Shift+click row 4 selects range 1..4
    const s2 = computeRowSelectionAfterClick(s1.rows, s1.anchor, 4, { shiftKey: true });
    expect(Array.from(s2.rows).sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    expect(s2.anchor).toBe(1);

    // Ctrl/Cmd+click toggles off row 2
    const s3 = computeRowSelectionAfterClick(s2.rows, s2.anchor, 2, { ctrlKey: true });
    expect(Array.from(s3.rows).sort((a, b) => a - b)).toEqual([1, 3, 4]);

    // Single click on already exclusively selected row clears it
    const s4 = computeRowSelectionAfterClick(new Set([3]), 3, 3, {});
    expect(s4.rows.size).toBe(0);
  });

  it('navigates active cells with arrows (LTR/RTL), Tab, Enter, and Shift+arrows range', () => {
    // ArrowDown and Enter move down
    expect(
      getNextCellNavigation({
        key: 'ArrowDown',
        shiftKey: false,
        isRtl: false,
        currentRow: 0,
        currentCol: 1,
        maxRow: 4,
        colCount: 3,
        currentRange: null,
      })
    ).toEqual({ kind: 'cell', rowIndex: 1, colIndex: 1 });

    expect(
      getNextCellNavigation({
        key: 'Enter',
        shiftKey: false,
        isRtl: false,
        currentRow: 1,
        currentCol: 0,
        maxRow: 4,
        colCount: 3,
        currentRange: null,
      })
    ).toEqual({ kind: 'cell', rowIndex: 2, colIndex: 0 });

    // RTL reverses ArrowLeft/ArrowRight
    expect(
      getNextCellNavigation({
        key: 'ArrowLeft',
        shiftKey: false,
        isRtl: true,
        currentRow: 0,
        currentCol: 0,
        maxRow: 4,
        colCount: 3,
        currentRange: null,
      })
    ).toEqual({ kind: 'cell', rowIndex: 0, colIndex: 1 });

    // Tab wraps to next row at end of columns
    expect(
      getNextCellNavigation({
        key: 'Tab',
        shiftKey: false,
        isRtl: false,
        currentRow: 0,
        currentCol: 2,
        maxRow: 4,
        colCount: 3,
        currentRange: null,
      })
    ).toEqual({ kind: 'cell', rowIndex: 1, colIndex: 0 });

    // Shift+ArrowRight extends selection range
    expect(
      getNextCellNavigation({
        key: 'ArrowRight',
        shiftKey: true,
        isRtl: false,
        currentRow: 1,
        currentCol: 0,
        maxRow: 4,
        colCount: 3,
        currentRange: null,
      })
    ).toEqual({ kind: 'range', startRow: 1, startCol: 0, endRow: 1, endCol: 1 });
  });

  it('formats status bar summary and Acting on labels for cell, row, multi-row, and range', () => {
    const nineCols: CleaningColumn[] = Array.from({ length: 9 }, (_, i) => ({
      name: `C${i + 1}`,
      dataType: 'Text',
      validCount: 5,
      errorCount: 0,
      emptyCount: 0,
      distinctCount: 5,
    }));

    expect(
      formatSelectionSummary({ kind: 'rows', rowIndices: [4] }, nineCols, sampleRows)
    ).toBe('Row 5 · 9 cells');

    expect(
      formatSelectionSummary({ kind: 'rows', rowIndices: [0, 2, 4] }, nineCols, sampleRows)
    ).toBe('3 rows selected');

    expect(
      formatSelectionSummary({ kind: 'cell', rowIndex: 4, columnName: 'Region' }, sampleColumns, sampleRows)
    ).toBe('Cell Region[5] = East');

    expect(
      formatActingOnTarget({ kind: 'cell', rowIndex: 4, columnName: 'Region' })
    ).toEqual({ primary: 'Region', secondary: 'R5' });

    expect(
      formatActingOnTarget({ kind: 'rows', rowIndices: [4] })
    ).toEqual({ primary: 'Row 5' });

    expect(
      formatActingOnTarget({ kind: 'rows', rowIndices: [0, 1, 2] })
    ).toEqual({ primary: '3 rows' });

    expect(
      formatActingOnTarget({ kind: 'range', startRow: 0, startCol: 0, endRow: 1, endCol: 2 })
    ).toEqual({ primary: '6 cells', secondary: '2×3' });
  });

  it('formats TSV clipboard text for cells, ranges, rows, and columns', () => {
    expect(
      formatSelectionAsTsv({ kind: 'cell', rowIndex: 4, columnName: 'Region' }, sampleColumns, sampleRows)
    ).toBe('East');

    expect(
      formatSelectionAsTsv(
        { kind: 'range', startRow: 0, startCol: 0, endRow: 1, endCol: 1 },
        sampleColumns,
        sampleRows
      )
    ).toBe('North\t10\nSouth\t20');

    expect(
      formatSelectionAsTsv({ kind: 'rows', rowIndices: [0, 4] }, sampleColumns, sampleRows)
    ).toBe('Region\tSales\tCity\nNorth\t10\tLondon\nEast\t50\tRome');
  });

  it('computes numeric and text quick stats across selection ranges', () => {
    const numStats = computeSelectionStats(
      { kind: 'range', startRow: 0, startCol: 1, endRow: 3, endCol: 1 },
      sampleColumns,
      sampleRows
    );
    expect(numStats).toEqual({
      type: 'numeric',
      count: 4,
      sum: '100',
      avg: '25',
      min: '10',
      max: '40',
    });

    const textStats = computeSelectionStats(
      { kind: 'range', startRow: 0, startCol: 0, endRow: 3, endCol: 0 },
      sampleColumns,
      sampleRows
    );
    expect(textStats).toEqual({
      type: 'text',
      count: 4,
      distinct: 3,
      empty: 0,
    });
  });

  it('resolves target row indices for context menu row operations', () => {
    expect(getTargetRowIndices({ kind: 'rows', rowIndices: [3, 1] }, 1)).toEqual([1, 3]);
    expect(getTargetRowIndices({ kind: 'range', startRow: 1, startCol: 0, endRow: 2, endCol: 1 }, 2)).toEqual([1, 2]);
    expect(getTargetRowIndices({ kind: 'cell', rowIndex: 4, columnName: 'Region' }, 4)).toEqual([4]);
  });

  it('executes remove_indices and keep_indices pipeline steps accurately', () => {
    const removeStep = {
      id: 's1',
      name: 'Removed rows',
      type: 'remove_rows' as const,
      description: '',
      mFormula: '',
      params: { action: 'remove_indices', rowIndices: [1, 3] },
    };
    const afterRemove = executeStep({ columns: sampleColumns, rows: sampleRows }, removeStep);
    expect(afterRemove.rows.map((r) => r.City)).toEqual(['London', 'Berlin', 'Rome']);
    expect(generateMFormula(removeStep, 'Source')).toContain('Table.RemoveRows(Source');

    const keepStep = {
      id: 's2',
      name: 'Kept selected rows',
      type: 'keep_rows' as const,
      description: '',
      mFormula: '',
      params: { action: 'keep_indices', rowIndices: [0, 4] },
    };
    const afterKeep = executeStep({ columns: sampleColumns, rows: sampleRows }, keepStep);
    expect(afterKeep.rows.map((r) => r.City)).toEqual(['London', 'Rome']);
    expect(generateMFormula(keepStep, 'Source')).toContain('Table.SelectRowsByIndex(Source');
  });
});
