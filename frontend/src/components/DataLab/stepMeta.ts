import type { LucideIcon } from 'lucide-react';
import {
  Database, Hash, Pencil, Trash2, Copy, Columns2, Combine, Replace, CircleSlash, AlertCircle, ArrowDownToLine,
  ArrowUpToLine, ListFilter, ListX, Rows3, ArrowUpAZ, CaseSensitive, Calculator, CalendarDays, FunctionSquare,
  CopyMinus, MoveHorizontal, Heading,
} from 'lucide-react';
import { DataCleaningStepType } from '../../types/dataCleaning';
import { LabGroup } from './labActions';
import { TranslateFn, defaultEnT } from '../../i18n/LanguageContext';

export interface StepMeta {
  icon: LucideIcon;
  group: LabGroup | 'source';
  color: string;
  label: string;
}

const C = {
  source: 'var(--color-pulse-400)',
  clean: 'var(--color-cat-clean)',
  shape: 'var(--color-cat-shape)',
  columns: 'var(--color-cat-columns)',
  compute: 'var(--color-cat-compute)',
};

export function getStepMetaMap(t: TranslateFn = defaultEnT): Record<DataCleaningStepType, StepMeta> {
  return {
    source: { icon: Database, group: 'source', color: C.source, label: t('labStepType_source') },
    promoted_headers: { icon: Heading, group: 'shape', color: C.shape, label: t('labStepMeta_headers') },
    changed_type: { icon: Hash, group: 'compute', color: C.compute, label: t('labStepMeta_type') },
    rename_column: { icon: Pencil, group: 'columns', color: C.columns, label: t('labStepMeta_rename') },
    remove_columns: { icon: Trash2, group: 'columns', color: C.columns, label: t('labStepMeta_remove_columns') },
    duplicate_column: { icon: Copy, group: 'columns', color: C.columns, label: t('labStepMeta_duplicate') },
    reorder_columns: { icon: MoveHorizontal, group: 'columns', color: C.columns, label: t('labStepMeta_reorder') },
    move_column: { icon: MoveHorizontal, group: 'columns', color: C.columns, label: t('labStepMeta_move') },
    replace_values: { icon: Replace, group: 'clean', color: C.clean, label: t('labStepMeta_replace') },
    replace_errors: { icon: AlertCircle, group: 'clean', color: C.clean, label: t('labStepMeta_fix_errors') },
    replace_nulls: { icon: CircleSlash, group: 'clean', color: C.clean, label: t('labStepMeta_fill_empty') },
    fill_down: { icon: ArrowDownToLine, group: 'clean', color: C.clean, label: t('labStepMeta_fill_down') },
    fill_up: { icon: ArrowUpToLine, group: 'clean', color: C.clean, label: t('labStepMeta_fill_up') },
    filter_rows: { icon: ListFilter, group: 'shape', color: C.shape, label: t('labStepMeta_filter') },
    remove_rows: { icon: ListX, group: 'shape', color: C.shape, label: t('labStepMeta_remove_rows') },
    keep_rows: { icon: Rows3, group: 'shape', color: C.shape, label: t('labStepMeta_keep_rows') },
    sort: { icon: ArrowUpAZ, group: 'shape', color: C.shape, label: t('labStepMeta_sort') },
    text_transform: { icon: CaseSensitive, group: 'clean', color: C.clean, label: t('labStepMeta_text') },
    number_transform: { icon: Calculator, group: 'compute', color: C.compute, label: t('labStepMeta_math') },
    date_transform: { icon: CalendarDays, group: 'compute', color: C.compute, label: t('labStepMeta_date') },
    split_column: { icon: Columns2, group: 'columns', color: C.columns, label: t('labStepMeta_split') },
    merge_columns: { icon: Combine, group: 'columns', color: C.columns, label: t('labStepMeta_merge') },
    remove_duplicates: { icon: CopyMinus, group: 'shape', color: C.shape, label: t('labStepMeta_dedupe') },
    edit_cell: { icon: Pencil, group: 'clean', color: C.clean, label: t('labStepMeta_edit_cell') },
    add_custom_column: { icon: FunctionSquare, group: 'compute', color: C.compute, label: t('labStepMeta_custom_column') },
  };
}

export const STEP_META: Record<DataCleaningStepType, StepMeta> = getStepMetaMap(defaultEnT);

export const metaFor = (type: DataCleaningStepType, t: TranslateFn = defaultEnT): StepMeta => {
  const map = t === defaultEnT ? STEP_META : getStepMetaMap(t);
  return map[type] || { icon: Database, group: 'shape', color: C.shape, label: String(type) };
};

/** "−6 rows", "+1 col" style deltas between two consecutive trace points. */
export function impactChips(
  prev: { rows: number; columns: number; errors: number; empty?: number } | null,
  cur: { rows: number; columns: number; errors: number; empty?: number },
  t: TranslateFn = defaultEnT
): { key: string; text: string; tone: 'up' | 'down' | 'bad' | 'good' }[] {
  if (!prev) return [];
  const chips: { key: string; text: string; tone: 'up' | 'down' | 'bad' | 'good' }[] = [];
  const dr = cur.rows - prev.rows;
  const dc = cur.columns - prev.columns;
  const de = cur.errors - prev.errors;
  if (dr !== 0) {
    const absDr = Math.abs(dr).toLocaleString();
    const key = dr > 0
      ? (Math.abs(dr) === 1 ? 'labRailDeltaAddedRows' : 'labRailDeltaAddedRowsPlural')
      : (Math.abs(dr) === 1 ? 'labRailDeltaRemovedRows' : 'labRailDeltaRemovedRowsPlural');
    chips.push({ key: 'rows', text: t(key, { n: absDr }), tone: dr > 0 ? 'up' : 'down' });
  }
  if (dc !== 0) {
    const absDc = Math.abs(dc);
    const key = dc > 0
      ? (absDc === 1 ? 'labRailDeltaAddedCols' : 'labRailDeltaAddedColsPlural')
      : (absDc === 1 ? 'labRailDeltaRemovedCols' : 'labRailDeltaRemovedColsPlural');
    chips.push({ key: 'cols', text: t(key, { n: absDc }), tone: dc > 0 ? 'up' : 'down' });
  }
  const dm = (cur.empty ?? 0) - (prev.empty ?? 0);
  if (dm < 0 && dr === 0) chips.push({ key: 'empty', text: t('labRailEmptyFilled', { n: Math.abs(dm).toLocaleString() }), tone: 'good' });
  if (de > 0) chips.push({ key: 'err', text: t('labRailErrorsAdded', { n: de }), tone: 'bad' });
  if (de < 0) chips.push({ key: 'err', text: t('labRailErrorsFixed', { n: Math.abs(de) }), tone: 'good' });
  return chips;
}
