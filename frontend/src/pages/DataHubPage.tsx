import React, { useMemo, useState } from 'react';
import { User } from '../types/auth';
import { Dataset } from '../types/dashboard';
import { columnTypeMix, datasetHealth } from '../utils/columnProfile';
import { AppNavbar } from '../components/Navbar/AppNavbar';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Button, Card, EmptyState, Modal, PageHeader, StatCard, cx } from '../ui';
import { DatasetImportModal } from '../components/Import/DatasetImportModal';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Database, Search, Table, UploadCloud, Trash2, LayoutGrid, Clock, BarChart3, Wand2, FlaskConical, AlertTriangle, TrendingUp,
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  globalDatasets: Dataset[];
  onLogout: () => void;
  onNavigate: (page: 'home' | 'login' | 'signup' | 'dashboard_hub' | 'bench' | 'sample_graphs' | 'data_hub' | 'forecasts', dashboardId?: string) => void;
  onOpenDataCleaning: (datasetId: string) => void;
  onInspectDataset: (dataset: Dataset) => void;
  onAddGlobalDataset: (newDataset: Dataset) => void;
  onDeleteGlobalDataset: (datasetId: string) => void;
  onCreateDashboardWithDataset: (datasetId: string) => void;
}

export const DataHubPage: React.FC<Props> = ({
  currentUser,
  globalDatasets,
  onLogout,
  onNavigate,
  onOpenDataCleaning,
  onInspectDataset,
  onAddGlobalDataset,
  onDeleteGlobalDataset,
  onCreateDashboardWithDataset,
}) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pendingDeleteDataset, setPendingDeleteDataset] = useState<Dataset | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

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

  const totalRecords = (globalDatasets || []).reduce((acc, d) => {
    const rows = d?.rowCount ?? (d as any)?.row_count ?? (Array.isArray(d?.data) ? d.data.length : 0);
    return acc + (Number(rows) || 0);
  }, 0);
  const totalCleaned = (globalDatasets || []).filter((d) => Boolean(d && d.cleaningPipeline && d.cleaningPipeline.length > 0)).length;

  const handleDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setImportFile(file);
      setIsImportModalOpen(true);
    }
  };

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f7f9fc] text-navy-900 flex flex-col relative">
      <AnimatedBackground variant="subtle" />
      <AppNavbar
        active="data_hub"
        currentUser={currentUser}
        onNavigate={onNavigate}
        onLogout={onLogout}
        action={
          <Button
            variant="primary"
            data-tour-target="upload-dataset"
            icon={<UploadCloud className="w-4 h-4" />}
            onClick={() => {
              setImportFile(null);
              setIsImportModalOpen(true);
            }}
          >
            {t('uploadDataset')}
          </Button>
        }
      />

      <main className="relative z-10 flex-1 max-w-7xl w-full min-w-0 mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10 space-y-6 sm:space-y-7">
        <PageHeader
          eyebrow={t('dataHub')}
          title={t('dataHubHeroTitle')}
          description={t('dataHubHeroDesc')}
        />

        {/* Compact Dropzone Banner for effortless Excel/CSV Upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDropZone}
          onClick={() => {
            setImportFile(null);
            setIsImportModalOpen(true);
          }}
          className={cx(
            'rounded-2xl border-2 border-dashed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-colors min-w-0',
            globalDatasets.length > 0 ? 'p-3.5 sm:px-5 sm:py-3.5' : 'p-5 sm:p-6',
            isDraggingFile
              ? 'border-sky-500 bg-sky-50/80'
              : 'border-slate-300/90 bg-white hover:border-sky-400 hover:bg-sky-50/30'
          )}
        >
          <div className="flex items-center gap-3.5 text-start min-w-0 flex-1">
            <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 grid place-items-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-navy-900 break-words">{t('dhQuickDropHint')}</p>
              <p dir="ltr" className="text-xs text-slate-500 mt-0.5 truncate">CSV, Excel (.xlsx / .xls), TSV, JSON</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="shrink-0 w-full sm:w-auto" icon={<UploadCloud className="w-3.5 h-3.5" />}>
            {t('uploadDataset')}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <StatCard tone="sky" icon={<Database className="w-5 h-5" />} value={globalDatasets.length} label={t('datasets')} />
          <StatCard tone="navy" icon={<BarChart3 className="w-5 h-5" />} value={(Number(totalRecords) || 0).toLocaleString()} label={t('recordsUnderManagement')} />
          <StatCard tone="emerald" icon={<Wand2 className="w-5 h-5" />} value={totalCleaned} label={t('cleanedInDataLab')} hint={t('stillRaw', { count: globalDatasets.length - totalCleaned })} />
        </div>

        <section data-tour-target="dataset-list" className="space-y-5 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
            <div className="relative flex-1 min-w-0 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchDatasetsPlaceholder')}
                aria-label={t('searchDatasetsPlaceholder')}
                dir="auto"
                className="w-full min-w-0 h-10 ps-10 pe-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-navy-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar pb-1 md:pb-0" role="tablist" aria-label={t('filterByTag')}>
                {['all', ...allTags].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    role="tab"
                    aria-selected={selectedTag === tag}
                    onClick={() => setSelectedTag(tag)}
                    className={cx(
                      'h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                      selectedTag === tag ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {tag === 'all' ? `${t('allTags')} · ${globalDatasets.length}` : tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredDatasets.length === 0 ? (
            <EmptyState
              icon={<Database className="w-6 h-6" />}
              title={globalDatasets.length === 0 ? t('bringInFirstDataset') : t('noDatasetsMatch')}
              description={
                globalDatasets.length === 0
                  ? t('uploadCsvExcelStart')
                  : t('clearSearchTag')
              }
              action={
                globalDatasets.length === 0 ? (
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<UploadCloud className="w-4 h-4" />}
                    onClick={() => {
                      setImportFile(null);
                      setIsImportModalOpen(true);
                    }}
                  >
                    {t('uploadDataset')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDatasets.map((ds) => (
                <DatasetCard
                  key={ds.id}
                  ds={ds}
                  onOpenDataCleaning={onOpenDataCleaning}
                  onInspectDataset={onInspectDataset}
                  onCreateDashboardWithDataset={onCreateDashboardWithDataset}
                  onDelete={() => setPendingDeleteDataset(ds)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <DatasetImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFile(null);
        }}
        initialFile={importFile}
        onDatasetImported={(saved) => {
          onAddGlobalDataset(saved);
        }}
      />

      <Modal
        isOpen={Boolean(pendingDeleteDataset)}
        onClose={() => setPendingDeleteDataset(null)}
        title={t('deleteDataset')}
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        size="sm"
        closeLabel={t('close')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPendingDeleteDataset(null)}>
              {t('dataHubCancelBtn')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (!pendingDeleteDataset) return;
                const id = pendingDeleteDataset.id;
                setPendingDeleteDataset(null);
                onDeleteGlobalDataset(id);
              }}
            >
              {t('dataHubConfirmDeleteBtn')}
            </Button>
          </>
        }
      >
        <p className="text-xs font-medium text-slate-600 mb-4 leading-relaxed">
          {t('deleteDatasetConfirm')}
        </p>
        {pendingDeleteDataset && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 truncate" dir="auto">
            &ldquo;{pendingDeleteDataset.name}&rdquo;
          </div>
        )}
      </Modal>
    </div>
  );
};

const healthTone = (h: number) => (h >= 95 ? 'bg-emerald-500' : h >= 80 ? 'bg-amber-400' : 'bg-rose-500');

interface CardProps {
  ds: Dataset;
  onOpenDataCleaning: (id: string) => void;
  onInspectDataset: (d: Dataset) => void;
  onCreateDashboardWithDataset: (id: string) => void;
  onDelete: () => void;
}

const DatasetCard: React.FC<CardProps> = ({ ds, onOpenDataCleaning, onInspectDataset, onCreateDashboardWithDataset, onDelete }) => {
  const { t, tPlural } = useLanguage();
  const rows = Number(ds?.rowCount ?? (ds as any)?.row_count ?? (Array.isArray(ds?.data) ? ds.data.length : 0)) || 0;
  const cols = Number(ds?.columnCount ?? (ds as any)?.column_count ?? (Array.isArray(ds?.columns) ? ds.columns.length : 0)) || 0;
  const health = useMemo(() => datasetHealth(ds.data || [], (ds.columns || []).map((c) => c.name)), [ds.data, ds.columns]);
  const mix = useMemo(() => columnTypeMix(ds.columns || []), [ds.columns]);
  const steps = ds.cleaningPipeline?.length || 0;
  const totalCols = Math.max(1, mix.text + mix.number + mix.date);
  const sourceLabel = (ds.sourceType || (ds as any)?.source_type || 'csv').toUpperCase();

  return (
    <Card interactive padded={false} className="flex flex-col min-w-0">
      <div className="p-5 space-y-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="w-10 h-10 rounded-xl grid place-items-center bg-sky-50 text-sky-600 shrink-0">
              <Table className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[15px] text-navy-900 leading-snug truncate" dir="auto" title={ds.name}>{ds.name}</h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">{ds.uploadedAt}</span>
                <span>·</span>
                <span className="font-semibold text-slate-600 shrink-0">{sourceLabel}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            title={t('deleteDataset')}
            aria-label={t('deleteDataset')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {ds.description && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed" dir="auto">{ds.description}</p>}

        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <p className="text-slate-500 text-xs">
            <b className="text-lg font-extrabold text-navy-900 tabular">{rows.toLocaleString()}</b> {t('rows')}
          </p>
          <p className="text-slate-500 text-xs">
            <b className="text-lg font-extrabold text-navy-900 tabular">{cols}</b> {t('columns')}
          </p>
        </div>

        <div>
          <div
            className="flex h-1.5 rounded-full overflow-hidden bg-slate-100"
            role="img"
            aria-label={t('dataHubColMixAria', { text: mix.text, number: mix.number, date: mix.date })}
          >
            <span className="bg-slate-400" style={{ width: `${(mix.text / totalCols) * 100}%` }} />
            <span className="bg-sky-500" style={{ width: `${(mix.number / totalCols) * 100}%` }} />
            <span className="bg-amber-400" style={{ width: `${(mix.date / totalCols) * 100}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {t('dataHubColMixSummary', { text: mix.text, number: mix.number, date: mix.date })}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between gap-2 text-[11px] font-semibold text-slate-500">
            <span>{t('dataQuality')}</span>
            <span className="tabular text-navy-900 truncate">
              {health}% · {steps > 0 ? <span className="text-emerald-600">{steps} {tPlural('steps', steps)}</span> : t('rawDataset')}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={cx('h-full rounded-full', healthTone(health))} style={{ width: `${health}%` }} />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center gap-2 bg-slate-50/60 rounded-b-2xl">
        <Button variant="primary" size="sm" className="flex-1 min-w-[130px]" onClick={() => onOpenDataCleaning(ds.id)} title={t('openInDataLab')} icon={<FlaskConical className="w-3.5 h-3.5" />}>
          {t('openInDataLab')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent('datapulse:open-forecast', { detail: { datasetId: ds.id } }))}
          title={t('fcOpenFromDataHub')}
          icon={<TrendingUp className="w-3.5 h-3.5 text-sky-600" />}
        >
          {t('dhActionForecast')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="!px-2.5 shrink-0"
          onClick={() => onInspectDataset(ds)}
          title={t('inspectColumns')}
          aria-label={t('inspectColumns')}
        >
          <Table className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="lab"
          size="sm"
          className="!px-2.5 shrink-0"
          onClick={() => onCreateDashboardWithDataset(ds.id)}
          title={t('newDashboardWithData')}
          aria-label={t('newDashboardWithData')}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
};
