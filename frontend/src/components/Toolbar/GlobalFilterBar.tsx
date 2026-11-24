import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DataFilter, Dataset, DatasetColumn } from '../../types/dashboard';
import { applyFilters } from '../../utils/dataProcessor';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../ui';
import {
  Plus,
  X,
  Search,
  ChevronLeft,
  AlertTriangle,
  Check,
  Filter,
} from 'lucide-react';

interface Props {
  datasets: Dataset[];
  globalFilters: DataFilter[];
  onUpdateGlobalFilters: (filters: DataFilter[]) => void;
  isPopoverOpenExternal?: boolean;
  onClosePopoverExternal?: () => void;
  droppedLegacyCount?: number;
  onDismissDroppedNotice?: () => void;
}

interface TargetColumn {
  datasetId: string;
  datasetName: string;
  column: string;
  type: DatasetColumn['type'];
}

const MAX_DISTINCT_VALUES = 200;

function isFilterActive(f: DataFilter): boolean {
  if (!f || !f.column) return false;
  const hasValues = Array.isArray(f.values) && f.values.length > 0;
  const hasMin = typeof f.min === 'number' && Number.isFinite(f.min);
  const hasMax = typeof f.max === 'number' && Number.isFinite(f.max);
  return hasValues || hasMin || hasMax;
}

function formatFilterSummary(f: DataFilter): string {
  if (Array.isArray(f.values) && f.values.length > 0) {
    if (f.values.length <= 2) {
      return f.values.map(String).join(', ');
    }
    return `${f.values.slice(0, 2).map(String).join(', ')} +${f.values.length - 2}`;
  }
  const hasMin = typeof f.min === 'number' && Number.isFinite(f.min);
  const hasMax = typeof f.max === 'number' && Number.isFinite(f.max);
  if (hasMin && hasMax) return `${f.min} – ${f.max}`;
  if (hasMin) return `≥ ${f.min}`;
  if (hasMax) return `≤ ${f.max}`;
  return '';
}

function sameFilterTarget(
  f: DataFilter,
  datasetId: string,
  column: string,
  fallbackDatasetId?: string
): boolean {
  if (f.column !== column) return false;
  const filterDsId = f.datasetId || fallbackDatasetId;
  return filterDsId === datasetId;
}

export const GlobalFilterBar: React.FC<Props> = ({
  datasets = [],
  globalFilters = [],
  onUpdateGlobalFilters,
  isPopoverOpenExternal,
  onClosePopoverExternal,
  droppedLegacyCount = 0,
  onDismissDroppedNotice,
}) => {
  const { t } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isPopoverOpenExternal !== undefined ? isPopoverOpenExternal : internalOpen;

  const [step, setStep] = useState<'column' | 'value'>('column');
  const [colSearch, setColSearch] = useState('');
  const [valSearch, setValSearch] = useState('');
  const [target, setTarget] = useState<TargetColumn | null>(null);
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>([]);
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  const anchorRef = useRef<HTMLDivElement>(null);

  const activeFilters = useMemo(
    () => globalFilters.filter(isFilterActive),
    [globalFilters]
  );

  const closePopover = () => {
    setInternalOpen(false);
    setStep('column');
    setColSearch('');
    setValSearch('');
    setTarget(null);
    onClosePopoverExternal?.();
  };

  const openColumnStep = () => {
    setStep('column');
    setColSearch('');
    setValSearch('');
    setTarget(null);
    setInternalOpen(true);
  };

  const openValueStep = (colTarget: TargetColumn) => {
    const existing = activeFilters.find((f) =>
      sameFilterTarget(f, colTarget.datasetId, colTarget.column, datasets[0]?.id)
    );
    setTarget(colTarget);
    setValSearch('');
    if (colTarget.type === 'number') {
      setMinInput(typeof existing?.min === 'number' ? String(existing.min) : '');
      setMaxInput(typeof existing?.max === 'number' ? String(existing.max) : '');
      setSelectedValues([]);
    } else {
      setSelectedValues(existing?.values ? [...existing.values] : []);
      setMinInput('');
      setMaxInput('');
    }
    setStep('value');
    setInternalOpen(true);
  };

  // Sync external trigger (TopToolbar "Global Filters" button)
  useEffect(() => {
    if (isPopoverOpenExternal) {
      setStep('column');
      setColSearch('');
      setValSearch('');
      setTarget(null);
      setInternalOpen(true);
    } else if (isPopoverOpenExternal === false) {
      setInternalOpen(false);
    }
  }, [isPopoverOpenExternal]);

  // Escape & outside-click to close popover
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closePopover();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('[data-tour-target="filters-btn"]')) return;
      if (anchorRef.current && !anchorRef.current.contains(targetEl)) {
        closePopover();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  });

  // Row count summary for primary dataset
  const primaryDataset = datasets[0];
  const primaryData = primaryDataset?.cleanedData?.length
    ? primaryDataset.cleanedData
    : primaryDataset?.data || [];
  const applicablePrimaryFilters = useMemo(
    () =>
      activeFilters.filter(
        (f) => !f.datasetId || f.datasetId === primaryDataset?.id
      ),
    [activeFilters, primaryDataset?.id]
  );
  const filteredRows = primaryDataset
    ? applyFilters(primaryData, applicablePrimaryFilters).length
    : 0;
  const totalRows =
    primaryDataset?.rowCount ??
    (primaryDataset as any)?.row_count ??
    primaryData.length ??
    0;

  // Distinct values for text/date columns (capped at 200)
  const distinctInfo = useMemo(() => {
    if (!target || target.type === 'number') {
      return { values: [] as (string | number)[], truncated: false };
    }
    const ds = datasets.find((d) => d.id === target.datasetId);
    const rows = ds?.cleanedData?.length ? ds.cleanedData : ds?.data || [];
    const seen = new Map<string, string | number>();
    let truncated = false;

    for (const row of rows) {
      const raw = row[target.column];
      if (raw === undefined || raw === null) continue;
      const str = String(raw).trim();
      if (!str) continue;
      const key = str.toLowerCase();
      if (!seen.has(key)) {
        if (seen.size >= MAX_DISTINCT_VALUES) {
          truncated = true;
          break;
        }
        seen.set(key, typeof raw === 'number' ? raw : str);
      }
    }

    const sorted = Array.from(seen.values()).sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
    );
    return { values: sorted, truncated };
  }, [datasets, target]);

  const visibleDistinctValues = useMemo(() => {
    const q = valSearch.trim().toLowerCase();
    if (!q) return distinctInfo.values;
    return distinctInfo.values.filter((v) => String(v).toLowerCase().includes(q));
  }, [distinctInfo.values, valSearch]);

  const filteredDatasetGroups = useMemo(() => {
    const q = colSearch.trim().toLowerCase();
    return datasets
      .map((ds) => ({
        dataset: ds,
        columns: (ds.columns || []).filter(
          (c) =>
            !q ||
            c.name.toLowerCase().includes(q) ||
            ds.name.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.columns.length > 0);
  }, [datasets, colSearch]);

  const handleToggleValue = (val: string | number) => {
    const key = String(val).trim().toLowerCase();
    setSelectedValues((prev) => {
      const exists = prev.some((v) => String(v).trim().toLowerCase() === key);
      if (exists) {
        return prev.filter((v) => String(v).trim().toLowerCase() !== key);
      }
      return [...prev, val];
    });
  };

  const handleApplyFilter = () => {
    if (!target) return;

    const existingIdx = globalFilters.findIndex((f) =>
      sameFilterTarget(f, target.datasetId, target.column, datasets[0]?.id)
    );

    let nextFilter: DataFilter | null = null;
    if (target.type === 'number') {
      const parsedMin = minInput.trim() !== '' ? Number(minInput.trim()) : undefined;
      const parsedMax = maxInput.trim() !== '' ? Number(maxInput.trim()) : undefined;
      const validMin = parsedMin !== undefined && Number.isFinite(parsedMin) ? parsedMin : undefined;
      const validMax = parsedMax !== undefined && Number.isFinite(parsedMax) ? parsedMax : undefined;

      if (validMin !== undefined || validMax !== undefined) {
        nextFilter = {
          id: existingIdx >= 0 ? globalFilters[existingIdx].id : `filter_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          datasetId: target.datasetId,
          column: target.column,
          ...(validMin !== undefined ? { min: validMin } : {}),
          ...(validMax !== undefined ? { max: validMax } : {}),
        };
      }
    } else if (selectedValues.length > 0) {
      nextFilter = {
        id: existingIdx >= 0 ? globalFilters[existingIdx].id : `filter_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        datasetId: target.datasetId,
        column: target.column,
        values: selectedValues,
      };
    }

    let nextFilters: DataFilter[];
    if (!nextFilter) {
      nextFilters = globalFilters.filter((_, idx) => idx !== existingIdx);
    } else if (existingIdx >= 0) {
      nextFilters = globalFilters.map((f, idx) => (idx === existingIdx ? nextFilter! : f));
    } else {
      nextFilters = [...globalFilters, nextFilter];
    }

    onUpdateGlobalFilters(nextFilters);
    closePopover();
  };

  const handleRemoveFilter = (filterId: string) => {
    onUpdateGlobalFilters(globalFilters.filter((f) => f.id !== filterId));
  };

  const handleEditChip = (f: DataFilter) => {
    const ds =
      datasets.find((d) => d.id === f.datasetId) ||
      datasets.find((d) => d.columns?.some((c) => c.name === f.column)) ||
      datasets[0];
    if (!ds) return;
    const colMeta = ds.columns?.find((c) => c.name === f.column);
    openValueStep({
      datasetId: ds.id,
      datasetName: ds.name,
      column: f.column,
      type: colMeta?.type || (typeof f.min === 'number' || typeof f.max === 'number' ? 'number' : 'string'),
    });
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 z-10 shadow-2xs">
      <div className="px-4 py-1.5 flex items-center justify-between gap-3 text-xs">
        {/* Start: Add Filter Popover Anchor + Active Filter Chips */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative shrink-0" ref={anchorRef}>
            <Button
              variant={activeFilters.length > 0 ? 'lab' : 'secondary'}
              size="sm"
              onClick={() => (isOpen ? closePopover() : openColumnStep())}
              icon={<Plus className="w-3.5 h-3.5" />}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
            >
              {t('filterAddBtn')}
            </Button>

            {isOpen && (
              <div
                role="dialog"
                aria-label={step === 'column' ? t('filterChooseColumn') : target?.column || t('filterAddBtn')}
                className="absolute top-full start-0 mt-1.5 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-xs text-slate-800"
              >
                {step === 'column' ? (
                  <div className="flex flex-col max-h-96">
                    <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-sky-600" />
                        <span>{t('filterChooseColumn')}</span>
                      </span>
                      <button
                        type="button"
                        onClick={closePopover}
                        aria-label={t('close')}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {datasets.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">
                        {t('filterNoColumns')}
                      </div>
                    ) : (
                      <>
                        <div className="p-2 border-b border-slate-100">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              autoFocus
                              value={colSearch}
                              onChange={(e) => setColSearch(e.target.value)}
                              placeholder={t('filterSearchColumns')}
                              aria-label={t('filterSearchColumns')}
                              dir="auto"
                              className="w-full ps-8 pe-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>

                        <div className="overflow-y-auto p-1.5 space-y-2">
                          {filteredDatasetGroups.length === 0 ? (
                            <div className="p-3 text-center text-slate-400">
                              {t('filterNoValues')}
                            </div>
                          ) : (
                            filteredDatasetGroups.map(({ dataset: ds, columns }) => (
                              <div key={ds.id} className="space-y-0.5">
                                {datasets.length > 1 && (
                                  <div
                                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                                    dir="auto"
                                  >
                                    {ds.name}
                                  </div>
                                )}
                                {columns.map((col) => {
                                  const hasActive = activeFilters.some((f) =>
                                    sameFilterTarget(f, ds.id, col.name, datasets[0]?.id)
                                  );
                                  return (
                                    <button
                                      key={`${ds.id}_${col.name}`}
                                      type="button"
                                      onClick={() =>
                                        openValueStep({
                                          datasetId: ds.id,
                                          datasetName: ds.name,
                                          column: col.name,
                                          type: col.type,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-sky-50 text-start flex items-center justify-between gap-2 transition-colors cursor-pointer"
                                    >
                                      <span className="font-medium text-slate-800 truncate flex items-center gap-1.5" dir="auto">
                                        {hasActive && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" />
                                        )}
                                        <span className="truncate">{col.name}</span>
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                        {col.type}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => setStep('column')}
                          aria-label={t('filterChooseColumn')}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md cursor-pointer shrink-0"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                        </button>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate" dir="auto">
                            {target?.column}
                          </div>
                          {datasets.length > 1 && target?.datasetName && (
                            <div className="text-[10px] text-slate-400 truncate" dir="auto">
                              {target.datasetName}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={closePopover}
                        aria-label={t('close')}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {target?.type === 'number' ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleApplyFilter();
                        }}
                        className="p-3 space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <label className="space-y-1">
                            <span className="text-[11px] font-semibold text-slate-600 block">
                              {t('filterFromLabel')}
                            </span>
                            <input
                              type="number"
                              step="any"
                              autoFocus
                              value={minInput}
                              onChange={(e) => setMinInput(e.target.value)}
                              placeholder="—"
                              aria-label={t('filterFromLabel')}
                              dir="ltr"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[11px] font-semibold text-slate-600 block">
                              {t('filterToLabel')}
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={maxInput}
                              onChange={(e) => setMaxInput(e.target.value)}
                              placeholder="—"
                              aria-label={t('filterToLabel')}
                              dir="ltr"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                            />
                          </label>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button variant="ghost" size="sm" onClick={closePopover}>
                            {t('filterCancel')}
                          </Button>
                          <Button type="submit" variant="primary" size="sm">
                            {t('filterApply')}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col">
                        <div className="p-2 border-b border-slate-100 space-y-1.5">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              autoFocus
                              value={valSearch}
                              onChange={(e) => setValSearch(e.target.value)}
                              placeholder={t('filterSearchValues')}
                              aria-label={t('filterSearchValues')}
                              dir="auto"
                              className="w-full ps-8 pe-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          {visibleDistinctValues.length > 0 && (
                            <div className="flex items-center justify-between px-1 text-[11px]">
                              <button
                                type="button"
                                onClick={() => setSelectedValues(visibleDistinctValues)}
                                className="text-sky-600 hover:underline font-semibold cursor-pointer"
                              >
                                {t('filterSelectVisible')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedValues([])}
                                className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                              >
                                {t('filterClearValues')}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                          {visibleDistinctValues.length === 0 ? (
                            <div className="p-3 text-center text-slate-400">
                              {t('filterNoValues')}
                            </div>
                          ) : (
                            visibleDistinctValues.map((val) => {
                              const key = String(val).trim().toLowerCase();
                              const checked = selectedValues.some(
                                (v) => String(v).trim().toLowerCase() === key
                              );
                              return (
                                <label
                                  key={String(val)}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleValue(val)}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                  />
                                  <span className="truncate text-slate-700" dir="auto">
                                    {String(val)}
                                  </span>
                                  {checked && (
                                    <Check className="w-3 h-3 text-sky-600 ms-auto shrink-0" />
                                  )}
                                </label>
                              );
                            })
                          )}
                        </div>

                        {distinctInfo.truncated && (
                          <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400">
                            {t('filterValuesLimitHint')}
                          </div>
                        )}

                        <div className="p-2.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/60">
                          <Button variant="ghost" size="sm" onClick={closePopover}>
                            {t('filterCancel')}
                          </Button>
                          <Button variant="primary" size="sm" onClick={handleApplyFilter}>
                            {t('filterApply')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 min-w-0">
            {activeFilters.map((f) => {
              const summary = formatFilterSummary(f);
              const fullTitle = f.values?.length
                ? `${f.column}: ${f.values.join(', ')}`
                : `${f.column}: ${summary}`;
              return (
                <div
                  key={f.id}
                  title={fullTitle}
                  className="inline-flex items-center gap-1 ps-2.5 pe-1.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-900 text-[11px] font-semibold shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => handleEditChip(f)}
                    aria-label={t('filterEditChipAria', { column: f.column })}
                    className="hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="font-bold" dir="auto">
                      {f.column}:
                    </span>
                    <span dir="auto">{summary}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFilter(f.id)}
                    aria-label={t('filterRemoveChipAria', { column: f.column })}
                    className="p-0.5 text-sky-600/70 hover:text-rose-600 rounded-full cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* End: Row Counter & Clear All */}
        <div className="flex items-center gap-2 shrink-0">
          {primaryDataset && (
            <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
              {t('filterRowsOf', {
                filtered: (Number(filteredRows) || 0).toLocaleString(),
                total: (Number(totalRows) || 0).toLocaleString(),
              })}
            </span>
          )}

          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateGlobalFilters([])}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              {t('filterBarClearAll')}
            </Button>
          )}
        </div>
      </div>

      {/* One-time dismissible notice if legacy filters were dropped during migration */}
      {droppedLegacyCount > 0 && (
        <div
          role="status"
          className="px-4 py-1.5 bg-amber-50 border-t border-amber-200/80 text-amber-900 text-[11px] font-medium flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{t('filterLegacyDroppedNotice', { count: droppedLegacyCount })}</span>
          </span>
          {onDismissDroppedNotice && (
            <button
              type="button"
              onClick={onDismissDroppedNotice}
              aria-label={t('close')}
              className="p-0.5 text-amber-700 hover:text-amber-950 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
