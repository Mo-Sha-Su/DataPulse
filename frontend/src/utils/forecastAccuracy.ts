import { Dataset } from '../types/dashboard';
import { ForecastAggregation, ForecastConfiguration, ForecastResultRecord } from '../types/forecast';

export interface ForecastVsActualComparison {
  date: string;
  predicted: number;
  actual: number;
  lower80: number;
  upper80: number;
  in80: boolean;
  errorPct: number | null;
}

export interface ForecastVsActualSummary {
  matchedPeriods: number;
  meanAbsPctError: number | null;
  meanAbsError: number;
  within80Count: number;
  within80All: boolean;
  within80RatePct: number;
  comparisons: ForecastVsActualComparison[];
}

export function parseFlexibleNumeric(raw: unknown): number | null {
  if (raw === null || raw === undefined || typeof raw === 'boolean') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  let s = String(raw).trim();
  if (!s || /^(null|nan|none|n\/a|na|-|—|--)$/i.test(s)) return null;
  s = s.replace(/\u2212/g, '-');
  const isNegParens = s.startsWith('(') && s.endsWith(')');
  if (isNegParens) s = s.slice(1, -1).trim();
  const cleaned = s.replace(/[,$€£¥₹\s%]/g, '');
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return isNegParens ? -Math.abs(n) : n;
}

export function parseFlexibleDateIso(raw: unknown): string | null {
  if (raw === null || raw === undefined || typeof raw === 'boolean') return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  if (!s) return null;

  // Quarter notation 2025-Q1 or Q1 2025
  const q1 = s.match(/^(\d{4})[-/ ]?Q([1-4])$/i);
  if (q1) {
    const yr = Number(q1[1]);
    const mo = (Number(q1[2]) - 1) * 3 + 1;
    return `${yr}-${String(mo).padStart(2, '0')}-01`;
  }
  const q2 = s.match(/^Q([1-4])[-/ ]?(\d{4})$/i);
  if (q2) {
    const mo = (Number(q2[1]) - 1) * 3 + 1;
    const yr = Number(q2[2]);
    return `${yr}-${String(mo).padStart(2, '0')}-01`;
  }

  // Exact YYYY-MM-DD prefix avoids timezone shifts
  const isoPrefix = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];

  const parsed = Date.parse(s);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

function getQuarterKey(isoDate: string): string {
  const year = isoDate.slice(0, 4);
  const month = Number(isoDate.slice(5, 7));
  const q = Math.floor((month - 1) / 3) + 1;
  return `${year}-Q${q}`;
}

function addDaysIso(isoDate: string, days: number): string {
  const dt = new Date(`${isoDate}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function aggregateValues(vals: number[], agg: ForecastAggregation): number {
  if (vals.length === 0) return 0;
  switch (agg) {
    case 'avg':
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    case 'count':
      return vals.length;
    case 'min':
      return Math.min(...vals);
    case 'max':
      return Math.max(...vals);
    case 'sum':
    default:
      return vals.reduce((a, b) => a + b, 0);
  }
}

/**
 * Compares new dataset observations arriving after `result.summary.lastActualDate`
 * against the saved forecast's predicted points & 80% intervals.
 */
export function evaluateForecastVsActual(
  dataset: Dataset | null,
  result: ForecastResultRecord | null,
  config: ForecastConfiguration,
): ForecastVsActualSummary | null {
  if (!dataset || !result || !result.predictedData?.length) return null;
  const lastActualDate =
    result.summary?.lastActualDate ||
    result.trainingPeriod?.end ||
    result.modelMetadata?.trainingPeriod?.end;
  if (!lastActualDate) return null;

  const evalCfg = result.modelMetadata?.evaluatedConfiguration;
  const dateCol = evalCfg?.dateColumn || config.dateColumn;
  const targetCol = evalCfg?.targetColumn || config.targetColumn;
  const agg = (evalCfg?.aggregation || config.aggregation || 'sum') as ForecastAggregation;
  const groupCol = evalCfg?.groupColumn ?? config.groupColumn ?? null;
  const groupVal = evalCfg?.groupValue ?? config.groupValue ?? null;

  if (!dateCol || !targetCol) return null;

  const rows = Array.isArray(dataset.cleanedData) ? dataset.cleanedData : dataset.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const filteredRows =
    groupCol && groupVal && groupVal !== '__ALL__'
      ? rows.filter((r) => String(r?.[groupCol] ?? '').trim() === groupVal)
      : rows;

  const parsedEntries: Array<{ iso: string; val: number }> = [];
  for (const row of filteredRows) {
    if (!row || typeof row !== 'object') continue;
    const iso = parseFlexibleDateIso(row[dateCol]);
    if (!iso || iso <= lastActualDate) continue;
    const val = agg === 'count' ? (row[targetCol] !== null && row[targetCol] !== undefined ? 1 : null) : parseFlexibleNumeric(row[targetCol]);
    if (val === null) continue;
    parsedEntries.push({ iso, val });
  }

  if (parsedEntries.length === 0) return null;

  const freq = result.frequency;
  const comparisons: ForecastVsActualComparison[] = [];

  for (const pt of result.predictedData) {
    if (!pt?.date || pt.date <= lastActualDate) continue;

    let bucketVals: number[] = [];
    if (freq === 'daily') {
      bucketVals = parsedEntries.filter((e) => e.iso === pt.date).map((e) => e.val);
    } else if (freq === 'weekly') {
      const weekEnd = addDaysIso(pt.date, 7);
      bucketVals = parsedEntries.filter((e) => e.iso >= pt.date && e.iso < weekEnd).map((e) => e.val);
    } else if (freq === 'monthly') {
      const ym = pt.date.slice(0, 7);
      bucketVals = parsedEntries.filter((e) => e.iso.slice(0, 7) === ym).map((e) => e.val);
    } else if (freq === 'quarterly') {
      const qk = getQuarterKey(pt.date);
      bucketVals = parsedEntries.filter((e) => getQuarterKey(e.iso) === qk).map((e) => e.val);
    } else if (freq === 'yearly') {
      const yr = pt.date.slice(0, 4);
      bucketVals = parsedEntries.filter((e) => e.iso.slice(0, 4) === yr).map((e) => e.val);
    }

    if (bucketVals.length === 0) continue;

    const actual = aggregateValues(bucketVals, agg);
    const predicted = Number(pt.value);
    const lower80 = Number(pt.lower80);
    const upper80 = Number(pt.upper80);
    const in80 = actual >= lower80 - 1e-9 && actual <= upper80 + 1e-9;
    const errorPct =
      Math.abs(actual) > 1e-6 ? (Math.abs(actual - predicted) / Math.abs(actual)) * 100 : null;

    comparisons.push({
      date: pt.date,
      predicted,
      actual,
      lower80,
      upper80,
      in80,
      errorPct,
    });
  }

  if (comparisons.length === 0) return null;

  const absErrors = comparisons.map((c) => Math.abs(c.actual - c.predicted));
  const meanAbsError = absErrors.reduce((a, b) => a + b, 0) / comparisons.length;
  const allHavePct = comparisons.every((c) => c.errorPct !== null);
  const meanAbsPctError = allHavePct
    ? comparisons.reduce((sum, c) => sum + (c.errorPct || 0), 0) / comparisons.length
    : null;
  const within80Count = comparisons.filter((c) => c.in80).length;

  return {
    matchedPeriods: comparisons.length,
    meanAbsPctError: meanAbsPctError !== null ? Math.round(meanAbsPctError * 10) / 10 : null,
    meanAbsError: Math.round(meanAbsError * 100) / 100,
    within80Count,
    within80All: within80Count === comparisons.length,
    within80RatePct: Math.round((within80Count / comparisons.length) * 100),
    comparisons,
  };
}
