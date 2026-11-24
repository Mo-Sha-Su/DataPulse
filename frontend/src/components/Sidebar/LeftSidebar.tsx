import React, { useState } from 'react';
import { Dataset, WidgetType, WidgetCategory } from '../../types/dashboard';
import { WIDGET_DEFINITIONS } from '../../data/widgetDefinitions';
import { BrandHomeLink } from '../BrandLogo';
import { DatasetImportModal } from '../Import/DatasetImportModal';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  UploadCloud,
  Database,
  BarChart3,
  TrendingUp,
  PieChart,
  Box,
  Plus,
  Table,
  Search,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  Activity,
  Layers,
  Trash2,
  Sparkles,
  Network,
  X,
} from 'lucide-react';

interface Props {
  datasets: Dataset[];
  onAddDataset: (newDataset: Dataset) => void;
  onSelectDatasetToInspect: (dataset: Dataset) => void;
  onAddWidgetToCanvas: (type: WidgetType, category: WidgetCategory) => void;
  onDeleteDataset?: (datasetId: string) => void;
  onOpenDataCleaning?: (datasetId?: string) => void;
  onOpenSelectDatasets?: () => void;
  onOpenDataModel?: () => void;
  onCloseDrawer?: () => void;
}

export const LeftSidebar: React.FC<Props> = ({
  datasets,
  onAddDataset,
  onSelectDatasetToInspect,
  onAddWidgetToCanvas,
  onDeleteDataset,
  onOpenDataCleaning,
  onOpenSelectDatasets,
  onOpenDataModel,
  onCloseDrawer,
}) => {
  const { t, tPlural } = useLanguage();
  const [activeTab, setActiveTab] = useState<'data' | 'widgets'>('widgets');
  const [selectedWidgetCategory, setSelectedWidgetCategory] = useState<WidgetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const getWidgetName = (type: WidgetType, fallback: string) => t(`widget_${type}_name` as any) || fallback;
  const getWidgetDesc = (type: WidgetType, fallback: string) => t(`widget_${type}_desc` as any) || fallback;
  const getCategoryLabel = (cat: WidgetCategory) =>
    cat === 'charts' ? t('leftCatCharts') : cat === 'analytics' ? t('leftCatAnalytics') : t('leftCat3d');

  const filteredWidgets = WIDGET_DEFINITIONS.filter((w) => {
    const matchesCat = selectedWidgetCategory === 'all' || w.category === selectedWidgetCategory;
    const q = searchQuery.toLowerCase();
    const locName = getWidgetName(w.type, w.name).toLowerCase();
    const locDesc = getWidgetDesc(w.type, w.description).toLowerCase();
    const matchesSearch =
      w.name.toLowerCase().includes(q) ||
      w.description.toLowerCase().includes(q) ||
      locName.includes(q) ||
      locDesc.includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <aside data-tour-target="chart-panel" className="w-full lg:w-[280px] h-full bg-white border-e border-slate-200 flex flex-col z-20 shrink-0 text-slate-800 select-none shadow-sm min-w-0">
      {/* Platform Branding Header */}
      <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/90 shrink-0">
        <BrandHomeLink
          variant="sidebar"
          size={28}
          ariaLabel={t('leftHomeTitle')}
          title={t('leftHomeTitle')}
        />
        {onCloseDrawer && (
          <button
            type="button"
            onClick={onCloseDrawer}
            aria-label={t('close')}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Sidebar Mode Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 p-1">
        <button
          onClick={() => setActiveTab('widgets')}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'widgets'
              ? 'bg-[#0284C7] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{t('visualizations')} ({WIDGET_DEFINITIONS.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'data'
              ? 'bg-[#0284C7] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{t('datasets')} ({datasets.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: WIDGET LIBRARY */}
      {activeTab === 'widgets' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute start-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchChartTypes')}
              dir="auto"
              className="w-full ps-8 pe-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15 font-medium"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedWidgetCategory('all')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-semibold transition-colors cursor-pointer ${
                selectedWidgetCategory === 'all'
                  ? 'bg-navy-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {t('allWidgets')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedWidgetCategory('charts')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-semibold transition-colors cursor-pointer ${
                selectedWidgetCategory === 'charts'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {t('chartsCategory')} ({WIDGET_DEFINITIONS.filter((w) => w.category === 'charts').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedWidgetCategory('analytics')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-semibold transition-colors cursor-pointer ${
                selectedWidgetCategory === 'analytics'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {t('analyticsCategory')} ({WIDGET_DEFINITIONS.filter((w) => w.category === 'analytics').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedWidgetCategory('3d')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-semibold transition-colors cursor-pointer ${
                selectedWidgetCategory === '3d'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {t('threeDCategory')} ({WIDGET_DEFINITIONS.filter((w) => w.category === '3d').length})
            </button>
          </div>

          {/* Widget List */}
          <div className="flex-1 overflow-y-auto pe-1 space-y-2">
            {filteredWidgets.map((item) => (
              <div
                key={item.type}
                className="p-2.5 bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-400 rounded-xl transition-all flex items-start justify-between group cursor-pointer shadow-2xs"
                onClick={() => onAddWidgetToCanvas(item.type, item.category)}
              >
                <div className="space-y-1 pe-2 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-sky-700 transition-colors">
                      {getWidgetName(item.type, item.name)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">· {getCategoryLabel(item.category)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-normal">
                    <span className="font-semibold text-slate-600">{t('sidebarWhenToUse')}:</span>{' '}
                    {getWidgetDesc(item.type, item.description)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddWidgetToCanvas(item.type, item.category);
                  }}
                  className="p-1.5 bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white rounded-lg transition-colors shrink-0 mt-0.5 border border-sky-200 cursor-pointer"
                  title={t('leftAddWidgetTip')}
                  aria-label={t('leftAddWidgetTip')}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: DATA SOURCES */}
      {activeTab === 'data' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
          {/* Upload Dropzone */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="w-full border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center group"
          >
            <UploadCloud className="w-7 h-7 text-sky-600 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-xs font-bold text-slate-800">
                {t('uploadCsvExcel')}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">{t('uploadCsvExcelHint')}</p>
            </div>
          </button>

          {/* Quick Explore the data Launcher Button */}
          {onOpenDataCleaning && (
            <button
              type="button"
              onClick={() => onOpenDataCleaning()}
              className="w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl text-sky-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>{t('exploreData')}</span>
            </button>
          )}

          {/* Quick Forecast Studio Launcher Button */}
          {datasets.length > 0 && (
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('datapulse:open-forecast', {
                    detail: { datasetId: datasets[0]?.id },
                  }),
                )
              }
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>{t('fcWidgetCreateInStudio')}</span>
            </button>
          )}

          {/* Data Model & Dataset Selection Actions */}
          <div className="grid grid-cols-2 gap-1.5">
            {onOpenSelectDatasets && (
              <button
                type="button"
                onClick={onOpenSelectDatasets}
                className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title={t('selectData')}
              >
                <Database className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('selectData')}</span>
              </button>
            )}

            {onOpenDataModel && (
              <button
                type="button"
                onClick={onOpenDataModel}
                className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title={t('dataModel')}
              >
                <Network className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('dataModel')}</span>
              </button>
            )}
          </div>

          {/* Datasets List */}
          <div className="flex-1 overflow-y-auto pe-1 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t('loadedDatasets')} ({datasets.length})
            </span>
            {datasets.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2 my-2">
                <Database className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">{t('noDatasetsSelected')}</p>
                <p className="text-[10px] text-slate-400 leading-snug">
                  {t('attachDatasetsHint')}
                </p>
                {onOpenSelectDatasets && (
                  <button
                    type="button"
                    onClick={onOpenSelectDatasets}
                    className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    {t('selectDatasets')}
                  </button>
                )}
              </div>
            ) : (
              (datasets || []).filter(Boolean).map((ds) => (
                <div
                  key={ds.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-sky-400 transition-colors shadow-2xs min-w-0"
                >
                  <div className="flex justify-between items-center gap-2 min-w-0">
                    <span className="font-bold text-xs text-slate-900 truncate min-w-0 flex-1" dir="auto">{ds.name || t('leftDefaultDatasetName')}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono font-bold shrink-0">
                      {(ds.sourceType || (ds as any)?.source_type || 'CSV').toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 font-medium">
                    <span>{tPlural('rows', Number(ds?.rowCount ?? (ds as any)?.row_count ?? (ds?.data?.length || 0)) || 0)}</span>
                    <span>•</span>
                    <span>{tPlural('columns', Number(ds?.columnCount ?? (ds as any)?.column_count ?? (ds?.columns?.length || 0)) || 0)}</span>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => onSelectDatasetToInspect(ds)}
                      className="flex-1 min-w-[72px] py-1 px-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title={t('inspect')}
                    >
                      <Table className="w-3 h-3 text-slate-500" />
                      <span>{t('inspect')}</span>
                    </button>

                    {onOpenDataCleaning && (
                      <button
                        onClick={() => onOpenDataCleaning(ds.id)}
                        className="flex-1 py-1 px-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg text-[11px] font-semibold text-sky-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title={t('transform')}
                      >
                        <Sparkles className="w-3 h-3 text-sky-600" />
                        <span>{t('transform')}</span>
                      </button>
                    )}

                    {onDeleteDataset && (
                      <button
                        onClick={() => onDeleteDataset(ds.id)}
                        className="p-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title={t('deleteDataset')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <DatasetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onDatasetImported={(saved) => {
          onAddDataset(saved);
        }}
      />
    </aside>
  );
};
