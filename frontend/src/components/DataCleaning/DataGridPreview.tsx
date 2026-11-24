import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CleaningColumn,
  ColumnDataType,
} from '../../types/dataCleaning';
import { isCellError } from '../../utils/transformationEngine';
import { localizeDataType } from '../../utils/columnProfile';
import { typeFamily, OperationScope } from '../DataLab/labActions';
import { ColumnHeaderFilterDropdown } from './ColumnHeaderFilterDropdown';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  GridSelection,
  isEditableElement,
  computeRowSelectionAfterClick,
  getNextCellNavigation,
  formatSelectionAsTsv,
  computeSelectionStats,
  getTargetRowIndices,
} from '../../utils/gridSelection';
import {
  DollarSign,
  Percent,
  Calendar,
  Clock,
  CheckSquare,
  MoreVertical,
  ChevronDown,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Filter,
  AlertCircle,
  Replace,
  ArrowDown,
  ArrowUp,
  Columns,
  Check,
  X,
} from 'lucide-react';

interface Props {
  columns: CleaningColumn[];
  rows: Record<string, any>[];
  queryId?: string;
  resetSelectionKey?: string;
  selectedColumn: string | null;
  showQualityBar: boolean;
  onSelectColumn: (col: string | null) => void;
  onChangeDataType: (col: string, newType: ColumnDataType) => void;
  onRenameColumn: (oldName: string) => void;
  onRemoveColumn: (col: string) => void;
  onDuplicateColumn: (col: string) => void;
  onMoveColumn: (col: string, direction: 'left' | 'right') => void;
  onApplySort: (col: string, direction: 'asc' | 'desc') => void;
  onApplyFilter: (params: { column: string; operator: string; value?: any; value2?: any; selectedValues?: any[] }) => void;
  selectedRowIndex?: number | null;
  selectedCell?: { rowIndex: number; columnName: string } | null;
  onSelectRow?: (rowIndex: number | null) => void;
  onSelectCell?: (cell: { rowIndex: number; columnName: string } | null) => void;
  onSelectionChange?: (selection: GridSelection) => void;
  onRemoveRows?: (rowIndices: number[]) => void;
  onKeepOnlyRows?: (rowIndices: number[]) => void;
  onOpenSplitColumn: (col: string) => void;
  onOpenReplaceValues: (col: string, initialFindValue?: string, targetRowIndex?: number) => void;
  onOpenReplaceErrors: (col: string, targetRowIndex?: number) => void;
  onFillDown: (col: string) => void;
  onFillUp: (col: string) => void;
  operationScope?: OperationScope;
  onChangeOperationScope?: (scope: OperationScope) => void;
  onEditCell?: (rowIndex: number, columnName: string, newValue: any) => void;
  onSingleCellTextTransform?: (rowIndex: number, columnName: string, action: string) => void;
  editCellTriggerKey?: number;
}

export const DataGridPreview: React.FC<Props> = ({
  columns,
  rows,
  queryId,
  resetSelectionKey,
  selectedColumn,
  selectedRowIndex,
  selectedCell,
  showQualityBar,
  onSelectColumn,
  onSelectRow,
  onSelectCell,
  onSelectionChange,
  onRemoveRows,
  onKeepOnlyRows,
  onChangeDataType,
  onRenameColumn,
  onRemoveColumn,
  onDuplicateColumn,
  onMoveColumn,
  onApplySort,
  onApplyFilter,
  onOpenSplitColumn,
  onOpenReplaceValues,
  onOpenReplaceErrors,
  onFillDown,
  onFillUp,
  operationScope = 'column',
  onChangeOperationScope,
  onEditCell,
  onSingleCellTextTransform,
  editCellTriggerKey,
}) => {
  const { t, tPlural, isRtl } = useLanguage();
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [activeTypeCol, setActiveTypeCol] = useState<string | null>(null);
  const [activeMenuCol, setActiveMenuCol] = useState<string | null>(null);

  // Selection states
  const [previewLimit, setPreviewLimit] = useState(100);
  const [localSelectedCell, setLocalSelectedCell] = useState<{ rowIndex: number; columnName: string } | null>(null);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [selectedColumnNames, setSelectedColumnNames] = useState<Set<string>>(new Set());
  const [selectionRange, setSelectionRange] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);
  const [lastClickedRow, setLastClickedRow] = useState<number | null>(null);
  const [lastClickedCol, setLastClickedCol] = useState<string | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnName: string; originalRaw: any } | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIndex?: number;
    columnName?: string;
  } | null>(null);

  const currentCell = selectedCell !== undefined ? selectedCell : localSelectedCell;

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const didMountResetRef = useRef(false);

  // Reset pagination only when switching dataset/query tabs
  useEffect(() => {
    setPreviewLimit(100);
  }, [queryId]);

  // Clear local grid selection when explicit resetSelectionKey changes (tab/step/non-cell pipeline steps)
  useEffect(() => {
    if (!didMountResetRef.current) {
      didMountResetRef.current = true;
      return;
    }
    setLocalSelectedCell(null);
    setSelectedRowIndices(new Set());
    setSelectedColumnNames(new Set());
    setSelectionRange(null);
    setLastClickedRow(null);
    setLastClickedCol(null);
    setContextMenu(null);
    setEditingCell(null);
  }, [resetSelectionKey]);

  // Clamp stale local selection if rows shrink or columns disappear
  useEffect(() => {
    const colSet = new Set(columns.map((c) => c.name));
    if (localSelectedCell && (localSelectedCell.rowIndex >= rows.length || !colSet.has(localSelectedCell.columnName))) {
      setLocalSelectedCell(null);
    }
    if (editingCell && (editingCell.rowIndex >= rows.length || !colSet.has(editingCell.columnName))) {
      setEditingCell(null);
    }
  }, [rows, columns, localSelectedCell, editingCell]);

  // Sync selectedColumn with selectedColumnNames
  useEffect(() => {
    if (selectedColumn) {
      setSelectedColumnNames((prev) => {
        if (prev.has(selectedColumn)) return prev;
        return new Set([selectedColumn]);
      });
    } else {
      setSelectedColumnNames(new Set());
    }
  }, [selectedColumn]);

  // Sync selectedRowIndex with selectedRowIndices
  useEffect(() => {
    if (selectedRowIndex !== undefined && selectedRowIndex !== null) {
      setSelectedRowIndices(new Set([selectedRowIndex]));
    }
  }, [selectedRowIndex]);

  // Close menus and context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setActiveFilterCol(null);
        setActiveTypeCol(null);
        setActiveMenuCol(null);
      }
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Unified selection model shared with CommandBar & LabStatusBar
  const gridSelection: GridSelection = useMemo(() => {
    if (selectionRange) {
      return { kind: 'range', ...selectionRange };
    }
    if (currentCell) {
      return { kind: 'cell', rowIndex: currentCell.rowIndex, columnName: currentCell.columnName };
    }
    if (selectedRowIndices.size > 0) {
      return {
        kind: 'rows',
        rowIndices: Array.from(selectedRowIndices).sort((a, b) => a - b),
      };
    }
    const cols =
      selectedColumnNames.size > 0
        ? Array.from(selectedColumnNames)
        : selectedColumn
        ? [selectedColumn]
        : [];
    if (cols.length > 0) {
      const primary = selectedColumn && cols.includes(selectedColumn) ? selectedColumn : cols[0];
      return { kind: 'columns', columnNames: cols, primaryColumn: primary };
    }
    return { kind: 'none' };
  }, [selectionRange, currentCell, selectedRowIndices, selectedColumnNames, selectedColumn]);

  const lastNotifiedSelRef = useRef<string>('');
  useEffect(() => {
    if (!onSelectionChange) return;
    const serialized = JSON.stringify(gridSelection);
    if (serialized !== lastNotifiedSelRef.current) {
      lastNotifiedSelRef.current = serialized;
      onSelectionChange(gridSelection);
    }
  }, [gridSelection, onSelectionChange]);

  // Universal TSV copy function for cell, range, rows, or columns
  const handleCopySelection = useCallback(() => {
    const tsv = formatSelectionAsTsv(gridSelection, columns, rows, previewLimit);
    if (tsv) {
      navigator.clipboard?.writeText(tsv).catch(() => {});
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    }
  }, [gridSelection, columns, rows, previewLimit]);

  const startInlineEdit = useCallback(
    (rIdx: number, colName: string) => {
      if (!onEditCell) return;
      const raw = rows[rIdx]?.[colName];
      const nextCell = { rowIndex: rIdx, columnName: colName };
      onSelectCell?.(nextCell);
      setLocalSelectedCell(nextCell);
      onSelectColumn(colName);
      setSelectedColumnNames(new Set([colName]));
      setLastClickedCol(colName);
      setEditingCell({ rowIndex: rIdx, columnName: colName, originalRaw: raw });
      setEditDraft(raw === null || raw === undefined || isCellError(raw) ? '' : String(raw));
      requestAnimationFrame(() => {
        inlineInputRef.current?.focus();
        inlineInputRef.current?.select();
      });
    },
    [onEditCell, rows, onSelectCell, onSelectColumn]
  );

  const commitInlineEdit = useCallback(() => {
    if (!editingCell || !onEditCell) {
      setEditingCell(null);
      return;
    }
    const { rowIndex, columnName, originalRaw } = editingCell;
    const colObj = columns.find((c) => c.name === columnName);
    const initialDraft =
      originalRaw === null || originalRaw === undefined || isCellError(originalRaw)
        ? ''
        : String(originalRaw);

    if (editDraft !== initialDraft) {
      let nextVal: any = editDraft;
      if (editDraft === '') {
        nextVal = null;
      } else if (colObj && typeFamily(colObj.dataType) === 'number') {
        const parsed = Number(editDraft.trim());
        if (editDraft.trim() !== '' && Number.isFinite(parsed)) {
          nextVal = parsed;
        }
      } else if (colObj?.dataType === 'Boolean') {
        const low = editDraft.trim().toLowerCase();
        if (low === 'true') nextVal = true;
        else if (low === 'false') nextVal = false;
      }
      onEditCell(rowIndex, columnName, nextVal);
    }
    setEditingCell(null);
  }, [editingCell, onEditCell, columns, editDraft]);

  const prevEditTriggerRef = useRef(editCellTriggerKey);
  useEffect(() => {
    if (
      editCellTriggerKey !== undefined &&
      editCellTriggerKey !== prevEditTriggerRef.current &&
      currentCell
    ) {
      prevEditTriggerRef.current = editCellTriggerKey;
      startInlineEdit(currentCell.rowIndex, currentCell.columnName);
    } else {
      prevEditTriggerRef.current = editCellTriggerKey;
    }
  }, [editCellTriggerKey, currentCell, startInlineEdit]);

  // Handle Select All Rows
  const handleSelectAllRows = useCallback(() => {
    const totalPreview = Math.min(rows.length, previewLimit);
    if (selectedRowIndices.size === totalPreview) {
      setSelectedRowIndices(new Set());
      onSelectRow?.(null);
    } else {
      const all = new Set<number>();
      for (let i = 0; i < totalPreview; i++) all.add(i);
      setSelectedRowIndices(all);
      onSelectCell?.(null);
      setLocalSelectedCell(null);
      setSelectionRange(null);
      setSelectedColumnNames(new Set());
      onSelectColumn(null);
      onSelectRow?.(totalPreview === 1 ? 0 : null);
    }
  }, [rows.length, previewLimit, selectedRowIndices.size, onSelectRow, onSelectCell, onSelectColumn]);

  // Clear all selections
  const handleClearAllSelections = useCallback(() => {
    onSelectCell?.(null);
    setLocalSelectedCell(null);
    onSelectRow?.(null);
    setSelectedRowIndices(new Set());
    setSelectedColumnNames(new Set());
    onSelectColumn(null);
    setSelectionRange(null);
    setLastClickedRow(null);
    setLastClickedCol(null);
    setContextMenu(null);
  }, [onSelectCell, onSelectRow, onSelectColumn]);

  // Keyboard navigation for selected cell and selection range
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const targetEl = e.target as HTMLElement | null;

      // Never intercept keys inside dialogs or editable controls (e.g. manual column inputs)
      if (activeEl?.closest?.('[role="dialog"]') || targetEl?.closest?.('[role="dialog"]')) {
        return;
      }
      if (isEditableElement(targetEl) || isEditableElement(activeEl)) {
        if (e.key === 'Escape') {
          activeEl?.blur?.();
          handleClearAllSelections();
        }
        return;
      }

      // Clear selection / open menus on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveFilterCol(null);
        setActiveTypeCol(null);
        setActiveMenuCol(null);
        handleClearAllSelections();
        return;
      }

      // Skip grid navigation while a header dropdown menu is open
      if (activeFilterCol || activeTypeCol || activeMenuCol) {
        return;
      }

      // Select all on Ctrl/Cmd+A (when focus is in grid or body)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        if (!activeEl || activeEl === document.body || filterContainerRef.current?.contains(activeEl)) {
          e.preventDefault();
          handleSelectAllRows();
        }
        return;
      }

      // Copy on Ctrl/Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (gridSelection.kind !== 'none') {
          e.preventDefault();
          handleCopySelection();
        }
        return;
      }

      // Leave Ctrl/Cmd/Alt shortcuts (like Ctrl+Enter Apply & close or Ctrl+K palette) to studio handlers
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (!currentCell) return;

      const colIdx = columns.findIndex((c) => c.name === currentCell.columnName);
      if (colIdx === -1) return;

      const maxRow = Math.min(rows.length, previewLimit) - 1;
      const nav = getNextCellNavigation({
        key: e.key,
        shiftKey: e.shiftKey,
        isRtl,
        currentRow: currentCell.rowIndex,
        currentCol: colIdx,
        maxRow,
        colCount: columns.length,
        currentRange: selectionRange,
      });

      if (nav) {
        e.preventDefault();
        if (nav.kind === 'range') {
          setSelectionRange({
            startRow: nav.startRow,
            startCol: nav.startCol,
            endRow: nav.endRow,
            endCol: nav.endCol,
          });
        } else {
          setSelectionRange(null);
          const nextColName = columns[nav.colIndex].name;
          const nextCellObj = { rowIndex: nav.rowIndex, columnName: nextColName };
          onSelectCell?.(nextCellObj);
          setLocalSelectedCell(nextCellObj);
          onSelectColumn(nextColName);
          setSelectedColumnNames(new Set([nextColName]));
          setLastClickedCol(nextColName);
          requestAnimationFrame(() => {
            const cellEl = tableContainerRef.current?.querySelector(
              `td[data-grid-cell="${nav.rowIndex}:${nav.colIndex}"]`
            ) as HTMLElement | null;
            cellEl?.focus({ preventScroll: false });
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentCell,
    columns,
    rows,
    onSelectCell,
    onSelectColumn,
    isRtl,
    previewLimit,
    selectionRange,
    gridSelection.kind,
    activeFilterCol,
    activeTypeCol,
    activeMenuCol,
    handleCopySelection,
    handleSelectAllRows,
    handleClearAllSelections,
  ]);

  // Handle Row Selection (Single, Shift-range, Ctrl-toggle)
  const handleRowClick = (rIdx: number, e: React.MouseEvent) => {
    if (isEditableElement(e.target)) return;
    const { rows: nextRows, anchor } = computeRowSelectionAfterClick(
      selectedRowIndices,
      lastClickedRow,
      rIdx,
      { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey }
    );

    setSelectedRowIndices(nextRows);
    setLastClickedRow(anchor);
    setSelectionRange(null);
    onSelectCell?.(null);
    setLocalSelectedCell(null);
    if (nextRows.size > 0) {
      setSelectedColumnNames(new Set());
      onSelectColumn(null);
    }
    onSelectRow?.(nextRows.size === 1 ? Array.from(nextRows)[0] : null);
  };

  // Handle Column Header Click (Single, Shift-range, Ctrl-multi)
  const handleColumnHeaderClick = (colName: string, e: React.MouseEvent) => {
    let nextCols = new Set(selectedColumnNames);

    if (e.shiftKey && lastClickedCol !== null) {
      const idx1 = columns.findIndex((c) => c.name === lastClickedCol);
      const idx2 = columns.findIndex((c) => c.name === colName);
      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        for (let i = start; i <= end; i++) {
          nextCols.add(columns[i].name);
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (nextCols.has(colName)) {
        nextCols.delete(colName);
      } else {
        nextCols.add(colName);
      }
    } else {
      nextCols = new Set([colName]);
    }

    setSelectionRange(null);
    setSelectedRowIndices(new Set());
    setLastClickedRow(null);
    onSelectRow?.(null);
    onSelectCell?.(null);
    setLocalSelectedCell(null);

    setSelectedColumnNames(nextCols);
    setLastClickedCol(colName);
    if (nextCols.size === 0) {
      onSelectColumn(null);
    } else {
      onSelectColumn(nextCols.has(colName) ? colName : Array.from(nextCols)[0]);
    }
  };

  // Handle Cell Click (Single, Shift-range)
  const handleCellClick = (rIdx: number, colName: string, e: React.MouseEvent) => {
    if (isEditableElement(e.target)) return;
    e.stopPropagation();
    const colIdx = columns.findIndex((c) => c.name === colName);
    if (e.shiftKey && currentCell) {
      const prevColIdx = columns.findIndex((c) => c.name === currentCell.columnName);
      setSelectionRange({
        startRow: currentCell.rowIndex,
        startCol: prevColIdx !== -1 ? prevColIdx : 0,
        endRow: rIdx,
        endCol: colIdx !== -1 ? colIdx : 0,
      });
      return;
    }

    setSelectionRange(null);
    const nextCell = { rowIndex: rIdx, columnName: colName };

    onSelectCell?.(nextCell);
    setLocalSelectedCell(nextCell);

    onSelectColumn(colName);
    setSelectedColumnNames(new Set([colName]));
    setLastClickedCol(colName);

    onSelectRow?.(null);
    setSelectedRowIndices(new Set());
    setLastClickedRow(null);
  };

  const handleCellContextMenu = (rIdx: number, colName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const colIdx = columns.findIndex((c) => c.name === colName);
    const insideRange =
      selectionRange &&
      colIdx !== -1 &&
      rIdx >= Math.min(selectionRange.startRow, selectionRange.endRow) &&
      rIdx <= Math.max(selectionRange.startRow, selectionRange.endRow) &&
      colIdx >= Math.min(selectionRange.startCol, selectionRange.endCol) &&
      colIdx <= Math.max(selectionRange.startCol, selectionRange.endCol);

    if (!insideRange && (currentCell?.rowIndex !== rIdx || currentCell?.columnName !== colName)) {
      const nextCell = { rowIndex: rIdx, columnName: colName };
      onSelectCell?.(nextCell);
      setLocalSelectedCell(nextCell);
      onSelectColumn(colName);
      setSelectedColumnNames(new Set([colName]));
      setLastClickedCol(colName);
      setSelectedRowIndices(new Set());
      onSelectRow?.(null);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, rowIndex: rIdx, columnName: colName });
  };

  const handleRowContextMenu = (rIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedRowIndices.has(rIdx)) {
      setSelectionRange(null);
      onSelectCell?.(null);
      setLocalSelectedCell(null);
      setSelectedColumnNames(new Set());
      onSelectColumn(null);
      setSelectedRowIndices(new Set([rIdx]));
      setLastClickedRow(rIdx);
      onSelectRow?.(rIdx);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, rowIndex: rIdx });
  };

  // Filter Grid by Cell Value
  const handleFilterByCellValue = (rowIdxOverride?: number, colNameOverride?: string) => {
    const targetRow = rowIdxOverride ?? currentCell?.rowIndex;
    const targetCol = colNameOverride ?? currentCell?.columnName;
    if (targetRow === undefined || !targetCol) return;
    const val = rows[targetRow]?.[targetCol];
    onApplyFilter({
      column: targetCol,
      operator: 'equals',
      value: val ?? '',
    });
  };

  // Selection statistics summary for grid footer strip
  const selectionSummary = useMemo(
    () => computeSelectionStats(gridSelection, columns, rows, previewLimit),
    [gridSelection, columns, rows, previewLimit]
  );

  const getTypeIcon = (type: ColumnDataType) => {
    switch (type) {
      case 'Whole Number':
        return <span className="font-mono font-bold text-xs text-sky-300">123</span>;
      case 'Decimal Number':
        return <span className="font-mono font-bold text-xs text-sky-300">1.2</span>;
      case 'Currency':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-300" />;
      case 'Percentage':
        return <Percent className="w-3.5 h-3.5 text-violet-300" />;
      case 'Date':
        return <Calendar className="w-3.5 h-3.5 text-amber-300" />;
      case 'Date/Time':
        return <Calendar className="w-3.5 h-3.5 text-orange-300" />;
      case 'Time':
        return <Clock className="w-3.5 h-3.5 text-cyan-300" />;
      case 'Boolean':
        return <CheckSquare className="w-3.5 h-3.5 text-fuchsia-300" />;
      default:
        return <span className="font-mono font-bold text-[11px] text-lab-dim">ABC</span>;
    }
  };

  const DATA_TYPES: ColumnDataType[] = [
    'Text',
    'Whole Number',
    'Decimal Number',
    'Percentage',
    'Currency',
    'Date',
    'Date/Time',
    'Time',
    'Boolean',
  ];

  if (columns.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-lab-dim bg-lab-bg">
        <Columns className="w-10 h-10 text-lab-faint mb-2" />
        <h4 className="font-semibold text-lab-text text-sm">{t('noColumnsInView')}</h4>
        <p className="text-xs text-lab-faint mt-1 max-w-sm">
          {t('bringInDataDesc')}
        </p>
      </div>
    );
  }

  const activeCellValue = currentCell ? rows[currentCell.rowIndex]?.[currentCell.columnName] : null;
  const totalPreviewRows = Math.min(rows.length, previewLimit);
  const isAllRowsSelected = selectedRowIndices.size === totalPreviewRows && totalPreviewRows > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-lab-bg text-lab-text select-none relative" ref={filterContainerRef}>
      {/* SELECTION & FORMULA / CONTEXT BAR */}
      <div className="h-10 shrink-0 px-3 bg-lab-panel border-b border-lab-line flex items-center justify-between text-xs gap-3 select-none">
        <div className="flex items-center gap-2 truncate">
          {currentCell ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-pulse-500/20 text-pulse-300 border border-pulse-500/30 shrink-0">
                {t('selectedCellLabel')}: R{currentCell.rowIndex + 1} : C[{currentCell.columnName}]
              </span>
              <span dir="auto" className="text-lab-text font-mono text-[11px] max-w-xs sm:max-w-md truncate bg-lab-raised px-2.5 py-0.5 rounded border border-lab-line shadow-inner">
                {activeCellValue === null || activeCellValue === undefined ? (
                  <span className="text-lab-faint italic font-sans">{t('labGridNullBadge')}</span>
                ) : (
                  String(activeCellValue)
                )}
              </span>
            </div>
          ) : selectedRowIndices.size > 0 ? (
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {t('selectedCount', { count: tPlural('rows', selectedRowIndices.size) })}
            </span>
          ) : selectedColumnNames.size > 0 ? (
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30" dir="auto">
              {t('selectedCount', { count: tPlural('columns', selectedColumnNames.size) })}: {Array.from(selectedColumnNames).join(', ')}
            </span>
          ) : (
            <span className="text-[11px] text-lab-faint italic">
              {t('labGridTipBar')}
            </span>
          )}
        </div>

        {/* Quick Context Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {currentCell && (
            <>
              {onChangeOperationScope && (
                <div
                  role="group"
                  aria-label={t('labScopeCellOnly')}
                  className="flex sm:hidden items-center p-0.5 rounded-md border border-lab-line bg-lab-bg text-[10px]"
                >
                  <button
                    type="button"
                    onClick={() => onChangeOperationScope('column')}
                    className={`px-1.5 py-0.5 rounded font-semibold cursor-pointer ${
                      operationScope === 'column' ? 'bg-lab-hover text-lab-text' : 'text-lab-dim'
                    }`}
                  >
                    {t('labScopeColumn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeOperationScope('cell')}
                    className={`px-1.5 py-0.5 rounded font-semibold cursor-pointer ${
                      operationScope === 'cell' ? 'bg-amber-500/25 text-amber-200' : 'text-lab-dim'
                    }`}
                  >
                    {t('labScopeCellTag')}
                  </button>
                </div>
              )}

              {onEditCell && (
                <>
                  <button
                    type="button"
                    onClick={() => startInlineEdit(currentCell.rowIndex, currentCell.columnName)}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold bg-lab-raised hover:bg-lab-hover text-lab-text border border-lab-line flex items-center gap-1 transition-colors cursor-pointer"
                    title={t('labGridEditCellTip')}
                  >
                    <Edit2 className="w-3 h-3 text-pulse-400" />
                    <span className="hidden sm:inline">{t('labEditCellBtn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditCell(currentCell.rowIndex, currentCell.columnName, null)}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold bg-lab-raised hover:bg-lab-hover text-lab-text border border-lab-line flex items-center gap-1 transition-colors cursor-pointer"
                    title={t('labGridClearCellTip')}
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span className="hidden md:inline">{t('labClearCellBtn')}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleCopySelection}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  copiedFeedback
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-lab-raised hover:bg-lab-hover text-lab-text border border-lab-line'
                }`}
                title={t('labGridCopyCellTip')}
              >
                {copiedFeedback ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-lab-dim" />}
                <span>{copiedFeedback ? t('copied') : t('copyValue')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterByCellValue()}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-lab-raised hover:bg-lab-hover text-lab-text border border-lab-line flex items-center gap-1 transition-colors cursor-pointer"
                title={t('labGridFilterCellTip')}
              >
                <Filter className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">{t('filterByValue')}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onOpenReplaceValues(
                    currentCell.columnName,
                    activeCellValue === null || activeCellValue === undefined ? '' : String(activeCellValue),
                    operationScope === 'cell' ? currentCell.rowIndex : undefined
                  )
                }
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-lab-raised hover:bg-lab-hover text-lab-text border border-lab-line flex items-center gap-1 transition-colors cursor-pointer"
                title={t('labGridReplaceColTip')}
              >
                <Replace className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">{t('replaceValue')}</span>
              </button>
            </>
          )}

          {(currentCell || selectedRowIndices.size > 0 || selectedColumnNames.size > 0 || selectionRange) && (
            <button
              type="button"
              onClick={handleClearAllSelections}
              className="px-2 py-1 rounded-md text-[11px] text-lab-dim hover:text-white hover:bg-lab-raised transition-colors cursor-pointer flex items-center gap-1"
              title={t('clearSelection')}
            >
              <X className="w-3 h-3" />
              <span>{t('clearSelection')}</span>
            </button>
          )}
        </div>
      </div>

      {/* SPREADSHEET TABLE GRID CONTAINER */}
      <div className="flex-1 overflow-auto lab-scroll relative" ref={tableContainerRef} tabIndex={0}>
        <table
          role="grid"
          aria-label={t('labGridTableAria')}
          aria-rowcount={rows.length + 1}
          aria-colcount={columns.length + 1}
          aria-multiselectable="true"
          className="w-full border-collapse text-start border-separate border-spacing-0"
        >
          {/* TABLE HEADER */}
          <thead role="rowgroup" className="sticky top-0 z-20 bg-lab-panel select-none shadow-xs">
            <tr role="row" aria-rowindex={1}>
              {/* Row Number Header Cell with Select All Checkbox */}
              <th
                scope="col"
                role="columnheader"
                aria-colindex={1}
                aria-label={t('labGridRowNumAria')}
                className="w-14 min-w-14 py-2 px-1 text-center font-mono font-semibold text-[11px] text-lab-faint border-e border-lab-line bg-lab-panel align-middle"
              >
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    checked={isAllRowsSelected}
                    onChange={handleSelectAllRows}
                    title={t('selectAllRows')}
                    className="w-3.5 h-3.5 rounded bg-lab-raised border-lab-line text-sky-500 focus:ring-sky-500/20 cursor-pointer"
                  />
                  <span>#</span>
                </div>
              </th>

              {/* Column Headers */}
              {columns.map((col, idx) => {
                const isSelected = selectedColumnNames.has(col.name);
                const total = Math.max(1, col.validCount + col.emptyCount + col.errorCount);
                const validPct = Math.round((col.validCount / total) * 100);
                const emptyPct = Math.round((col.emptyCount / total) * 100);
                const errorPct = 100 - validPct - emptyPct;

                return (
                  <th
                    key={col.name}
                    scope="col"
                    role="columnheader"
                    aria-colindex={idx + 2}
                    aria-selected={isSelected}
                    tabIndex={-1}
                    onClick={(e) => handleColumnHeaderClick(col.name, e)}
                    className={`min-w-44 max-w-64 p-0 border-e border-lab-line transition-colors cursor-pointer group align-top ${
                      isSelected ? 'bg-pulse-400/15 ring-1 ring-pulse-400/70 ring-inset' : 'hover:bg-lab-raised'
                    }`}
                  >
                    {/* Header Top Row: Type Icon + Column Name + Filter/Menu triggers */}
                    <div className="px-2.5 py-1.5 flex items-center justify-between gap-1.5 relative">
                      <div className="flex items-center gap-1.5 truncate">
                        {/* Data Type Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTypeCol(activeTypeCol === col.name ? null : col.name);
                              setActiveFilterCol(null);
                              setActiveMenuCol(null);
                            }}
                            className="p-1 rounded hover:bg-lab-hover flex items-center gap-0.5 cursor-pointer shrink-0"
                            title={t('labGridTypeTip', { type: localizeDataType(col.dataType, t) })}
                          >
                            {getTypeIcon(col.dataType)}
                            <ChevronDown className="w-2.5 h-2.5 text-lab-faint" />
                          </button>

                          {/* Data Type Selection Dropdown */}
                          {activeTypeCol === col.name && (
                            <div className="absolute top-full start-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-75">
                              <span className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider block">
                                {t('labGridChangeType')}
                              </span>
                              {DATA_TYPES.map((dt) => (
                                <button
                                  key={dt}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onChangeDataType(col.name, dt);
                                    setActiveTypeCol(null);
                                  }}
                                  className={`w-full text-start px-2 py-1.5 rounded-md flex items-center gap-2 hover:bg-slate-100 transition-colors cursor-pointer ${
                                    col.dataType === dt ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700'
                                  }`}
                                >
                                  {getTypeIcon(dt)}
                                  <span>{localizeDataType(dt, t)}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Column Name */}
                        <span dir="auto" className="font-semibold text-lab-text truncate text-[13px]" title={col.name}>
                          {col.name}
                        </span>
                      </div>

                      {/* Header Right Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Filter Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterCol(activeFilterCol === col.name ? null : col.name);
                              setActiveTypeCol(null);
                              setActiveMenuCol(null);
                            }}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              activeFilterCol === col.name
                                ? 'bg-sky-600 text-white'
                                : 'text-lab-faint hover:text-lab-text hover:bg-lab-hover'
                            }`}
                            title={t('labGridFilterSortColTip')}
                          >
                            <Filter className="w-3.5 h-3.5" />
                          </button>

                          {/* Column Filter Dropdown */}
                          <ColumnHeaderFilterDropdown
                            column={col.name}
                            dataType={col.dataType}
                            rows={rows}
                            isOpen={activeFilterCol === col.name}
                            onClose={() => setActiveFilterCol(null)}
                            onApplySort={(dir) => onApplySort(col.name, dir)}
                            onApplyFilter={(params) => onApplyFilter(params)}
                          />
                        </div>

                        {/* Column Options Menu Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuCol(activeMenuCol === col.name ? null : col.name);
                              setActiveFilterCol(null);
                              setActiveTypeCol(null);
                            }}
                            className="p-1 rounded text-lab-faint hover:text-lab-text hover:bg-lab-hover transition-colors cursor-pointer"
                            title={t('labGridColOpsTip')}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Column Dropdown Menu */}
                          {activeMenuCol === col.name && (
                            <div className="absolute top-full end-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-75">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRenameColumn(col.name);
                                  setActiveMenuCol(null);
                                }}
                                className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>{t('renameColumnAction')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateColumn(col.name);
                                  setActiveMenuCol(null);
                                }}
                                className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>{t('duplicateColumnAction')}</span>
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenSplitColumn(col.name);
                                  setActiveMenuCol(null);
                                }}
                                className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                              >
                                <span>{t('splitColumnAction')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenReplaceValues(col.name);
                                  setActiveMenuCol(null);
                                }}
                                className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                              >
                                <span>{t('replaceValuesAction')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenReplaceErrors(col.name);
                                  setActiveMenuCol(null);
                                }}
                                className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                              >
                                <span>{t('replaceErrorsAction')}</span>
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFillDown(col.name);
                                  setActiveMenuCol(null);
                                }}
                                className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                              >
                                <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                                <span>{t('fillDownAction')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFillUp(col.name);
                                  setActiveMenuCol(null);
                                }}
                                className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                              >
                                <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                                <span>{t('fillUpAction')}</span>
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveColumn(col.name, 'left');
                                    setActiveMenuCol(null);
                                  }}
                                  className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                                >
                                  <ArrowLeft className={`w-3.5 h-3.5 text-slate-500 ${isRtl ? 'rotate-180' : ''}`} />
                                  <span>{t('moveLeftAction')}</span>
                                </button>
                              )}

                              {idx < columns.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveColumn(col.name, 'right');
                                    setActiveMenuCol(null);
                                  }}
                                  className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                                >
                                  <ArrowRight className={`w-3.5 h-3.5 text-slate-500 ${isRtl ? 'rotate-180' : ''}`} />
                                  <span>{t('moveRightAction')}</span>
                                </button>
                              )}

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveColumn(col.name);
                                  setActiveMenuCol(null);
                                }}
                                className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-rose-50 text-rose-600 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>{t('removeColumnAction')}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quality strip */}
                    {showQualityBar && (
                      <div
                        className="px-2.5 pb-2"
                        title={t('labGridQualityStripTip', {
                          valid: col.validCount,
                          pct: validPct,
                          empty: col.emptyCount,
                          errors: col.errorCount,
                        })}
                      >
                        <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-lab-raised">
                          <div style={{ width: `${validPct}%` }} className="bg-emerald-400 h-full" />
                          <div style={{ width: `${emptyPct}%` }} className="bg-amber-400 h-full" />
                          <div style={{ width: `${errorPct}%` }} className="bg-rose-500 h-full" />
                        </div>
                        <div className="mt-1 flex justify-between font-mono text-[10px] text-lab-faint">
                          <span>{t('labGridPctValid', { pct: validPct })}</span>
                          {(col.emptyCount > 0 || col.errorCount > 0) && (
                            <span className={col.errorCount > 0 ? 'text-rose-300' : 'text-amber-300'}>
                              {col.emptyCount + col.errorCount} {t('labGridToFix')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* TABLE BODY (Spreadsheet Grid) */}
          <tbody role="rowgroup" className="divide-y divide-lab-line/60 font-mono text-[12px]">
            {rows.slice(0, previewLimit).map((row, rIdx) => {
              const isRowSelected = selectedRowIndices.has(rIdx);

              return (
                <tr
                  key={rIdx}
                  role="row"
                  aria-rowindex={rIdx + 2}
                  aria-selected={isRowSelected}
                  onContextMenu={(e) => handleRowContextMenu(rIdx, e)}
                  className={`transition-colors ${
                    isRowSelected
                      ? 'bg-sky-500/20 ring-1 ring-sky-400/60 font-medium'
                      : 'even:bg-white/[0.018] hover:bg-pulse-400/[0.08]'
                  }`}
                >
                  {/* Row Number Cell with checkbox */}
                  <th
                    scope="row"
                    role="rowheader"
                    aria-rowindex={rIdx + 2}
                    aria-colindex={1}
                    aria-selected={isRowSelected}
                    tabIndex={-1}
                    onClick={(e) => handleRowClick(rIdx, e)}
                    className={`w-14 py-1.5 px-1 text-center border-e border-lab-line font-medium select-none cursor-pointer transition-colors align-middle ${
                      isRowSelected
                        ? 'bg-sky-500 text-white font-bold ring-1 ring-sky-400'
                        : 'text-lab-faint bg-lab-panel/70 hover:bg-lab-raised hover:text-lab-text'
                    }`}
                    title={t('labGridClickRowTip', { row: rIdx + 1 })}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="w-3.5 h-3.5 rounded bg-lab-raised border-lab-line text-sky-500 focus:ring-sky-500/20 cursor-pointer pointer-events-none"
                      />
                      <span>{rIdx + 1}</span>
                    </div>
                  </th>

                  {/* Data Cells (Click to select cell, Arrow keys to navigate) */}
                  {columns.map((col, colIdx) => {
                    const val = row[col.name];
                    const isErr = isCellError(val);
                    const isNull = val === null || val === undefined || val === '';
                    const isColumnSelected = selectedColumnNames.has(col.name);
                    const isCellSelected = currentCell?.rowIndex === rIdx && currentCell?.columnName === col.name;
                    const isCellInRange = selectionRange ? (
                      rIdx >= Math.min(selectionRange.startRow, selectionRange.endRow) &&
                      rIdx <= Math.max(selectionRange.startRow, selectionRange.endRow) &&
                      colIdx >= Math.min(selectionRange.startCol, selectionRange.endCol) &&
                      colIdx <= Math.max(selectionRange.startCol, selectionRange.endCol)
                    ) : false;

                    const isInlineEditing =
                      editingCell?.rowIndex === rIdx && editingCell?.columnName === col.name;

                    return (
                      <td
                        key={col.name}
                        role="gridcell"
                        aria-colindex={colIdx + 2}
                        aria-selected={isCellSelected || isCellInRange}
                        data-grid-cell={`${rIdx}:${colIdx}`}
                        tabIndex={isCellSelected ? 0 : -1}
                        dir="auto"
                        onClick={(e) => handleCellClick(rIdx, col.name, e)}
                        onDoubleClick={(e) => {
                          if (!onEditCell) return;
                          e.stopPropagation();
                          startInlineEdit(rIdx, col.name);
                        }}
                        onContextMenu={(e) => handleCellContextMenu(rIdx, col.name, e)}
                        className={`py-1.5 px-2.5 border-e border-lab-line/60 truncate max-w-64 tabular-nums cursor-pointer transition-all relative focus:outline-none ${
                          typeFamily(col.dataType) === 'number' ? 'text-end' : 'text-start'
                        } ${
                          isInlineEditing
                            ? 'p-0 ring-2 ring-amber-400 ring-inset bg-lab-bg z-20'
                            : isCellSelected
                            ? 'ring-2 ring-pulse-400 ring-inset bg-pulse-500/30 font-bold text-white shadow-inner relative z-10'
                            : isCellInRange
                            ? 'ring-1 ring-pulse-400/50 bg-pulse-500/20 text-white font-medium'
                            : isRowSelected
                            ? 'bg-sky-500/10'
                            : isColumnSelected
                            ? 'bg-pulse-400/[0.08]'
                            : 'hover:bg-white/[0.04]'
                        }`}
                        title={t('labGridClickCellTip', { col: col.name, row: rIdx + 1 })}
                      >
                        {isInlineEditing ? (
                          <input
                            ref={inlineInputRef}
                            type="text"
                            dir="auto"
                            data-editable-cell="true"
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            onBlur={commitInlineEdit}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitInlineEdit();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setEditingCell(null);
                              }
                            }}
                            className="w-full h-full px-2 py-1 bg-slate-950 text-white font-mono text-[12px] outline-none"
                          />
                        ) : isErr ? (
                          <span
                            className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 font-bold text-[10px] inline-flex items-center gap-1"
                            title={val.message || t('labGridConvError')}
                          >
                            <AlertCircle className="w-3 h-3 text-rose-300" />
                            <span>{t('cellError')}</span>
                          </span>
                        ) : isNull ? (
                          <span className="text-lab-faint italic font-sans">{t('labGridNullBadge')}</span>
                        ) : typeof val === 'boolean' ? (
                          <span className={`font-semibold ${val ? 'text-emerald-300' : 'text-lab-dim'}`}>
                            {val ? 'TRUE' : 'FALSE'}
                          </span>
                        ) : (
                          <span className="text-lab-text">{String(val)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length > previewLimit && (
          <div className="sticky start-0 px-4 py-2.5 text-[11px] text-lab-dim bg-lab-panel border-t border-lab-line flex items-center justify-between">
            <div>
              {t('previewingRows', {
                current: Math.min(previewLimit, rows.length),
                total: rows.length.toLocaleString(),
              })}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewLimit((prev) => Math.min(rows.length, prev + 100))}
                className="px-2.5 py-1 rounded bg-lab-raised hover:bg-lab-hover text-lab-text border border-lab-line text-xs font-semibold cursor-pointer transition-colors"
              >
                {t('showMoreRows')}
              </button>
              {rows.length <= 5000 && (
                <button
                  type="button"
                  onClick={() => setPreviewLimit(rows.length)}
                  className="px-2.5 py-1 rounded bg-pulse-500/20 hover:bg-pulse-500/30 text-pulse-300 border border-pulse-500/40 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {t('showAllRows')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STATUS BAR SUMMARY */}
      {selectionSummary && (
        <div className="h-8 shrink-0 px-3 sm:px-4 bg-lab-panel border-t border-lab-line flex items-center justify-between gap-4 text-[11px] text-lab-dim select-none font-mono overflow-x-auto no-scrollbar max-w-full">
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 whitespace-nowrap">
            <span>
              <strong className="text-lab-text">{t('labGridCount')}</strong> {selectionSummary.count}
            </span>
            {selectionSummary.type === 'numeric' ? (
              <>
                <span>
                  <strong className="text-lab-text">{t('labGridSum')}</strong> {selectionSummary.sum}
                </span>
                <span>
                  <strong className="text-lab-text">{t('labGridAvg')}</strong> {selectionSummary.avg}
                </span>
                <span>
                  <strong className="text-lab-text">{t('labGridMin')}</strong> {selectionSummary.min}
                </span>
                <span>
                  <strong className="text-lab-text">{t('labGridMax')}</strong> {selectionSummary.max}
                </span>
              </>
            ) : (
              <>
                <span>
                  <strong className="text-lab-text">{t('labGridDistinct')}</strong> {selectionSummary.distinct}
                </span>
                <span>
                  <strong className="text-lab-text">{t('labGridEmpty')}</strong> {selectionSummary.empty}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            {copiedFeedback ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> {t('labGridCopiedTsv')}
              </span>
            ) : (
              <span className="text-lab-faint text-[10px]">{t('labGridCtrlCCopy')}</span>
            )}
          </div>
        </div>
      )}

      {/* RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (() => {
        const targetRowIndices = getTargetRowIndices(gridSelection, contextMenu.rowIndex);
        const contextCellVal =
          contextMenu.rowIndex !== undefined && contextMenu.columnName
            ? rows[contextMenu.rowIndex]?.[contextMenu.columnName]
            : undefined;
        const contextFindStr =
          contextCellVal === null || contextCellVal === undefined ? '' : String(contextCellVal);

        return (
          <div
            role="menu"
            aria-label={t('labGridTableAria')}
            style={{
              top: Math.max(8, Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 360 : 400)),
              left: Math.max(8, Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 248 : 400)),
            }}
            className="fixed z-50 w-60 max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-16px)] overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 text-xs text-slate-200 select-none animate-in fade-in duration-75"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                handleCopySelection();
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800 text-start cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>{t('copyValue')}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono" dir="ltr">Ctrl+C</span>
            </button>

            {contextMenu.columnName && contextMenu.rowIndex !== undefined && (
              <>
                <div className="h-px bg-slate-800 my-1" />
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {t('labGridCtxCellOnlyHeading', { row: contextMenu.rowIndex + 1 })}
                </div>

                {onEditCell && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        const r = contextMenu.rowIndex!;
                        const c = contextMenu.columnName!;
                        setContextMenu(null);
                        startInlineEdit(r, c);
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-800 text-start cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-pulse-400" />
                      <span>{t('labGridCtxEditCell')}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onEditCell(contextMenu.rowIndex!, contextMenu.columnName!, null);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-800 text-start cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t('labGridCtxClearCell')}</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onOpenReplaceValues(contextMenu.columnName!, contextFindStr, contextMenu.rowIndex);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-800 text-start cursor-pointer"
                >
                  <Replace className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('labGridCtxReplaceThisCellOnly')}</span>
                </button>

                {onSingleCellTextTransform && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSingleCellTextTransform(contextMenu.rowIndex!, contextMenu.columnName!, 'trim');
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-start cursor-pointer text-slate-300"
                    >
                      <span className="w-3.5 h-3.5 text-center font-mono text-[10px] text-emerald-400">T</span>
                      <span>{t('labGridCtxTrimCell')}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSingleCellTextTransform(contextMenu.rowIndex!, contextMenu.columnName!, 'uppercase');
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-start cursor-pointer text-slate-300"
                    >
                      <span className="w-3.5 h-3.5 text-center font-mono text-[10px] text-emerald-400">AA</span>
                      <span>{t('labGridCtxUpperCell')}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSingleCellTextTransform(contextMenu.rowIndex!, contextMenu.columnName!, 'lowercase');
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-start cursor-pointer text-slate-300"
                    >
                      <span className="w-3.5 h-3.5 text-center font-mono text-[10px] text-emerald-400">aa</span>
                      <span>{t('labGridCtxLowerCell')}</span>
                    </button>
                  </>
                )}

                <div className="h-px bg-slate-800 my-1" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleFilterByCellValue(contextMenu.rowIndex, contextMenu.columnName);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-800 text-start cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('labGridCtxFilterThisValue')}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onOpenReplaceValues(contextMenu.columnName!, contextFindStr);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-800 text-start cursor-pointer"
                >
                  <Replace className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t('labGridCtxReplaceColValues')}</span>
                </button>
              </>
            )}

            {targetRowIndices.length > 0 && (onRemoveRows || onKeepOnlyRows) && (
              <>
                <div className="h-px bg-slate-800 my-1" />
                {onKeepOnlyRows && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onKeepOnlyRows(targetRowIndices);
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-800 text-start cursor-pointer text-slate-200"
                  >
                    <Check className="w-3.5 h-3.5 text-pulse-400" />
                    <span>{t('labGridCtxKeepSelectedRows')}</span>
                  </button>
                )}
                {onRemoveRows && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onRemoveRows(targetRowIndices);
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-rose-500/15 text-start cursor-pointer text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      {targetRowIndices.length === 1
                        ? t('labGridCtxRemoveRow')
                        : t('labGridCtxRemoveRows', { count: targetRowIndices.length })}
                    </span>
                  </button>
                )}
              </>
            )}

            <div className="h-px bg-slate-800 my-1" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                handleClearAllSelections();
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800 text-start cursor-pointer text-slate-400 hover:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <X className="w-3.5 h-3.5" />
                <span>{t('clearSelection')}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono" dir="ltr">Esc</span>
            </button>
          </div>
        );
      })()}
    </div>
  );
};
