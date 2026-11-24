import React, { useState } from 'react';
import { Dataset, DashboardState } from '../../types/dashboard';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Database,
  Check,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { Modal, Button, Input } from '../../ui';

interface Props {
  isOpen: boolean;
  globalDatasets: Dataset[];
  selectedDatasetIds: string[];
  currentDashboard: DashboardState;
  onClose: () => void;
  onApplySelection: (selectedIds: string[]) => void;
}

export const SelectDatasetsModal: React.FC<Props> = ({
  isOpen,
  globalDatasets,
  selectedDatasetIds,
  currentDashboard,
  onClose,
  onApplySelection,
}) => {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (selectedDatasetIds && selectedDatasetIds.length > 0) {
      return selectedDatasetIds;
    }
    return globalDatasets.map((d) => d.id);
  });

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allTags = Array.from(
    new Set(globalDatasets.flatMap((d) => d.tags || []))
  );

  const filteredDatasets = globalDatasets.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()));

    const matchesTag =
      selectedTag === 'all' || (d.tags && d.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const deselectedIds = globalDatasets
    .map((d) => d.id)
    .filter((id) => !selectedIds.includes(id));

  const affectedWidgets = currentDashboard.widgets.filter((w) =>
    deselectedIds.includes(w.config.datasetId)
  );

  const handleApply = () => {
    onApplySelection(selectedIds);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="shrink-0">{t('selectDatasets')} —</span>
          <span dir="auto" className="truncate font-extrabold">&quot;{currentDashboard.name}&quot;</span>
        </span>
      }
      subtitle={t('selectDatasetsSubtitle')}
      closeLabel={t('close')}
      icon={
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 grid place-items-center">
          <Database className="w-4 h-4" />
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleApply}
            disabled={selectedIds.length === 0}
          >
            {t('applySelectionBtn')} ({selectedIds.length})
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-slate-700">
        {/* Search & Tag Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
            <Input
              type="text"
              controlSize="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchGlobalDatasetsPlaceholder')}
              className="h-9 ps-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0 max-w-full">
            <button
              type="button"
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                selectedTag === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('all')} ({globalDatasets.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  selectedTag === tag
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Selection Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <span>
            <strong className="tabular-nums">{selectedIds.length}</strong> / {globalDatasets.length} {t('datasets')}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedIds(globalDatasets.map((d) => d.id))}
              className="text-sky-600 hover:underline font-bold cursor-pointer"
            >
              {t('selectAllRows')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-slate-500 hover:underline font-bold cursor-pointer"
            >
              {t('clearSelection')}
            </button>
          </div>
        </div>

        {/* Dataset Cards List */}
        <div className="space-y-2">
          {filteredDatasets.map((ds) => {
            const isSelected = selectedIds.includes(ds.id);

            return (
              <button
                type="button"
                key={ds.id}
                onClick={() => toggleSelect(ds.id)}
                className={`w-full text-start p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-sky-50/70 border-sky-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span dir="auto" className="font-bold text-slate-900 text-sm truncate max-w-full">
                      {ds.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 uppercase shrink-0">
                      {ds.sourceType}
                    </span>
                  </div>

                  {ds.description && (
                    <p dir="auto" className="text-slate-500 text-[11px] line-clamp-2">
                      {ds.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-400 font-medium">
                    <span className="tabular-nums">
                      {(Number(ds?.rowCount ?? (ds as any)?.row_count ?? (ds?.data?.length || 0)) || 0).toLocaleString()} {t('rows')}
                    </span>
                    <span>•</span>
                    <span className="tabular-nums">
                      {Number(ds?.columnCount ?? (ds as any)?.column_count ?? (ds?.columns?.length || 0)) || 0} {t('columns')}
                    </span>
                    {ds.tags && ds.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ds.tags.map((tTag) => (
                          <span
                            key={tTag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold"
                          >
                            {tTag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Warning if deselected datasets affect widgets */}
        {affectedWidgets.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              <strong>{t('warningDeselectedInUse')}</strong> {affectedWidgets.length} {t('widgets')}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
