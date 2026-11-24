import React, { useState, useEffect, useRef } from 'react';
import { CanvasSettings, ReportPage, ProjectType, ReportPageSizePreset, WidgetType } from '../../types/dashboard';
import { REPORT_PAGE_PRESETS } from '../../utils/reportPageDimensions';
import { BrandHomeLink, BrandLogo } from '../BrandLogo';
import { LanguageToggle, useLanguage } from '../../i18n/LanguageContext';
import {
  Pencil,
  ZoomIn,
  ZoomOut,
  Eye,
  Save,
  FolderOpen,
  Grid,
  Filter,
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
  Printer,
  RotateCcw,
  RotateCw,
  BarChart3,
  TrendingUp,
  Table,
  Type,
  Box,
  Command,
  Info,
  Check,
  X,
  FilePlus,
  Sparkles,
  Layout,
  Network,
  Database,
  Lock,
  Unlock,
  Maximize2,
  RefreshCw,
  Menu,
} from 'lucide-react';
import { Modal, Button } from '../../ui';

interface Props {
  dashboardTitle: string;
  projectType?: ProjectType;
  pages?: ReportPage[];
  activePageId?: string;
  widgetCount: number;
  autoSaveStatus: 'saved' | 'saving' | 'unsaved';
  canvas: CanvasSettings;
  canUndo: boolean;
  canRedo: boolean;
  activeFilterCount?: number;
  activeWorkspaceView?: 'canvas' | 'data_model';
  onChangeWorkspaceView?: (view: 'canvas' | 'data_model') => void;
  onOpenSelectDatasets?: () => void;
  onBackToHub?: () => void;
  onOpenFilters?: () => void;
  onExportPdf?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTitleChange: (newTitle: string) => void;
  onUpdateCanvas: (updatedCanvas: Partial<CanvasSettings>) => void;
  onTogglePreviewMode: () => void;
  onSaveDashboard: () => void;
  onOpenDashboardManager: () => void;
  onNewDashboard?: () => void;
  onNewReport?: () => void;
  onAddPage?: () => void;
  onSelectPage?: (pageId: string) => void;
  onRenamePage?: (pageId: string, newName: string) => void;
  onDeletePage?: (pageId: string) => void;
  onAddWidget?: (widgetType: WidgetType) => void;
  onOpenDataCleaning?: () => void;
}

const DASHBOARD_PRESETS: { name: string; width: number; height: number }[] = [
  { name: '1920×1080 Full HD', width: 1920, height: 1080 },
  { name: '1366×768 Laptop', width: 1366, height: 768 },
  { name: '1280×720 HD', width: 1280, height: 720 },
  { name: '1024×768 Tablet', width: 1024, height: 768 },
];

type MenuName = 'file' | 'edit' | 'view' | 'insert' | 'format' | 'help' | null;

export const TopToolbar: React.FC<Props> = ({
  dashboardTitle,
  projectType = 'dashboard',
  pages = [],
  activePageId,
  widgetCount,
  autoSaveStatus,
  canvas,
  canUndo,
  canRedo,
  activeFilterCount = 0,
  onBackToHub,
  onOpenFilters,
  onExportPdf,
  onUndo,
  onRedo,
  onTitleChange,
  onUpdateCanvas,
  onTogglePreviewMode,
  onSaveDashboard,
  onOpenDashboardManager,
  onNewDashboard,
  onNewReport,
  onAddPage,
  onSelectPage,
  onRenamePage,
  onDeletePage,
  onAddWidget,
  onOpenDataCleaning,
  activeWorkspaceView = 'canvas',
  onChangeWorkspaceView,
  onOpenSelectDatasets,
}) => {
  const { t } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<MenuName>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(dashboardTitle);
  const [showCanvasPopover, setShowCanvasPopover] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageNameInput, setPageNameInput] = useState('');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const canvasPopoverRef = useRef<HTMLDivElement>(null);

  // Close menus & canvas popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuContainerRef.current && !menuContainerRef.current.contains(target)) {
        setActiveMenu(null);
        setShowMobileMenu(false);
      }
      if (canvasPopoverRef.current && !canvasPopoverRef.current.contains(target)) {
        setShowCanvasPopover(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
        setShowMobileMenu(false);
        setShowCanvasPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      onTitleChange(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const activePageIndex = pages.findIndex((p) => p.id === activePageId);

  const handlePageRenameSubmit = (pageId: string) => {
    if (pageNameInput.trim() && onRenamePage) {
      onRenamePage(pageId, pageNameInput.trim());
    }
    setEditingPageId(null);
  };

  const toggleMenu = (menu: MenuName) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMouseEnterMenu = (menu: MenuName) => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  return (
    <header className="relative z-30 bg-white border-b border-slate-200 select-none shadow-xs text-slate-800">
      {/* ROW 1: DESKTOP APPLICATION MENU BAR & REPORT METADATA */}
      <div className="h-10 px-2.5 sm:px-4 flex items-center justify-between border-b border-slate-100 text-xs gap-2 min-w-0">
        {/* Left: Brand + Command Menu Bar */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0" ref={menuContainerRef}>
          {/* Mobile / Tablet Compact Command Menu */}
          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobileMenu((prev) => !prev)}
              aria-expanded={showMobileMenu}
              aria-label={t('menuFile')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                showMobileMenu ? 'bg-slate-200 text-slate-900' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {showMobileMenu && (
              <div className="fixed top-10 start-2 w-[min(20rem,calc(100vw-1rem))] max-h-[75dvh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 space-y-2 text-xs text-slate-800">
                <div className="px-2 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('menuFile')}</div>
                <div className="space-y-0.5">
                  {onNewDashboard && (
                    <button type="button" onClick={() => { onNewDashboard(); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer">
                      <Layout className="w-4 h-4 text-slate-500" /> {t('newDashboard')}
                    </button>
                  )}
                  {onNewReport && (
                    <button type="button" onClick={() => { onNewReport(); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer">
                      <FilePlus className="w-4 h-4 text-slate-500" /> {t('newReport')}
                    </button>
                  )}
                  {projectType === 'report' && onAddPage && (
                    <button type="button" onClick={() => { onAddPage(); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer">
                      <Plus className="w-4 h-4 text-slate-500" /> {t('insertNewPage')}
                    </button>
                  )}
                  <button type="button" onClick={() => { onOpenDashboardManager(); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer">
                    <FolderOpen className="w-4 h-4 text-slate-500" /> {t('openSavedProjects')}
                  </button>
                  <button type="button" onClick={() => { onSaveDashboard(); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-sky-600 font-bold cursor-pointer">
                    <Save className="w-4 h-4 text-sky-600" /> {t('saveReport')}
                  </button>
                  {onExportPdf && (
                    <button type="button" onClick={() => { onExportPdf(); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer">
                      <Printer className="w-4 h-4 text-emerald-600" /> {t('exportPdf')}
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1.5">
                  <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('menuInsert')}</div>
                  <div className="grid grid-cols-2 gap-1">
                    <button type="button" onClick={() => { onAddWidget?.('bar'); setShowMobileMenu(false); }} className="text-start px-2.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer truncate">
                      <BarChart3 className="w-3.5 h-3.5 text-sky-600 shrink-0" /> <span className="truncate">{t('standardChart')}</span>
                    </button>
                    <button type="button" onClick={() => { onAddWidget?.('kpi'); setShowMobileMenu(false); }} className="text-start px-2.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer truncate">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span className="truncate">{t('kpiMetricCard')}</span>
                    </button>
                    <button type="button" onClick={() => { onAddWidget?.('textbox'); setShowMobileMenu(false); }} className="text-start px-2.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer truncate">
                      <Type className="w-3.5 h-3.5 text-amber-600 shrink-0" /> <span className="truncate">{t('richTextBlock')}</span>
                    </button>
                    <button type="button" onClick={() => { onAddWidget?.('forecast'); setShowMobileMenu(false); }} className="text-start px-2.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer truncate">
                      <TrendingUp className="w-3.5 h-3.5 text-sky-600 shrink-0" /> <span className="truncate">{t('insertForecastChart')}</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-1.5">
                  <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('menuView')} & {t('menuHelp')}</div>
                  <div className="space-y-0.5">
                    <button type="button" onClick={() => { onUpdateCanvas({ snapToGrid: !canvas.snapToGrid }); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center justify-between hover:bg-slate-100 cursor-pointer">
                      <span className="flex items-center gap-2"><Grid className="w-4 h-4 text-slate-500" /> {t('gridSnap')}</span>
                      {canvas.snapToGrid && <Check className="w-4 h-4 text-sky-600" />}
                    </button>
                    <button type="button" onClick={() => { setShowCanvasPopover(true); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer">
                      <SlidersHorizontal className="w-4 h-4 text-slate-500" /> {t('canvasSizeSettings')}
                    </button>
                    <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent('datapulse:open-tour')); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer">
                      <Sparkles className="w-4 h-4 text-sky-500" /> {t('quickTour')}
                    </button>
                    <button type="button" onClick={() => { setShowShortcutsModal(true); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer">
                      <Command className="w-4 h-4 text-sky-600" /> {t('keyboardShortcuts')}
                    </button>
                    <button type="button" onClick={() => { setShowAboutModal(true); setShowMobileMenu(false); }} className="w-full text-start px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer">
                      <Info className="w-4 h-4 text-sky-600" /> {t('aboutDataPulse')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Brand Logo & Name */}
          <BrandHomeLink
            variant="toolbar"
            size={22}
            ariaLabel={t('leftHomeTitle')}
            title={t('leftHomeTitle')}
          />

          {/* Traditional Command Menu Bar (Desktop lg+) */}
          <nav aria-label={t('workbench')} className="hidden lg:flex items-center gap-0.5 relative">
            {/* FILE MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu('file')}
                onMouseEnter={() => handleMouseEnterMenu('file')}
                aria-expanded={activeMenu === 'file'}
                aria-haspopup="true"
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  activeMenu === 'file'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t('menuFile')}
              </button>
              {activeMenu === 'file' && (
                <div className="absolute top-full start-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 text-xs text-slate-800 animate-in fade-in duration-100">
                  {onNewDashboard && (
                    <button
                      type="button"
                      onClick={() => {
                        onNewDashboard();
                        setActiveMenu(null);
                      }}
                      className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-slate-500" /> {t('newDashboard')}
                      </span>
                    </button>
                  )}

                  {onNewReport && (
                    <button
                      type="button"
                      onClick={() => {
                        onNewReport();
                        setActiveMenu(null);
                      }}
                      className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FilePlus className="w-4 h-4 text-slate-500" /> {t('newReport')}
                      </span>
                    </button>
                  )}

                  {projectType === 'report' && onAddPage && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddPage();
                        setActiveMenu(null);
                      }}
                      className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-slate-500" /> {t('insertNewPage')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+N</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onOpenDashboardManager();
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-slate-500" /> {t('openSavedProjects')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Ctrl+O</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      onSaveDashboard();
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer font-bold text-sky-600"
                  >
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4 text-sky-600" /> {t('saveReport')}
                    </span>
                    <span className="text-[10px] text-sky-500 font-mono">Ctrl+S</span>
                  </button>

                  {onExportPdf && (
                    <button
                      type="button"
                      onClick={() => {
                        onExportPdf();
                        setActiveMenu(null);
                      }}
                      className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-emerald-600" /> {t('exportPdf')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+P</span>
                    </button>
                  )}

                  {onOpenDataCleaning && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenDataCleaning();
                        setActiveMenu(null);
                      }}
                      className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-sky-50 text-sky-800 transition-colors cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-600" /> {t('exploreData')}
                      </span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-100" />

                  {onBackToHub && (
                    <button
                      type="button"
                      onClick={() => {
                        onBackToHub();
                        setActiveMenu(null);
                      }}
                      className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-rose-50 text-rose-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4 text-rose-500 rtl:rotate-180" /> {t('backToHub')}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* EDIT MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu('edit')}
                onMouseEnter={() => handleMouseEnterMenu('edit')}
                aria-expanded={activeMenu === 'edit'}
                aria-haspopup="true"
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  activeMenu === 'edit'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t('menuEdit')}
              </button>
              {activeMenu === 'edit' && (
                <div className="absolute top-full start-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 text-xs text-slate-800 animate-in fade-in duration-100">
                  <button
                    type="button"
                    disabled={!canUndo}
                    onClick={() => {
                      onUndo();
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-slate-500" /> {t('undo')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Ctrl+Z</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canRedo}
                    onClick={() => {
                      onRedo();
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCw className="w-4 h-4 text-slate-500" /> {t('redo')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Ctrl+Y</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setTitleInput(dashboardTitle);
                      setIsEditingTitle(true);
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-slate-500" /> {t('renameReportTitle')}
                  </button>

                  {onOpenFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenFilters();
                        setActiveMenu(null);
                      }}
                      className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-sky-600" /> {t('globalFilters')}
                      </span>
                      {activeFilterCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded-full text-[10px] font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenDataCleaning && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenDataCleaning();
                        setActiveMenu(null);
                      }}
                      className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-sky-50 text-sky-800 transition-colors cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-600" /> {t('exploreData')}
                      </span>
                    </button>
                  )}

                  {pages.length > 1 && onDeletePage && activePageId && (
                    <>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          onDeletePage(activePageId);
                          setActiveMenu(null);
                        }}
                        className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer font-semibold"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" /> {t('deleteActivePage')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* VIEW MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu('view')}
                onMouseEnter={() => handleMouseEnterMenu('view')}
                aria-expanded={activeMenu === 'view'}
                aria-haspopup="true"
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  activeMenu === 'view'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t('menuView')}
              </button>
              {activeMenu === 'view' && (
                <div className="absolute top-full start-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 text-xs text-slate-800 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePreviewMode();
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                  >
                      <Eye className="w-4 h-4 text-sky-600" /> {t('preview')}
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCanvas({ zoom: Math.min(2.0, canvas.zoom + 0.1) });
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4 text-slate-500" /> {t('zoom')} + (+10%)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCanvas({ zoom: Math.max(0.3, canvas.zoom - 0.1) });
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4 text-slate-500" /> {t('zoom')} - (-10%)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCanvas({ zoom: 1.0 });
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <span>{t('resetZoom')}</span>
                    <span className="font-mono text-[10px] font-bold text-sky-600">100%</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCanvas({ zoom: 0.70 });
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    {t('fitPage')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCanvas({ zoom: 0.95 });
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    {t('fitWidth')}
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCanvas({ snapToGrid: !canvas.snapToGrid });
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-slate-500" /> {t('gridSnap')}
                    </span>
                    {canvas.snapToGrid && <Check className="w-4 h-4 text-sky-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* INSERT MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu('insert')}
                onMouseEnter={() => handleMouseEnterMenu('insert')}
                aria-expanded={activeMenu === 'insert'}
                aria-haspopup="true"
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  activeMenu === 'insert'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t('menuInsert')}
              </button>
              {activeMenu === 'insert' && (
                <div className="absolute top-full start-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 text-xs text-slate-800 animate-in fade-in duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('insertWidgets')}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onAddWidget?.('bar');
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4 text-sky-600" /> {t('standardChart')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddWidget?.('kpi');
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> {t('kpiMetricCard')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddWidget?.('textbox');
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Type className="w-4 h-4 text-amber-600" /> {t('richTextBlock')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddWidget?.('scatter3d');
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Box className="w-4 h-4 text-cyan-600" /> {t('scatter3dGraph')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddWidget?.('forecast');
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 text-sky-600" /> {t('insertForecastChart')}
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      onAddPage?.();
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                  >
                    <Plus className="w-4 h-4 text-slate-500" /> {t('insertNewPage')}
                  </button>
                </div>
              )}
            </div>

            {/* FORMAT MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu('format')}
                onMouseEnter={() => handleMouseEnterMenu('format')}
                aria-expanded={activeMenu === 'format'}
                aria-haspopup="true"
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  activeMenu === 'format'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t('menuFormat')}
              </button>
              {activeMenu === 'format' && (
                <div className="absolute top-full start-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 text-xs text-slate-800 animate-in fade-in duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {projectType === 'report' ? t('printableReportTitle') : t('canvasPreset')}
                  </div>

                  {projectType === 'report' ? (
                    Object.keys(REPORT_PAGE_PRESETS).map((key) => {
                      const preset = REPORT_PAGE_PRESETS[key as ReportPageSizePreset];
                      const isSelected = canvas.pageSizePreset === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onUpdateCanvas({
                              pageSizePreset: key as ReportPageSizePreset,
                              presetName: key,
                              orientation: preset.orientation,
                              widthPhysical: preset.widthPhysical,
                              heightPhysical: preset.heightPhysical,
                              unit: preset.unit,
                            });
                            setActiveMenu(null);
                          }}
                          className={`w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected ? 'bg-sky-50 text-sky-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{key}</span>
                          {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                        </button>
                      );
                    })
                  ) : (
                    DASHBOARD_PRESETS.map((p) => {
                      const isSelected = !canvas.pageSizePreset && canvas.presetName === p.name;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            onUpdateCanvas({
                              presetName: p.name,
                              pageSizePreset: undefined,
                              width: p.width,
                              height: p.height,
                            });
                            setActiveMenu(null);
                          }}
                          className={`w-full text-start px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected ? 'bg-sky-50 text-sky-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{p.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                        </button>
                      );
                    })
                  )}

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowCanvasPopover(true);
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-slate-500" /> {t('canvasSizeSettings')}
                  </button>
                </div>
              )}
            </div>

            {/* HELP MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu('help')}
                onMouseEnter={() => handleMouseEnterMenu('help')}
                aria-expanded={activeMenu === 'help'}
                aria-haspopup="true"
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  activeMenu === 'help'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t('menuHelp')}
              </button>
              {activeMenu === 'help' && (
                <div className="absolute top-full start-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 text-xs text-slate-800 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('datapulse:open-tour'));
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-sky-500" /> {t('quickTour')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowShortcutsModal(true);
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Command className="w-4 h-4 text-sky-600" /> {t('keyboardShortcuts')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAboutModal(true);
                      setActiveMenu(null);
                    }}
                    className="w-full text-start px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-sky-600" /> {t('aboutDataPulse')}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Title, Type Badge, Auto-Save Status, Back Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Report Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              dir="auto"
              autoFocus
              aria-label={t('menuEditReportTitleAria')}
              className="w-28 sm:w-44 px-2 py-0.5 bg-slate-50 border border-sky-500 rounded text-xs font-bold text-slate-900 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleInput(dashboardTitle);
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1 text-start p-1 rounded hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer min-w-0"
              title={t('menuRenameReportTip')}
              aria-label={`${t('menuRenameReportTip')}: ${dashboardTitle}`}
            >
              <h2 className="font-bold text-xs sm:text-sm text-slate-900 max-w-[85px] sm:max-w-[180px] truncate" dir="auto">
                {dashboardTitle}
              </h2>
              <Pencil className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          )}

          {/* Type Badge */}
          <span
            className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border shrink-0 ${
              projectType === 'report'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}
          >
            {projectType === 'report' ? t('reportBadge') : t('dashboardBadge')}
          </span>

          {/* Auto-Save Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] ps-1 shrink-0" title={t('saveNow')}>
            {autoSaveStatus === 'saving' ? (
              <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
            ) : (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  autoSaveStatus === 'saved' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            )}
            <span className="text-slate-500 text-[11px] font-medium">
              {autoSaveStatus === 'saved' ? t('saved') : autoSaveStatus === 'saving' ? t('saving') : t('unsavedChanges')}
            </span>
          </div>

          {/* Language Selector */}
          <LanguageToggle compact className="h-7 text-xs py-0.5 px-2" />

          {/* Hub Navigation */}
          {onBackToHub && (
            <button
              type="button"
              onClick={onBackToHub}
              className="h-7 px-2.5 rounded-md bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80 text-slate-700 hover:text-slate-900 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title={t('backToHub')}
              aria-label={t('backToHub')}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600 shrink-0 rtl:rotate-180" />
              <span className="hidden sm:inline">{t('backToHub')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ROW 2: QUICK ACTION TOOLBAR / RIBBON */}
      <div className="min-h-[44px] px-2.5 sm:px-4 py-1 flex items-center justify-between bg-slate-50/80 border-b border-slate-200/80 text-xs gap-2 min-w-0">
        {/* Left Toolbar Commands (horizontally scrollable on narrow screens) */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5 [&>*]:shrink-0">
          {/* Undo & Redo Group */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 disabled:opacity-35 disabled:hover:bg-white transition-all focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer"
              title={`${t('undo')} (Ctrl+Z)`}
              aria-label={t('undo')}
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 disabled:opacity-35 disabled:hover:bg-white transition-all focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer"
              title={`${t('redo')} (Ctrl+Y)`}
              aria-label={t('redo')}
            >
              <RotateCw className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Page Tabs Bar (Only in Report mode) */}
          {projectType === 'report' && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-0.5" />
              <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg">
                {pages.length > 1 && (
                  <div className="flex items-center pe-1 border-e border-slate-300/60 gap-0.5">
                    <button
                      type="button"
                      onClick={() => activePageIndex > 0 && onSelectPage && onSelectPage(pages[activePageIndex - 1].id)}
                      disabled={activePageIndex <= 0}
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-slate-300/80 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      title={t('menuPrevPage')}
                      aria-label={t('menuPrevPage')}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                    <span className="text-[10px] font-bold text-slate-600 px-1" dir="ltr">
                      {activePageIndex + 1}/{pages.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => activePageIndex < pages.length - 1 && onSelectPage && onSelectPage(pages[activePageIndex + 1].id)}
                      disabled={activePageIndex >= pages.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-slate-300/80 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      title={t('menuNextPage')}
                      aria-label={t('menuNextPage')}
                    >
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                )}

                {/* Page Tabs */}
                <div className="flex items-center gap-1 max-w-[180px] sm:max-w-[340px] overflow-x-auto no-scrollbar">
                  {pages.map((p) => {
                    const isActive = p.id === (activePageId || pages[0]?.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectPage && onSelectPage(p.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                          isActive
                            ? 'bg-white text-sky-700 shadow-xs font-bold border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
                        }`}
                      >
                        <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />

                        {editingPageId === p.id ? (
                          <input
                            type="text"
                            value={pageNameInput}
                            onChange={(e) => setPageNameInput(e.target.value)}
                            onBlur={() => handlePageRenameSubmit(p.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePageRenameSubmit(p.id)}
                            autoFocus
                            dir="auto"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={t('menuRenamePageTip')}
                            className="w-20 px-1 py-0.5 bg-white border border-sky-500 rounded text-xs font-semibold text-slate-900 focus:outline-none"
                          />
                        ) : (
                          <span
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingPageId(p.id);
                              setPageNameInput(p.name);
                            }}
                            dir="auto"
                            className="truncate max-w-[100px]"
                            title={t('menuDoubleClickRenamePage')}
                          >
                            {p.name}
                          </span>
                        )}

                        {isActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPageId(p.id);
                              setPageNameInput(p.name);
                            }}
                            className="p-0.5 hover:bg-sky-50 text-slate-400 hover:text-sky-600 rounded transition-colors cursor-pointer"
                            title={t('menuRenamePageTip')}
                            aria-label={`${t('menuRenamePageTip')}: ${p.name}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}

                        {pages.length > 1 && onDeletePage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePage(p.id);
                            }}
                            className="p-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title={`${t('menuDeletePageTip')}: ${p.name}`}
                            aria-label={`${t('menuDeletePageTip')}: ${p.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Page Button */}
                {onAddPage && (
                  <button
                    type="button"
                    onClick={onAddPage}
                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-300 text-slate-700 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
                    title={t('menuAddReportPage')}
                    aria-label={t('menuAddReportPage')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}

          {onOpenFilters && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />
              <button
                type="button"
                data-tour-target="filters-btn"
                onClick={onOpenFilters}
                title={t('globalFilters')}
                aria-label={t('globalFilters')}
                className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer ${
                  activeFilterCount > 0
                    ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 active:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline">{t('globalFilters')}</span>
                {activeFilterCount > 0 && (
                  <span className="bg-white text-sky-700 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </>
          )}

          {onOpenDataCleaning && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />
              <button
                type="button"
                onClick={onOpenDataCleaning}
                title={t('exploreData')}
                aria-label={t('exploreData')}
                className="h-8 px-2.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="hidden sm:inline">{t('exploreData')}</span>
              </button>
            </>
          )}

          {onOpenSelectDatasets && (
            <button
              type="button"
              onClick={onOpenSelectDatasets}
              title={t('selectDatasets')}
              aria-label={t('selectDatasets')}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="hidden sm:inline">{t('selectDatasets')}</span>
            </button>
          )}

          {onChangeWorkspaceView && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => onChangeWorkspaceView('canvas')}
                  className={`h-7 px-2.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeWorkspaceView !== 'data_model'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={t('canvas')}
                >
                  <Layout className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden md:inline">{t('canvas')}</span>
                </button>
                <button
                  type="button"
                  data-tour-target="data-model-toggle"
                  onClick={() => onChangeWorkspaceView('data_model')}
                  className={`h-7 px-2.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeWorkspaceView === 'data_model'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={t('dataModel')}
                >
                  <Network className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden md:inline">{t('dataModel')}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Canvas & Zoom Popover Trigger */}
          <div className="relative" ref={canvasPopoverRef}>
            <button
              type="button"
              onClick={() => setShowCanvasPopover(!showCanvasPopover)}
              className="h-8 px-2 sm:px-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer shadow-2xs"
              title={t('toolbarAdjustCanvasTip')}
              aria-label={t('toolbarAdjustCanvasTip')}
              aria-expanded={showCanvasPopover}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="hidden lg:inline text-slate-600 font-medium">{t('toolbarCanvasLabel')}</span>
              <span className="hidden md:inline-block text-slate-900 font-mono font-bold text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" dir="ltr">
                {canvas.width || 1920} × {canvas.height || 1080}
              </span>
              <span className="text-sky-600 font-mono font-bold text-[11px] hidden sm:inline" dir="ltr">
                {Math.round(canvas.zoom * 100)}%
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {/* Canvas Popover */}
            {showCanvasPopover && (
              <div className="fixed sm:absolute top-22 sm:top-10 end-2 sm:end-0 w-[min(22rem,calc(100vw-1rem))] max-h-[calc(100dvh-6.5rem)] overflow-y-auto p-4 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 text-xs space-y-3.5 text-slate-800">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Maximize2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm truncate">{t('toolbarCanvasSizeSettings')}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 shrink-0" dir="ltr">
                    {canvas.width || 1920} × {canvas.height || 1080} px
                  </span>
                </div>

                {/* MANUAL CANVAS SIZE INPUTS */}
                <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider truncate">
                      {t('toolbarManualDimPx')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                        lockAspectRatio
                          ? 'bg-sky-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={lockAspectRatio ? t('toolbarRatioLocked') : t('toolbarUnlockRatio')}
                    >
                      {lockAspectRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{lockAspectRatio ? t('toolbarRatioLocked') : t('toolbarUnlockRatio')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Width input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600">{t('toolbarWidthLabel')}</label>
                        <div className="flex items-center gap-0.5" dir="ltr">
                          <button
                            type="button"
                            onClick={() => {
                              const newW = Math.max(400, (canvas.width || 1920) - 50);
                              let newH = canvas.height || 1080;
                              if (lockAspectRatio && (canvas.width || 1920) > 0) {
                                newH = Math.round(newW * ((canvas.height || 1080) / (canvas.width || 1920)));
                              }
                              onUpdateCanvas({
                                width: newW,
                                height: newH,
                                pageSizePreset: 'Custom Size',
                                presetName: `Custom (${newW}×${newH})`,
                              });
                            }}
                            className="px-1 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            -50
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newW = Math.min(8000, (canvas.width || 1920) + 50);
                              let newH = canvas.height || 1080;
                              if (lockAspectRatio && (canvas.width || 1920) > 0) {
                                newH = Math.round(newW * ((canvas.height || 1080) / (canvas.width || 1920)));
                              }
                              onUpdateCanvas({
                                width: newW,
                                height: newH,
                                pageSizePreset: 'Custom Size',
                                presetName: `Custom (${newW}×${newH})`,
                              });
                            }}
                            className="px-1 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            +50
                          </button>
                        </div>
                      </div>
                      <div className="relative" dir="ltr">
                        <input
                          type="number"
                          min={400}
                          max={8000}
                          step={10}
                          value={canvas.width || 1920}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 400;
                            const clamped = Math.max(400, Math.min(8000, val));
                            let newH = canvas.height || 1080;
                            if (lockAspectRatio && (canvas.width || 1920) > 0) {
                              newH = Math.round(clamped * ((canvas.height || 1080) / (canvas.width || 1920)));
                            }
                            onUpdateCanvas({
                              width: clamped,
                              height: newH,
                              pageSizePreset: 'Custom Size',
                              presetName: `Custom (${clamped}×${newH})`,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-sky-500 pe-7"
                        />
                        <span className="absolute end-2 top-2 text-[10px] text-slate-400 font-mono">px</span>
                      </div>
                    </div>

                    {/* Height input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600">{t('toolbarHeightLabel')}</label>
                        <div className="flex items-center gap-0.5" dir="ltr">
                          <button
                            type="button"
                            onClick={() => {
                              const newH = Math.max(300, (canvas.height || 1080) - 50);
                              let newW = canvas.width || 1920;
                              if (lockAspectRatio && (canvas.height || 1080) > 0) {
                                newW = Math.round(newH * ((canvas.width || 1920) / (canvas.height || 1080)));
                              }
                              onUpdateCanvas({
                                width: newW,
                                height: newH,
                                pageSizePreset: 'Custom Size',
                                presetName: `Custom (${newW}×${newH})`,
                              });
                            }}
                            className="px-1 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            -50
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newH = Math.min(8000, (canvas.height || 1080) + 50);
                              let newW = canvas.width || 1920;
                              if (lockAspectRatio && (canvas.height || 1080) > 0) {
                                newW = Math.round(newH * ((canvas.width || 1920) / (canvas.height || 1080)));
                              }
                              onUpdateCanvas({
                                width: newW,
                                height: newH,
                                pageSizePreset: 'Custom Size',
                                presetName: `Custom (${newW}×${newH})`,
                              });
                            }}
                            className="px-1 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            +50
                          </button>
                        </div>
                      </div>
                      <div className="relative" dir="ltr">
                        <input
                          type="number"
                          min={300}
                          max={8000}
                          step={10}
                          value={canvas.height || 1080}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 300;
                            const clamped = Math.max(300, Math.min(8000, val));
                            let newW = canvas.width || 1920;
                            if (lockAspectRatio && (canvas.height || 1080) > 0) {
                              newW = Math.round(clamped * ((canvas.width || 1920) / (canvas.height || 1080)));
                            }
                            onUpdateCanvas({
                              width: newW,
                              height: clamped,
                              pageSizePreset: 'Custom Size',
                              presetName: `Custom (${newW}×${clamped})`,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-sky-500 pe-7"
                        />
                        <span className="absolute end-2 top-2 text-[10px] text-slate-400 font-mono">px</span>
                      </div>
                    </div>
                  </div>

                  {/* Aspect Ratio Chips */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {t('toolbarQuickRatios')}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCanvas({
                            width: 1920,
                            height: 1080,
                            pageSizePreset: 'Custom Size',
                            presetName: '1920×1080 (16:9)',
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          canvas.width === 1920 && canvas.height === 1080
                            ? 'bg-sky-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        16:9 (1920×1080)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCanvas({
                            width: 1920,
                            height: 1200,
                            pageSizePreset: 'Custom Size',
                            presetName: '1920×1200 (16:10)',
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          canvas.width === 1920 && canvas.height === 1200
                            ? 'bg-sky-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        16:10 (1920×1200)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCanvas({
                            width: 1024,
                            height: 768,
                            pageSizePreset: 'Custom Size',
                            presetName: '1024×768 (4:3)',
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          canvas.width === 1024 && canvas.height === 768
                            ? 'bg-sky-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        4:3 (1024×768)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCanvas({
                            width: 1080,
                            height: 1080,
                            pageSizePreset: 'Custom Size',
                            presetName: '1080×1080 (1:1)',
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          canvas.width === 1080 && canvas.height === 1080
                            ? 'bg-sky-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        1:1 (1080×1080)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCanvas({
                            width: 2560,
                            height: 1080,
                            pageSizePreset: 'Custom Size',
                            presetName: '21:9 Ultra-wide',
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          canvas.width === 2560 && canvas.height === 1080
                            ? 'bg-sky-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        21:9 (2560×1080)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preset Selector */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium text-[11px]">
                    {projectType === 'report' ? t('toolbarPaperSizePreset') : t('toolbarScreenSizePreset')}
                  </span>
                  <select
                    value={projectType === 'report' ? (canvas.pageSizePreset || 'A4 Portrait') : (canvas.presetName || '1920×1080 Full HD')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (projectType === 'report') {
                        const presetKey = val as ReportPageSizePreset;
                        const foundPreset = REPORT_PAGE_PRESETS[presetKey];
                        if (foundPreset) {
                          onUpdateCanvas({
                            pageSizePreset: presetKey,
                            presetName: presetKey,
                            orientation: foundPreset.orientation,
                            widthPhysical: foundPreset.widthPhysical,
                            heightPhysical: foundPreset.heightPhysical,
                            unit: foundPreset.unit,
                          });
                        }
                      } else {
                        const found = DASHBOARD_PRESETS.find((p) => p.name === val);
                        if (found) {
                          onUpdateCanvas({
                            presetName: found.name,
                            pageSizePreset: undefined,
                            width: found.width,
                            height: found.height,
                          });
                        }
                      }
                    }}
                    aria-label={projectType === 'report' ? t('toolbarPaperSizePreset') : t('toolbarScreenSizePreset')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
                  >
                    {projectType === 'report' ? (
                      Object.keys(REPORT_PAGE_PRESETS).map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))
                    ) : (
                      DASHBOARD_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Zoom Controls */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 font-medium text-[11px]">{t('toolbarZoomScale')}</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => onUpdateCanvas({ zoom: Math.max(0.3, canvas.zoom - 0.1) })}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      title={t('dmZoomOut')}
                      aria-label={t('dmZoomOut')}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="font-mono font-bold text-sky-600 text-xs" dir="ltr">
                      {Math.round(canvas.zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateCanvas({ zoom: Math.min(2.0, canvas.zoom + 0.1) })}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      title={t('dmZoomIn')}
                      aria-label={t('dmZoomIn')}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateCanvas({ zoom: 1.0 })}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer"
                      title={t('resetZoom')}
                      dir="ltr"
                    >
                      100%
                    </button>
                  </div>
                  {/* Fit Buttons */}
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => onUpdateCanvas({ zoom: 0.70 })}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {t('fitPage')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateCanvas({ zoom: 0.95 })}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {t('fitWidth')}
                    </button>
                  </div>
                </div>

                {/* Grid Snapping */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 font-medium text-[11px]">{t('toolbarGridSnapping')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateCanvas({ snapToGrid: !canvas.snapToGrid })}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      canvas.snapToGrid
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {canvas.snapToGrid ? t('toolbarOn') : t('toolbarOff')}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCanvasPopover(false)}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl mt-1 transition-colors cursor-pointer shadow-sm whitespace-nowrap shrink-0"
                >
                  {t('applyAndClose')}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onTogglePreviewMode}
            className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/70 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-all focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer whitespace-nowrap shrink-0"
            title={t('preview')}
            aria-label={t('preview')}
          >
            <Eye className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="hidden sm:inline">{t('preview')}</span>
          </button>

          {onExportPdf && (
            <button
              type="button"
              data-tour-target="export-pdf"
              onClick={onExportPdf}
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all focus-visible:outline-2 focus-visible:outline-emerald-500 cursor-pointer whitespace-nowrap shrink-0"
              title={t('exportPdf')}
              aria-label={t('exportPdf')}
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t('exportPdf')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSaveDashboard}
            className="h-8 px-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer whitespace-nowrap shrink-0"
            title={t('saveNow')}
            aria-label={t('saveNow')}
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span>{t('saveNow')}</span>
          </button>
        </div>
      </div>

      {/* KEYBOARD SHORTCUTS MODAL */}
      <Modal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        size="md"
        title={t('keyboardShortcuts')}
        icon={<Command className="w-5 h-5 text-sky-600" />}
        closeLabel={t('close')}
        footer={
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => setShowShortcutsModal(false)}
          >
            {t('toolbarGotIt')}
          </Button>
        }
      >
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100">
            <span className="text-slate-600 font-medium min-w-0 truncate">{t('undo')}</span>
            <kbd dir="ltr" className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-[11px] text-slate-700 shrink-0">
              Ctrl + Z
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100">
            <span className="text-slate-600 font-medium min-w-0 truncate">{t('redo')}</span>
            <kbd dir="ltr" className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-[11px] text-slate-700 shrink-0">
              Ctrl + Y
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100">
            <span className="text-slate-600 font-medium min-w-0 truncate">{t('toolbarShortcutSaveDesc')}</span>
            <kbd dir="ltr" className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-[11px] text-slate-700 shrink-0">
              Ctrl + S
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100">
            <span className="text-slate-600 font-medium min-w-0 truncate">{t('toolbarShortcutExportDesc')}</span>
            <kbd dir="ltr" className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-[11px] text-slate-700 shrink-0">
              Ctrl + P
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100">
            <span className="text-slate-600 font-medium min-w-0 truncate">{t('toolbarShortcutExitDesc')}</span>
            <kbd dir="ltr" className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-[11px] text-slate-700 shrink-0">
              Esc
            </kbd>
          </div>
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-slate-600 font-medium min-w-0 truncate">{t('toolbarShortcutRenameDesc')}</span>
            <span className="text-slate-500 font-medium text-[11px] shrink-0">{t('toolbarDoubleClick')}</span>
          </div>
        </div>
      </Modal>

      {/* ABOUT DATA PULSE MODAL */}
      <Modal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        size="sm"
        title={t('toolbarAboutTitle')}
        closeLabel={t('close')}
        footer={
          <Button
            type="button"
            variant="navy"
            size="sm"
            className="w-full"
            onClick={() => setShowAboutModal(false)}
          >
            {t('close')}
          </Button>
        }
      >
        <div className="space-y-4 text-center py-2">
          <div className="flex justify-center">
            <BrandLogo size={48} />
          </div>
          <div>
            <p className="text-xs font-bold text-sky-600">{t('toolbarAboutSubtitle')}</p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {t('toolbarAboutVersionDesc')}
            </p>
          </div>
        </div>
      </Modal>
    </header>
  );
};
