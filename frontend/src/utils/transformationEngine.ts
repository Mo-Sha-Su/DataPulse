import {
  CleaningColumn,
  ColumnDataType,
  DataCleaningStep,
  CellError,
  StepEvaluationResult,
} from '../types/dataCleaning';

// Helper to check if a value represents a CellError
export function isCellError(val: any): val is CellError {
  return val && typeof val === 'object' && val.__isError === true;
}

// Automatically detect the data type of an array of sample values
/**
 * A value counts as a date only if it has a recognisable date SHAPE (ISO, d/m/y, "12 Mar 2025", "Mar 12, 2025").
 * JavaScript's Date.parse alone is far too lenient: it accepts identifiers such as "SO-1000" or "Room 12, 4".
 */
export function looksLikeDate(str: string): boolean {
  const s = str.trim();
  if (s.length < 6) return false;
  const shaped =
    /^\d{4}-\d{1,2}-\d{1,2}([T\s]\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s) ||
    /^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}([\s,]+\d{1,2}:\d{2}(:\d{2})?(\s?[AaPp][Mm])?)?$/.test(s) ||
    /^\d{1,2}\s+[A-Za-z]{3,9}\.?,?\s+\d{4}$/.test(s) ||
    /^[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}$/.test(s);
  return shaped && !isNaN(Date.parse(s));
}

export function detectColumnType(values: any[]): ColumnDataType {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'Text';

  let boolCount = 0;
  let intCount = 0;
  let decCount = 0;
  let dateCount = 0;
  let currencyCount = 0;
  let pctCount = 0;

  for (const val of nonNullValues.slice(0, 50)) {
    const str = String(val).trim();
    if (typeof val === 'boolean' || str.toLowerCase() === 'true' || str.toLowerCase() === 'false') {
      boolCount++;
    } else if (/^[$€£¥]\s?[\d,]+(\.\d+)?$/.test(str) || /^[\d,]+(\.\d+)?\s?[$€£¥]$/.test(str)) {
      currencyCount++;
    } else if (/^-?[\d,]+(\.\d+)?%$/.test(str)) {
      pctCount++;
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) intCount++;
      else decCount++;
    } else if (/^-?\d+$/.test(str.replace(/,/g, ''))) {
      intCount++;
    } else if (/^-?\d+\.\d+$/.test(str.replace(/,/g, ''))) {
      decCount++;
    } else if (looksLikeDate(str)) {
      dateCount++;
    }
  }

  const sampleSize = Math.min(50, nonNullValues.length);
  const threshold = sampleSize * 0.7;

  if (boolCount >= threshold) return 'Boolean';
  if (currencyCount >= threshold) return 'Currency';
  if (pctCount >= threshold) return 'Percentage';
  if (intCount >= threshold) return 'Whole Number';
  if (intCount + decCount >= threshold) return 'Decimal Number';
  if (dateCount >= threshold) return 'Date';

  return 'Text';
}

// Convert a single value to target ColumnDataType
export function castValueToType(val: any, targetType: ColumnDataType, originalCol: string): any {
  if (val === null || val === undefined || val === '') return null;
  if (isCellError(val)) return val;

  const str = String(val).trim();

  switch (targetType) {
    case 'Text':
      return String(val);

    case 'Whole Number': {
      if (typeof val === 'number') return Math.round(val);
      const cleaned = str.replace(/,/g, '').replace(/[$€£¥]/g, '').trim();
      const parsed = parseInt(cleaned, 10);
      if (isNaN(parsed) || !/^-?\d+$/.test(cleaned.split('.')[0])) {
        return {
          __isError: true,
          rawValue: val,
          message: `Cannot convert "${val}" to Whole Number`,
        } as CellError;
      }
      return parsed;
    }

    case 'Decimal Number': {
      if (typeof val === 'number') return val;
      const cleaned = str.replace(/,/g, '').replace(/[$€£¥]/g, '').trim();
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed)) {
        return {
          __isError: true,
          rawValue: val,
          message: `Cannot convert "${val}" to Decimal Number`,
        } as CellError;
      }
      return parsed;
    }

    case 'Percentage': {
      if (typeof val === 'number') return val;
      const hasSign = str.endsWith('%');
      const cleaned = str.replace(/%/g, '').replace(/,/g, '').trim();
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed)) {
        return {
          __isError: true,
          rawValue: val,
          message: `Cannot convert "${val}" to Percentage`,
        } as CellError;
      }
      return hasSign ? parsed : parsed;
    }

    case 'Currency': {
      if (typeof val === 'number') return val;
      const cleaned = str.replace(/[$€£¥]/g, '').replace(/,/g, '').trim();
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed)) {
        return {
          __isError: true,
          rawValue: val,
          message: `Cannot convert "${val}" to Currency`,
        } as CellError;
      }
      return parsed;
    }

    case 'Boolean': {
      if (typeof val === 'boolean') return val;
      const lower = str.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 't') return true;
      if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'f') return false;
      return {
        __isError: true,
        rawValue: val,
        message: `Cannot convert "${val}" to Boolean`,
      } as CellError;
    }

    case 'Date': {
      if (str.length < 4) {
        return {
          __isError: true,
          rawValue: val,
          message: `Invalid Date value "${val}"`,
        } as CellError;
      }
      const d = new Date(str);
      if (isNaN(d.getTime())) {
        return {
          __isError: true,
          rawValue: val,
          message: `Cannot convert "${val}" to Date`,
        } as CellError;
      }
      return d.toISOString().slice(0, 10);
    }

    case 'Date/Time': {
      const d = new Date(str);
      if (isNaN(d.getTime())) {
        return {
          __isError: true,
          rawValue: val,
          message: `Cannot convert "${val}" to Date/Time`,
        } as CellError;
      }
      return d.toISOString().replace('T', ' ').slice(0, 19);
    }

    case 'Time': {
      const timeMatch = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (timeMatch) {
        return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}${timeMatch[3] ? `:${timeMatch[3]}` : ''}`;
      }
      return {
        __isError: true,
        rawValue: val,
        message: `Cannot convert "${val}" to Time`,
      } as CellError;
    }

    default:
      return String(val);
  }
}

// Compute Column Quality Stats (valid, empty, errors)
export function computeColumnQuality(
  columns: string[],
  rows: Record<string, any>[],
  dataTypes: Record<string, ColumnDataType>
): CleaningColumn[] {
  const totalRows = rows.length;

  return columns.map((colName) => {
    let emptyCount = 0;
    let errorCount = 0;
    let validCount = 0;

    for (const row of rows) {
      const val = row[colName];
      if (isCellError(val)) {
        errorCount++;
      } else if (val === null || val === undefined || val === '') {
        emptyCount++;
      } else {
        validCount++;
      }
    }

    return {
      name: colName,
      originalName: colName,
      dataType: dataTypes[colName] || 'Text',
      validCount,
      emptyCount,
      errorCount,
    };
  });
}

// Execute a single step transformation on dataset state
export function executeStep(
  inputState: { columns: CleaningColumn[]; rows: Record<string, any>[] },
  step: DataCleaningStep
): { columns: CleaningColumn[]; rows: Record<string, any>[] } {
  const { type, params } = step;
  let currentCols = [...inputState.columns];
  let currentRows = inputState.rows.map((r) => ({ ...r }));

  const targetRowIdx =
    typeof params?.targetRowIndex === 'number' &&
    Number.isInteger(params.targetRowIndex) &&
    params.targetRowIndex >= 0
      ? params.targetRowIndex
      : null;

  switch (type) {
    case 'source':
      // Source step passes through its raw data
      return inputState;

    case 'edit_cell': {
      const { column, value } = params;
      if (targetRowIdx === null || !column || targetRowIdx >= currentRows.length) break;
      if (!currentCols.some((c) => c.name === column)) break;
      currentRows = currentRows.map((row, idx) =>
        idx === targetRowIdx ? { ...row, [column]: value === undefined ? null : value } : row
      );
      break;
    }

    case 'promoted_headers': {
      if (currentRows.length === 0) return inputState;
      const firstRow = currentRows[0];
      const newColNames = currentCols.map((c, idx) => {
        const val = firstRow[c.name];
        return val ? String(val).trim() : `Column${idx + 1}`;
      });

      const updatedRows = currentRows.slice(1).map((row) => {
        const newRow: Record<string, any> = {};
        currentCols.forEach((c, idx) => {
          newRow[newColNames[idx]] = row[c.name];
        });
        return newRow;
      });

      const newCols = newColNames.map((name) => {
        const colVals = updatedRows.map((r) => r[name]);
        return {
          name,
          originalName: name,
          dataType: detectColumnType(colVals),
          validCount: 0,
          emptyCount: 0,
          errorCount: 0,
        };
      });

      return { columns: newCols, rows: updatedRows };
    }

    case 'changed_type': {
      const { column, newType } = params;
      currentRows = currentRows.map((row, idx) => {
        if (targetRowIdx !== null && idx !== targetRowIdx) return row;
        const casted = castValueToType(row[column], newType, column);
        return { ...row, [column]: casted };
      });
      if (targetRowIdx === null) {
        currentCols = currentCols.map((c) =>
          c.name === column ? { ...c, dataType: newType } : c
        );
      }
      break;
    }

    case 'rename_column': {
      const { oldName, newName } = params;
      if (!oldName || !newName || oldName === newName) break;
      currentCols = currentCols.map((c) =>
        c.name === oldName ? { ...c, name: newName } : c
      );
      currentRows = currentRows.map((row) => {
        const newRow: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) {
          if (k === oldName) newRow[newName] = v;
          else newRow[k] = v;
        }
        return newRow;
      });
      break;
    }

    case 'remove_columns': {
      const targetCols: string[] = Array.isArray(params.columns) ? params.columns : [params.column];
      currentCols = currentCols.filter((c) => !targetCols.includes(c.name));
      currentRows = currentRows.map((row) => {
        const newRow = { ...row };
        targetCols.forEach((col) => delete newRow[col]);
        return newRow;
      });
      break;
    }

    case 'duplicate_column': {
      const { column, newColumnName } = params;
      const targetCol = currentCols.find((c) => c.name === column);
      if (!targetCol) break;
      const finalName = newColumnName || `${column} - Copy`;
      const colIndex = currentCols.findIndex((c) => c.name === column);
      const newColObj: CleaningColumn = {
        name: finalName,
        originalName: finalName,
        dataType: targetCol.dataType,
        validCount: 0,
        emptyCount: 0,
        errorCount: 0,
      };
      currentCols.splice(colIndex + 1, 0, newColObj);
      currentRows = currentRows.map((row) => ({
        ...row,
        [finalName]: row[column],
      }));
      break;
    }

    case 'move_column': {
      const { column, direction } = params;
      const idx = currentCols.findIndex((c) => c.name === column);
      if (idx === -1) break;
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx >= 0 && targetIdx < currentCols.length) {
        const item = currentCols.splice(idx, 1)[0];
        currentCols.splice(targetIdx, 0, item);
      }
      break;
    }

    case 'reorder_columns': {
      const { orderedColumns } = params as { orderedColumns: string[] };
      if (Array.isArray(orderedColumns)) {
        const colMap = new Map(currentCols.map((c) => [c.name, c]));
        const reordered: CleaningColumn[] = [];
        orderedColumns.forEach((cName) => {
          const found = colMap.get(cName);
          if (found) {
            reordered.push(found);
            colMap.delete(cName);
          }
        });
        // append any remaining
        colMap.forEach((c) => reordered.push(c));
        currentCols = reordered;
      }
      break;
    }

    case 'replace_values': {
      const { column, findValue, replaceValue, matchEntire } = params;
      const findStr = String(findValue ?? '');
      const repStr = replaceValue ?? '';

      currentRows = currentRows.map((row, idx) => {
        if (targetRowIdx !== null && idx !== targetRowIdx) return row;
        const raw = row[column];
        if (isCellError(raw)) return row;
        if (raw === null || raw === undefined) {
          if (findStr === '' || findStr.toLowerCase() === 'null') {
            return { ...row, [column]: repStr };
          }
          return row;
        }

        const rawStr = String(raw);
        if (matchEntire) {
          if (rawStr === findStr || (typeof raw === 'number' && Number(raw) === Number(findValue))) {
            return { ...row, [column]: repStr };
          }
        } else {
          if (rawStr.includes(findStr)) {
            const replaced = rawStr.split(findStr).join(repStr);
            return { ...row, [column]: replaced };
          }
        }
        return row;
      });
      break;
    }

    case 'replace_errors': {
      const { column, replaceValue } = params;
      currentRows = currentRows.map((row, idx) => {
        if (targetRowIdx !== null && idx !== targetRowIdx) return row;
        if (isCellError(row[column])) {
          return { ...row, [column]: replaceValue ?? null };
        }
        return row;
      });
      break;
    }

    case 'fill_down': {
      const { column } = params;
      if (targetRowIdx !== null) {
        if (targetRowIdx < currentRows.length) {
          const curVal = currentRows[targetRowIdx][column];
          if (curVal === null || curVal === undefined || curVal === '' || isCellError(curVal)) {
            for (let i = targetRowIdx - 1; i >= 0; i--) {
              const cand = currentRows[i][column];
              if (cand !== null && cand !== undefined && cand !== '' && !isCellError(cand)) {
                currentRows[targetRowIdx] = { ...currentRows[targetRowIdx], [column]: cand };
                break;
              }
            }
          }
        }
        break;
      }
      let lastVal: any = null;
      currentRows = currentRows.map((row) => {
        const val = row[column];
        if (val !== null && val !== undefined && val !== '' && !isCellError(val)) {
          lastVal = val;
          return row;
        }
        if (lastVal !== null) {
          return { ...row, [column]: lastVal };
        }
        return row;
      });
      break;
    }

    case 'fill_up': {
      const { column } = params;
      if (targetRowIdx !== null) {
        if (targetRowIdx < currentRows.length) {
          const curVal = currentRows[targetRowIdx][column];
          if (curVal === null || curVal === undefined || curVal === '' || isCellError(curVal)) {
            for (let i = targetRowIdx + 1; i < currentRows.length; i++) {
              const cand = currentRows[i][column];
              if (cand !== null && cand !== undefined && cand !== '' && !isCellError(cand)) {
                currentRows[targetRowIdx] = { ...currentRows[targetRowIdx], [column]: cand };
                break;
              }
            }
          }
        }
        break;
      }
      let nextVal: any = null;
      for (let i = currentRows.length - 1; i >= 0; i--) {
        const val = currentRows[i][column];
        if (val !== null && val !== undefined && val !== '' && !isCellError(val)) {
          nextVal = val;
        } else if (nextVal !== null) {
          currentRows[i][column] = nextVal;
        }
      }
      break;
    }

    case 'filter_rows': {
      const { column, operator, value, value2, selectedValues } = params;

      if (Array.isArray(selectedValues)) {
        const set = new Set(selectedValues.map((v) => String(v)));
        currentRows = currentRows.filter((r) => set.has(String(r[column] ?? '')));
        break;
      }

      currentRows = currentRows.filter((row) => {
        const cell = row[column];
        if (isCellError(cell)) return true;
        if (cell === null || cell === undefined) return operator === 'equals' && (value === null || value === '');

        const cellStr = String(cell).toLowerCase();
        const targetStr = String(value ?? '').toLowerCase();
        const cellNum = Number(cell);
        const targetNum = Number(value);

        switch (operator) {
          case 'equals':
            if (!isNaN(cellNum) && !isNaN(targetNum)) return cellNum === targetNum;
            return cellStr === targetStr;
          case 'not_equals':
            if (!isNaN(cellNum) && !isNaN(targetNum)) return cellNum !== targetNum;
            return cellStr !== targetStr;
          case 'contains':
            return cellStr.includes(targetStr);
          case 'not_contains':
            return !cellStr.includes(targetStr);
          case 'starts_with':
            return cellStr.startsWith(targetStr);
          case 'ends_with':
            return cellStr.endsWith(targetStr);
          case 'greater_than':
            return cellNum > targetNum;
          case 'greater_equal':
            return cellNum >= targetNum;
          case 'less_than':
            return cellNum < targetNum;
          case 'less_equal':
            return cellNum <= targetNum;
          case 'between': {
            const targetNum2 = Number(value2);
            return cellNum >= targetNum && cellNum <= targetNum2;
          }
          // Date Filters
          case 'before': {
            const cellDate = new Date(cell);
            const targetDate = new Date(value);
            return !isNaN(cellDate.getTime()) && !isNaN(targetDate.getTime()) && cellDate < targetDate;
          }
          case 'after': {
            const cellDate = new Date(cell);
            const targetDate = new Date(value);
            return !isNaN(cellDate.getTime()) && !isNaN(targetDate.getTime()) && cellDate > targetDate;
          }
          case 'date_between': {
            const cellDate = new Date(cell);
            const d1 = new Date(value);
            const d2 = new Date(value2);
            return !isNaN(cellDate.getTime()) && cellDate >= d1 && cellDate <= d2;
          }
          case 'this_year': {
            const cellDate = new Date(cell);
            return !isNaN(cellDate.getTime()) && cellDate.getFullYear() === new Date().getFullYear();
          }
          case 'this_month': {
            const cellDate = new Date(cell);
            const now = new Date();
            return !isNaN(cellDate.getTime()) && cellDate.getFullYear() === now.getFullYear() && cellDate.getMonth() === now.getMonth();
          }
          default:
            return true;
        }
      });
      break;
    }

    case 'remove_rows': {
      const { action, count, startRow, numToRemove, numToKeep, column } = params;
      switch (action) {
        case 'remove_top':
          currentRows = currentRows.slice(Math.max(0, count || 1));
          break;
        case 'remove_bottom':
          currentRows = currentRows.slice(0, Math.max(0, currentRows.length - (count || 1)));
          break;
        case 'remove_blank': {
          currentRows = currentRows.filter((row) => {
            const vals = column ? [row[column]] : Object.values(row);
            return !vals.every((v) => v === null || v === undefined || v === '');
          });
          break;
        }
        case 'remove_errors': {
          currentRows = currentRows.filter((row) => {
            if (column) return !isCellError(row[column]);
            return !Object.values(row).some(isCellError);
          });
          break;
        }
        case 'remove_alternate': {
          const first = Math.max(0, (startRow || 1) - 1);
          const rem = Math.max(1, numToRemove || 1);
          const keep = Math.max(1, numToKeep || 1);
          const result: Record<string, any>[] = [];
          for (let i = 0; i < currentRows.length; i++) {
            if (i < first) {
              result.push(currentRows[i]);
            } else {
              const cyclePos = (i - first) % (rem + keep);
              if (cyclePos >= rem) {
                result.push(currentRows[i]);
              }
            }
          }
          currentRows = result;
          break;
        }
        case 'remove_duplicates': {
          const keyCols: string[] = Array.isArray(params.columns) && params.columns.length > 0
            ? params.columns
            : currentCols.map((c) => c.name);
          const seen = new Set<string>();
          currentRows = currentRows.filter((row) => {
            const key = keyCols.map((c) => String(row[c] ?? '')).join('__|__');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          break;
        }
        case 'remove_indices': {
          const indexSet = new Set<number>(
            Array.isArray(params.rowIndices) ? params.rowIndices.filter((n: any) => typeof n === 'number') : []
          );
          currentRows = currentRows.filter((_, idx) => !indexSet.has(idx));
          break;
        }
      }
      break;
    }

    case 'keep_rows': {
      const { action, count, startRow } = params;
      switch (action) {
        case 'keep_top':
          currentRows = currentRows.slice(0, Math.max(0, count || 1));
          break;
        case 'keep_bottom':
          currentRows = currentRows.slice(Math.max(0, currentRows.length - (count || 1)));
          break;
        case 'keep_range': {
          const start = Math.max(0, (startRow || 1) - 1);
          const num = Math.max(0, count || 1);
          currentRows = currentRows.slice(start, start + num);
          break;
        }
        case 'keep_indices': {
          const indexSet = new Set<number>(
            Array.isArray(params.rowIndices) ? params.rowIndices.filter((n: any) => typeof n === 'number') : []
          );
          currentRows = currentRows.filter((_, idx) => indexSet.has(idx));
          break;
        }
      }
      break;
    }

    case 'sort': {
      const rules: { column: string; direction: 'asc' | 'desc' }[] = params.rules || [
        { column: params.column, direction: params.direction || 'asc' },
      ];

      currentRows = [...currentRows].sort((a, b) => {
        for (const rule of rules) {
          const valA = a[rule.column];
          const valB = b[rule.column];

          if (valA === valB) continue;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          let comp = 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            comp = valA - valB;
          } else {
            comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
          }

          if (comp !== 0) {
            return rule.direction === 'desc' ? -comp : comp;
          }
        }
        return 0;
      });
      break;
    }

    case 'text_transform': {
      const { column, action, prefix, suffix, count, start, length, delimiter } = params;
      currentRows = currentRows.map((row, idx) => {
        if (targetRowIdx !== null && idx !== targetRowIdx) return row;
        const val = row[column];
        if (val === null || val === undefined || isCellError(val)) return row;
        let str = String(val);

        switch (action) {
          case 'uppercase':
            str = str.toUpperCase();
            break;
          case 'lowercase':
            str = str.toLowerCase();
            break;
          case 'capitalize':
            str = str.replace(/\b\w/g, (char) => char.toUpperCase());
            break;
          case 'trim':
            str = str.trim();
            break;
          case 'clean':
            str = str.replace(/[\x00-\x1F\x7F]/g, '');
            break;
          case 'prefix':
            str = `${prefix ?? ''}${str}`;
            break;
          case 'suffix':
            str = `${str}${suffix ?? ''}`;
            break;
          case 'extract_first':
            str = str.slice(0, Math.max(0, count || 1));
            break;
          case 'extract_last':
            str = str.slice(-Math.max(0, count || 1));
            break;
          case 'extract_range':
            str = str.substr(Math.max(0, (start || 1) - 1), Math.max(0, length || 1));
            break;
          case 'extract_before_delimiter':
            if (delimiter && str.includes(delimiter)) {
              str = str.split(delimiter)[0];
            }
            break;
          case 'extract_after_delimiter':
            if (delimiter && str.includes(delimiter)) {
              const parts = str.split(delimiter);
              str = parts.slice(1).join(delimiter);
            }
            break;
        }
        return { ...row, [column]: str };
      });
      break;
    }

    case 'number_transform': {
      const { column, action, value, decimals } = params;
      currentRows = currentRows.map((row, idx) => {
        if (targetRowIdx !== null && idx !== targetRowIdx) return row;
        const raw = row[column];
        if (raw === null || raw === undefined || isCellError(raw)) return row;
        const num = Number(raw);
        if (isNaN(num)) return row;

        let res = num;
        switch (action) {
          case 'abs':
            res = Math.abs(num);
            break;
          case 'round': {
            const factor = Math.pow(10, decimals ?? 0);
            res = Math.round(num * factor) / factor;
            break;
          }
          case 'round_up':
            res = Math.ceil(num);
            break;
          case 'round_down':
            res = Math.floor(num);
            break;
          case 'add':
            res = num + Number(value || 0);
            break;
          case 'subtract':
            res = num - Number(value || 0);
            break;
          case 'multiply':
            res = num * Number(value || 1);
            break;
          case 'divide': {
            const divisor = Number(value);
            if (divisor === 0) {
              return {
                ...row,
                [column]: {
                  __isError: true,
                  rawValue: raw,
                  message: 'Division by zero',
                } as CellError,
              };
            }
            res = num / divisor;
            break;
          }
          case 'percentage':
            res = (num * Number(value || 100)) / 100;
            break;
          case 'modulo':
            res = num % Number(value || 1);
            break;
        }
        return { ...row, [column]: res };
      });
      break;
    }

    case 'date_transform': {
      const { column, action } = params;
      currentRows = currentRows.map((row, idx) => {
        if (targetRowIdx !== null && idx !== targetRowIdx) return row;
        const raw = row[column];
        if (raw === null || raw === undefined || isCellError(raw)) return row;
        const d = new Date(raw);
        if (isNaN(d.getTime())) return row;

        let res: any = raw;
        switch (action) {
          case 'year':
            res = d.getFullYear();
            break;
          case 'quarter':
            res = `Q${Math.floor(d.getMonth() / 3) + 1}`;
            break;
          case 'month':
            res = d.getMonth() + 1;
            break;
          case 'month_name':
            res = d.toLocaleString('default', { month: 'long' });
            break;
          case 'week': {
            const oneJan = new Date(d.getFullYear(), 0, 1);
            const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
            res = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
            break;
          }
          case 'day':
            res = d.getDate();
            break;
          case 'day_name':
            res = d.toLocaleString('default', { weekday: 'long' });
            break;
          case 'start_of_year':
            res = `${d.getFullYear()}-01-01`;
            break;
          case 'end_of_year':
            res = `${d.getFullYear()}-12-31`;
            break;
          case 'start_of_month': {
            const monthStr = String(d.getMonth() + 1).padStart(2, '0');
            res = `${d.getFullYear()}-${monthStr}-01`;
            break;
          }
          case 'end_of_month': {
            const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const monthStr = String(d.getMonth() + 1).padStart(2, '0');
            res = `${d.getFullYear()}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
            break;
          }
          case 'start_of_quarter': {
            const qStartMonth = Math.floor(d.getMonth() / 3) * 3 + 1;
            res = `${d.getFullYear()}-${String(qStartMonth).padStart(2, '0')}-01`;
            break;
          }
          case 'end_of_quarter': {
            const qEndMonth = Math.floor(d.getMonth() / 3) * 3 + 3;
            const lastDay = new Date(d.getFullYear(), qEndMonth, 0).getDate();
            res = `${d.getFullYear()}-${String(qEndMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            break;
          }
        }
        return { ...row, [column]: res };
      });
      break;
    }

    case 'split_column': {
      const { column, mode, delimiter, at, numberOfColumns, charCount, positions } = params;
      const targetColIdx = currentCols.findIndex((c) => c.name === column);
      if (targetColIdx === -1) break;

      // Determine split logic
      const splitRowValue = (val: any): string[] => {
        if (val === null || val === undefined) return ['', ''];
        const str = String(val);

        if (mode === 'characters') {
          const n = Math.max(1, charCount || 1);
          return [str.slice(0, n), str.slice(n)];
        }

        if (mode === 'positions') {
          const posList = String(positions || '5')
            .split(',')
            .map((p) => parseInt(p.trim(), 10))
            .filter((p) => !isNaN(p) && p > 0);
          if (posList.length === 0) return [str];
          const parts: string[] = [];
          let last = 0;
          for (const pos of posList) {
            parts.push(str.slice(last, pos));
            last = pos;
          }
          parts.push(str.slice(last));
          return parts;
        }

        // By delimiter
        const delim = delimiter === '\\t' ? '\t' : (delimiter || ' ');
        if (!str.includes(delim)) return [str, ''];

        if (at === 'leftmost') {
          const idx = str.indexOf(delim);
          return [str.slice(0, idx), str.slice(idx + delim.length)];
        }
        if (at === 'rightmost') {
          const idx = str.lastIndexOf(delim);
          return [str.slice(0, idx), str.slice(idx + delim.length)];
        }

        // Every delimiter
        const splits = str.split(delim);
        if (numberOfColumns && numberOfColumns > 0) {
          const result = splits.slice(0, numberOfColumns - 1);
          result.push(splits.slice(numberOfColumns - 1).join(delim));
          return result;
        }
        return splits;
      };

      // Determine maximum parts across sample
      let maxParts = 2;
      for (const row of currentRows.slice(0, 50)) {
        const parts = splitRowValue(row[column]);
        if (parts.length > maxParts) maxParts = parts.length;
      }
      if (numberOfColumns) maxParts = Math.max(maxParts, numberOfColumns);

      const newColNames: string[] = [];
      for (let i = 1; i <= maxParts; i++) {
        let proposed = `${column}.${i}`;
        let counter = 1;
        while (currentCols.some((c) => c.name === proposed)) {
          proposed = `${column}.${i}_${counter++}`;
        }
        newColNames.push(proposed);
      }

      const newColsToAdd = newColNames.map((name) => ({
        name,
        originalName: name,
        dataType: 'Text' as ColumnDataType,
        validCount: 0,
        emptyCount: 0,
        errorCount: 0,
      }));

      // Replace original column with split columns
      currentCols.splice(targetColIdx, 1, ...newColsToAdd);

      currentRows = currentRows.map((row) => {
        const parts = splitRowValue(row[column]);
        const newRow = { ...row };
        delete newRow[column];
        newColNames.forEach((n, idx) => {
          newRow[n] = parts[idx] ?? '';
        });
        return newRow;
      });
      break;
    }

    case 'merge_columns': {
      const { columns: colsToMerge, separator, newColumnName } = params;
      if (!Array.isArray(colsToMerge) || colsToMerge.length < 2) break;
      const targetName = newColumnName || 'Merged';

      const sep = separator === 'custom' ? (params.customSeparator ?? '') : separator ?? ' ';

      const firstColIdx = currentCols.findIndex((c) => colsToMerge.includes(c.name));

      currentRows = currentRows.map((row) => {
        const mergedVal = colsToMerge
          .map((c) => (row[c] !== null && row[c] !== undefined ? String(row[c]) : ''))
          .filter((v) => v !== '')
          .join(sep);
        const newRow = { ...row, [targetName]: mergedVal };
        // If user chose to remove merged columns
        if (params.removeOriginal) {
          colsToMerge.forEach((c) => delete newRow[c]);
        }
        return newRow;
      });

      if (params.removeOriginal) {
        currentCols = currentCols.filter((c) => !colsToMerge.includes(c.name));
      }

      const newMergedCol: CleaningColumn = {
        name: targetName,
        originalName: targetName,
        dataType: 'Text',
        validCount: 0,
        emptyCount: 0,
        errorCount: 0,
      };

      if (firstColIdx !== -1 && params.removeOriginal) {
        currentCols.splice(firstColIdx, 0, newMergedCol);
      } else {
        currentCols.push(newMergedCol);
      }
      break;
    }

    case 'remove_duplicates': {
      const keyCols: string[] = Array.isArray(params.columns) && params.columns.length > 0
        ? params.columns
        : currentCols.map((c) => c.name);

      const seen = new Set<string>();
      currentRows = currentRows.filter((row) => {
        const key = keyCols.map((c) => String(row[c] ?? '')).join('__|__');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      break;
    }

    case 'replace_nulls': {
      const { column, action, customValue } = params;

      if (action === 'fill_down') {
        if (targetRowIdx !== null) {
          if (targetRowIdx < currentRows.length) {
            const curVal = currentRows[targetRowIdx][column];
            if (curVal === null || curVal === undefined || curVal === '') {
              for (let i = targetRowIdx - 1; i >= 0; i--) {
                const cand = currentRows[i][column];
                if (cand !== null && cand !== undefined && cand !== '' && !isCellError(cand)) {
                  currentRows[targetRowIdx] = { ...currentRows[targetRowIdx], [column]: cand };
                  break;
                }
              }
            }
          }
        } else {
          let lastVal: any = null;
          currentRows = currentRows.map((row) => {
            const val = row[column];
            if (val !== null && val !== undefined && val !== '' && !isCellError(val)) {
              lastVal = val;
              return row;
            }
            return lastVal !== null ? { ...row, [column]: lastVal } : row;
          });
        }
        break;
      }

      if (action === 'fill_up') {
        if (targetRowIdx !== null) {
          if (targetRowIdx < currentRows.length) {
            const curVal = currentRows[targetRowIdx][column];
            if (curVal === null || curVal === undefined || curVal === '') {
              for (let i = targetRowIdx + 1; i < currentRows.length; i++) {
                const cand = currentRows[i][column];
                if (cand !== null && cand !== undefined && cand !== '' && !isCellError(cand)) {
                  currentRows[targetRowIdx] = { ...currentRows[targetRowIdx], [column]: cand };
                  break;
                }
              }
            }
          }
        } else {
          let nextVal: any = null;
          for (let i = currentRows.length - 1; i >= 0; i--) {
            const val = currentRows[i][column];
            if (val !== null && val !== undefined && val !== '' && !isCellError(val)) {
              nextVal = val;
            } else if (nextVal !== null) {
              currentRows[i] = { ...currentRows[i], [column]: nextVal };
            }
          }
        }
        break;
      }

      // Pre-calculate stats if needed
      let numericStats = { sum: 0, count: 0, min: Infinity, max: -Infinity, median: 0 };
      if (['replace_avg', 'replace_median', 'replace_min', 'replace_max'].includes(action)) {
        const nums = currentRows
          .map((r) => r[column])
          .filter((v) => typeof v === 'number' && !isNaN(v)) as number[];

        if (nums.length > 0) {
          numericStats.count = nums.length;
          numericStats.sum = nums.reduce((a, b) => a + b, 0);
          numericStats.min = Math.min(...nums);
          numericStats.max = Math.max(...nums);
          const sorted = [...nums].sort((a, b) => a - b);
          numericStats.median = sorted[Math.floor(sorted.length / 2)];
        }
      }

      currentRows = currentRows.map((row, idx) => {
        if (targetRowIdx !== null && idx !== targetRowIdx) return row;
        const val = row[column];
        if (val !== null && val !== undefined && val !== '') return row;

        let rep: any = null;
        switch (action) {
          case 'replace_zero':
            rep = 0;
            break;
          case 'replace_value':
            rep = customValue ?? '';
            break;
          case 'replace_avg':
            rep = numericStats.count > 0 ? Math.round((numericStats.sum / numericStats.count) * 100) / 100 : 0;
            break;
          case 'replace_median':
            rep = numericStats.median;
            break;
          case 'replace_min':
            rep = numericStats.min !== Infinity ? numericStats.min : 0;
            break;
          case 'replace_max':
            rep = numericStats.max !== -Infinity ? numericStats.max : 0;
            break;
        }

        return { ...row, [column]: rep };
      });
      break;
    }

    case 'add_custom_column': {
      const { newColumnName, formulaType, col1, col2, operator, constantValue } = params;
      const targetName = newColumnName || 'Custom';

      currentRows = currentRows.map((row) => {
        let val: any = null;
        if (formulaType === 'math') {
          const v1 = Number(row[col1] ?? 0);
          const v2 = col2 ? Number(row[col2] ?? 0) : Number(constantValue ?? 0);
          switch (operator) {
            case '+': val = v1 + v2; break;
            case '-': val = v1 - v2; break;
            case '*': val = v1 * v2; break;
            case '/': val = v2 !== 0 ? v1 / v2 : null; break;
          }
        } else if (formulaType === 'concat') {
          val = `${row[col1] ?? ''} ${row[col2] ?? ''}`.trim();
        }
        return { ...row, [targetName]: val };
      });

      currentCols.push({
        name: targetName,
        originalName: targetName,
        dataType: formulaType === 'math' ? 'Decimal Number' : 'Text',
        validCount: 0,
        emptyCount: 0,
        errorCount: 0,
      });
      break;
    }
  }

  // Recalculate column quality
  const typeMap: Record<string, ColumnDataType> = {};
  currentCols.forEach((c) => (typeMap[c.name] = c.dataType));
  const qualityCols = computeColumnQuality(
    currentCols.map((c) => c.name),
    currentRows,
    typeMap
  );

  return {
    columns: qualityCols,
    rows: currentRows,
  };
}

// Evaluate entire pipeline up to selected step index
export function evaluatePipeline(
  rawRows: Record<string, any>[],
  steps: DataCleaningStep[],
  targetStepId?: string
): StepEvaluationResult {
  if (!rawRows || rawRows.length === 0) {
    return {
      columns: [],
      rows: [],
      totalErrors: 0,
      totalEmpty: 0,
      totalRows: 0,
      totalColumns: 0,
    };
  }

  // Initialize Source state
  const firstRow = rawRows[0] || {};
  const rawColNames = Object.keys(firstRow);

  const initialTypes: Record<string, ColumnDataType> = {};
  rawColNames.forEach((col) => {
    const vals = rawRows.map((r) => r[col]);
    initialTypes[col] = detectColumnType(vals);
  });

  let currentState: { columns: CleaningColumn[]; rows: Record<string, any>[] } = {
    columns: computeColumnQuality(rawColNames, rawRows, initialTypes),
    rows: rawRows.map((r) => ({ ...r })),
  };

  // Find target step cutoff
  const targetIndex = targetStepId
    ? steps.findIndex((s) => s.id === targetStepId)
    : steps.length - 1;

  const stepsToRun = targetIndex >= 0 ? steps.slice(0, targetIndex + 1) : steps;

  for (const step of stepsToRun) {
    currentState = executeStep(currentState, step);
  }

  let totalErrors = 0;
  let totalEmpty = 0;
  currentState.columns.forEach((c) => {
    totalErrors += c.errorCount;
    totalEmpty += c.emptyCount;
  });

  return {
    columns: currentState.columns,
    rows: currentState.rows,
    totalErrors,
    totalEmpty,
    totalRows: currentState.rows.length,
    totalColumns: currentState.columns.length,
  };
}

export interface StepTraceEntry {
  stepId: string;
  rows: number;
  columns: number;
  errors: number;
  empty: number;
}

/**
 * Runs the pipeline ONCE and records the size/quality after every step (evaluatePipeline per step would be
 * quadratic). Used by the Data Lab pipeline rail to show what each step did to the data.
 */
export function tracePipeline(rawRows: Record<string, any>[], steps: DataCleaningStep[]): StepTraceEntry[] {
  if (!rawRows || rawRows.length === 0) {
    return steps.map((s) => ({ stepId: s.id, rows: 0, columns: 0, errors: 0, empty: 0 }));
  }
  const rawColNames = Object.keys(rawRows[0] || {});
  const initialTypes: Record<string, ColumnDataType> = {};
  rawColNames.forEach((col) => {
    initialTypes[col] = detectColumnType(rawRows.map((r) => r[col]));
  });
  let state: { columns: CleaningColumn[]; rows: Record<string, any>[] } = {
    columns: computeColumnQuality(rawColNames, rawRows, initialTypes),
    rows: rawRows.map((r) => ({ ...r })),
  };
  const out: StepTraceEntry[] = [];
  for (const step of steps) {
    state = executeStep(state, step);
    let errors = 0;
    let empty = 0;
    state.columns.forEach((c) => {
      errors += c.errorCount;
      empty += c.emptyCount;
    });
    out.push({ stepId: step.id, rows: state.rows.length, columns: state.columns.length, errors, empty });
  }
  return out;
}

// Generate Explore the data formula for a step
export function generateMFormula(step: DataCleaningStep, prevStepName = 'Source'): string {
  const sanitizeName = (n: string) => (n.includes(' ') ? `#"${n}"` : n);
  const prevRef = sanitizeName(prevStepName);
  const rowSuffix =
    typeof step.params?.targetRowIndex === 'number'
      ? ` /* Row ${step.params.targetRowIndex + 1} only */`
      : '';

  switch (step.type) {
    case 'source':
      return '= Csv.Document(File.Contents("C:\\Data\\Dataset.csv"), [Delimiter=",", Columns=Auto, Encoding=65001, QuoteStyle=QuoteStyle.None])';

    case 'edit_cell': {
      const rowNum = typeof step.params?.targetRowIndex === 'number' ? step.params.targetRowIndex + 1 : 1;
      const col = step.params?.column ?? '';
      const rawVal = step.params?.value;
      const formattedVal = rawVal === null || rawVal === undefined ? 'null' : JSON.stringify(rawVal);
      return `= Table.ReplaceValueAt(${prevRef}, ${rowNum}, "${col}", ${formattedVal})`;
    }

    case 'promoted_headers':
      return `= Table.PromoteHeaders(${prevRef}, [PromoteAllScalars=true])`;

    case 'changed_type': {
      const typeMap: Record<ColumnDataType, string> = {
        'Text': 'type text',
        'Whole Number': 'Int64.Type',
        'Decimal Number': 'type number',
        'Percentage': 'Percentage.Type',
        'Currency': 'Currency.Type',
        'Date': 'type date',
        'Date/Time': 'type datetime',
        'Time': 'type time',
        'Boolean': 'type logical',
      };
      const mType = typeMap[step.params.newType as ColumnDataType] || 'type text';
      return `= Table.TransformColumnTypes(${prevRef}, {{"${step.params.column}", ${mType}}})${rowSuffix}`;
    }

    case 'rename_column':
      return `= Table.RenameColumns(${prevRef}, {{"${step.params.oldName}", "${step.params.newName}"}})`;

    case 'remove_columns': {
      const cols = Array.isArray(step.params.columns) ? step.params.columns : [step.params.column];
      return `= Table.RemoveColumns(${prevRef}, {${cols.map((c: string) => `"${c}"`).join(', ')}})`;
    }

    case 'duplicate_column':
      return `= Table.DuplicateColumn(${prevRef}, "${step.params.column}", "${step.params.newColumnName || `${step.params.column} - Copy`}")`;

    case 'reorder_columns':
      return `= Table.ReorderColumns(${prevRef}, {${(step.params.orderedColumns || []).map((c: string) => `"${c}"`).join(', ')}})`;

    case 'replace_values':
      return `= Table.ReplaceValue(${prevRef}, "${step.params.findValue}", "${step.params.replaceValue}", Replacer.ReplaceText, {"${step.params.column}"})${rowSuffix}`;

    case 'replace_errors':
      return `= Table.ReplaceErrorValues(${prevRef}, {{"${step.params.column}", "${step.params.replaceValue ?? ''}"}})${rowSuffix}`;

    case 'replace_nulls':
      return `= Table.ReplaceValue(${prevRef}, null, ${JSON.stringify(step.params.customValue ?? 0)}, Replacer.ReplaceValue, {"${step.params.column}"})${rowSuffix}`;

    case 'fill_down':
      return `= Table.FillDown(${prevRef}, {"${step.params.column}"})${rowSuffix}`;

    case 'fill_up':
      return `= Table.FillUp(${prevRef}, {"${step.params.column}"})${rowSuffix}`;

    case 'filter_rows':
      return `= Table.SelectRows(${prevRef}, each [${step.params.column}] ${step.params.operator === 'equals' ? '=' : '<>'} "${step.params.value}")`;

    case 'remove_rows':
      if (step.params.action === 'remove_top') {
        return `= Table.Skip(${prevRef}, ${step.params.count || 1})`;
      }
      if (step.params.action === 'remove_bottom') {
        return `= Table.RemoveLastN(${prevRef}, ${step.params.count || 1})`;
      }
      if (step.params.action === 'remove_duplicates') {
        return `= Table.Distinct(${prevRef}, {${(step.params.columns || []).map((c: string) => `"${c}"`).join(', ')}})`;
      }
      if (step.params.action === 'remove_indices') {
        const indices: number[] = Array.isArray(step.params.rowIndices) ? step.params.rowIndices : [];
        return `= Table.RemoveRows(${prevRef}, {${indices.map((i) => i + 1).join(', ')}})`;
      }
      return `= Table.SelectRows(${prevRef}, each true)`;

    case 'keep_rows':
      if (step.params.action === 'keep_top') {
        return `= Table.FirstN(${prevRef}, ${step.params.count || 10})`;
      }
      if (step.params.action === 'keep_bottom') {
        return `= Table.LastN(${prevRef}, ${step.params.count || 10})`;
      }
      if (step.params.action === 'keep_indices') {
        const indices: number[] = Array.isArray(step.params.rowIndices) ? step.params.rowIndices : [];
        return `= Table.SelectRowsByIndex(${prevRef}, {${indices.map((i) => i + 1).join(', ')}})`;
      }
      return `= Table.Range(${prevRef}, ${step.params.startRow || 0}, ${step.params.count || 10})`;

    case 'sort': {
      const order = step.params.direction === 'desc' ? 'Order.Descending' : 'Order.Ascending';
      return `= Table.Sort(${prevRef}, {{"${step.params.column}", ${order}}})`;
    }

    case 'text_transform':
      return `= Table.TransformColumns(${prevRef}, {{"${step.params.column}", Text.${step.params.action === 'uppercase' ? 'Upper' : 'Lower'}, type text}})${rowSuffix}`;

    case 'number_transform':
      return `= Table.TransformColumns(${prevRef}, {{"${step.params.column}", each _ ${step.params.action === 'add' ? '+' : '*'} ${step.params.value || 1}, type number}})${rowSuffix}`;

    case 'date_transform':
      return `= Table.TransformColumns(${prevRef}, {{"${step.params.column}", Date.${step.params.action === 'year' ? 'Year' : 'Month'}, Int64.Type}})${rowSuffix}`;

    case 'split_column':
      return `= Table.SplitColumn(${prevRef}, "${step.params.column}", Splitter.SplitTextByDelimiter("${step.params.delimiter || ' '}", QuoteStyle.Csv), {"${step.params.column}.1", "${step.params.column}.2"})`;

    case 'merge_columns':
      return `= Table.CombineColumns(${prevRef}, {${(step.params.columns || []).map((c: string) => `"${c}"`).join(', ')}}, Combiner.CombineTextByDelimiter("${step.params.separator || ' '}", QuoteStyle.None), "${step.params.newColumnName || 'Merged'}")`;

    case 'remove_duplicates':
      return `= Table.Distinct(${prevRef}, {${(step.params.columns || []).map((c: string) => `"${c}"`).join(', ')}})`;

    default:
      return `= Table.SelectRows(${prevRef}, each true)`;
  }
}

// Zero sample datasets: The application strictly operates on user data.
export const RAW_SAMPLE_DATASET: Record<string, any>[] = [];

