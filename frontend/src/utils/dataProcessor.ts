import { Dataset, AggregationMethod, NumberFormatType, DataFilter } from '../types/dashboard';

export interface ProcessedDataPoint {
  x: string | number;
  y: number;
  z?: number;
  secondary?: number;
  originalGroup?: any[];
  formattedY: string;
}

function toFiniteNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function applyFilters(
  rows: Record<string, any>[],
  filters?: DataFilter[]
): Record<string, any>[] {
  if (!rows || rows.length === 0 || !filters || filters.length === 0) {
    return rows || [];
  }

  const active = filters.filter((f) => {
    if (!f || !f.column) return false;
    const hasValues = Array.isArray(f.values) && f.values.length > 0;
    const hasMin = typeof f.min === 'number' && Number.isFinite(f.min);
    const hasMax = typeof f.max === 'number' && Number.isFinite(f.max);
    return hasValues || hasMin || hasMax;
  });

  if (active.length === 0) return rows;

  return rows.filter((row) =>
    active.every((f) => {
      const rawVal = row[f.column];
      const rowNum = toFiniteNum(rawVal);

      if (Array.isArray(f.values) && f.values.length > 0) {
        const rowStr = String(rawVal ?? '').trim().toLowerCase();
        const matched = f.values.some((target) => {
          const targetNum = toFiniteNum(target);
          if (rowNum !== null && targetNum !== null) return rowNum === targetNum;
          return rowStr === String(target ?? '').trim().toLowerCase();
        });
        if (!matched) return false;
      }

      const hasMin = typeof f.min === 'number' && Number.isFinite(f.min);
      const hasMax = typeof f.max === 'number' && Number.isFinite(f.max);
      if (hasMin || hasMax) {
        if (rowNum === null) return false;
        if (hasMin && rowNum < f.min!) return false;
        if (hasMax && rowNum > f.max!) return false;
      }

      return true;
    })
  );
}

export function formatNumber(
  value: number,
  format: NumberFormatType = 'number',
  symbol: string = '$'
): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  const num = Number(value) || 0;

  switch (format) {
    case 'currency':
      if (Math.abs(num) >= 1_000_000) {
        return `${symbol}${(num / 1_000_000).toFixed(2)}M`;
      }
      if (Math.abs(num) >= 1_000) {
        return `${symbol}${(num / 1_000).toFixed(1)}K`;
      }
      return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

    case 'percentage':
      return `${num.toFixed(1)}%`;

    case 'compact':
      if (Math.abs(num) >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(2)}B`;
      }
      if (Math.abs(num) >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(2)}M`;
      }
      if (Math.abs(num) >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`;
      }
      return num.toFixed(1);

    case 'number':
    default:
      if (Number.isInteger(num)) {
        return num.toLocaleString();
      }
      return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}

export function aggregateValues(values: number[], method: AggregationMethod): number {
  if (!values || values.length === 0) return 0;
  const valid = values.filter((v) => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return 0;

  switch (method) {
    case 'sum':
      return valid.reduce((acc, curr) => acc + curr, 0);
    case 'avg':
      return valid.reduce((acc, curr) => acc + curr, 0) / valid.length;
    case 'count':
      return valid.length;
    case 'min':
      return Math.min(...valid);
    case 'max':
      return Math.max(...valid);
    case 'none':
    default:
      return valid[0] ?? 0;
  }
}

export function processWidgetData(
  dataset: Dataset | undefined,
  xAxisField: string,
  yAxisField: string,
  aggregation: AggregationMethod = 'sum',
  zAxisField?: string,
  secondaryField?: string,
  format: NumberFormatType = 'number',
  currencySymbol: string = '$',
  globalFilters?: DataFilter[]
): ProcessedDataPoint[] {
  const rawRows = dataset?.cleanedData && dataset.cleanedData.length > 0 ? dataset.cleanedData : dataset?.data;
  if (!rawRows || rawRows.length === 0) {
    return [];
  }

  const applicableGlobal = (globalFilters || []).filter(
    (f) => !f.datasetId || f.datasetId === dataset?.id
  );
  const filteredRows = applicableGlobal.length > 0 ? applyFilters(rawRows, applicableGlobal) : rawRows;

  if (filteredRows.length === 0) {
    return [];
  }

  // If aggregation is 'none', map row by row directly
  if (aggregation === 'none') {
    return filteredRows.map((row) => {
      const xVal = row[xAxisField] ?? 'Unspecified';
      const rawY = parseFloat(row[yAxisField]);
      const yVal = isNaN(rawY) ? 0 : rawY;
      const rawZ = zAxisField ? parseFloat(row[zAxisField]) : undefined;
      const rawSec = secondaryField ? parseFloat(row[secondaryField]) : undefined;

      return {
        x: xVal,
        y: yVal,
        z: rawZ !== undefined && !isNaN(rawZ) ? rawZ : undefined,
        secondary: rawSec !== undefined && !isNaN(rawSec) ? rawSec : undefined,
        formattedY: formatNumber(yVal, format, currencySymbol),
      };
    });
  }

  // Otherwise, group by X-axis category
  const groups = new Map<string, { yVals: number[]; zVals: number[]; secVals: number[]; rows: any[] }>();

  filteredRows.forEach((row) => {
    const key = String(row[xAxisField] ?? 'Unspecified');
    if (!groups.has(key)) {
      groups.set(key, { yVals: [], zVals: [], secVals: [], rows: [] });
    }
    const grp = groups.get(key)!;
    grp.rows.push(row);

    const yNum = parseFloat(row[yAxisField]);
    if (!isNaN(yNum)) grp.yVals.push(yNum);

    if (zAxisField) {
      const zNum = parseFloat(row[zAxisField]);
      if (!isNaN(zNum)) grp.zVals.push(zNum);
    }

    if (secondaryField) {
      const secNum = parseFloat(row[secondaryField]);
      if (!isNaN(secNum)) grp.secVals.push(secNum);
    }
  });

  const result: ProcessedDataPoint[] = [];

  groups.forEach((grp, key) => {
    const aggregatedY = aggregateValues(grp.yVals, aggregation);
    const aggregatedZ = zAxisField ? aggregateValues(grp.zVals, aggregation) : undefined;
    const aggregatedSec = secondaryField ? aggregateValues(grp.secVals, aggregation) : undefined;

    result.push({
      x: key,
      y: aggregatedY,
      z: aggregatedZ,
      secondary: aggregatedSec,
      originalGroup: grp.rows,
      formattedY: formatNumber(aggregatedY, format, currencySymbol),
    });
  });

  return result;
}

export function calculateSummaryMetrics(data: ProcessedDataPoint[]) {
  if (!data || data.length === 0) {
    return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
  }
  const yValues = data.map((d) => d.y);
  const sum = yValues.reduce((acc, c) => acc + c, 0);
  const avg = sum / yValues.length;
  const min = Math.min(...yValues);
  const max = Math.max(...yValues);

  return { sum, avg, min, max, count: data.length };
}
