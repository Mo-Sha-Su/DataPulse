import { CleaningColumn } from '../types/dataCleaning';
import { defaultEnT, TranslateFn } from '../i18n/LanguageContext';
import { isCellError } from './transformationEngine';

export type GridSelection =
  | { kind: 'none' }
  | { kind: 'cell'; rowIndex: number; columnName: string }
  | { kind: 'range'; startRow: number; startCol: number; endRow: number; endCol: number }
  | { kind: 'rows'; rowIndices: number[] }
  | { kind: 'columns'; columnNames: string[]; primaryColumn: string };

export interface SelectionStats {
  type: 'numeric' | 'text';
  count: number;
  sum?: string;
  avg?: string;
  min?: string;
  max?: string;
  distinct?: number;
  empty?: number;
}

/**
 * Returns true if the target or active element is an editable form control or
 * contentEditable cell (e.g. a manually typed column editor) so grid key/click
 * handlers do not steal keystrokes or focus.
 */
export function isEditableElement(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false;
  const el = target as {
    tagName?: string;
    type?: string;
    isContentEditable?: boolean;
    closest?: (selector: string) => unknown;
  };
  const tag = el.tagName?.toUpperCase();
  if (tag === 'INPUT') {
    const inputType = (el.type || 'text').toLowerCase();
    return inputType !== 'checkbox' && inputType !== 'radio';
  }
  if (tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  if (el.isContentEditable) {
    return true;
  }
  if (typeof el.closest === 'function') {
    if (el.closest('[contenteditable="true"], [data-editable-cell="true"]')) {
      return true;
    }
  }
  return false;
}

/**
 * Computes the next set of selected row indices when a row number is clicked,
 * supporting Single click, Shift+range selection, and Ctrl/Cmd+toggle.
 */
export function computeRowSelectionAfterClick(
  prevSelected: Set<number>,
  anchorRow: number | null,
  clickedRow: number,
  modifiers: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
): { rows: Set<number>; anchor: number } {
  const next = new Set(prevSelected);

  if (modifiers.shiftKey && anchorRow !== null) {
    const start = Math.min(anchorRow, clickedRow);
    const end = Math.max(anchorRow, clickedRow);
    for (let i = start; i <= end; i++) {
      next.add(i);
    }
    return { rows: next, anchor: anchorRow };
  }

  if (modifiers.ctrlKey || modifiers.metaKey) {
    if (next.has(clickedRow)) {
      next.delete(clickedRow);
    } else {
      next.add(clickedRow);
    }
    return { rows: next, anchor: clickedRow };
  }

  if (next.size === 1 && next.has(clickedRow)) {
    return { rows: new Set<number>(), anchor: clickedRow };
  }

  return { rows: new Set<number>([clickedRow]), anchor: clickedRow };
}

export type CellNavigationResult =
  | { kind: 'cell'; rowIndex: number; colIndex: number }
  | { kind: 'range'; startRow: number; startCol: number; endRow: number; endCol: number }
  | null;

/**
 * Computes next active cell or extended range for Arrow, Tab, and Enter keys.
 */
export function getNextCellNavigation(params: {
  key: string;
  shiftKey: boolean;
  isRtl: boolean;
  currentRow: number;
  currentCol: number;
  maxRow: number;
  colCount: number;
  currentRange: { startRow: number; startCol: number; endRow: number; endCol: number } | null;
}): CellNavigationResult {
  const { key, shiftKey, isRtl, currentRow, currentCol, maxRow, colCount, currentRange } = params;
  if (maxRow < 0 || colCount <= 0) return null;

  if (shiftKey && (key === 'ArrowDown' || key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowRight')) {
    const startRow = currentRange ? currentRange.startRow : currentRow;
    const startCol = currentRange ? currentRange.startCol : currentCol;
    let endRow = currentRange ? currentRange.endRow : currentRow;
    let endCol = currentRange ? currentRange.endCol : currentCol;

    if (key === 'ArrowDown') endRow = Math.min(maxRow, endRow + 1);
    else if (key === 'ArrowUp') endRow = Math.max(0, endRow - 1);
    else if (key === 'ArrowRight') {
      endCol = isRtl ? Math.max(0, endCol - 1) : Math.min(colCount - 1, endCol + 1);
    } else if (key === 'ArrowLeft') {
      endCol = isRtl ? Math.min(colCount - 1, endCol + 1) : Math.max(0, endCol - 1);
    }

    return { kind: 'range', startRow, startCol, endRow, endCol };
  }

  let nextRow = currentRow;
  let nextCol = currentCol;

  switch (key) {
    case 'ArrowDown':
    case 'Enter':
      nextRow = Math.min(maxRow, currentRow + 1);
      break;
    case 'ArrowUp':
      nextRow = Math.max(0, currentRow - 1);
      break;
    case 'ArrowRight':
      nextCol = isRtl ? Math.max(0, currentCol - 1) : Math.min(colCount - 1, currentCol + 1);
      break;
    case 'ArrowLeft':
      nextCol = isRtl ? Math.min(colCount - 1, currentCol + 1) : Math.max(0, currentCol - 1);
      break;
    case 'Tab':
      if (shiftKey) {
        if (currentCol > 0) {
          nextCol = currentCol - 1;
        } else if (currentRow > 0) {
          nextRow = currentRow - 1;
          nextCol = colCount - 1;
        }
      } else {
        if (currentCol < colCount - 1) {
          nextCol = currentCol + 1;
        } else if (currentRow < maxRow) {
          nextRow = currentRow + 1;
          nextCol = 0;
        }
      }
      break;
    default:
      return null;
  }

  if (nextRow === currentRow && nextCol === currentCol) {
    return null;
  }

  return { kind: 'cell', rowIndex: nextRow, colIndex: nextCol };
}

export function formatCellValuePreview(val: unknown, emptyLabel = 'null'): string {
  if (val === null || val === undefined || val === '') return emptyLabel;
  if (isCellError(val)) return 'Error';
  const s = String(val);
  return s.length > 36 ? `${s.slice(0, 33)}...` : s;
}

/**
 * Formats a concise human-readable selection summary for the Data Lab status bar, e.g.:
 * - "Row 5 · 9 cells"
 * - "3 rows selected"
 * - "Cell Region[5] = East"
 */
export function formatSelectionSummary(
  selection: GridSelection,
  columns: CleaningColumn[],
  rows: Record<string, any>[],
  t: TranslateFn = defaultEnT
): string | null {
  switch (selection.kind) {
    case 'none':
      return null;
    case 'cell': {
      const val = rows[selection.rowIndex]?.[selection.columnName];
      const valStr = formatCellValuePreview(val, t('labGridNullBadge'));
      return t('labGridSelCellSummary', {
        col: selection.columnName,
        row: selection.rowIndex + 1,
        value: valStr,
      });
    }
    case 'range': {
      const rowSpan = Math.abs(selection.endRow - selection.startRow) + 1;
      const colSpan = Math.abs(selection.endCol - selection.startCol) + 1;
      return t('labGridSelRangeSummary', {
        cells: rowSpan * colSpan,
        rows: rowSpan,
        cols: colSpan,
      });
    }
    case 'rows': {
      if (selection.rowIndices.length === 0) return null;
      if (selection.rowIndices.length === 1) {
        return t('labGridSelRowSummary', {
          row: selection.rowIndices[0] + 1,
          cells: columns.length,
        });
      }
      return t('labGridSelRowsSelected', { count: selection.rowIndices.length });
    }
    case 'columns': {
      if (selection.columnNames.length === 0) return null;
      if (selection.columnNames.length === 1) {
        return t('labGridSelColSummary', {
          col: selection.columnNames[0],
          rows: rows.length.toLocaleString(),
        });
      }
      return t('labGridSelColsSelected', { count: selection.columnNames.length });
    }
    default:
      return null;
  }
}

/**
 * Formats what the CommandBar "Acting on" badge displays for any selection mode.
 */
export function formatActingOnTarget(
  selection: GridSelection,
  t: TranslateFn = defaultEnT
): { primary: string; secondary?: string } | null {
  switch (selection.kind) {
    case 'cell':
      return {
        primary: selection.columnName,
        secondary: `R${selection.rowIndex + 1}`,
      };
    case 'range': {
      const rowSpan = Math.abs(selection.endRow - selection.startRow) + 1;
      const colSpan = Math.abs(selection.endCol - selection.startCol) + 1;
      return {
        primary: t('labActingCells', { count: rowSpan * colSpan }),
        secondary: `${rowSpan}×${colSpan}`,
      };
    }
    case 'rows':
      if (selection.rowIndices.length === 0) return null;
      if (selection.rowIndices.length === 1) {
        return { primary: t('labActingRow', { row: selection.rowIndices[0] + 1 }) };
      }
      return { primary: t('labActingRows', { count: selection.rowIndices.length }) };
    case 'columns':
      if (!selection.primaryColumn) return null;
      return {
        primary: selection.primaryColumn,
        secondary:
          selection.columnNames.length > 1 ? `+${selection.columnNames.length - 1}` : undefined,
      };
    case 'none':
    default:
      return null;
  }
}

/**
 * Serializes the active grid selection into tab-separated text (TSV) for clipboard copy.
 */
export function formatSelectionAsTsv(
  selection: GridSelection,
  columns: CleaningColumn[],
  rows: Record<string, any>[],
  previewLimit = rows.length
): string {
  const safeVal = (v: unknown) => (v === null || v === undefined ? '' : isCellError(v) ? '#ERROR' : String(v));

  if (selection.kind === 'range') {
    const minR = Math.min(selection.startRow, selection.endRow);
    const maxR = Math.min(rows.length - 1, Math.max(selection.startRow, selection.endRow));
    const minC = Math.min(selection.startCol, selection.endCol);
    const maxC = Math.min(columns.length - 1, Math.max(selection.startCol, selection.endCol));
    const lines: string[] = [];
    for (let r = minR; r <= maxR; r++) {
      const vals: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        const col = columns[c];
        vals.push(col ? safeVal(rows[r]?.[col.name]) : '');
      }
      lines.push(vals.join('\t'));
    }
    return lines.join('\n');
  }

  if (selection.kind === 'cell') {
    return safeVal(rows[selection.rowIndex]?.[selection.columnName]);
  }

  if (selection.kind === 'rows' && selection.rowIndices.length > 0) {
    const sortedRows = [...selection.rowIndices].sort((a, b) => a - b);
    const headerLine = columns.map((c) => c.name).join('\t');
    const dataLines = sortedRows.map((r) =>
      columns.map((c) => safeVal(rows[r]?.[c.name])).join('\t')
    );
    return [headerLine, ...dataLines].join('\n');
  }

  if (selection.kind === 'columns' && selection.columnNames.length > 0) {
    const colSet = new Set(selection.columnNames);
    const targetCols = columns.filter((c) => colSet.has(c.name));
    if (targetCols.length === 0) return '';
    const headerLine = targetCols.map((c) => c.name).join('\t');
    const maxRows = Math.min(rows.length, previewLimit);
    const dataLines: string[] = [];
    for (let r = 0; r < maxRows; r++) {
      dataLines.push(targetCols.map((c) => safeVal(rows[r]?.[c.name])).join('\t'));
    }
    return [headerLine, ...dataLines].join('\n');
  }

  return '';
}

/**
 * Computes numeric or categorical quick stats for the selected values.
 */
export function computeSelectionStats(
  selection: GridSelection,
  columns: CleaningColumn[],
  rows: Record<string, any>[],
  previewLimit = rows.length
): SelectionStats | null {
  const vals: unknown[] = [];

  if (selection.kind === 'range') {
    const minR = Math.min(selection.startRow, selection.endRow);
    const maxR = Math.min(rows.length - 1, Math.max(selection.startRow, selection.endRow));
    const minC = Math.min(selection.startCol, selection.endCol);
    const maxC = Math.min(columns.length - 1, Math.max(selection.startCol, selection.endCol));
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const col = columns[c];
        if (col) vals.push(rows[r]?.[col.name]);
      }
    }
  } else if (selection.kind === 'cell') {
    vals.push(rows[selection.rowIndex]?.[selection.columnName]);
  } else if (selection.kind === 'rows') {
    for (const r of selection.rowIndices) {
      for (const col of columns) {
        vals.push(rows[r]?.[col.name]);
      }
    }
  } else if (selection.kind === 'columns') {
    const totalPreview = Math.min(rows.length, previewLimit);
    for (let r = 0; r < totalPreview; r++) {
      for (const colName of selection.columnNames) {
        vals.push(rows[r]?.[colName]);
      }
    }
  }

  if (vals.length === 0) return null;

  const count = vals.length;
  let emptyCount = 0;
  const numVals: number[] = [];
  const distinctSet = new Set<string>();

  for (const v of vals) {
    if (v === null || v === undefined || v === '') {
      emptyCount++;
    } else if (!isCellError(v)) {
      distinctSet.add(String(v));
      const num = Number(v);
      if (typeof v === 'number' || (!isNaN(num) && typeof v !== 'boolean' && String(v).trim() !== '')) {
        numVals.push(num);
      }
    }
  }

  const isAllNumeric = numVals.length > 0 && numVals.length === count - emptyCount;

  if (isAllNumeric) {
    const sum = numVals.reduce((a, b) => a + b, 0);
    const avg = sum / numVals.length;
    const min = Math.min(...numVals);
    const max = Math.max(...numVals);
    return {
      type: 'numeric',
      count,
      sum: Number.isInteger(sum) ? sum.toLocaleString() : sum.toFixed(2),
      avg: Number.isInteger(avg) ? avg.toLocaleString() : avg.toFixed(2),
      min: Number.isInteger(min) ? min.toLocaleString() : min.toFixed(2),
      max: Number.isInteger(max) ? max.toLocaleString() : max.toFixed(2),
    };
  }

  return {
    type: 'text',
    count,
    distinct: distinctSet.size,
    empty: emptyCount,
  };
}

/**
 * Resolves the sorted list of row indices targeted by a context menu row operation.
 */
export function getTargetRowIndices(
  selection: GridSelection,
  contextRowIndex?: number
): number[] {
  if (selection.kind === 'rows' && selection.rowIndices.length > 0) {
    if (contextRowIndex === undefined || selection.rowIndices.includes(contextRowIndex)) {
      return [...new Set(selection.rowIndices)].sort((a, b) => a - b);
    }
  }
  if (selection.kind === 'range') {
    const minR = Math.min(selection.startRow, selection.endRow);
    const maxR = Math.max(selection.startRow, selection.endRow);
    if (contextRowIndex === undefined || (contextRowIndex >= minR && contextRowIndex <= maxR)) {
      const out: number[] = [];
      for (let r = minR; r <= maxR; r++) out.push(r);
      return out;
    }
  }
  if (contextRowIndex !== undefined) {
    return [contextRowIndex];
  }
  if (selection.kind === 'cell') {
    return [selection.rowIndex];
  }
  return [];
}
