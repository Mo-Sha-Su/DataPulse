import { CleaningColumn, ColumnDataType, DataCleaningStepType } from '../types/dataCleaning';
import { isCellError } from './transformationEngine';
import { TranslateFn, defaultEnT } from '../i18n/LanguageContext';

export function localizeDataType(dataType: ColumnDataType, t: TranslateFn = defaultEnT): string {
  switch (dataType) {
    case 'Text': return t('colType_Text');
    case 'Whole Number': return t('colType_WholeNumber');
    case 'Decimal Number': return t('colType_DecimalNumber');
    case 'Currency': return t('colType_Currency');
    case 'Percentage': return t('colType_Percentage');
    case 'Date': return t('colType_Date');
    case 'Date/Time': return t('colType_DateTime');
    case 'Time': return t('colType_Time');
    case 'Boolean': return t('colType_Boolean');
    default: return String(dataType);
  }
}

export interface ValueCount {
  value: string;
  count: number;
}

export interface NumericStats {
  min: number;
  max: number;
  mean: number;
  median: number;
}

export interface ColumnProfile {
  name: string;
  total: number;
  valid: number;
  empty: number;
  errors: number;
  distinct: number;
  /** distinct / valid, 1 means every value is unique (an identifier) */
  uniqueness: number;
  top: ValueCount[];
  numeric?: NumericStats;
  text?: { minLength: number; maxLength: number };
}

const isEmpty = (v: any) => v === null || v === undefined || v === '';

/** Profile of one column of the current step's rows. Pure; O(n). */
export function profileColumn(rows: Record<string, any>[], name: string, topN = 6): ColumnProfile {
  const counts = new Map<string, number>();
  const nums: number[] = [];
  let valid = 0;
  let empty = 0;
  let errors = 0;
  let minLen = Infinity;
  let maxLen = 0;

  for (const row of rows) {
    const v = row[name];
    if (isCellError(v)) {
      errors++;
      continue;
    }
    if (isEmpty(v)) {
      empty++;
      continue;
    }
    valid++;
    const key = String(v);
    counts.set(key, (counts.get(key) || 0) + 1);
    if (typeof v === 'number' && Number.isFinite(v)) nums.push(v);
    if (key.length < minLen) minLen = key.length;
    if (key.length > maxLen) maxLen = key.length;
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, topN)
    .map(([value, count]) => ({ value, count }));

  let numeric: NumericStats | undefined;
  if (nums.length > 0 && nums.length >= valid * 0.8) {
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    numeric = {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: nums.reduce((a, b) => a + b, 0) / nums.length,
      median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    };
  }

  return {
    name,
    total: rows.length,
    valid,
    empty,
    errors,
    distinct: counts.size,
    uniqueness: valid === 0 ? 0 : counts.size / valid,
    top,
    numeric,
    text: valid > 0 ? { minLength: minLen === Infinity ? 0 : minLen, maxLength: maxLen } : undefined,
  };
}

/** One-click fix that maps straight onto a pipeline step. */
export interface Suggestion {
  id: string;
  title: string;
  detail: string;
  /** how many cells/rows it would touch */
  affected: number;
  tone: 'clean' | 'shape' | 'compute';
  step: { type: DataCleaningStepType; name: string; params: Record<string, any> };
}

const NUMBER_TEXT = /^\s*-?[\d,]+(\.\d+)?\s*$/;
const DATE_TEXT = /^(\d{4}-\d{2}-\d{2}([T\s]\d{2}:\d{2}(:\d{2})?)?|\d{1,2}\/\d{1,2}\/\d{4})$/;

/**
 * Looks at the actual cell values and proposes fixes a person would otherwise hunt for by eye.
 * Every suggestion is a normal pipeline step (visible, reorderable, deletable), never a hidden change.
 */
export function suggestFixes(column: CleaningColumn, rows: Record<string, any>[], t: TranslateFn = defaultEnT): Suggestion[] {
  const name = column.name;
  const out: Suggestion[] = [];
  const strings: string[] = [];
  let emptyCount = 0;
  for (const r of rows) {
    const v = r[name];
    if (isCellError(v)) continue;
    if (isEmpty(v)) emptyCount++;
    else if (typeof v === 'string') strings.push(v);
  }

  // 1) stray whitespace
  const padded = strings.filter((s) => s !== s.trim()).length;
  if (padded > 0) {
    out.push({
      id: `trim:${name}`,
      title: t('labFixTrimTitle'),
      detail: t('labFixTrimDetail', { count: padded }),
      affected: padded,
      tone: 'clean',
      step: { type: 'text_transform', name: `${t('labAction_trim_label')} (${name})`, params: { column: name, action: 'trim' } },
    });
  }

  // 2) same word, different capitalisation ("Shipped" / "shipped")
  const byLower = new Map<string, Set<string>>();
  for (const s of strings) {
    const k = s.trim().toLowerCase();
    if (!byLower.has(k)) byLower.set(k, new Set());
    byLower.get(k)!.add(s.trim());
  }
  const variantGroups = [...byLower.values()].filter((set) => set.size > 1);
  if (variantGroups.length > 0) {
    const affected = strings.filter((s) => (byLower.get(s.trim().toLowerCase())?.size || 0) > 1).length;
    const titleCase = (v: string) => v.replace(/\b\w/g, (c) => c.toUpperCase());
    const titleUnifies = variantGroups.every((g) => new Set([...g].map(titleCase)).size === 1);
    const action = titleUnifies ? 'capitalize' : 'lowercase';
    out.push({
      id: `case:${name}`,
      title: titleUnifies ? t('labFixCaseTitle') : t('labFixCaseTitleLower'),
      detail: t('labFixCaseDetailCount', {
        count: variantGroups.length,
        sample: [...variantGroups[0]].slice(0, 2).map((v) => `"${v}"`).join(' / '),
      }),
      affected,
      tone: 'clean',
      step: {
        type: 'text_transform',
        name: `${titleUnifies ? t('labAction_title_label') : t('labAction_lower_label')} (${name})`,
        params: { column: name, action },
      },
    });
  }

  // 3) empty cells
  if (emptyCount > 0) {
    const numeric = ['Whole Number', 'Decimal Number', 'Currency', 'Percentage'].includes(column.dataType);
    out.push({
      id: `nulls:${name}`,
      title: numeric ? t('labFixNullsZeroTitle') : t('labFixNullsUnknownTitle'),
      detail: t('labFixEmptyDetail', { count: emptyCount }),
      affected: emptyCount,
      tone: 'clean',
      step: numeric
        ? { type: 'replace_nulls', name: `${t('labStepType_replace_values')} (${name})`, params: { column: name, action: 'replace_zero' } }
        : { type: 'replace_nulls', name: `${t('labStepType_replace_values')} (${name})`, params: { column: name, action: 'replace_value', customValue: 'Unknown' } },
    });
  }

  // 4) values that are still text although the column is (or clearly should be) numeric / a date
  const NUMERIC_TYPES: ColumnDataType[] = ['Whole Number', 'Decimal Number'];
  const sample = strings.filter((s) => s.trim() !== '');
  if (sample.length > 0) {
    const numLike = sample.filter((s) => NUMBER_TEXT.test(s)).length;
    const dateLike = sample.filter((s) => DATE_TEXT.test(s.trim())).length;
    const push = (newType: ColumnDataType, count: number, why: string) =>
      out.push({
        id: `type:${name}`,
        title: t('labFixConvertTitle', { type: localizeDataType(newType, t) }),
        detail: why,
        affected: count,
        tone: 'compute',
        step: { type: 'changed_type', name: `${t('labStepType_changed_type')} (${name})`, params: { column: name, newType } },
      });

    if (column.dataType === 'Text') {
      if (numLike / sample.length >= 0.8) {
        push(sample.some((s) => s.includes('.')) ? 'Decimal Number' : 'Whole Number', numLike, t('labFixConvertNumWhy', { count: numLike, total: sample.length }));
      } else if (dateLike / sample.length >= 0.8) {
        push('Date', dateLike, t('labFixConvertDateWhy', { count: dateLike, total: sample.length }));
      }
    } else if (NUMERIC_TYPES.includes(column.dataType) && numLike > 0) {
      push(column.dataType, numLike, t('labFixConvertNumStillWhy', { count: numLike, total: sample.length }));
    } else if (column.dataType === 'Date' && dateLike > 0) {
      push('Date', dateLike, t('labFixConvertDateStillWhy', { count: dateLike, total: sample.length }));
    }
  }

  return out;
}

/** Whole-table observations (not tied to one column). */
export function tableIssues(columns: CleaningColumn[], rows: Record<string, any>[], t: TranslateFn = defaultEnT): Suggestion[] {
  const out: Suggestion[] = [];
  if (rows.length === 0 || columns.length === 0) return out;
  const names = columns.map((c) => c.name);

  const seen = new Set<string>();
  let dupes = 0;
  for (const r of rows) {
    const key = names.map((n) => String(r[n] ?? '')).join('\u0001');
    if (seen.has(key)) dupes++;
    else seen.add(key);
  }
  if (dupes > 0) {
    out.push({
      id: 'dupes',
      title: t('labFixDupesTitle'),
      detail: t('labFixDupesDetailExact', { count: dupes }),
      affected: dupes,
      tone: 'shape',
      step: { type: 'remove_duplicates', name: t('labStepType_remove_duplicates'), params: { columns: names } },
    });
  }

  const blank = rows.filter((r) => names.every((n) => isEmpty(r[n]))).length;
  if (blank > 0) {
    out.push({
      id: 'blank-rows',
      title: t('labAction_removeblank_label'),
      detail: t('labFixBlankRowsDetail', { count: blank }),
      affected: blank,
      tone: 'shape',
      step: { type: 'remove_rows', name: t('labStepType_remove_blank_rows'), params: { action: 'remove_blank' } },
    });
  }
  return out;
}

/** 0-100 share of cells that are valid (neither empty nor an error). */
export function qualityScore(columns: CleaningColumn[]): number {
  let valid = 0;
  let total = 0;
  for (const c of columns) {
    valid += c.validCount;
    total += c.validCount + c.emptyCount + c.errorCount;
  }
  return total === 0 ? 100 : Math.round((valid / total) * 100);
}

/** Share (0-100) of cells that are filled in, measured on a sample so large datasets stay cheap. */
export function datasetHealth(rows: Record<string, any>[], columnNames: string[], sample = 500): number {
  if (!rows?.length || !columnNames.length) return 100;
  const n = Math.min(rows.length, sample);
  const step = rows.length / n;
  let filled = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const row = rows[Math.floor(i * step)];
    for (const c of columnNames) {
      total++;
      const v = row?.[c];
      if (!(v === null || v === undefined || v === '')) filled++;
    }
  }
  return total === 0 ? 100 : Math.round((filled / total) * 100);
}

export function columnTypeMix(columns: { type?: string }[]): { text: number; number: number; date: number } {
  const mix = { text: 0, number: 0, date: 0 };
  for (const c of columns || []) {
    if (c.type === 'number') mix.number++;
    else if (c.type === 'date') mix.date++;
    else mix.text++;
  }
  return mix;
}
