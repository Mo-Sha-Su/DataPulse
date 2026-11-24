import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dataset } from '../types/dashboard';
import {
  QueryModel,
  DataCleaningStep,
  ColumnDataType,
} from '../types/dataCleaning';
import {
  evaluatePipeline,
  generateMFormula,
  tracePipeline,
} from '../utils/transformationEngine';
import { DataGridPreview } from '../components/DataCleaning/DataGridPreview';
import { CommandBar } from '../components/DataLab/CommandBar';
import { CommandPalette } from '../components/DataLab/CommandPalette';
import { StepRail } from '../components/DataLab/StepRail';
import { ColumnInspector } from '../components/DataLab/ColumnInspector';
import { QueryTabs } from '../components/DataLab/QueryTabs';
import { LabStatusBar } from '../components/DataLab/LabStatusBar';
import { buildLabActions, OperationScope } from '../components/DataLab/labActions';
import { Suggestion, qualityScore } from '../utils/columnProfile';
import { GridSelection, formatSelectionSummary } from '../utils/gridSelection';
import {
  DATA_LAB_SAVE_TIMEOUT_MS,
  selectDirtyDatasetsToSave,
  commitDirtyDatasets,
  createUniqueStepId,
  closeQueryTab,
} from '../utils/dataLabCommit';
import { SplitColumnModal } from '../components/DataCleaning/SplitColumnModal';
import { MergeColumnsModal } from '../components/DataCleaning/MergeColumnsModal';
import { ReplaceValuesModal } from '../components/DataCleaning/ReplaceValuesModal';
import { RemoveDuplicatesModal } from '../components/DataCleaning/RemoveDuplicatesModal';
import { ManageRowsModal, RowOperationAction } from '../components/DataCleaning/ManageRowsModal';
import { TransformParamModal, TransformModalType } from '../components/DataCleaning/TransformParamModal';
import { BrandHomeLink, hasDataLabUnsavedChanges } from '../components/BrandLogo';
import { useLanguage, LanguageToggle } from '../i18n/LanguageContext';
import { DatasetImportModal } from '../components/Import/DatasetImportModal';
import { saveGlobalDataset } from '../services/globalDatasetService';
import { Button, Modal } from '../ui';
import {
  Database,
  ArrowLeft,
  FileSpreadsheet,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileText,
  Upload,
  PanelLeft,
  X,
} from 'lucide-react';

export interface DataLabCloseOptions {
  skipHistoryBack?: boolean;
  navigateHome?: boolean;
  committedDatasets?: Dataset[];
}

interface Props {
  initialDatasets: Dataset[];
  availableDatasets?: Dataset[];
  targetDatasetId?: string;
  onApplyAndClose: (updatedDatasets: Dataset[], options?: DataLabCloseOptions) => void;
  onClose: (options?: DataLabCloseOptions) => void;
  onCancelPopStateExit?: () => void;
}

export const DataCleaningEditorPage: React.FC<Props> = ({
  initialDatasets,
  availableDatasets,
  targetDatasetId,
  onApplyAndClose,
  onClose,
  onCancelPopStateExit,
}) => {
  const { t, isRtl } = useLanguage();
  const hubDatasets = availableDatasets ?? initialDatasets;

  const knownBaseDatasets = useMemo(() => {
    const byId = new Map<string, Dataset>();
    for (const ds of hubDatasets) byId.set(ds.id, ds);
    for (const ds of initialDatasets) byId.set(ds.id, ds);
    return Array.from(byId.values());
  }, [hubDatasets, initialDatasets]);

  const didInitQueriesRef = useRef(initialDatasets.length > 0);

  // Convert initial Datasets into QueryModels with default Source step
  const [queries, setQueries] = useState<QueryModel[]>(() => {
    return initialDatasets.map((ds) => {
      const sourceStepId = createUniqueStepId('step_source');
      const sourceStep: DataCleaningStep = {
        id: sourceStepId,
        name: t('sourceStep'),
        type: 'source',
        description: t('labSourceImportedFrom', { name: ds.name }),
        mFormula: `= Csv.Document(File.Contents("${ds.name}.csv"), [Delimiter=",", Columns=${ds.columnCount}])`,
        params: {},
      };

      return {
        id: ds.id,
        name: ds.name,
        sourceType: ds.sourceType,
        originalDatasetId: ds.id,
        rawRows: (ds.cleanedData && ds.cleanedData.length > 0 ? ds.cleanedData : ds.data) || [],
        steps: [sourceStep],
        selectedStepId: sourceStepId,
      };
    });
  });

  // Active query selection
  const [activeQueryId, setActiveQueryId] = useState<string>(() => {
    if (targetDatasetId && queries.some((q) => q.id === targetDatasetId)) {
      return targetDatasetId;
    }
    return queries[0]?.id || '';
  });

  // Sync initialDatasets ONLY once if loaded asynchronously (never re-open tabs after closing the last tab)
  useEffect(() => {
    if (!didInitQueriesRef.current && initialDatasets.length > 0 && queries.length === 0) {
      didInitQueriesRef.current = true;
      const mapped = initialDatasets.map((ds) => {
        const sourceStepId = createUniqueStepId('step_source');
        const sourceStep: DataCleaningStep = {
          id: sourceStepId,
          name: t('sourceStep'),
          type: 'source',
          description: t('labSourceImportedFrom', { name: ds.name }),
          mFormula: `= Csv.Document(File.Contents("${ds.name}.csv"), [Delimiter=",", Columns=${ds.columnCount}])`,
          params: {},
        };
        return {
          id: ds.id,
          name: ds.name,
          sourceType: ds.sourceType,
          originalDatasetId: ds.id,
          rawRows: (ds.cleanedData && ds.cleanedData.length > 0 ? ds.cleanedData : ds.data) || [],
          steps: [sourceStep],
          selectedStepId: sourceStepId,
        };
      });
      setQueries(mapped);
      if (targetDatasetId && mapped.some((q) => q.id === targetDatasetId)) {
        setActiveQueryId(targetDatasetId);
      } else if (mapped[0]) {
        setActiveQueryId(mapped[0].id);
      }
    }
  }, [initialDatasets, targetDatasetId, queries.length, t]);

  const activeQuery = queries.find((q) => q.id === activeQueryId) || queries[0];
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 1280));
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; columnName: string } | null>(null);
  const [gridSelection, setGridSelection] = useState<GridSelection>({ kind: 'none' });
  const [operationScope, setOperationScope] = useState<OperationScope>('column');
  const [editCellTriggerKey, setEditCellTriggerKey] = useState(0);
  const [gridResetCounter, setGridResetCounter] = useState(0);
  const preserveCellOnNextEvalRef = useRef<{ rowIndex: number; columnName: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const [saveError, setSaveError] = useState<{ message: string; failedDatasetIds: string[] } | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [promptSource, setPromptSource] = useState<'button' | 'logo' | 'popstate'>('button');
  const pendingCloseOptionsRef = useRef<DataLabCloseOptions | undefined>(undefined);
  const [queryToClose, setQueryToClose] = useState<string | null>(null);

  const isApplyingRef = useRef(false);
  const savedRecordsRef = useRef<Map<string, Dataset>>(new Map());
  const importedRecordsRef = useRef<Map<string, Dataset>>(new Map());
  const initialPipelinesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (initialDatasets.length > 0 && initialPipelinesRef.current.size === 0) {
      for (const ds of initialDatasets) {
        initialPipelinesRef.current.set(ds.id, JSON.stringify(ds.cleaningPipeline || []));
      }
    }
  }, [initialDatasets]);

  const getCommittedDatasets = (): Dataset[] => {
    const merged = new Map<string, Dataset>();
    importedRecordsRef.current.forEach((ds, id) => merged.set(id, ds));
    savedRecordsRef.current.forEach((ds, id) => merged.set(id, ds));
    return Array.from(merged.values());
  };

  const handleRequestClose = () => {
    if (isApplyingRef.current) return;
    if (hasDataLabUnsavedChanges(queries)) {
      setPromptSource('button');
      setShowUnsavedModal(true);
    } else {
      const committed = getCommittedDatasets();
      onClose(committed.length > 0 ? { committedDatasets: committed } : undefined);
    }
  };

  const handleBeforeLogoNavigate = () => {
    if (isApplyingRef.current) return false;
    if (hasDataLabUnsavedChanges(queries)) {
      setPromptSource('logo');
      setShowUnsavedModal(true);
      return false;
    }
    return true;
  };

  const handleConfirmedLogoNavigate = () => {
    const committed = getCommittedDatasets();
    onClose({ navigateHome: true, ...(committed.length > 0 ? { committedDatasets: committed } : {}) });
  };

  const handleCloseQuery = (id: string) => {
    const target = queries.find((q) => q.id === id);
    if (target && target.steps.length > 1) {
      setQueryToClose(id);
    } else {
      performCloseQuery(id);
    }
  };

  const performCloseQuery = (id: string) => {
    setQueries((prev) => {
      const { remaining, nextActiveId } = closeQueryTab(prev, activeQueryId, id);
      if (activeQueryId === id) {
        setActiveQueryId(nextActiveId);
        setSelectedColumn(null);
        setSelectedRowIndex(null);
        setSelectedCell(null);
      }
      return remaining;
    });
    setQueryToClose(null);
  };

  const handleNewEmptyQuery = () => {
    const newId = createUniqueStepId('ds_query');
    const sourceStepId = createUniqueStepId('step_source');
    const sourceStep: DataCleaningStep = {
      id: sourceStepId,
      name: t('sourceStep'),
      type: 'source',
      description: t('labBlankQueryDesc'),
      mFormula: '= #table({"Column1", "Column2"}, {})',
      params: {},
    };
    const newQuery: QueryModel = {
      id: newId,
      name: `${t('labQueryPrefix')} ${queries.length + 1}`,
      sourceType: 'csv',
      originalDatasetId: newId,
      rawRows: [{ Column1: '', Column2: '' }],
      steps: [sourceStep],
      selectedStepId: sourceStepId,
    };
    setQueries((prev) => [...prev, newQuery]);
    setActiveQueryId(newId);
  };

  const handleOpenDataset = (ds: Dataset) => {
    const existing = queries.find((q) => (q.originalDatasetId || q.id) === ds.id);
    if (existing) {
      setActiveQueryId(existing.id);
      return;
    }
    const sourceStepId = createUniqueStepId('step_source');
    const sourceStep: DataCleaningStep = {
      id: sourceStepId,
      name: t('sourceStep'),
      type: 'source',
      description: t('labSourceImportedFrom', { name: ds.name }),
      mFormula: `= Csv.Document(File.Contents("${ds.name}"), [Delimiter=",", Columns=${ds.columnCount}])`,
      params: {},
    };
    const opened: QueryModel = {
      id: ds.id,
      name: ds.name,
      sourceType: ds.sourceType,
      originalDatasetId: ds.id,
      rawRows: (ds.cleanedData && ds.cleanedData.length > 0 ? ds.cleanedData : ds.data) || [],
      steps: [sourceStep],
      selectedStepId: sourceStepId,
    };
    setQueries((prev) => [...prev, opened]);
    setActiveQueryId(opened.id);
  };

  // Modals state
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [replaceValuesModalState, setReplaceValuesModalState] = useState<{
    isOpen: boolean;
    column?: string;
    initialFindValue?: string;
    targetRowIndex?: number;
    initialCellOnly?: boolean;
  }>({ isOpen: false });
  const [removeDuplicatesModalOpen, setRemoveDuplicatesModalOpen] = useState(false);
  const [manageRowsModalState, setManageRowsModalState] = useState<{ isOpen: boolean; action: RowOperationAction }>({
    isOpen: false,
    action: 'remove_top',
  });
  const [transformParamModalState, setTransformParamModalState] = useState<{
    isOpen: boolean;
    type: TransformModalType;
    column?: string;
    initialValue?: any;
    initialValue2?: any;
    availableColumns?: string[];
    targetRowIndex?: number;
    initialCellOnly?: boolean;
  }>({
    isOpen: false,
    type: 'text_prefix',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute evaluation result of current query pipeline up to activeQuery.selectedStepId
  const currentEvaluation = useMemo(() => {
    if (!activeQuery) {
      return {
        columns: [],
        rows: [],
        totalErrors: 0,
        totalEmpty: 0,
        totalRows: 0,
        totalColumns: 0,
      };
    }
    return evaluatePipeline(activeQuery.rawRows, activeQuery.steps, activeQuery.selectedStepId);
  }, [activeQuery?.rawRows, activeQuery?.steps, activeQuery?.selectedStepId]);

  // Clear grid selection whenever active query, selected step, or evaluated rows change,
  // unless a single-cell edit/transform explicitly preserved the active cell.
  const didMountClearRef = useRef(false);
  useEffect(() => {
    if (!didMountClearRef.current) {
      didMountClearRef.current = true;
      return;
    }
    const preserved = preserveCellOnNextEvalRef.current;
    preserveCellOnNextEvalRef.current = null;
    if (
      preserved &&
      preserved.rowIndex >= 0 &&
      preserved.rowIndex < currentEvaluation.rows.length &&
      currentEvaluation.columns.some((c) => c.name === preserved.columnName)
    ) {
      setSelectedCell(preserved);
      setSelectedColumn(preserved.columnName);
      setSelectedRowIndex(null);
      setGridSelection({ kind: 'cell', rowIndex: preserved.rowIndex, columnName: preserved.columnName });
      return;
    }
    setSelectedColumn(null);
    setSelectedRowIndex(null);
    setSelectedCell(null);
    setGridSelection({ kind: 'none' });
    setGridResetCounter((c) => c + 1);
  }, [activeQuery?.id, activeQuery?.selectedStepId, currentEvaluation.rows, currentEvaluation.columns]);

  // Current selected step formula
  const currentStep = activeQuery?.steps.find((s) => s.id === activeQuery.selectedStepId) || activeQuery?.steps[0];
  const activeFormula = currentStep ? currentStep.mFormula : '= Source';

  // Helper to add a new step into the active query pipeline
  const addStepToActiveQuery = (
    type: DataCleaningStep['type'],
    name: string,
    params: Record<string, any>,
    description = ''
  ) => {
    if (!activeQuery) return;
    if (typeof params?.targetRowIndex === 'number' && typeof params?.column === 'string') {
      preserveCellOnNextEvalRef.current = { rowIndex: params.targetRowIndex, columnName: params.column };
    } else {
      preserveCellOnNextEvalRef.current = null;
    }

    const newStepId = `step_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const prevStep = activeQuery.steps[activeQuery.steps.length - 1];
    const prevName = prevStep ? prevStep.name : 'Source';

    const tempStep: DataCleaningStep = {
      id: newStepId,
      name,
      type,
      description,
      mFormula: '',
      params,
    };
    tempStep.mFormula = generateMFormula(tempStep, prevName);

    // If user is time-travelled to an earlier step, insert after that step or append
    const currentStepIndex = activeQuery.steps.findIndex((s) => s.id === activeQuery.selectedStepId);
    let updatedSteps: DataCleaningStep[];

    if (currentStepIndex >= 0 && currentStepIndex < activeQuery.steps.length - 1) {
      updatedSteps = [
        ...activeQuery.steps.slice(0, currentStepIndex + 1),
        tempStep,
        ...activeQuery.steps.slice(currentStepIndex + 1),
      ];
    } else {
      updatedSteps = [...activeQuery.steps, tempStep];
    }

    savedRecordsRef.current.delete(activeQuery.originalDatasetId || activeQuery.id);
    setQueries((prev) =>
      prev.map((q) =>
        q.id === activeQuery.id
          ? {
              ...q,
              steps: updatedSteps,
              selectedStepId: newStepId,
            }
          : q
      )
    );
  };

  // Step Operations in Applied Steps Sidebar
  const handleSelectStep = (stepId: string) => {
    setQueries((prev) =>
      prev.map((q) => (q.id === activeQuery.id ? { ...q, selectedStepId: stepId } : q))
    );
  };

  const handleDeleteStep = (stepId: string) => {
    if (!activeQuery || activeQuery.steps.length <= 1) return;
    const remaining = activeQuery.steps.filter((s) => s.id !== stepId);
    const nextSelectedId = remaining[remaining.length - 1]?.id || remaining[0].id;
    savedRecordsRef.current.delete(activeQuery.originalDatasetId || activeQuery.id);

    setQueries((prev) =>
      prev.map((q) =>
        q.id === activeQuery.id
          ? {
              ...q,
              steps: remaining,
              selectedStepId: nextSelectedId,
            }
          : q
      )
    );
  };

  const handleRenameStep = (stepId: string) => {
    const target = activeQuery?.steps.find((s) => s.id === stepId);
    if (!target) return;
    setTransformParamModalState({
      isOpen: true,
      type: 'rename_step',
      initialValue: target.name,
    });
  };

  const handleMoveStepUp = (stepId: string) => {
    if (!activeQuery) return;
    const idx = activeQuery.steps.findIndex((s) => s.id === stepId);
    if (idx <= 1) return; // Don't move before Source
    const newSteps = [...activeQuery.steps];
    const item = newSteps.splice(idx, 1)[0];
    newSteps.splice(idx - 1, 0, item);
    savedRecordsRef.current.delete(activeQuery.originalDatasetId || activeQuery.id);

    setQueries((prev) =>
      prev.map((q) => (q.id === activeQuery.id ? { ...q, steps: newSteps } : q))
    );
  };

  const handleMoveStepDown = (stepId: string) => {
    if (!activeQuery) return;
    const idx = activeQuery.steps.findIndex((s) => s.id === stepId);
    if (idx === -1 || idx === 0 || idx >= activeQuery.steps.length - 1) return;
    const newSteps = [...activeQuery.steps];
    const item = newSteps.splice(idx, 1)[0];
    newSteps.splice(idx + 1, 0, item);
    savedRecordsRef.current.delete(activeQuery.originalDatasetId || activeQuery.id);

    setQueries((prev) =>
      prev.map((q) => (q.id === activeQuery.id ? { ...q, steps: newSteps } : q))
    );
  };

  const handleEditStepSettings = (step: DataCleaningStep) => {
    switch (step.type) {
      case 'replace_values':
        setReplaceValuesModalState({
          isOpen: true,
          column: step.params?.column || selectedColumn || currentEvaluation.columns[0]?.name || '',
          initialFindValue: step.params?.findValue,
        });
        break;
      case 'split_column':
        setSplitModalOpen(true);
        break;
      case 'merge_columns':
        setMergeModalOpen(true);
        break;
      case 'remove_duplicates':
        setRemoveDuplicatesModalOpen(true);
        break;
      case 'rename_column':
        setTransformParamModalState({
          isOpen: true,
          type: 'rename_column',
          column: step.params.oldName,
          initialValue: step.params.newName,
        });
        break;
      default:
        break;
    }
  };

  const handleQueryNameChange = (newName: string) => {
    if (activeQuery) {
      savedRecordsRef.current.delete(activeQuery.originalDatasetId || activeQuery.id);
    }
    setQueries((prev) =>
      prev.map((q) => (q.id === activeQuery.id ? { ...q, name: newName } : q))
    );
  };

  // Column Actions
  const handleChangeDataType = (column: string, newType: ColumnDataType) => {
    addStepToActiveQuery('changed_type', `${t('labStepType_changed_type')} (${column})`, { column, newType });
  };

  const handleRenameColumn = (oldName: string) => {
    setTransformParamModalState({
      isOpen: true,
      type: 'rename_column',
      column: oldName,
      initialValue: oldName,
    });
  };

  const handleRemoveColumn = (column?: string) => {
    const target = column || selectedColumn;
    if (!target) return;
    addStepToActiveQuery('remove_columns', `${t('labStepType_removed_columns')} (${target})`, { column: target });
    setSelectedColumn(null);
  };

  const handleDuplicateColumn = (column?: string) => {
    const target = column || selectedColumn;
    if (!target) return;
    const newName = `${target} ${t('labDuplicateSuffix')}`;
    addStepToActiveQuery('duplicate_column', `${t('labStepType_duplicated_column')} (${target})`, { column: target, newColumnName: newName });
  };

  const handleMoveColumn = (column: string, direction: 'left' | 'right') => {
    addStepToActiveQuery('move_column', `${t('labStepType_reordered_columns')} (${column})`, { column, direction });
  };

  const handleApplySort = (column: string, direction: 'asc' | 'desc') => {
    addStepToActiveQuery('sort', `${t('labStepType_sort_rows')} (${column} ${direction.toUpperCase()})`, {
      column,
      direction,
    });
  };

  const handleApplyFilter = (params: { column: string; operator: string; value?: any; value2?: any; selectedValues?: any[] }) => {
    addStepToActiveQuery('filter_rows', `${t('labStepType_filter_rows')} (${params.column})`, params);
  };

  const hasSelectedCell = Boolean(
    selectedCell &&
    selectedCell.rowIndex >= 0 &&
    selectedCell.rowIndex < currentEvaluation.rows.length
  );
  const activeCellTargetRow =
    hasSelectedCell && operationScope === 'cell' ? selectedCell!.rowIndex : undefined;

  const formatTargetSuffix = (col: string, rowIdx?: number) =>
    typeof rowIdx === 'number' ? `${col} · R${rowIdx + 1}` : col;

  const handleEditCell = (rowIndex: number, columnName: string, newValue: any) => {
    if (rowIndex < 0 || rowIndex >= currentEvaluation.rows.length) return;
    const curVal = currentEvaluation.rows[rowIndex]?.[columnName];
    if (newValue === null && (curVal === null || curVal === undefined)) return;
    if (Object.is(curVal, newValue)) return;

    const stepName =
      newValue === null
        ? t('labStepClearedCell', { col: columnName, row: rowIndex + 1 })
        : t('labStepEditedCell', { col: columnName, row: rowIndex + 1 });
    const desc = `${t('labRowOnlyTag', { row: rowIndex + 1 })} · ${columnName} → ${
      newValue === null ? 'null' : String(newValue)
    }`;
    addStepToActiveQuery(
      'edit_cell',
      stepName,
      { column: columnName, targetRowIndex: rowIndex, value: newValue },
      desc
    );
  };

  const handleFillDown = (column?: string) => {
    const target = column || selectedColumn;
    if (!target) return;
    const rowIdx = selectedCell?.columnName === target ? activeCellTargetRow : undefined;
    addStepToActiveQuery(
      'fill_down',
      `${t('labStepType_fill_down')} (${formatTargetSuffix(target, rowIdx)})`,
      { column: target, ...(typeof rowIdx === 'number' ? { targetRowIndex: rowIdx } : {}) },
      typeof rowIdx === 'number' ? t('labRowOnlyTag', { row: rowIdx + 1 }) : ''
    );
  };

  const handleFillUp = (column?: string) => {
    const target = column || selectedColumn;
    if (!target) return;
    const rowIdx = selectedCell?.columnName === target ? activeCellTargetRow : undefined;
    addStepToActiveQuery(
      'fill_up',
      `${t('labStepType_fill_up')} (${formatTargetSuffix(target, rowIdx)})`,
      { column: target, ...(typeof rowIdx === 'number' ? { targetRowIndex: rowIdx } : {}) },
      typeof rowIdx === 'number' ? t('labRowOnlyTag', { row: rowIdx + 1 }) : ''
    );
  };

  // Row context operations (create normal pipeline steps)
  const handleRemoveSelectedRows = (rowIndices: number[]) => {
    if (!rowIndices.length) return;
    const sorted = [...new Set(rowIndices)].sort((a, b) => a - b);
    const stepTitle =
      sorted.length === 1
        ? t('labStepRemovedRowN', { row: sorted[0] + 1 })
        : t('labStepRemovedNRows', { count: sorted.length });
    addStepToActiveQuery('remove_rows', stepTitle, {
      action: 'remove_indices',
      rowIndices: sorted,
    });
  };

  const handleKeepOnlySelectedRows = (rowIndices: number[]) => {
    if (!rowIndices.length) return;
    const sorted = [...new Set(rowIndices)].sort((a, b) => a - b);
    const stepTitle =
      sorted.length === 1
        ? t('labStepKeptRowN', { row: sorted[0] + 1 })
        : t('labStepKeptNRows', { count: sorted.length });
    addStepToActiveQuery('keep_rows', stepTitle, {
      action: 'keep_indices',
      rowIndices: sorted,
    });
  };

  // Text Transform Trigger (supports column-wide or single-cell override)
  const handleTextTransform = (action: string, explicitCell?: { rowIndex: number; columnName: string }) => {
    const col = explicitCell?.columnName || selectedColumn;
    if (!col) return;
    const rowIdx = explicitCell
      ? explicitCell.rowIndex
      : selectedCell?.columnName === col
      ? activeCellTargetRow
      : undefined;

    if (['prefix', 'suffix', 'extract_first', 'extract_last', 'extract_range', 'extract_before_delimiter', 'extract_after_delimiter'].includes(action)) {
      setTransformParamModalState({
        isOpen: true,
        type: `text_${action}` as any,
        column: col,
        targetRowIndex: selectedCell?.columnName === col ? selectedCell.rowIndex : rowIdx,
        initialCellOnly: typeof rowIdx === 'number',
      });
    } else {
      addStepToActiveQuery(
        'text_transform',
        `${t('labStepType_transform_text')} (${formatTargetSuffix(col, rowIdx)})`,
        {
          column: col,
          action,
          ...(typeof rowIdx === 'number' ? { targetRowIndex: rowIdx } : {}),
        },
        typeof rowIdx === 'number' ? t('labRowOnlyTag', { row: rowIdx + 1 }) : ''
      );
    }
  };

  // Number Transform Trigger
  const handleNumberTransform = (action: string) => {
    if (!selectedColumn) return;
    const rowIdx = selectedCell?.columnName === selectedColumn ? activeCellTargetRow : undefined;
    if (['math', 'round'].includes(action)) {
      setTransformParamModalState({
        isOpen: true,
        type: `number_${action}` as any,
        column: selectedColumn,
        targetRowIndex: selectedCell?.columnName === selectedColumn ? selectedCell.rowIndex : undefined,
        initialCellOnly: typeof rowIdx === 'number',
      });
    } else {
      addStepToActiveQuery(
        'number_transform',
        `${t('labStepType_transform_number')} (${formatTargetSuffix(selectedColumn, rowIdx)})`,
        {
          column: selectedColumn,
          action,
          ...(typeof rowIdx === 'number' ? { targetRowIndex: rowIdx } : {}),
        },
        typeof rowIdx === 'number' ? t('labRowOnlyTag', { row: rowIdx + 1 }) : ''
      );
    }
  };

  // Date Transform Trigger
  const handleDateTransform = (action: string) => {
    if (!selectedColumn) return;
    const rowIdx = selectedCell?.columnName === selectedColumn ? activeCellTargetRow : undefined;
    addStepToActiveQuery(
      'date_transform',
      `${t('labStepType_transform_date')} (${formatTargetSuffix(selectedColumn, rowIdx)})`,
      {
        column: selectedColumn,
        action,
        ...(typeof rowIdx === 'number' ? { targetRowIndex: rowIdx } : {}),
      },
      typeof rowIdx === 'number' ? t('labRowOnlyTag', { row: rowIdx + 1 }) : ''
    );
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // File Upload via shared DatasetImportModal (already persisted to DB by DatasetImportModal)
  const handleImportedDataset = (saved: Dataset) => {
    const newId = saved.id || createUniqueStepId('ds_query');
    importedRecordsRef.current.set(newId, saved);
    const sourceStepId = createUniqueStepId('step_source');
    const newQuery: QueryModel = {
      id: newId,
      name: saved.name,
      sourceType: saved.sourceType === 'excel' ? 'excel' : 'csv',
      originalDatasetId: saved.id,
      rawRows: (saved.cleanedData && saved.cleanedData.length > 0 ? saved.cleanedData : saved.data) || [],
      steps: [
        {
          id: sourceStepId,
          name: t('sourceStep'),
          type: 'source',
          description: t('labSourceImportedFrom', { name: saved.name }),
          mFormula: `= Csv.Document(File.Contents("${saved.name}"), [Delimiter=","])`,
          params: {},
        },
      ],
      selectedStepId: sourceStepId,
    };
    setQueries((prev) => [newQuery, ...prev]);
    setActiveQueryId(newId);
  };

  // CLOSE & APPLY: Save ONLY changed or newly created datasets sequentially with 90s timeout,
  // update app state with DB-returned records, and close via history.
  const handleCommitCloseAndApply = async (
    specificIdsToSave?: string[],
    closeOptions?: DataLabCloseOptions
  ) => {
    if (isApplyingRef.current) return;
    pendingCloseOptionsRef.current = closeOptions;

    if (queries.length === 0 && importedRecordsRef.current.size === 0 && savedRecordsRef.current.size === 0) {
      onClose(closeOptions);
      return;
    }

    setSaveError(null);

    const alreadySavedIds = new Set(savedRecordsRef.current.keys());
    const alreadyPersistedImportIds = new Set(importedRecordsRef.current.keys());
    const datasetsToSave = selectDirtyDatasetsToSave({
      queries,
      initialDatasets: knownBaseDatasets,
      alreadySavedIds,
      alreadyPersistedImportIds,
      specificIdsToSave,
    });

    const buildCommittedList = getCommittedDatasets;

    // Nothing dirty or new to persist
    if (datasetsToSave.length === 0) {
      const committed = buildCommittedList();
      if (committed.length === 0) {
        onClose(closeOptions);
      } else {
        onApplyAndClose(committed, closeOptions);
      }
      return;
    }

    isApplyingRef.current = true;
    setIsApplying(true);
    setSaveProgress({ current: 1, total: datasetsToSave.length });

    const batch = await commitDirtyDatasets({
      targets: datasetsToSave,
      saveFn: (targetDs, signal) => saveGlobalDataset(targetDs, signal),
      timeoutMs: DATA_LAB_SAVE_TIMEOUT_MS,
      timeoutMessage: t('labTimeoutError'),
      fallbackErrorMessage: t('labSaveFailedFallback'),
      onProgress: (current, total) => {
        setSaveProgress({ current, total });
      },
    });

    for (const savedFromDb of batch.succeeded) {
      savedRecordsRef.current.set(savedFromDb.id, savedFromDb);
      importedRecordsRef.current.delete(savedFromDb.id);
    }

    isApplyingRef.current = false;
    setIsApplying(false);
    setSaveProgress(null);

    if (batch.failures.length > 0) {
      if (closeOptions?.skipHistoryBack) {
        onCancelPopStateExit?.();
        pendingCloseOptionsRef.current = undefined;
      }
      const msg =
        batch.failures.length > 1
          ? batch.failures.map((f) => `${f.name}: ${f.message}`).join(' • ')
          : `${batch.failures[0].name}: ${batch.failures[0].message}`;
      setSaveError({
        message: msg,
        failedDatasetIds: batch.failures.map((f) => f.id),
      });
      return;
    }

    // All changed datasets saved cleanly! Pass the database-returned records to app state and close.
    onApplyAndClose(buildCommittedList(), closeOptions);
  };

  const selectedColObj = currentEvaluation.columns.find((c) => c.name === selectedColumn);

  // What each step did to the data, computed in a single pass over the pipeline.
  const trace = useMemo(
    () => (activeQuery ? tracePipeline(activeQuery.rawRows, activeQuery.steps) : []),
    [activeQuery?.rawRows, activeQuery?.steps]
  );
  const health = useMemo(() => qualityScore(currentEvaluation.columns), [currentEvaluation.columns]);
  const selectedStepIndex = Math.max(0, activeQuery?.steps.findIndex((s) => s.id === activeQuery.selectedStepId) ?? 0);

  const labActions = buildLabActions({
    newSource: () => setIsImportModalOpen(true),
    removeColumn: () => handleRemoveColumn(),
    duplicateColumn: () => handleDuplicateColumn(),
    renameColumn: () => selectedColumn && handleRenameColumn(selectedColumn),
    moveColumn: (dir) => selectedColumn && handleMoveColumn(selectedColumn, dir),
    openSplit: () => setSplitModalOpen(true),
    openMerge: () => setMergeModalOpen(true),
    openReplaceValues: () => {
      const targetCol = selectedColumn || currentEvaluation.columns[0]?.name || '';
      const isMatchingCell = Boolean(hasSelectedCell && selectedCell?.columnName === targetCol);
      const cellRaw = isMatchingCell ? currentEvaluation.rows[selectedCell!.rowIndex]?.[targetCol] : undefined;
      setReplaceValuesModalState({
        isOpen: true,
        column: targetCol,
        initialFindValue:
          isMatchingCell && cellRaw !== null && cellRaw !== undefined ? String(cellRaw) : undefined,
        targetRowIndex: isMatchingCell ? selectedCell!.rowIndex : undefined,
        initialCellOnly: isMatchingCell && operationScope === 'cell',
      });
    },
    openReplaceErrors: () => {
      const targetCol = selectedColumn || '';
      const isMatchingCell = Boolean(hasSelectedCell && selectedCell?.columnName === targetCol);
      setTransformParamModalState({
        isOpen: true,
        type: 'replace_errors',
        column: targetCol,
        targetRowIndex: isMatchingCell ? selectedCell!.rowIndex : undefined,
        initialCellOnly: isMatchingCell && operationScope === 'cell',
      });
    },
    openReplaceNulls: () => {
      const targetCol = selectedColumn || '';
      const isMatchingCell = Boolean(hasSelectedCell && selectedCell?.columnName === targetCol);
      setTransformParamModalState({
        isOpen: true,
        type: 'replace_nulls',
        column: targetCol,
        targetRowIndex: isMatchingCell ? selectedCell!.rowIndex : undefined,
        initialCellOnly: isMatchingCell && operationScope === 'cell',
      });
    },
    openRemoveDuplicates: () => setRemoveDuplicatesModalOpen(true),
    openManageRows: (action) => setManageRowsModalState({ isOpen: true, action }),
    sort: (dir) => selectedColumn && handleApplySort(selectedColumn, dir),
    fillDown: () => handleFillDown(),
    fillUp: () => handleFillUp(),
    text: (action) => handleTextTransform(action),
    number: handleNumberTransform,
    date: handleDateTransform,
    editCell: () => {
      if (hasSelectedCell) {
        setEditCellTriggerKey((k) => k + 1);
      }
    },
    clearCell: () => {
      if (hasSelectedCell && selectedCell) {
        handleEditCell(selectedCell.rowIndex, selectedCell.columnName, null);
      }
    },
    addCustomColumn: () =>
      setTransformParamModalState({
        isOpen: true,
        type: 'custom_column',
        column: selectedColumn || currentEvaluation.columns[0]?.name || '',
        availableColumns: currentEvaluation.columns.map((c) => c.name),
      }),
  }, t);

  const applySuggestion = (sg: Suggestion) => addStepToActiveQuery(sg.step.type, sg.step.name, sg.step.params, sg.detail);

  const commitRef = useRef(handleCommitCloseAndApply);
  commitRef.current = handleCommitCloseAndApply;

  // Ctrl/Cmd+K opens the action palette; Ctrl/Cmd+Enter triggers Apply & close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl?.closest?.('[role="dialog"]')) return;
        e.preventDefault();
        if (!isApplyingRef.current) {
          commitRef.current();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Expose unsaved state to router popstate handler
  useEffect(() => {
    (window as any).__hasDataLabUnsavedChanges = () => hasDataLabUnsavedChanges(queries);
    (window as any).__promptDataLabUnsaved = (source: 'button' | 'logo' | 'popstate' = 'popstate') => {
      setPromptSource(source);
      setShowUnsavedModal(true);
    };
    return () => {
      delete (window as any).__hasDataLabUnsavedChanges;
      delete (window as any).__promptDataLabUnsaved;
    };
  }, [queries]);

  return (
    <div className="w-full h-dvh bg-lab-bg flex flex-col overflow-hidden text-lab-text font-sans antialiased select-none">
      {/* TOP PROGRESS BAR DURING SAVE */}
      {saveProgress && (
        <div className="w-full h-1 bg-slate-900 overflow-hidden shrink-0 z-50">
          <div
            className="h-full bg-gradient-to-r from-pulse-500 to-sky-400 transition-all duration-300 ease-out"
            style={{ width: `${Math.round((saveProgress.current / saveProgress.total) * 100)}%` }}
          />
        </div>
      )}

      {/* STUDIO HEADER */}
      <header className="h-12 px-2.5 sm:px-4 flex items-center justify-between gap-2 shrink-0 bg-lab-bg border-b border-lab-line z-40 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {activeQuery && (
            <button
              type="button"
              onClick={() => setMobileRailOpen((v) => !v)}
              aria-expanded={mobileRailOpen}
              aria-label={t('labRailPipelineTitle')}
              className="lg:hidden h-8 px-2 sm:px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-lab-dim hover:text-lab-text hover:bg-lab-raised border border-lab-line transition-colors cursor-pointer shrink-0"
            >
              <PanelLeft className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">{t('labRailPipelineTitle')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={isApplying}
            aria-label={t('discard')}
            className={`h-8 px-2 sm:ps-2 sm:pe-3 rounded-lg flex items-center gap-1.5 text-[13px] font-semibold text-lab-dim hover:text-lab-text hover:bg-lab-raised transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isApplying ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={t('labLeaveWithoutApply')}
          >
            <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="hidden sm:inline">{t('discard')}</span>
          </button>
          <span className="hidden sm:block h-5 w-px bg-lab-line shrink-0" />
          <BrandHomeLink
            variant="datalab"
            size={15}
            onBeforeNavigate={handleBeforeLogoNavigate}
            onNavigateHome={handleConfirmedLogoNavigate}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageToggle className="h-8 py-1 text-xs" />
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={isApplying}
            className={`hidden sm:inline-flex items-center h-8 px-3 rounded-lg text-[13px] font-semibold text-lab-dim hover:text-lab-text hover:bg-lab-raised transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isApplying ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {t('discard')}
          </button>
          <button
            type="button"
            data-tour-target="apply-close"
            onClick={() => handleCommitCloseAndApply()}
            disabled={isApplying}
            className={`h-8 px-2.5 sm:px-4 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 shadow-lg shadow-sky-500/20 transition cursor-pointer whitespace-nowrap shrink-0 ${
              isApplying ? 'opacity-90 cursor-not-allowed' : ''
            }`}
            title={t('labApplyBtnTitle')}
          >
            {isApplying ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {saveProgress
                ? t('labSavingProgress', { current: saveProgress.current, total: saveProgress.total })
                : isApplying
                ? t('savingChanges')
                : t('applyAndClose')}
            </span>
          </button>
        </div>
      </header>

      {/* INLINE ERROR BANNER WITH RETRY */}
      {saveError && (
        <div
          role="alert"
          className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-xs text-rose-200 shrink-0 z-40 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium" dir="auto">{saveError.message}</span>
            <span className="text-rose-400 font-mono text-[11px]">{t('labFailedCountBadge', { count: saveError.failedDatasetIds.length })}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isApplying}
              onClick={() => handleCommitCloseAndApply(saveError.failedDatasetIds, pendingCloseOptionsRef.current)}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('retry')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              aria-label={t('close')}
              className="p-1 rounded-md text-rose-300 hover:text-white hover:bg-rose-500/20 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* COMMAND BAR */}
      <CommandBar
        actions={labActions}
        selectedColumn={selectedColumn}
        selectedType={selectedColObj?.dataType}
        selection={gridSelection}
        operationScope={operationScope}
        onChangeOperationScope={setOperationScope}
        hasSelectedCell={hasSelectedCell}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      {paletteOpen && (
        <CommandPalette
          actions={labActions}
          selectedColumn={selectedColumn}
          selectedType={selectedColObj?.dataType}
          operationScope={operationScope}
          hasSelectedCell={hasSelectedCell}
          selectedRowIndex={selectedCell?.rowIndex ?? null}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      {/* WORKSPACE: pipeline | data | inspector */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {activeQuery && mobileRailOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
            onClick={() => setMobileRailOpen(false)}
          />
        )}
        {activeQuery && (
          <div className={mobileRailOpen ? 'fixed inset-y-0 start-0 z-50 h-full flex lg:static' : 'hidden lg:flex h-full'}>
            <StepRail
              queryName={activeQuery.name}
              sourceType={activeQuery.sourceType}
              steps={activeQuery.steps}
              trace={trace}
              selectedStepId={activeQuery.selectedStepId}
              onSelectStep={(id) => {
                handleSelectStep(id);
                setMobileRailOpen(false);
              }}
              onDeleteStep={handleDeleteStep}
              onRenameStep={handleRenameStep}
              onEditStepSettings={handleEditStepSettings}
              onMoveStepUp={handleMoveStepUp}
              onMoveStepDown={handleMoveStepDown}
              onQueryNameChange={handleQueryNameChange}
              onCloseMobile={() => setMobileRailOpen(false)}
            />
          </div>
        )}

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <QueryTabs
            queries={queries}
            activeId={activeQuery?.id}
            availableDatasets={hubDatasets}
            onSelect={(id) => {
              setActiveQueryId(id);
              setSelectedColumn(null);
              setSelectedRowIndex(null);
              setSelectedCell(null);
            }}
            onAddFile={() => setIsImportModalOpen(true)}
            onNewEmptyQuery={handleNewEmptyQuery}
            onOpenDataset={handleOpenDataset}
            onCloseQuery={handleCloseQuery}
          />

          {queries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-lab-bg">
              <div className="w-14 h-14 rounded-2xl grid place-items-center bg-lab-raised border border-lab-line-strong mb-4">
                <Database className="w-6 h-6 text-pulse-400" />
              </div>
              <h3 className="text-lg font-bold">{t('allTabsClosedTitle')}</h3>
              <p className="text-[13px] text-lab-dim max-w-md mt-1.5 mb-6">
                {t('allTabsClosedDesc')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-500/20 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Upload className="w-4 h-4" /> {t('uploadFile')}
                </button>
                <button
                  type="button"
                  onClick={handleNewEmptyQuery}
                  className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-200 bg-lab-panel border border-lab-line-strong hover:bg-lab-raised hover:text-white transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> {t('newEmptyQuery')}
                </button>
              </div>

              {hubDatasets.length > 0 && (
                <div className="mt-8 pt-6 border-t border-lab-line w-full max-w-md">
                  <div className="text-[11px] font-semibold text-lab-faint uppercase tracking-wider mb-3">
                    {t('openExistingDataset')}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-h-36 overflow-y-auto lab-scroll">
                    {hubDatasets.map((ds) => (
                      <button
                        key={ds.id}
                        type="button"
                        onClick={() => handleOpenDataset(ds)}
                        className="px-3 py-1.5 rounded-lg bg-lab-panel border border-lab-line hover:border-lab-line-strong text-xs text-lab-text hover:bg-lab-raised flex items-center gap-2 transition cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5 text-blue-400" />
                        <span dir="auto" className="truncate max-w-48">{ds.name}</span>
                        <span className="text-[10px] text-lab-dim font-mono" dir="ltr">{ds.rowCount}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <DataGridPreview
              columns={currentEvaluation.columns}
              rows={currentEvaluation.rows}
              queryId={activeQuery?.id}
              resetSelectionKey={`${activeQuery?.id || ''}:${gridResetCounter}`}
              selectedColumn={selectedColumn}
              selectedRowIndex={selectedRowIndex}
              selectedCell={selectedCell}
              showQualityBar
              onSelectColumn={(col) => {
                setSelectedColumn(col);
                if (col) {
                  setSelectedRowIndex(null);
                }
              }}
              onSelectRow={(r) => {
                setSelectedRowIndex(r);
                if (r !== null) {
                  setSelectedColumn(null);
                  setSelectedCell(null);
                }
              }}
              onSelectCell={(c) => {
                setSelectedCell(c);
                if (c) {
                  setSelectedRowIndex(null);
                }
              }}
              onSelectionChange={setGridSelection}
              onRemoveRows={handleRemoveSelectedRows}
              onKeepOnlyRows={handleKeepOnlySelectedRows}
              onChangeDataType={handleChangeDataType}
              onRenameColumn={handleRenameColumn}
              onRemoveColumn={handleRemoveColumn}
              onDuplicateColumn={handleDuplicateColumn}
              onMoveColumn={handleMoveColumn}
              onApplySort={handleApplySort}
              onApplyFilter={handleApplyFilter}
              onOpenSplitColumn={() => setSplitModalOpen(true)}
              onOpenReplaceValues={(col, initialFindValue, targetRowIndex) =>
                setReplaceValuesModalState({
                  isOpen: true,
                  column: col,
                  initialFindValue,
                  targetRowIndex:
                    typeof targetRowIndex === 'number'
                      ? targetRowIndex
                      : selectedCell?.columnName === col
                      ? selectedCell.rowIndex
                      : undefined,
                  initialCellOnly:
                    typeof targetRowIndex === 'number' ||
                    (operationScope === 'cell' && selectedCell?.columnName === col),
                })
              }
              onOpenReplaceErrors={(col, targetRowIndex) =>
                setTransformParamModalState({
                  isOpen: true,
                  type: 'replace_errors',
                  column: col || selectedColumn || '',
                  targetRowIndex:
                    typeof targetRowIndex === 'number'
                      ? targetRowIndex
                      : selectedCell?.columnName === (col || selectedColumn)
                      ? selectedCell?.rowIndex
                      : undefined,
                  initialCellOnly:
                    typeof targetRowIndex === 'number' ||
                    (operationScope === 'cell' && selectedCell?.columnName === (col || selectedColumn)),
                })
              }
              onFillDown={handleFillDown}
              onFillUp={handleFillUp}
              operationScope={operationScope}
              onChangeOperationScope={setOperationScope}
              onEditCell={handleEditCell}
              onSingleCellTextTransform={(rowIndex, columnName, action) =>
                handleTextTransform(action, { rowIndex, columnName })
              }
              editCellTriggerKey={editCellTriggerKey}
            />
          )}

          {activeQuery && (
            <LabStatusBar
              rows={currentEvaluation.totalRows}
              columns={currentEvaluation.totalColumns}
              errors={currentEvaluation.totalErrors}
              stepIndex={selectedStepIndex}
              stepCount={activeQuery.steps.length}
              stepName={currentStep?.name || t('sourceStep')}
              formula={activeFormula}
              score={health}
              selectionSummaryText={formatSelectionSummary(
                gridSelection,
                currentEvaluation.columns,
                currentEvaluation.rows,
                t
              )}
              inspectorOpen={inspectorOpen}
              onToggleInspector={() => setInspectorOpen((v) => !v)}
            />
          )}
        </main>

        {activeQuery && queries.length > 0 && inspectorOpen && (
          <>
            <div
              className="xl:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
              onClick={() => setInspectorOpen(false)}
            />
            <div className="fixed inset-y-0 end-0 z-50 h-full flex xl:static">
              <ColumnInspector
                columns={currentEvaluation.columns}
                rows={currentEvaluation.rows}
                selectedColumn={selectedColumn}
                onApply={applySuggestion}
                onSelectColumn={setSelectedColumn}
                onClose={() => setInspectorOpen(false)}
              />
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Split Column Modal */}
      {splitModalOpen && (
        <SplitColumnModal
          isOpen={splitModalOpen}
          column={selectedColumn || currentEvaluation.columns[0]?.name || ''}
          sampleRows={currentEvaluation.rows}
          onClose={() => setSplitModalOpen(false)}
          onApply={(params) => {
            addStepToActiveQuery('split_column', `${t('labStepType_split_column')} (${params.column})`, params);
          }}
        />
      )}

      {/* 2. Merge Columns Modal */}
      {mergeModalOpen && (
        <MergeColumnsModal
          isOpen={mergeModalOpen}
          availableColumns={currentEvaluation.columns.map((c) => c.name)}
          initialSelectedColumns={selectedColumn ? [selectedColumn] : []}
          sampleRows={currentEvaluation.rows}
          onClose={() => setMergeModalOpen(false)}
          onApply={(params) => {
            addStepToActiveQuery('merge_columns', `${t('labStepType_merged_columns')} (${params.newColumnName})`, params);
          }}
        />
      )}

      {/* 3. Replace Values Modal */}
      {replaceValuesModalState.isOpen && (
        <ReplaceValuesModal
          isOpen={replaceValuesModalState.isOpen}
          column={replaceValuesModalState.column || selectedColumn || currentEvaluation.columns[0]?.name || ''}
          initialFindValue={replaceValuesModalState.initialFindValue}
          targetRowIndex={replaceValuesModalState.targetRowIndex}
          initialCellOnly={replaceValuesModalState.initialCellOnly}
          sampleRows={currentEvaluation.rows}
          onClose={() => setReplaceValuesModalState({ isOpen: false })}
          onApply={(params) => {
            const labelCol = formatTargetSuffix(params.column, params.targetRowIndex);
            addStepToActiveQuery(
              'replace_values',
              `${t('labStepType_replace_values')} (${labelCol})`,
              params,
              typeof params.targetRowIndex === 'number'
                ? t('labRowOnlyTag', { row: params.targetRowIndex + 1 })
                : ''
            );
          }}
        />
      )}

      {/* 4. Remove Duplicates Modal */}
      {removeDuplicatesModalOpen && (
        <RemoveDuplicatesModal
          isOpen={removeDuplicatesModalOpen}
          columns={currentEvaluation.columns.map((c) => c.name)}
          initialSelectedColumns={selectedColumn ? [selectedColumn] : []}
          onClose={() => setRemoveDuplicatesModalOpen(false)}
          onApply={(selectedCols) => {
            addStepToActiveQuery('remove_duplicates', t('labStepType_remove_duplicates'), { columns: selectedCols });
          }}
        />
      )}

      {/* 5. Manage Rows Modal */}
      {manageRowsModalState.isOpen && (
        <ManageRowsModal
          isOpen={manageRowsModalState.isOpen}
          actionType={manageRowsModalState.action}
          totalRows={currentEvaluation.totalRows}
          onClose={() => setManageRowsModalState((prev) => ({ ...prev, isOpen: false }))}
          onApply={(params) => {
            if (params.action === 'remove_blank') {
              addStepToActiveQuery('remove_rows', t('labStepType_remove_blank_rows'), { action: 'remove_blank' });
            } else if (params.action.startsWith('keep_')) {
              const keepTitle =
                params.action === 'keep_top'
                  ? t('labStepType_kept_top_rows')
                  : params.action === 'keep_bottom'
                  ? t('labStepType_kept_bottom_rows')
                  : t('labStepType_kept_range_rows');
              addStepToActiveQuery('keep_rows', keepTitle, params);
            } else {
              const removeTitle =
                params.action === 'remove_top'
                  ? t('labStepType_removed_top_rows')
                  : params.action === 'remove_bottom'
                  ? t('labStepType_removed_bottom_rows')
                  : t('labStepType_removed_alternate_rows');
              addStepToActiveQuery('remove_rows', removeTitle, params);
            }
          }}
        />
      )}

      {/* 6. Transform Parameters Modal */}
      {transformParamModalState.isOpen && (
        <TransformParamModal
          isOpen={transformParamModalState.isOpen}
          type={transformParamModalState.type}
          column={transformParamModalState.column || selectedColumn || ''}
          initialValue={transformParamModalState.initialValue}
          initialValue2={transformParamModalState.initialValue2}
          availableColumns={currentEvaluation.columns.map((c) => c.name)}
          targetRowIndex={transformParamModalState.targetRowIndex}
          initialCellOnly={transformParamModalState.initialCellOnly}
          onClose={() => setTransformParamModalState((prev) => ({ ...prev, isOpen: false }))}
          onApply={(params) => {
            const rowNote =
              typeof params.targetRowIndex === 'number'
                ? t('labRowOnlyTag', { row: params.targetRowIndex + 1 })
                : '';
            const labelCol = formatTargetSuffix(params.column || '', params.targetRowIndex);

            if (transformParamModalState.type === 'rename_step') {
              setQueries((prev) =>
                prev.map((q) =>
                  q.id === activeQuery.id
                    ? {
                        ...q,
                        steps: q.steps.map((s) =>
                          s.id === activeQuery.selectedStepId ? { ...s, name: params.newName } : s
                        ),
                      }
                    : q
                )
              );
            } else if (transformParamModalState.type === 'rename_column') {
              addStepToActiveQuery('rename_column', `${t('labStepType_renamed_column')} (${params.newName})`, params);
            } else if (transformParamModalState.type === 'replace_errors') {
              addStepToActiveQuery('replace_errors', `${t('labStepType_replace_errors')} (${labelCol})`, params, rowNote);
            } else if (transformParamModalState.type === 'replace_nulls') {
              addStepToActiveQuery('replace_nulls', `${t('labStepMeta_fill_empty')} (${labelCol})`, params, rowNote);
            } else if (transformParamModalState.type.startsWith('text_')) {
              addStepToActiveQuery('text_transform', `${t('labStepType_transform_text')} (${labelCol})`, params, rowNote);
            } else if (transformParamModalState.type.startsWith('number_')) {
              addStepToActiveQuery('number_transform', `${t('labStepType_transform_number')} (${labelCol})`, params, rowNote);
            } else if (transformParamModalState.type === 'custom_column') {
              addStepToActiveQuery('add_custom_column', `${t('labStepType_added_custom_column')} (${params.newColumnName})`, params);
            }
          }}
        />
      )}

      {/* CONFIRMATION MODAL: UNSAVED CHANGES */}
      <Modal
        isOpen={showUnsavedModal}
        onClose={() => {
          setShowUnsavedModal(false);
          if (promptSource === 'popstate') {
            onCancelPopStateExit?.();
          }
          setPromptSource('button');
        }}
        title={t('unsavedChangesTitle')}
        icon={
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 grid place-items-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        }
        size="md"
        theme="dark"
        closeLabel={t('close')}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="!bg-transparent !border-slate-700 !text-slate-200 hover:!bg-slate-800"
              onClick={() => {
                setShowUnsavedModal(false);
                if (promptSource === 'popstate') {
                  onCancelPopStateExit?.();
                }
                setPromptSource('button');
              }}
            >
              {t('continueEditing')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="!bg-rose-500/15 !text-rose-300 border border-rose-500/30 hover:!bg-rose-500/25"
              onClick={() => {
                setShowUnsavedModal(false);
                const source = promptSource;
                setPromptSource('button');
                const committed = getCommittedDatasets();
                const extra = committed.length > 0 ? { committedDatasets: committed } : {};
                if (source === 'logo') {
                  onClose({ navigateHome: true, ...extra });
                } else if (source === 'popstate') {
                  onClose({ skipHistoryBack: true, ...extra });
                } else {
                  onClose(committed.length > 0 ? extra : undefined);
                }
              }}
            >
              {t('discardChanges')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                setShowUnsavedModal(false);
                const source = promptSource;
                setPromptSource('button');
                const closeOpts: DataLabCloseOptions | undefined =
                  source === 'logo'
                    ? { navigateHome: true }
                    : source === 'popstate'
                    ? { skipHistoryBack: true }
                    : undefined;
                await handleCommitCloseAndApply(undefined, closeOpts);
              }}
            >
              {t('saveAndApply')}
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-300 leading-relaxed">{t('unsavedChangesDesc')}</p>
      </Modal>

      {/* CONFIRMATION MODAL: CLOSE DATASET */}
      <Modal
        isOpen={Boolean(queryToClose)}
        onClose={() => setQueryToClose(null)}
        title={t('closeDatasetConfirmTitle')}
        icon={
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 grid place-items-center text-rose-400">
            <Trash2 className="w-4 h-4" />
          </div>
        }
        size="md"
        theme="dark"
        closeLabel={t('close')}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="!bg-transparent !border-slate-700 !text-slate-200 hover:!bg-slate-800"
              onClick={() => setQueryToClose(null)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => queryToClose && performCloseQuery(queryToClose)}
            >
              {t('closeDataset')}
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-300 leading-relaxed">{t('closeDatasetConfirmDesc')}</p>
      </Modal>

      {isImportModalOpen && (
        <DatasetImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onDatasetImported={handleImportedDataset}
        />
      )}
    </div>
  );
};
