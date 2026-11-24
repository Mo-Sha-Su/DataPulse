import React, { useState, useEffect } from 'react';
import { User } from '../types/auth';
import { DashboardState, ProjectType, Dataset } from '../types/dashboard';
import { DEFAULT_CANVAS, DEFAULT_REPORT_CANVAS } from '../data/dashboardDefaults';
import { fetchDashboardsFromDb, saveDashboardToDb, deleteDashboardFromDb } from '../services/dbService';
import { syncModelWithUsedDatasets } from '../utils/dataModelingEngine';
import { AppNavbar } from '../components/Navbar/AppNavbar';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Button, Card, EmptyState, FieldLabel, Input, Modal, PageHeader, Segmented, Select, Textarea } from '../ui';
import { hasActiveDataModel } from '../utils/semanticQueryEngine';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Plus,
  LayoutGrid,
  Search,
  Calendar,
  ArrowUpDown,
  Trash2,
  Edit2,
  LogOut,
  X,
  AlertTriangle,
  FileText,
  BarChart3,
  ArrowRight,
  UploadCloud,
  TrendingUp,
  CheckCircle2,
  Database,
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  onLogout: () => void;
  onOpenDashboard: (dashboardId: string) => void;
  onNavigate: (page: 'home' | 'login' | 'signup' | 'dashboard_hub' | 'bench' | 'sample_graphs' | 'data_hub' | 'forecasts', dashboardId?: string) => void;
  globalDatasets?: Dataset[];
}

export const DashboardHubPage: React.FC<Props> = ({
  currentUser,
  onLogout,
  onOpenDashboard,
  onNavigate,
  globalDatasets = [],
}) => {
  const { t, tPlural, formatDate: contextFormatDate } = useLanguage();
  const [dashboards, setDashboards] = useState<DashboardState[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardsFromDb()
      .then((items) => {
        setDashboards(items);
        setDbError(null);
      })
      .catch((e) => setDbError(e?.message || t('hubLoadErrorFallback')));
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dashboard' | 'report'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<DashboardState | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [newProjectType, setNewProjectType] = useState<ProjectType>('dashboard');
  const [canvasPreset, setCanvasPreset] = useState<'1920x1080' | '1366x768' | 'a4_portrait' | 'a4_landscape' | 'us_letter'>('1920x1080');
  const [newName, setNewName] = useState('');
  const [newUsedFor, setNewUsedFor] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedDsIds, setSelectedDsIds] = useState<string[]>([]);

  const openCreateWithType = (type: ProjectType) => {
    setNewProjectType(type);
    setCanvasPreset(type === 'report' ? 'a4_portrait' : '1920x1080');
    setIsCreateModalOpen(true);
  };

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsedFor.trim()) return;

    let canvasSettings = { ...DEFAULT_CANVAS };
    if (newProjectType === 'report') {
      if (canvasPreset === 'a4_landscape') {
        canvasSettings = {
          presetName: 'A4 Report Landscape (1056×816)',
          width: 1056,
          height: 816,
          zoom: 0.85,
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          gradientValue: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          imageUrl: '',
          imageFit: 'cover',
          showGrid: false,
          snapToGrid: true,
          gridGap: 10,
        };
      } else if (canvasPreset === 'us_letter') {
        canvasSettings = {
          presetName: 'US Letter Report (850×1100)',
          width: 850,
          height: 1100,
          zoom: 0.9,
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          gradientValue: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          imageUrl: '',
          imageFit: 'cover',
          showGrid: false,
          snapToGrid: true,
          gridGap: 10,
        };
      } else {
        canvasSettings = { ...DEFAULT_REPORT_CANVAS };
      }
    } else {
      if (canvasPreset === '1366x768') {
        canvasSettings = {
          ...DEFAULT_CANVAS,
          presetName: '1366×768 Laptop (Dashboard)',
          width: 1366,
          height: 768,
        };
      } else {
        canvasSettings = {
          ...DEFAULT_CANVAS,
          presetName: '1920×1080 Full HD (Dashboard)',
          width: 1920,
          height: 1080,
        };
      }
    }

    const chosenDatasets = globalDatasets.filter((d) => selectedDsIds.includes(d.id));
    const initialModel = syncModelWithUsedDatasets(undefined, chosenDatasets, newName.trim());

    const newDash: DashboardState = {
      id: `${newProjectType}_${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim(),
      type: newProjectType,
      usedFor: newUsedFor.trim(),
      thumbnail: newProjectType === 'report' ? 'report' : 'dashboard',
      widgets: [],
      datasets: chosenDatasets,
      selectedDatasetIds: selectedDsIds,
      dataModel: initialModel,
      canvas: canvasSettings,
      pages: newProjectType === 'report' ? [{ id: 'p_1', name: t('appPageN', { n: 1 }) }] : undefined,
      activePageId: newProjectType === 'report' ? 'p_1' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };

    setIsCreateModalOpen(false);

    try {
      await saveDashboardToDb(newDash);
      setDashboards((prev) => [newDash, ...prev]);
      setDbError(null);
    } catch (e: any) {
      setDbError(e?.message || t('hubSaveErrorFallback'));
      return;
    }

    setNewName('');
    setNewUsedFor('');
    setNewDescription('');
    setNewProjectType('dashboard');
    setCanvasPreset('1920x1080');

    onOpenDashboard(newDash.id);
  };

  const confirmDelete = async () => {
    if (!dashboardToDelete) return;
    const targetId = dashboardToDelete.id;
    setDashboardToDelete(null);
    try {
      await deleteDashboardFromDb(targetId);
      setDashboards((prev) => prev.filter((d) => d.id !== targetId));
      setDbError(null);
    } catch (e: any) {
      setDbError(e?.message || t('hubDeleteErrorFallback'));
    }
  };

  const filteredDashboards = dashboards
    .filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.usedFor && d.usedFor.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      const isReportItem =
        d.type === 'report' ||
        d.canvas.presetName.toLowerCase().includes('report') ||
        d.canvas.presetName.toLowerCase().includes('a4') ||
        d.canvas.presetName.toLowerCase().includes('letter');

      if (typeFilter === 'dashboard' && isReportItem) return false;
      if (typeFilter === 'report' && !isReportItem) return false;

      if (dateFilter !== 'all') {
        const createdDate = new Date(d.createdAt || Date.now());
        const now = new Date();
        const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);

        if (dateFilter === 'today' && diffDays > 1) return false;
        if (dateFilter === 'week' && diffDays > 7) return false;
        if (dateFilter === 'month' && diffDays > 30) return false;
        if (dateFilter === 'year' && diffDays > 365) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return t('allTime');
    try {
      return contextFormatDate(isoStr, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const userFirstName = currentUser?.first_name || t('hubUserFallback');

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f7f9fc] text-navy-900 font-sans flex flex-col relative">
      <AnimatedBackground variant="subtle" />
      <AppNavbar
        active="dashboard_hub"
        currentUser={currentUser}
        onNavigate={onNavigate}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      <main className="relative z-10 max-w-7xl mx-auto w-full min-w-0 px-4 sm:px-6 md:px-10 py-6 sm:py-10 flex-1 flex flex-col gap-7 sm:gap-8">
        {/* Clean Welcome Header + Datasets Summary */}
        <PageHeader
          eyebrow={t('workspaceEyebrow')}
          title={t('hubWelcomeBack', { name: userFirstName })}
          description={t('dashboardHubDesc')}
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('data_hub')}
                className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('hubDatasetsSummary', { count: globalDatasets.length })}</span>
              </button>
              <Button
                variant="primary"
                size="lg"
                data-tour-target="new-project"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => openCreateWithType('dashboard')}
              >
                {t('newDashboardOrReport')}
              </Button>
            </div>
          }
        />

        {/* Quick Actions Strip */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('hubQuickActionsTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => onNavigate('data_hub')}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-lift transition-all text-start flex items-center gap-3.5 group cursor-pointer"
            >
              <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 grid place-items-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <UploadCloud className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy-900 truncate">{t('hubQaUploadTitle')}</p>
                <p className="text-xs text-slate-500 truncate">{t('hubQaUploadDesc')}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openCreateWithType('dashboard')}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-lift transition-all text-start flex items-center gap-3.5 group cursor-pointer"
            >
              <span className="w-10 h-10 rounded-xl bg-navy-900/5 text-navy-900 grid place-items-center shrink-0 group-hover:bg-navy-900 group-hover:text-white transition-colors">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy-900 truncate">{t('hubQaDashboardTitle')}</p>
                <p className="text-xs text-slate-500 truncate">{t('hubQaDashboardDesc')}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openCreateWithType('report')}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-lift transition-all text-start flex items-center gap-3.5 group cursor-pointer"
            >
              <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 grid place-items-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy-900 truncate">{t('hubQaReportTitle')}</p>
                <p className="text-xs text-slate-500 truncate">{t('hubQaReportDesc')}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('forecasts')}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-lift transition-all text-start flex items-center gap-3.5 group cursor-pointer"
            >
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy-900 truncate">{t('hubQaForecastTitle')}</p>
                <p className="text-xs text-slate-500 truncate">{t('hubQaForecastDesc')}</p>
              </div>
            </button>
          </div>
        </section>

        {/* Approachable Getting Started Banner when workspace is small */}
        {dashboards.length === 0 && (
          <div className="bg-white border border-sky-200/90 rounded-2xl p-5 sm:p-6 shadow-lift">
            <h3 className="text-sm font-bold text-navy-900 mb-3">{t('hubGettingStartedTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600">
              {[
                { n: '1', done: globalDatasets.length > 0, text: t('hubGettingStartedStep1') },
                { n: '2', done: globalDatasets.some((d) => (d.cleaningPipeline?.length || 0) > 0), text: t('hubGettingStartedStep2') },
                { n: '3', done: dashboards.length > 0, text: t('hubGettingStartedStep3') },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-2.5">
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-sky-50 text-sky-700 font-bold text-[11px] grid place-items-center shrink-0">
                      {step.n}
                    </span>
                  )}
                  <span className={step.done ? 'text-slate-900 font-medium' : ''}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspace Projects List */}
        <section className="space-y-5 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <h2 className="text-lg font-extrabold text-navy-900 tracking-tight">{t('hubRecentTitle')}</h2>
              <span className="text-xs font-semibold text-slate-500 tabular">({filteredDashboards.length})</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 min-w-0 max-w-full">
              <Segmented<'all' | 'dashboard' | 'report'>
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: 'all', label: t('all') },
                  { value: 'dashboard', label: <><BarChart3 className="w-3.5 h-3.5 shrink-0" /> {t('dashboardsTab')}</> },
                  { value: 'report', label: <><FileText className="w-3.5 h-3.5 shrink-0" /> {t('reportsTab')}</> },
                ]}
              />

              <div className="relative w-full sm:w-auto sm:min-w-[200px] flex-1 sm:flex-initial min-w-0">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('searchByName')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  dir="auto"
                  className="w-full min-w-0 h-9 ps-9 pe-8 rounded-xl bg-white border border-slate-200 text-xs font-medium text-navy-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label={t('close')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="h-9 flex items-center gap-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  aria-label={t('allTime')}
                  className="bg-transparent focus:outline-none cursor-pointer min-w-0"
                >
                  <option value="all">{t('allTime')}</option>
                  <option value="today">{t('today')}</option>
                  <option value="week">{t('thisWeek')}</option>
                  <option value="month">{t('thisMonth')}</option>
                  <option value="year">{t('thisYear')}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSortOrder((prev) => (prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'name' : 'newest'))
                }
                className="h-9 flex items-center gap-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{t('sortBy')}: {sortOrder === 'newest' ? t('sortNewest') : sortOrder === 'oldest' ? t('sortOldest') : t('sortName')}</span>
              </button>
            </div>
          </div>

          {dbError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {dbError}
            </div>
          )}

          {filteredDashboards.length === 0 ? (
            <EmptyState
              icon={<LayoutGrid className="w-6 h-6" />}
              title={dashboards.length === 0 ? t('nothingHereYet') : t('noMatches')}
              description={
                searchTerm || dateFilter !== 'all' || typeFilter !== 'all'
                  ? t('clearSearchFilters')
                  : t('createFirstDashboardDesc')
              }
              action={
                <Button variant="primary" size="lg" icon={<Plus className="w-4 h-4" />} onClick={() => openCreateWithType('dashboard')}>
                  {t('createACanvas')}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredDashboards.map((dash) => {
                const isReportItem =
                  dash.type === 'report' ||
                  dash.canvas.presetName.toLowerCase().includes('report') ||
                  dash.canvas.presetName.toLowerCase().includes('a4') ||
                  dash.canvas.presetName.toLowerCase().includes('letter');
                const widgetCount = dash.widgets?.length || 0;
                const datasetCount = new Set([...(dash.selectedDatasetIds || []), ...(dash.datasets || []).map((d) => d.id)]).size;
                const modelTables = hasActiveDataModel(dash.dataModel)
                  ? (dash.dataModel!.factTables.length + dash.dataModel!.dimensionTables.length)
                  : 0;

                return (
                  <Card
                    key={dash.id}
                    interactive
                    padded={false}
                    onClick={() => onOpenDashboard(dash.id)}
                    className="group cursor-pointer flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-5 space-y-3 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
                            isReportItem ? 'bg-navy-900/5 text-navy-900' : 'bg-sky-50 text-sky-600'
                          }`}
                        >
                          {isReportItem ? <FileText className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                        </span>
                        <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onOpenDashboard(dash.id); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title={t('open')}
                            aria-label={`${t('open')} ${dash.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDashboardToDelete(dash); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t('delete')}
                            aria-label={`${t('delete')} ${dash.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-sky-600 mb-0.5">
                          {isReportItem ? t('hubKindReport') : t('hubKindDashboard')}
                        </p>
                        <h3 className="font-bold text-navy-900 text-[15px] group-hover:text-sky-600 transition-colors truncate" dir="auto" title={dash.name}>
                          {dash.name}
                        </h3>
                        {dash.usedFor && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate" dir="auto">
                            {dash.usedFor}
                          </p>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium pt-1 tabular truncate">
                        {widgetCount} {t('widgets')} · {datasetCount} {tPlural('datasets', datasetCount)}
                        {modelTables > 0 ? ` · ${t('models')} ${modelTables}` : ''}
                      </p>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-400 bg-slate-50/50">
                      <span className="truncate">{formatDate(dash.createdAt)}</span>
                      <span className="font-semibold text-sky-600 inline-flex items-center gap-1 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform shrink-0">
                        <span>{t('open')}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* CREATE DASHBOARD OR REPORT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('createModalTitle')}
        icon={<Plus className="w-5 h-5 text-sky-600" />}
        size="lg"
        closeLabel={t('close')}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" form="create-canvas-form" variant="primary" size="md">
              {t('createCanvasBtn')}
            </Button>
          </>
        }
      >
        <form id="create-canvas-form" onSubmit={handleCreateDashboard} className="space-y-4">
          <div className="space-y-2">
            <FieldLabel requiredMark>{t('projectType')}</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setNewProjectType('dashboard');
                  setCanvasPreset('1920x1080');
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-start gap-2 text-start min-w-0 ${
                  newProjectType === 'dashboard'
                    ? 'border-sky-600 bg-sky-50/70'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-navy-900">{t('interactiveDashboardTitle')}</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {t('interactiveDashboardDesc')}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewProjectType('report');
                  setCanvasPreset('a4_portrait');
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-start gap-2 text-start min-w-0 ${
                  newProjectType === 'report'
                    ? 'border-navy-900 bg-slate-100'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-navy-900 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-navy-900">{t('printableReportTitle')}</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {t('printableReportDesc')}
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="create-canvas-preset">{t('canvasPreset')}</FieldLabel>
            {newProjectType === 'dashboard' ? (
              <Select
                id="create-canvas-preset"
                value={canvasPreset}
                onChange={(e) => setCanvasPreset(e.target.value as any)}
                className="font-semibold text-xs h-10"
              >
                <option value="1920x1080">{t('hubPresetFhd')} (1920×1080)</option>
                <option value="1366x768">{t('hubPresetLaptop')} (1366×768)</option>
              </Select>
            ) : (
              <Select
                id="create-canvas-preset"
                value={canvasPreset}
                onChange={(e) => setCanvasPreset(e.target.value as any)}
                className="font-semibold text-xs h-10"
              >
                <option value="a4_portrait">{t('hubPresetA4Portrait')} (816 × 1056 px)</option>
                <option value="a4_landscape">{t('hubPresetA4Landscape')} (1056 × 816 px)</option>
                <option value="us_letter">{t('hubPresetUsLetter')} (850 × 1100 px)</option>
              </Select>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="create-canvas-name" requiredMark>{t('canvasName')}</FieldLabel>
            <Input
              id="create-canvas-name"
              type="text"
              required
              placeholder={newProjectType === 'report' ? t('reportNamePlaceholder') : t('dashboardNamePlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              dir="auto"
              className="text-xs font-medium"
            />
          </div>

          <div>
            <FieldLabel htmlFor="create-canvas-usedfor" requiredMark>{t('usedForLabel')}</FieldLabel>
            <Input
              id="create-canvas-usedfor"
              type="text"
              required
              placeholder={t('usedForPlaceholder')}
              value={newUsedFor}
              onChange={(e) => setNewUsedFor(e.target.value)}
              dir="auto"
              className="text-xs font-medium"
            />
          </div>

          <div>
            <FieldLabel htmlFor="create-canvas-desc" hint={`${newDescription.length} / 500`}>
              {t('descriptionLabel')}
            </FieldLabel>
            <Textarea
              id="create-canvas-desc"
              maxLength={500}
              rows={2}
              placeholder={t('descriptionPlaceholder')}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              dir="auto"
              className="text-xs font-medium resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-slate-700">
                {t('attachDatasets')} ({selectedDsIds.length} / {globalDatasets.length})
              </label>
              <div className="flex gap-2 text-[11px] shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDsIds(globalDatasets.map((d) => d.id))}
                  className="text-sky-600 font-semibold hover:underline cursor-pointer"
                >
                  {t('selectAllRows')}
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setSelectedDsIds([])}
                  className="text-slate-500 font-semibold hover:underline cursor-pointer"
                >
                  {t('clearSelection')}
                </button>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {globalDatasets.length === 0 ? (
                <p className="text-[11px] text-slate-500 p-1">{t('noDatasetsInHub')}</p>
              ) : (
                globalDatasets.map((ds) => {
                  const isChecked = selectedDsIds.includes(ds.id);
                  return (
                    <div
                      key={ds.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedDsIds(selectedDsIds.filter((id) => id !== ds.id));
                        } else {
                          setSelectedDsIds([...selectedDsIds, ds.id]);
                        }
                      }}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all min-w-0 ${
                        isChecked
                          ? 'bg-sky-50 border-sky-300 text-navy-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-sky-600 focus:ring-sky-500 h-3.5 w-3.5 shrink-0"
                        />
                        <span dir="auto" className="truncate flex-1">{ds.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal shrink-0 tabular">
                          {(Number(ds?.rowCount ?? (ds as any)?.row_count ?? (ds?.data?.length || 0)) || 0).toLocaleString()} {t('rows')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={Boolean(dashboardToDelete)}
        onClose={() => setDashboardToDelete(null)}
        title={t('deleteCanvasTitle')}
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        size="sm"
        closeLabel={t('close')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDashboardToDelete(null)}>
              {t('cancel')}
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              {t('deletePermanently')}
            </Button>
          </>
        }
      >
        <p className="text-xs font-medium text-slate-600 mb-4 leading-relaxed">
          {t('deleteCanvasDesc')}
        </p>
        {dashboardToDelete && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 truncate" dir="auto">
            &ldquo;{dashboardToDelete.name}&rdquo;
          </div>
        )}
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title={t('logoutConfirmTitle')}
        icon={<LogOut className="w-5 h-5 text-sky-600" />}
        size="sm"
        closeLabel={t('close')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsLogoutModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setIsLogoutModalOpen(false);
                onLogout();
              }}
            >
              {t('logOut')}
            </Button>
          </>
        }
      >
        <p className="text-xs font-medium text-slate-600 leading-relaxed">
          {t('logoutConfirmDesc')}
        </p>
      </Modal>
    </div>
  );
};
