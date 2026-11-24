import type { LucideIcon } from 'lucide-react';
import {
  Scissors, Eraser, CaseUpper, CaseLower, CaseSensitive, Replace, CircleSlash, AlertCircle, ArrowDownToLine,
  ArrowUpToLine, CopyMinus, Rows3, ArrowUpAZ, ArrowDownZA, Trash2, Copy, Columns2, Combine, Pencil, MoveLeft,
  MoveRight, FunctionSquare, Calculator, CalendarDays, Hash, Sigma, TextCursorInput, ListX, Percent,
} from 'lucide-react';
import { ColumnDataType } from '../../types/dataCleaning';
import { RowOperationAction } from '../DataCleaning/ManageRowsModal';
import { TranslateFn, defaultEnT } from '../../i18n/LanguageContext';

export type LabGroup = 'clean' | 'shape' | 'columns' | 'compute';

export function getGroups(t: TranslateFn = defaultEnT): { id: LabGroup; label: string; blurb: string; color: string }[] {
  return [
    { id: 'clean', label: t('labGroupClean'), blurb: t('labGroupCleanBlurb'), color: 'var(--color-cat-clean)' },
    { id: 'shape', label: t('labGroupRows'), blurb: t('labGroupRowsBlurb'), color: 'var(--color-cat-shape)' },
    { id: 'columns', label: t('labGroupColumns'), blurb: t('labGroupColumnsBlurb'), color: 'var(--color-cat-columns)' },
    { id: 'compute', label: t('labGroupCompute'), blurb: t('labGroupComputeBlurb'), color: 'var(--color-cat-compute)' },
  ];
}

export const GROUPS = getGroups(defaultEnT);

export type TypeFamily = 'text' | 'number' | 'date' | 'other';
export const typeFamily = (t?: ColumnDataType): TypeFamily => {
  if (!t) return 'other';
  if (t === 'Text') return 'text';
  if (['Whole Number', 'Decimal Number', 'Currency', 'Percentage'].includes(t)) return 'number';
  if (['Date', 'Date/Time', 'Time'].includes(t)) return 'date';
  return 'other';
};

export type OperationScope = 'column' | 'cell';

export interface LabHandlers {
  newSource: () => void;
  removeColumn: () => void;
  duplicateColumn: () => void;
  renameColumn: () => void;
  moveColumn: (dir: 'left' | 'right') => void;
  openSplit: () => void;
  openMerge: () => void;
  openReplaceValues: () => void;
  openReplaceErrors: () => void;
  openReplaceNulls: () => void;
  openRemoveDuplicates: () => void;
  openManageRows: (a: RowOperationAction) => void;
  sort: (dir: 'asc' | 'desc') => void;
  fillDown: () => void;
  fillUp: () => void;
  text: (action: string) => void;
  number: (action: string) => void;
  date: (action: string) => void;
  addCustomColumn: () => void;
  editCell?: () => void;
  clearCell?: () => void;
}

export interface LabAction {
  id: string;
  label: string;
  hint: string;
  group: LabGroup;
  icon: LucideIcon;
  keywords: string;
  /** needs a column to be selected in the grid */
  needsColumn?: boolean;
  /** needs a single cell to be selected in the grid */
  needsCell?: boolean;
  /** can operate on a single cell (targetRowIndex) without affecting other cells */
  cellCompatible?: boolean;
  /** only meaningful for this kind of column */
  family?: TypeFamily;
  danger?: boolean;
  run: () => void;
}

export function buildLabActions(h: LabHandlers, t: TranslateFn = defaultEnT): LabAction[] {
  const A = (a: Omit<LabAction, 'run'> & { run: () => void }): LabAction => a;
  return [
    // ---- Clean
    A({ id: 'edit_cell', label: t('labAction_editcell_label'), hint: t('labAction_editcell_hint'), group: 'clean', icon: Pencil, keywords: 'edit cell value set single تحرير خلية', needsColumn: true, needsCell: true, cellCompatible: true, run: () => h.editCell?.() }),
    A({ id: 'clear_cell', label: t('labAction_clearcell_label'), hint: t('labAction_clearcell_hint'), group: 'clean', icon: CircleSlash, keywords: 'clear empty null cell single مسح خلية', needsColumn: true, needsCell: true, cellCompatible: true, run: () => h.clearCell?.() }),
    A({ id: 'trim', label: t('labAction_trim_label'), hint: t('labAction_trim_hint'), group: 'clean', icon: Scissors, keywords: 'whitespace strip مسافات', needsColumn: true, cellCompatible: true, run: () => h.text('trim') }),
    A({ id: 'clean', label: t('labAction_clean_label'), hint: t('labAction_clean_hint'), group: 'clean', icon: Eraser, keywords: 'clean control invisible تنظيف', needsColumn: true, cellCompatible: true, run: () => h.text('clean') }),
    A({ id: 'upper', label: t('labAction_upper_label'), hint: t('labAction_upper_hint'), group: 'clean', icon: CaseUpper, keywords: 'case capital أحرف كبيرة', needsColumn: true, cellCompatible: true, run: () => h.text('uppercase') }),
    A({ id: 'lower', label: t('labAction_lower_label'), hint: t('labAction_lower_hint'), group: 'clean', icon: CaseLower, keywords: 'case small أحرف صغيرة', needsColumn: true, cellCompatible: true, run: () => h.text('lowercase') }),
    A({ id: 'title', label: t('labAction_title_label'), hint: t('labAction_title_hint'), group: 'clean', icon: CaseSensitive, keywords: 'case capitalize proper', needsColumn: true, cellCompatible: true, run: () => h.text('capitalize') }),
    A({ id: 'replace', label: t('labAction_replace_label'), hint: t('labAction_replace_hint'), group: 'clean', icon: Replace, keywords: 'find substitute استبدال', needsColumn: true, cellCompatible: true, run: h.openReplaceValues }),
    A({ id: 'nulls', label: t('labAction_nulls_label'), hint: t('labAction_nulls_hint'), group: 'clean', icon: CircleSlash, keywords: 'null blank missing impute fill فارغ', needsColumn: true, cellCompatible: true, run: h.openReplaceNulls }),
    A({ id: 'errors', label: t('labAction_errors_label'), hint: t('labAction_errors_hint'), group: 'clean', icon: AlertCircle, keywords: 'error invalid أخطاء', needsColumn: true, cellCompatible: true, run: h.openReplaceErrors }),
    A({ id: 'filldown', label: t('labAction_filldown_label'), hint: t('labAction_filldown_hint'), group: 'clean', icon: ArrowDownToLine, keywords: 'propagate fill تعبئة لأسفل', needsColumn: true, cellCompatible: true, run: h.fillDown }),
    A({ id: 'fillup', label: t('labAction_fillup_label'), hint: t('labAction_fillup_hint'), group: 'clean', icon: ArrowUpToLine, keywords: 'propagate fill تعبئة لأعلى', needsColumn: true, cellCompatible: true, run: h.fillUp }),
    A({ id: 'dupes', label: t('labAction_dupes_label'), hint: t('labAction_dupes_hint'), group: 'clean', icon: CopyMinus, keywords: 'distinct unique dedupe تكرار', run: h.openRemoveDuplicates }),
    A({ id: 'blank', label: t('labAction_removeblank_label'), hint: t('labAction_removeblank_hint'), group: 'clean', icon: ListX, keywords: 'empty فارغ', run: () => h.openManageRows('remove_blank') }),
    // ---- Rows
    A({ id: 'keeptop', label: t('labAction_keeptop_label'), hint: t('labAction_keeptop_hint'), group: 'shape', icon: Rows3, keywords: 'head limit first أعلى', run: () => h.openManageRows('keep_top') }),
    A({ id: 'keepbottom', label: t('labAction_keepbottom_label'), hint: t('labAction_keepbottom_hint'), group: 'shape', icon: Rows3, keywords: 'tail last أسفل', run: () => h.openManageRows('keep_bottom') }),
    A({ id: 'keeprange', label: t('labAction_keeprange_label'), hint: t('labAction_keeprange_hint'), group: 'shape', icon: Rows3, keywords: 'between slice نطاق', run: () => h.openManageRows('keep_range') }),
    A({ id: 'removetop', label: t('labAction_removetop_label'), hint: t('labAction_removetop_hint'), group: 'shape', icon: ListX, keywords: 'skip header تخطي', run: () => h.openManageRows('remove_top') }),
    A({ id: 'removebottom', label: t('labAction_removebottom_label'), hint: t('labAction_removebottom_hint'), group: 'shape', icon: ListX, keywords: 'footer totals تذييل', run: () => h.openManageRows('remove_bottom') }),
    A({ id: 'removealt', label: t('labAction_removealt_label'), hint: t('labAction_removealt_hint'), group: 'shape', icon: ListX, keywords: 'every other متناوب', run: () => h.openManageRows('remove_alternate') }),
    A({ id: 'sortasc', label: t('labAction_sortasc_label'), hint: t('labAction_sortasc_hint'), group: 'shape', icon: ArrowUpAZ, keywords: 'order sort فرز تصاعدي', needsColumn: true, run: () => h.sort('asc') }),
    A({ id: 'sortdesc', label: t('labAction_sortdesc_label'), hint: t('labAction_sortdesc_hint'), group: 'shape', icon: ArrowDownZA, keywords: 'order sort فرز تنازلي', needsColumn: true, run: () => h.sort('desc') }),
    // ---- Columns
    A({ id: 'rename', label: t('labAction_rename_label'), hint: t('labAction_rename_hint'), group: 'columns', icon: Pencil, keywords: 'name title إعادة تسمية', needsColumn: true, run: h.renameColumn }),
    A({ id: 'split', label: t('labAction_split_label'), hint: t('labAction_split_hint'), group: 'columns', icon: Columns2, keywords: 'delimiter separate تقسيم', needsColumn: true, run: h.openSplit }),
    A({ id: 'merge', label: t('labAction_merge_label'), hint: t('labAction_merge_hint'), group: 'columns', icon: Combine, keywords: 'combine concatenate دمج', run: h.openMerge }),
    A({ id: 'duplicate', label: t('labAction_duplicate_label'), hint: t('labAction_duplicate_hint'), group: 'columns', icon: Copy, keywords: 'copy clone duplicate تكرار', needsColumn: true, run: h.duplicateColumn }),
    A({ id: 'left', label: t('labAction_left_label'), hint: t('labAction_left_hint'), group: 'columns', icon: MoveLeft, keywords: 'reorder move تحريك', needsColumn: true, run: () => h.moveColumn('left') }),
    A({ id: 'right', label: t('labAction_right_label'), hint: t('labAction_right_hint'), group: 'columns', icon: MoveRight, keywords: 'reorder move تحريك', needsColumn: true, run: () => h.moveColumn('right') }),
    A({ id: 'removecol', label: t('labAction_remove_label'), hint: t('labAction_remove_hint'), group: 'columns', icon: Trash2, keywords: 'drop delete حذف', needsColumn: true, danger: true, run: h.removeColumn }),
    // ---- Compute
    A({ id: 'custom', label: t('labAction_custom_label'), hint: t('labAction_custom_hint'), group: 'compute', icon: FunctionSquare, keywords: 'formula calculate add مخصص', run: h.addCustomColumn }),
    A({ id: 'prefix', label: t('labAction_prefix_label'), hint: t('labAction_prefix_hint'), group: 'compute', icon: TextCursorInput, keywords: 'text before بادئة', needsColumn: true, cellCompatible: true, family: 'text', run: () => h.text('prefix') }),
    A({ id: 'suffix', label: t('labAction_suffix_label'), hint: t('labAction_suffix_hint'), group: 'compute', icon: TextCursorInput, keywords: 'text after لاحقة', needsColumn: true, cellCompatible: true, family: 'text', run: () => h.text('suffix') }),
    A({ id: 'math', label: t('labAction_math_label'), hint: t('labAction_math_hint'), group: 'compute', icon: Calculator, keywords: 'arithmetic plus times حساب', needsColumn: true, cellCompatible: true, family: 'number', run: () => h.number('math') }),
    A({ id: 'round', label: t('labAction_round_label'), hint: t('labAction_round_hint'), group: 'compute', icon: Hash, keywords: 'decimals precision تقريب', needsColumn: true, cellCompatible: true, family: 'number', run: () => h.number('round') }),
    A({ id: 'roundup', label: t('labAction_roundup_label'), hint: t('labAction_roundup_hint'), group: 'compute', icon: Sigma, keywords: 'ceil تقريب للأعلى', needsColumn: true, cellCompatible: true, family: 'number', run: () => h.number('round_up') }),
    A({ id: 'rounddown', label: t('labAction_rounddown_label'), hint: t('labAction_rounddown_hint'), group: 'compute', icon: Sigma, keywords: 'floor تقريب للأسفل', needsColumn: true, cellCompatible: true, family: 'number', run: () => h.number('round_down') }),
    A({ id: 'abs', label: t('labAction_abs_label'), hint: t('labAction_abs_hint'), group: 'compute', icon: Percent, keywords: 'positive مطلقة', needsColumn: true, cellCompatible: true, family: 'number', run: () => h.number('abs') }),
    ...(['year', 'quarter', 'month', 'month_name', 'day', 'day_name'] as const).map((p) => {
      const labelKey = `labAction_date_${p}_label` as const;
      const hintKey = `labAction_date_${p}_hint` as const;
      return A({
        id: `date_${p}`,
        label: t(labelKey),
        hint: t(hintKey),
        group: 'compute',
        icon: CalendarDays,
        keywords: `date time part ${p.replace('_', ' ')} تاريخ`,
        needsColumn: true,
        cellCompatible: true,
        family: 'date',
        run: () => h.date(p),
      });
    }),
  ];
}

/** Why an action can't run right now (null = enabled). */
export function disabledReason(
  a: LabAction,
  selectedColumn: string | null,
  selectedType?: ColumnDataType,
  t: TranslateFn = defaultEnT,
  options?: { scope?: OperationScope; hasSelectedCell?: boolean }
): string | null {
  if (a.needsCell && !options?.hasSelectedCell) return t('labSelectCellFirst');
  if (options?.scope === 'cell' && !a.cellCompatible) return t('labRequiresColumnScope');
  if (a.needsColumn && !selectedColumn) return t('labSelectColumnFirst');
  if (a.family && a.family !== typeFamily(selectedType)) {
    return a.family === 'number'
      ? t('labRequiresNumber')
      : a.family === 'date'
      ? t('labRequiresDate')
      : t('labRequiresText');
  }
  return null;
}

/** Palette search: every word must match label/keywords/hint; label-prefix matches rank first. */
export function searchActions(actions: LabAction[], query: string): LabAction[] {
  const q = query.trim().toLowerCase();
  if (!q) return actions;
  const words = q.split(/\s+/);
  const scored: { a: LabAction; s: number }[] = [];
  for (const a of actions) {
    const label = a.label.toLowerCase();
    const hay = `${label} ${a.keywords} ${a.hint.toLowerCase()} ${a.group}`;
    if (!words.every((w) => hay.includes(w))) continue;
    let s = 0;
    if (label.startsWith(q)) s += 4;
    else if (label.includes(q)) s += 2;
    if (words.every((w) => label.includes(w))) s += 1;
    scored.push({ a, s });
  }
  return scored.sort((x, y) => y.s - x.s).map((x) => x.a);
}
