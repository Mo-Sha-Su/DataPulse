import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, lazy, Suspense, ComponentType } from 'react';
import { DashboardState, Widget, WidgetType, WidgetCategory, WidgetConfig, Dataset, CanvasSettings, DataFilter } from './types/dashboard';
import { User } from './types/auth';
import { fetchSessionUser, logoutUser, SESSION_EXPIRED_EVENT } from './services/authService';
import { createEmptyDashboard, DEFAULT_CANVAS, DEFAULT_REPORT_CANVAS } from './data/dashboardDefaults';
import { WIDGET_DEFINITIONS } from './data/widgetDefinitions';
import { useHistory } from './hooks/useHistory';
import { saveDashboardToDb, fetchDashboardsFromDb, deleteDashboardFromDb, consumeDroppedFilterCount } from './services/dbService';
import { normalizeDashboardFilters } from './utils/filterMigration';


import { LeftSidebar } from './components/Sidebar/LeftSidebar';
import { TopToolbar } from './components/Toolbar/TopToolbar';
import { GlobalFilterBar } from './components/Toolbar/GlobalFilterBar';
import { CanvasWorkspace } from './components/Canvas/CanvasWorkspace';
import { RightConfigPanel } from './components/Sidebar/RightConfigPanel';
import { DatasetPreviewModal } from './components/Modals/DatasetPreviewModal';
import { ManageDashboardsModal } from './components/Modals/ManageDashboardsModal';
import { SelectDatasetsModal } from './components/Modals/SelectDatasetsModal';
import { fetchGlobalDatasets, saveGlobalDataset, deleteGlobalDataset, invalidateDatasetsCache } from './services/globalDatasetService';
import { DataModelState } from './types/dataModel';
import { syncModelWithUsedDatasets } from './utils/dataModelingEngine';
import { EyeOff, CheckCircle2, X, Sparkles, AlertCircle, PanelLeft, SlidersHorizontal } from 'lucide-react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { OnboardingTourModal } from './components/Modals/OnboardingTourModal';
import { pathToRoute, routeToPath, resolveEffectiveRoute, isRouteProtected, getPostLoginRedirectRoute, AppRoute } from './utils/router';
import {
  mergeUpdatedDatasets,
  mergeDashboardDatasetsIfAffected,
  resolveDataLabInitialDatasets,
} from './utils/dataLabCommit';
import type { DataLabCloseOptions } from './pages/DataCleaningEditorPage';
import type { ForecastRecord } from './types/forecast';


/** Route-level code splitting for named exports. */
function lazyNamed<T extends Record<string, any>, K extends keyof T>(load: () => Promise<T>, name: K) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType<any> }));
}

const HomePage = lazyNamed(() => import('./pages/HomePage'), 'HomePage');
const FeaturesPage = lazyNamed(() => import('./pages/FeaturesPage'), 'FeaturesPage');
const PricingPage = lazyNamed(() => import('./pages/PricingPage'), 'PricingPage');
const AboutPage = lazyNamed(() => import('./pages/AboutPage'), 'AboutPage');
const LoginPage = lazyNamed(() => import('./pages/LoginPage'), 'LoginPage');
const SignupPage = lazyNamed(() => import('./pages/SignupPage'), 'SignupPage');
const DashboardHubPage = lazyNamed(() => import('./pages/DashboardHubPage'), 'DashboardHubPage');
const SampleGraphsPage = lazyNamed(() => import('./pages/SampleGraphsPage'), 'SampleGraphsPage');
const DataCleaningEditorPage = lazyNamed(() => import('./pages/DataCleaningEditorPage'), 'DataCleaningEditorPage');
const DataHubPage = lazyNamed(() => import('./pages/DataHubPage'), 'DataHubPage');
const ForecastStudioPage = lazyNamed(() => import('./pages/ForecastStudioPage'), 'ForecastStudioPage');
const DataModelWorkspace = lazyNamed(() => import('./components/DataModel/DataModelWorkspace'), 'DataModelWorkspace');
const ExportPdfModal = lazyNamed(() => import('./components/Modals/ExportPdfModal'), 'ExportPdfModal');

type PageView = 'home' | 'features' | 'pricing' | 'about' | 'login' | 'signup' | 'dashboard_hub' | 'bench' | 'sample_graphs' | 'data_hub' | 'forecasts';

function AppInner() {
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState<PageView>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [activeForecastId, setActiveForecastId] = useState<string | undefined>(undefined);
  const [targetForecastDatasetId, setTargetForecastDatasetId] = useState<string | undefined>(undefined);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isTourReplay, setIsTourReplay] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // The bench starts empty; saved work is loaded from the database when a dashboard is opened from the hub.
  const loadInitialState = (): DashboardState => createEmptyDashboard();

  const {
    currentState: dashboard,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(loadInitialState());

  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [configuringWidgetId, setConfiguringWidgetId] = useState<string | null>(null);
  const [inspectedDataset, setInspectedDataset] = useState<Dataset | null>(null);
  const [isDataCleaningOpen, setIsDataCleaningOpen] = useState(false);
  const [targetCleaningDatasetId, setTargetCleaningDatasetId] = useState<string | undefined>(undefined);
  const [isDashboardManagerOpen, setIsDashboardManagerOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [droppedFiltersNoticeCount, setDroppedFiltersNoticeCount] = useState(0);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [savedDashboards, setSavedDashboards] = useState<DashboardState[]>([]);
  const [globalDatasets, setGlobalDatasets] = useState<Dataset[]>([]);
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<'canvas' | 'data_model'>('canvas');
  const [isSelectDatasetsOpen, setIsSelectDatasetsOpen] = useState(false);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);

  // Maintain ref to current user and navigation state for popstate event listeners
  const currentUserRef = useRef<User | null>(currentUser);
  const isDataCleaningOpenRef = useRef(isDataCleaningOpen);
  const targetCleaningDatasetIdRef = useRef(targetCleaningDatasetId);
  const activeDashboardIdRef = useRef(activeDashboardId);
  const activePageRef = useRef(activePage);
  const savedDashboardsRef = useRef<DashboardState[]>(savedDashboards);

  // History API coordination refs
  const pendingRouteAfterLoginRef = useRef<AppRoute | null>(null);
  const pendingHistoryStepRef = useRef(false);
  const replaceNextUrlRef = useRef(false);
  const mountedSyncedRef = useRef(false);
  const canUseBackForDataLabRef = useRef(false);
  const bypassDataLabGuardRef = useRef(false);
  const restoringDataLabForwardRef = useRef(false);
  const checkedOnboardingUserIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    isDataCleaningOpenRef.current = isDataCleaningOpen;
    targetCleaningDatasetIdRef.current = targetCleaningDatasetId;
    activeDashboardIdRef.current = activeDashboardId;
    activePageRef.current = activePage;
    savedDashboardsRef.current = savedDashboards;
  }, [isDataCleaningOpen, targetCleaningDatasetId, activeDashboardId, activePage, savedDashboards]);

  // Dashboards saved by older versions (or other clients) can miss canvas fields such as zoom; fill the gaps.
  const withCanvasDefaults = useCallback(
    (d: DashboardState): DashboardState => ({ ...d, canvas: { ...DEFAULT_CANVAS, ...(d.canvas || {}) } }),
    []
  );

  // Open specific dashboard from Hub or deep link; unknown/deleted IDs always return to the hub.
  const handleOpenDashboardFromHub = useCallback(
    async (dashboardId: string, options?: { keepOverlayOpen?: boolean }) => {
      setActiveDashboardId(dashboardId);

      try {
        const dbItems = await fetchDashboardsFromDb();
        const target = dbItems.find((d) => d.id === dashboardId);
        if (target) {
          pushState(withCanvasDefaults(target));
          setDroppedFiltersNoticeCount(consumeDroppedFilterCount(target.id));
          setActivePage('bench');
          return;
        }
      } catch (e) {
        console.warn('Error reading dashboard from database', e);
      }

      const fromState = savedDashboardsRef.current.find((d) => d.id === dashboardId);
      if (fromState) {
        pushState(withCanvasDefaults(fromState));
        setDroppedFiltersNoticeCount(consumeDroppedFilterCount(fromState.id));
        setActivePage('bench');
        return;
      }

      // Unknown or deleted dashboard id: return to hub and never create a new dashboard.
      replaceNextUrlRef.current = true;
      if (options?.keepOverlayOpen) {
        setIsDataCleaningOpen(false);
        setTargetCleaningDatasetId(undefined);
      }
      setActiveDashboardId(null);
      setActiveWorkspaceView('canvas');
      setActivePage('dashboard_hub');
    },
    [pushState, withCanvasDefaults]
  );

  // Derive canonical route from React screen state for single-place History API synchronization.
  const currentRoute: AppRoute = useMemo(() => {
    if (isDataCleaningOpen) {
      return {
        page: 'data_lab',
        dashboardId: activePage === 'bench' && activeDashboardId ? activeDashboardId : undefined,
        datasetId: targetCleaningDatasetId,
      };
    }
    if (activePage === 'bench') {
      return { page: 'bench', dashboardId: activeDashboardId || undefined };
    }
    if (activePage === 'forecasts') {
      return { page: 'forecasts', forecastId: activeForecastId, datasetId: targetForecastDatasetId };
    }
    return { page: activePage };
  }, [isDataCleaningOpen, activePage, activeDashboardId, targetCleaningDatasetId, activeForecastId, targetForecastDatasetId]);

  // Single-place URL sync: runs in the same commit as screen transitions, pushing only when the path changed.
  useLayoutEffect(() => {
    if (!authChecked) return;
    if (pendingHistoryStepRef.current) return;
    const targetPath = routeToPath(currentRoute);

    if (!mountedSyncedRef.current) {
      mountedSyncedRef.current = true;
      if (window.location.pathname !== targetPath) {
        window.history.replaceState({ route: currentRoute }, '', targetPath);
      }
      return;
    }

    if (replaceNextUrlRef.current) {
      replaceNextUrlRef.current = false;
      if (window.location.pathname !== targetPath) {
        window.history.replaceState({ route: currentRoute }, '', targetPath);
      }
      return;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ route: currentRoute }, '', targetPath);
    }
  }, [authChecked, currentRoute]);

  // Restore the session from the server (httpOnly cookie -> /api/auth/me), then resolve the initial URL.
  useEffect(() => {
    let cancelled = false;
    fetchSessionUser().then((user) => {
      if (cancelled) return;
      setCurrentUser(user);
      currentUserRef.current = user;

      const initialRoute = pathToRoute(window.location.pathname);
      const effective = resolveEffectiveRoute(initialRoute, !!user);

      if (!user && isRouteProtected(initialRoute)) {
        pendingRouteAfterLoginRef.current = initialRoute;
      }

      if (effective.page === 'data_lab') {
        canUseBackForDataLabRef.current = false;
        setTargetCleaningDatasetId(effective.datasetId);
        setIsDataCleaningOpen(true);
        if (effective.dashboardId) {
          setActiveDashboardId(effective.dashboardId);
          setActivePage('bench');
          handleOpenDashboardFromHub(effective.dashboardId, { keepOverlayOpen: true });
        } else {
          setActivePage('data_hub');
        }
      } else if (effective.page === 'bench' && effective.dashboardId) {
        setActiveDashboardId(effective.dashboardId);
        setActivePage('bench');
        handleOpenDashboardFromHub(effective.dashboardId);
      } else if (effective.page === 'forecasts') {
        setActiveForecastId(effective.forecastId);
        setTargetForecastDatasetId(effective.datasetId);
        setActivePage('forecasts');
      } else {
        setActivePage(effective.page as PageView);
      }

      setAuthChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [handleOpenDashboardFromHub]);

  // Handle browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      pendingHistoryStepRef.current = false;

      if (restoringDataLabForwardRef.current) {
        restoringDataLabForwardRef.current = false;
        return;
      }

      const bypassGuard = bypassDataLabGuardRef.current;
      bypassDataLabGuardRef.current = false;

      if (isDataCleaningOpenRef.current) {
        const hasUnsaved = !bypassGuard && Boolean((window as any).__hasDataLabUnsavedChanges?.());
        if (hasUnsaved) {
          (window as any).__promptDataLabUnsaved?.('popstate');
          return;
        }
        setIsDataCleaningOpen(false);
        setTargetCleaningDatasetId(undefined);
      }

      const route = pathToRoute(window.location.pathname);
      const isAuthed = !!currentUserRef.current;
      const effective = resolveEffectiveRoute(route, isAuthed);

      if (!isAuthed && isRouteProtected(route)) {
        pendingRouteAfterLoginRef.current = route;
      }

      const canonicalEffectivePath = routeToPath(effective);
      if (window.location.pathname !== canonicalEffectivePath) {
        replaceNextUrlRef.current = true;
      }

      if (effective.page === 'data_lab') {
        canUseBackForDataLabRef.current = true;
        setTargetCleaningDatasetId(effective.datasetId);
        setIsDataCleaningOpen(true);
        if (effective.dashboardId) {
          if (activePageRef.current !== 'bench' || activeDashboardIdRef.current !== effective.dashboardId) {
            setActiveDashboardId(effective.dashboardId);
            setActivePage('bench');
            handleOpenDashboardFromHub(effective.dashboardId, { keepOverlayOpen: true });
          }
        } else if (activePageRef.current !== 'data_hub' && activePageRef.current !== 'bench') {
          setActivePage('data_hub');
        }
        return;
      }

      setIsDataCleaningOpen(false);
      setTargetCleaningDatasetId(undefined);

      if (effective.page === 'bench' && effective.dashboardId) {
        if (activePageRef.current !== 'bench' || activeDashboardIdRef.current !== effective.dashboardId) {
          handleOpenDashboardFromHub(effective.dashboardId);
        } else {
          setActivePage('bench');
        }
      } else if (effective.page === 'forecasts') {
        setActiveDashboardId(null);
        setActiveWorkspaceView('canvas');
        setActiveForecastId(effective.forecastId);
        setTargetForecastDatasetId(effective.datasetId);
        setActivePage('forecasts');
      } else {
        if (effective.page !== 'bench') {
          setActiveDashboardId(null);
          setActiveWorkspaceView('canvas');
        }
        setActiveForecastId(undefined);
        setTargetForecastDatasetId(undefined);
        setActivePage(effective.page as PageView);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleOpenDashboardFromHub]);

  // Listen for open tour and global navigation events
  useEffect(() => {
    const handleOpenTour = () => {
      setIsTourReplay(true);
      setShowTutorial(true);
    };
    const handleNav = (e: any) => {
      if (e.detail) {
        let dest: PageView = e.detail;
        if (dest === 'home' || (dest as string) === 'dashboards') {
          dest = currentUserRef.current ? 'dashboard_hub' : 'home';
        }
        const requestedRoute: AppRoute =
          dest === 'dashboard_hub'
            ? { page: 'dashboard_hub' }
            : dest === 'data_hub'
            ? { page: 'data_hub' }
            : dest === 'forecasts'
            ? { page: 'forecasts' }
            : dest === 'bench'
            ? { page: 'bench', dashboardId: activeDashboardIdRef.current || undefined }
            : ({ page: dest } as AppRoute);
        const isAuthed = !!currentUserRef.current;
        const effective = resolveEffectiveRoute(requestedRoute, isAuthed);
        if (!isAuthed && isRouteProtected(requestedRoute)) {
          pendingRouteAfterLoginRef.current = requestedRoute;
        }
        setIsDataCleaningOpen(false);
        setTargetCleaningDatasetId(undefined);
        if (effective.page !== 'bench') {
          setActiveDashboardId(null);
          setActiveWorkspaceView('canvas');
        }
        if (effective.page !== 'forecasts') {
          setActiveForecastId(undefined);
          setTargetForecastDatasetId(undefined);
        }
        setActivePage(effective.page as PageView);
      }
    };
    const handleOpenDataLab = (e?: any) => {
      const dsId = e?.detail?.datasetId || (typeof e?.detail === 'string' ? e.detail : undefined);
      canUseBackForDataLabRef.current = true;
      setTargetCleaningDatasetId(dsId);
      setIsDataCleaningOpen(true);
    };
    const handleOpenForecast = (e?: any) => {
      const fId = e?.detail?.forecastId;
      const dsId = e?.detail?.datasetId;
      setIsDataCleaningOpen(false);
      setTargetCleaningDatasetId(undefined);
      setActiveDashboardId(null);
      setActiveWorkspaceView('canvas');
      setActiveForecastId(fId);
      setTargetForecastDatasetId(dsId);
      setActivePage('forecasts');
    };
    window.addEventListener('datapulse:open-tour', handleOpenTour);
    window.addEventListener('datapulse:navigate', handleNav);
    window.addEventListener('datapulse:open-datalab', handleOpenDataLab);
    window.addEventListener('datapulse:open-forecast', handleOpenForecast);
    return () => {
      window.removeEventListener('datapulse:open-tour', handleOpenTour);
      window.removeEventListener('datapulse:navigate', handleNav);
      window.removeEventListener('datapulse:open-datalab', handleOpenDataLab);
      window.removeEventListener('datapulse:open-forecast', handleOpenForecast);
    };
  }, []);

  // Toast timer
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (!currentUser) {
      checkedOnboardingUserIdRef.current = null;
      return;
    }
    let cancelled = false;
    fetchGlobalDatasets()
      .then((ds) => {
        if (!cancelled) setGlobalDatasets(ds);
      })
      .catch((e) => console.warn('Failed to load datasets from database', e));
    fetchDashboardsFromDb()
      .then((items) => {
        if (!cancelled) setSavedDashboards(items);
      })
      .catch((e) => console.warn('Failed to load dashboards from database', e));

    // Auto-launch onboarding once per authenticated user session if not yet completed in Neon PostgreSQL
    if (checkedOnboardingUserIdRef.current !== String(currentUser.id)) {
      checkedOnboardingUserIdRef.current = String(currentUser.id);
      import('./services/neonService').then(({ fetchUserSettingsFromNeon }) => {
        fetchUserSettingsFromNeon().then((settings) => {
          if (cancelled) return;
          const isCompleted =
            settings?.preferences?.onboarding?.completed === true ||
            settings?.preferences?.onboardingCompleted === true;
          if (!isCompleted) {
            setIsTourReplay(false);
            setShowTutorial(true);
          }
        }).catch(() => {});
      }).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced Auto-Save to backend database
  const triggerAutoSave = useCallback((stateToSave: DashboardState) => {
    setAutoSaveStatus('saving');
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveDashboardToDb(stateToSave);
        setAutoSaveStatus('saved');
      } catch (err) {
        console.error('Failed to auto-save to database', err);
        setAutoSaveStatus('unsaved');
      }
    }, 1200);
  }, []);

  // Immediate save to the database (Ctrl+S / Save button): cancels the pending debounce.
  const saveNow = useCallback(async (state: DashboardState) => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    setAutoSaveStatus('saving');
    try {
      await saveDashboardToDb(state);
      setAutoSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save to database', err);
      setAutoSaveStatus('unsaved');
    }
  }, []);

  const updateDashboardState = (updater: (prev: DashboardState) => DashboardState) => {
    const newState = updater(dashboard);
    const updatedWithTime = { ...newState, updatedAt: new Date().toISOString() };
    pushState(updatedWithTime);
    triggerAutoSave(updatedWithTime);
  };

  const handleNavigate = (page: PageView, dashboardId?: string) => {
    setIsDataCleaningOpen(false);
    setTargetCleaningDatasetId(undefined);

    if (dashboardId) {
      const requestedRoute: AppRoute = { page: 'bench', dashboardId };
      if (!currentUser) {
        pendingRouteAfterLoginRef.current = requestedRoute;
        setActiveDashboardId(null);
        setActivePage('login');
        return;
      }
      handleOpenDashboardFromHub(dashboardId);
      return;
    }

    let dest = page;
    if (dest === 'home' || (dest as string) === 'dashboards') {
      dest = currentUser ? 'dashboard_hub' : 'home';
    }
    const requestedRoute: AppRoute =
      dest === 'dashboard_hub'
        ? { page: 'dashboard_hub' }
        : dest === 'data_hub'
        ? { page: 'data_hub' }
        : dest === 'forecasts'
        ? { page: 'forecasts' }
        : dest === 'bench'
        ? { page: 'bench', dashboardId: activeDashboardId || undefined }
        : ({ page: dest } as AppRoute);

    const effective = resolveEffectiveRoute(requestedRoute, !!currentUser);
    if (!currentUser && isRouteProtected(requestedRoute)) {
      pendingRouteAfterLoginRef.current = requestedRoute;
    }

    if (effective.page !== 'bench') {
      setActiveDashboardId(null);
      setActiveWorkspaceView('canvas');
    }
    if (effective.page !== 'forecasts') {
      setActiveForecastId(undefined);
      setTargetForecastDatasetId(undefined);
    }
    setActivePage(effective.page as PageView);
  };

  const handleLoginSuccess = (user: User) => {
    invalidateDatasetsCache();
    setGlobalDatasets([]);
    setCurrentUser(user); // triggers the database load of this user's datasets and dashboards
    currentUserRef.current = user;

    const nextRoute = getPostLoginRedirectRoute(pendingRouteAfterLoginRef.current);
    pendingRouteAfterLoginRef.current = null;

    if (nextRoute.page === 'data_lab') {
      canUseBackForDataLabRef.current = false;
      setTargetCleaningDatasetId(nextRoute.datasetId);
      setIsDataCleaningOpen(true);
      if (nextRoute.dashboardId) {
        setActiveDashboardId(nextRoute.dashboardId);
        setActivePage('bench');
        handleOpenDashboardFromHub(nextRoute.dashboardId, { keepOverlayOpen: true });
      } else {
        setActiveDashboardId(null);
        setActivePage('data_hub');
      }
    } else if (nextRoute.page === 'bench' && nextRoute.dashboardId) {
      handleOpenDashboardFromHub(nextRoute.dashboardId);
    } else if (nextRoute.page === 'forecasts') {
      setActiveDashboardId(null);
      setActiveWorkspaceView('canvas');
      setActiveForecastId(nextRoute.forecastId);
      setTargetForecastDatasetId(nextRoute.datasetId);
      setActivePage('forecasts');
    } else {
      setActiveDashboardId(null);
      setActiveWorkspaceView('canvas');
      setActiveForecastId(undefined);
      setTargetForecastDatasetId(undefined);
      setActivePage(nextRoute.page as PageView);
    }
  };

  const handleLogout = async () => {
    await logoutUser(); // clears the session cookie on the server
    invalidateDatasetsCache();
    setCurrentUser(null);
    setActivePage('home');
    // Hard reload so no in-memory data (datasets, dashboards, undo history) survives into the next session.
    window.location.assign('/');
  };

  // Session expired / rejected by the API: send the user back to sign in (everything is already saved in the database).
  useEffect(() => {
    const onExpired = () => {
      invalidateDatasetsCache();
      setCurrentUser(null);
      currentUserRef.current = null;
      setIsDataCleaningOpen(false);
      setTargetCleaningDatasetId(undefined);
      setActiveDashboardId(null);
      replaceNextUrlRef.current = true;
      setActivePage('login');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    if (activePage !== 'bench') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPreviewMode) setIsPreviewMode(false);
        setSelectedWidgetId(null);
        setConfiguringWidgetId(null);
        setInspectedDataset(null);
        setIsDashboardManagerOpen(false);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (canUndo) undo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          if (canRedo) redo();
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          saveNow(dashboard);
        } else if (e.shiftKey && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          setIsPreviewMode((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, dashboard, isPreviewMode, activePage]);

  // Widget addition
  const handleAddWidget = (type: WidgetType, categoryArg?: WidgetCategory) => {
    const def = WIDGET_DEFINITIONS.find((w) => w.type === type);
    const category = (categoryArg ?? def?.category) as WidgetCategory;
    if (!def && !categoryArg) return; // unknown widget type: never create a blank widget
    const activeDataset = resolvedDashboardDatasets[0] || dashboard.datasets[0];

    const currentPages = dashboard.pages && dashboard.pages.length > 0
      ? dashboard.pages
      : [{ id: 'p_1', name: t('appPageN', { n: 1 }) }];
    const activePageId = dashboard.activePageId || currentPages[0].id;
    const translatedWidgetName = t(`widget_${type}_name` as any) || def?.name || t('appNewWidgetTitle', { type });

    const newWidget: Widget = {
      id: `w_${type}_${Date.now()}`,
      type,
      category,
      title: translatedWidgetName,
      pageId: activePageId,
      position: {
        x: 60 + (dashboard.widgets.length % 5) * 40,
        y: 60 + (dashboard.widgets.length % 5) * 40,
        width: def?.defaultWidth || 420,
        height: def?.defaultHeight || 300,
        zIndex: dashboard.widgets.length + 1,
      },
      config: {
        datasetId: activeDataset?.id || '',
        xAxisField: activeDataset?.columns[0]?.name || '',
        yAxisField: activeDataset?.columns[1]?.name || activeDataset?.columns[0]?.name || '',
        aggregation: 'sum',
        numberFormat: 'number',
        currencySymbol: '$',
        title: translatedWidgetName,
        titleColor: '#1E293B',
        primaryColor: '#3B82F6',
        colorPalette: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'],
        backgroundColor: '#FFFFFF',
      },
    };

    updateDashboardState((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));

    setSelectedWidgetId(newWidget.id);
  };

  // New Document Handlers (Empty Canvas referencing Global Datasets)
  const handleNewDashboard = () => {
    const newDash: DashboardState = {
      id: `dashboard_${Date.now()}`,
      name: t('appUntitledDashboard'),
      description: t('appUntitledDashboardDesc'),
      type: 'dashboard',
      usedFor: t('dashboardBadge'),
      thumbnail: '📊',
      widgets: [],
      datasets: [],
      selectedDatasetIds: [],
      canvas: { ...DEFAULT_CANVAS },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };
    setSavedDashboards((prev) => [newDash, ...prev.filter((d) => d.id !== newDash.id)]);
    pushState(newDash);
    setActiveDashboardId(newDash.id);
    setSelectedWidgetId(null);
    setConfiguringWidgetId(null);
    setActivePage('bench');
    triggerAutoSave(newDash);
    // Prompt dataset selection context
    setIsSelectDatasetsOpen(true);
  };

  const handleNewReport = () => {
    const newReport: DashboardState = {
      id: `report_${Date.now()}`,
      name: t('appUntitledReportTitle'),
      description: t('appUntitledReportDesc'),
      type: 'report',
      usedFor: t('reportBadge'),
      thumbnail: '📄',
      widgets: [],
      datasets: [],
      selectedDatasetIds: [],
      canvas: { ...DEFAULT_REPORT_CANVAS },
      pages: [{ id: 'p_1', name: t('appPageN', { n: 1 }) }],
      activePageId: 'p_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };
    setSavedDashboards((prev) => [newReport, ...prev.filter((d) => d.id !== newReport.id)]);
    pushState(newReport);
    setActiveDashboardId(newReport.id);
    setSelectedWidgetId(null);
    setConfiguringWidgetId(null);
    setActivePage('bench');
    triggerAutoSave(newReport);
    // Prompt dataset selection context
    setIsSelectDatasetsOpen(true);
  };

  // Report Page Handlers
  const handleAddPage = () => {
    const newPageId = `p_${Date.now()}`;
    const existingPages = dashboard.pages && dashboard.pages.length > 0
      ? dashboard.pages
      : [{ id: 'p_1', name: t('appPageN', { n: 1 }) }];
    const newPageName = t('appPageN', { n: existingPages.length + 1 });
    const newPages = [...existingPages, { id: newPageId, name: newPageName }];

    updateDashboardState((prev) => ({
      ...prev,
      pages: newPages,
      activePageId: newPageId,
    }));
  };

  const handleSelectPage = (pageId: string) => {
    updateDashboardState((prev) => ({
      ...prev,
      activePageId: pageId,
    }));
    setSelectedWidgetId(null);
    setConfiguringWidgetId(null);
  };

  const handleRenamePage = (pageId: string, newName: string) => {
    updateDashboardState((prev) => ({
      ...prev,
      pages: (prev.pages || []).map((p) => (p.id === pageId ? { ...p, name: newName } : p)),
    }));
  };

  const handleDeletePage = (pageId: string) => {
    const currentPages = dashboard.pages || [];
    if (currentPages.length <= 1) return;
    const remainingPages = currentPages.filter((p) => p.id !== pageId);
    const nextActivePageId = remainingPages[0].id;

    updateDashboardState((prev) => ({
      ...prev,
      pages: remainingPages,
      activePageId: nextActivePageId,
      widgets: prev.widgets.filter((w) => w.pageId !== pageId),
    }));
    setSelectedWidgetId(null);
    setConfiguringWidgetId(null);
  };

  const handleUpdateWidgetPosition = (
    widgetId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    updateDashboardState((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, position: { ...w.position, x, y, width, height } } : w
      ),
    }));
  };

  const handleDuplicateWidget = (widgetId: string) => {
    const target = dashboard.widgets.find((w) => w.id === widgetId);
    if (!target) return;

    const dup: Widget = {
      ...target,
      id: `w_${target.type}_${Date.now()}`,
      title: `${target.title} ${t('appWidgetCopySuffix')}`,
      position: {
        ...target.position,
        x: target.position.x + 30,
        y: target.position.y + 30,
        zIndex: dashboard.widgets.length + 1,
      },
    };

    updateDashboardState((prev) => ({
      ...prev,
      widgets: [...prev.widgets, dup],
    }));

    setSelectedWidgetId(dup.id);
  };

  const handleDeleteWidget = (widgetId: string) => {
    updateDashboardState((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== widgetId),
    }));
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null);
    }
    if (configuringWidgetId === widgetId) {
      setConfiguringWidgetId(null);
    }
  };

  const handleUpdateWidgetConfig = (widgetId: string, updatedConfig: WidgetConfig) => {
    updateDashboardState((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, title: updatedConfig.title, config: updatedConfig } : w
      ),
    }));
  };

  const handleUpdateCanvas = (updatedCanvas: Partial<CanvasSettings>) => {
    updateDashboardState((prev) => ({
      ...prev,
      canvas: { ...prev.canvas, ...updatedCanvas },
    }));
  };

  // A dataset added from inside a dashboard (upload, generated dimension) is stored in the database first;
  // the dashboard then only references it.
  const handleAddDataset = async (newDs: Dataset) => {
    try {
      const saved = await saveGlobalDataset(newDs);
      setGlobalDatasets((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
      updateDashboardState((prev) => ({
        ...prev,
        datasets: [saved, ...prev.datasets.filter((d) => d.id !== saved.id)],
        selectedDatasetIds: Array.from(new Set([saved.id, ...(prev.selectedDatasetIds || [])])),
      }));
    } catch (err: any) {
      console.error('Failed to save dataset to the database', err);
      setErrorBanner(
        err?.message
          ? `${t('appCannotSaveDatasetErr')} (${err.message})`
          : t('appCannotSaveDatasetErr')
      );
    }
  };

  const handleDeleteDataset = (datasetId: string) => {
    updateDashboardState((prev) => ({
      ...prev,
      datasets: prev.datasets.filter((d) => d.id !== datasetId),
    }));
    if (inspectedDataset?.id === datasetId) {
      setInspectedDataset(null);
    }
  };

  const handleUpdateGlobalFilters = (globalFilters: DataFilter[]) => {
    updateDashboardState((prev) => ({
      ...prev,
      globalFilters,
    }));
  };

  // Resolved dashboard datasets (referencing user-uploaded datasets only, no sample data fallbacks)
  const resolvedDashboardDatasets = useMemo(() => {
    // 1. Build lookup pool of user-uploaded datasets
    const pool = new Map<string, Dataset>();
    (dashboard.datasets || []).forEach((d) => pool.set(d.id, d));
    globalDatasets.forEach((d) => pool.set(d.id, d));

    // 2. Identify all datasets used in this dashboard
    const usedIds = new Set<string>();

    if (dashboard.selectedDatasetIds && dashboard.selectedDatasetIds.length > 0) {
      dashboard.selectedDatasetIds.forEach((id) => usedIds.add(id));
    }
    if (dashboard.datasets && dashboard.datasets.length > 0) {
      dashboard.datasets.forEach((d) => usedIds.add(d.id));
    }
    if (dashboard.widgets && dashboard.widgets.length > 0) {
      dashboard.widgets.forEach((w) => {
        if (w.config?.datasetId) {
          usedIds.add(w.config.datasetId);
        }
      });
    }
    if (dashboard.globalFilters && dashboard.globalFilters.length > 0) {
      dashboard.globalFilters.forEach((f) => {
        if (f.datasetId) usedIds.add(f.datasetId);
      });
    }
    if (dashboard.dataModel) {
      dashboard.dataModel.factTables.forEach((f) => {
        if (f.datasetId) usedIds.add(f.datasetId);
      });
      dashboard.dataModel.dimensionTables.forEach((d) => {
        if (d.datasetId) usedIds.add(d.datasetId);
      });
    }

    // If specific datasets are selected or used by widgets/filters/model, resolve them
    if (usedIds.size > 0) {
      const matched: Dataset[] = [];
      usedIds.forEach((id) => {
        const found = pool.get(id);
        if (found) matched.push(found);
      });
      if (matched.length > 0) return matched;
    }

    if (dashboard.datasets && dashboard.datasets.length > 0) {
      return dashboard.datasets;
    }
    return [];
  }, [
    dashboard.selectedDatasetIds,
    dashboard.widgets,
    dashboard.globalFilters,
    dashboard.datasets,
    dashboard.dataModel,
    globalDatasets,
  ]);

  const handleSelectDatasetIds = (selectedIds: string[]) => {
    const selected = globalDatasets.filter((d) => selectedIds.includes(d.id));
    updateDashboardState((prev) => ({
      ...prev,
      selectedDatasetIds: selectedIds,
      datasets: selected,
      // The Data Model follows the attached datasets: new ones get fact/dimension tables and relationships.
      dataModel: syncModelWithUsedDatasets(prev.dataModel, selected, prev.name),
    }));
  };

  const handleUpdateDataModel = (model: DataModelState) => {
    updateDashboardState((prev) => ({
      ...prev,
      dataModel: model,
    }));
  };

  // Keep the Data Model in step with the data the dashboard really uses. Covers dashboards saved before the model
  // existed (or with an empty one) and datasets that arrive after the dashboard was opened. syncModelWithUsedDatasets
  // returns the same object when nothing needs to change, so this settles after one pass.
  useEffect(() => {
    if (activePage !== 'bench' || resolvedDashboardDatasets.length === 0) return;
    const synced = syncModelWithUsedDatasets(dashboard.dataModel, resolvedDashboardDatasets, dashboard.name);
    if (synced !== dashboard.dataModel) {
      updateDashboardState((prev) => ({ ...prev, dataModel: synced }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, resolvedDashboardDatasets, dashboard.dataModel]);

  const handleAddGlobalDataset = async (newDs: Dataset) => {
    const saved = await saveGlobalDataset(newDs);
    setGlobalDatasets((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
  };

  const handleDeleteGlobalDataset = async (datasetId: string) => {
    await deleteGlobalDataset(datasetId);
    setGlobalDatasets((prev) => prev.filter((d) => d.id !== datasetId));
    if (inspectedDataset?.id === datasetId) setInspectedDataset(null);
  };

  const handleCreateDashboardWithDataset = (datasetId: string) => {
    const targetDs = globalDatasets.find((d) => d.id === datasetId);
    const name = targetDs ? t('appAnalyticsSuffix', { name: targetDs.name }) : t('appUntitledDashboard');
    const newDash: DashboardState = {
      id: `dash_${Date.now()}`,
      name,
      description: t('appAnalyticsForDesc', { name: targetDs?.name || t('leftDefaultDatasetName') }),
      type: 'dashboard',
      usedFor: t('dashboardBadge'),
      thumbnail: '📊',
      widgets: [],
      datasets: targetDs ? [targetDs] : globalDatasets,
      selectedDatasetIds: targetDs ? [targetDs.id] : undefined,
      dataModel: syncModelWithUsedDatasets(undefined, targetDs ? [targetDs] : globalDatasets, name),
      canvas: DEFAULT_CANVAS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };
    setSavedDashboards((prev) => [newDash, ...prev.filter((d) => d.id !== newDash.id)]);
    pushState(newDash);
    setActiveDashboardId(newDash.id);
    setActivePage('bench');
    setActiveWorkspaceView('canvas');
    triggerAutoSave(newDash);
  };

  const handleAddForecastToDashboard = async (forecast: ForecastRecord, targetDashboardId?: string) => {
    const forecastDs = globalDatasets.find((d) => d.id === forecast.datasetId);
    const existingTarget = targetDashboardId
      ? savedDashboardsRef.current.find((d) => d.id === targetDashboardId)
      : null;

    let updatedDashboard: DashboardState;
    if (existingTarget) {
      const firstPageId = existingTarget.activePageId || existingTarget.pages?.[0]?.id || 'p_1';
      const nextWidget: Widget = {
        id: `w_forecast_${Date.now()}`,
        type: 'forecast',
        category: 'analytics',
        title: forecast.name,
        pageId: firstPageId,
        position: {
          x: 60 + (existingTarget.widgets.length % 4) * 36,
          y: 60 + (existingTarget.widgets.length % 4) * 36,
          width: 560,
          height: 360,
          zIndex: existingTarget.widgets.length + 1,
        },
        config: {
          datasetId: forecast.datasetId,
          xAxisField: forecast.configuration.dateColumn,
          yAxisField: forecast.configuration.targetColumn,
          aggregation: 'sum',
          numberFormat: 'number',
          currencySymbol: '$',
          title: forecast.name,
          titleColor: '#0F172A',
          primaryColor: '#0284C7',
          colorPalette: ['#0284C7', '#10B981', '#F59E0B', '#EC4899'],
          backgroundColor: '#FFFFFF',
          forecastId: forecast.id,
          forecastConfidenceLevel: forecast.configuration.confidenceLevel || '95',
          forecastScenarioId: forecast.scenarios?.[0]?.id,
        },
      };
      const mergedSelectedIds = Array.from(
        new Set([...(existingTarget.selectedDatasetIds || []), forecast.datasetId].filter(Boolean)),
      );
      const mergedDatasets =
        forecastDs && !existingTarget.datasets.some((d) => d.id === forecastDs.id)
          ? [...existingTarget.datasets, forecastDs]
          : existingTarget.datasets;
      updatedDashboard = withCanvasDefaults({
        ...existingTarget,
        widgets: [...existingTarget.widgets, nextWidget],
        datasets: mergedDatasets,
        selectedDatasetIds: mergedSelectedIds,
        updatedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      });
    } else {
      const dashId = `dash_${Date.now()}`;
      const nextWidget: Widget = {
        id: `w_forecast_${Date.now()}`,
        type: 'forecast',
        category: 'analytics',
        title: forecast.name,
        pageId: 'p_1',
        position: {
          x: 60,
          y: 60,
          width: 620,
          height: 380,
          zIndex: 1,
        },
        config: {
          datasetId: forecast.datasetId,
          xAxisField: forecast.configuration.dateColumn,
          yAxisField: forecast.configuration.targetColumn,
          aggregation: 'sum',
          numberFormat: 'number',
          currencySymbol: '$',
          title: forecast.name,
          titleColor: '#0F172A',
          primaryColor: '#0284C7',
          colorPalette: ['#0284C7', '#10B981', '#F59E0B', '#EC4899'],
          backgroundColor: '#FFFFFF',
          forecastId: forecast.id,
          forecastConfidenceLevel: forecast.configuration.confidenceLevel || '95',
          forecastScenarioId: forecast.scenarios?.[0]?.id,
        },
      };
      const initialDatasets = forecastDs ? [forecastDs] : [];
      updatedDashboard = {
        id: dashId,
        name: `${forecast.name} — ${t('forecastStudio')}`,
        description: forecast.configuration.targetColumn,
        type: 'dashboard',
        usedFor: t('forecastStudio'),
        thumbnail: '📈',
        widgets: [nextWidget],
        datasets: initialDatasets,
        selectedDatasetIds: forecastDs ? [forecastDs.id] : [],
        dataModel: syncModelWithUsedDatasets(undefined, initialDatasets, forecast.name),
        canvas: { ...DEFAULT_CANVAS },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      };
    }

    await saveDashboardToDb(updatedDashboard);
    setSavedDashboards((prev) => [updatedDashboard, ...prev.filter((d) => d.id !== updatedDashboard.id)]);
    pushState(updatedDashboard);
    setActiveDashboardId(updatedDashboard.id);
    setActiveForecastId(undefined);
    setTargetForecastDatasetId(undefined);
    setActiveWorkspaceView('canvas');
    setActivePage('bench');
    setToastMessage(t('fcAddedToDashboardToast'));
  };

  const handleOpenDataCleaning = (datasetId?: string) => {
    canUseBackForDataLabRef.current = true;
    setTargetCleaningDatasetId(datasetId);
    setIsDataCleaningOpen(true);
  };

  const closeDataLab = useCallback(
    (options?: DataLabCloseOptions) => {
      if (options?.committedDatasets && options.committedDatasets.length > 0) {
        const committed = options.committedDatasets;
        setGlobalDatasets((prev) => mergeUpdatedDatasets(prev, committed));
        if (activePageRef.current === 'bench' && activeDashboardIdRef.current) {
          const nextDashDatasets = mergeDashboardDatasetsIfAffected(
            dashboard.datasets,
            dashboard.selectedDatasetIds,
            committed
          );
          if (nextDashDatasets) {
            updateDashboardState((prev) => ({ ...prev, datasets: nextDashDatasets }));
          }
        }
      }

      if (options?.navigateHome) {
        canUseBackForDataLabRef.current = false;
        const homeDest: PageView = currentUserRef.current ? 'dashboard_hub' : 'home';
        setIsDataCleaningOpen(false);
        setTargetCleaningDatasetId(undefined);
        setActiveDashboardId(null);
        setActiveWorkspaceView('canvas');
        setActivePage(homeDest);
        return;
      }

      if (options?.skipHistoryBack) {
        canUseBackForDataLabRef.current = false;
        const landedRoute = resolveEffectiveRoute(pathToRoute(window.location.pathname), !!currentUserRef.current);
        if (window.location.pathname !== routeToPath(landedRoute)) {
          replaceNextUrlRef.current = true;
        }
        setIsDataCleaningOpen(false);
        setTargetCleaningDatasetId(undefined);
        if (landedRoute.page === 'bench' && landedRoute.dashboardId) {
          if (activePageRef.current !== 'bench' || activeDashboardIdRef.current !== landedRoute.dashboardId) {
            handleOpenDashboardFromHub(landedRoute.dashboardId);
          } else {
            setActivePage('bench');
          }
        } else if (landedRoute.page !== 'data_lab') {
          if (landedRoute.page !== 'bench') {
            setActiveDashboardId(null);
            setActiveWorkspaceView('canvas');
          }
          setActivePage(landedRoute.page as PageView);
        }
        return;
      }

      setIsDataCleaningOpen(false);
      setTargetCleaningDatasetId(undefined);

      if (canUseBackForDataLabRef.current) {
        canUseBackForDataLabRef.current = false;
        pendingHistoryStepRef.current = true;
        bypassDataLabGuardRef.current = true;
        window.history.back();
      }
    },
    [handleOpenDashboardFromHub, dashboard.datasets, dashboard.selectedDatasetIds, updateDashboardState]
  );

  const handleCancelDataLabPopStateExit = useCallback(() => {
    restoringDataLabForwardRef.current = true;
    window.history.forward();
  }, []);

  // Updates local global datasets & active dashboard datasets after DataCleaningEditorPage has saved them.
  const handleApplyCleanedDatasets = (updatedDatasets: Dataset[], options?: DataLabCloseOptions) => {
    if (updatedDatasets.length > 0) {
      setGlobalDatasets((prev) => mergeUpdatedDatasets(prev, updatedDatasets));

      // Only update the dashboard state when its canvas is open and at least one of its datasets changed.
      // Never touch dashboard state when the Lab was opened from the Data Hub.
      if (activePage === 'bench' && activeDashboardId) {
        const nextDashDatasets = mergeDashboardDatasetsIfAffected(
          dashboard.datasets,
          dashboard.selectedDatasetIds,
          updatedDatasets
        );
        if (nextDashDatasets) {
          updateDashboardState((prev) => ({ ...prev, datasets: nextDashDatasets }));
        }
      }

      setToastMessage(t('appliedSuccessToast'));
    }
    closeDataLab(options);
  };

  const dataLabInitialDatasets = useMemo(
    () =>
      resolveDataLabInitialDatasets({
        targetDatasetId: targetCleaningDatasetId,
        activePage,
        globalDatasets,
        dashboardDatasets: resolvedDashboardDatasets,
      }),
    [targetCleaningDatasetId, activePage, globalDatasets, resolvedDashboardDatasets]
  );

  // The Data Lab (pipeline studio) is a full-screen overlay that can be opened from the Data Hub and from the canvas.
  const dataCleaningOverlay = isDataCleaningOpen ? (
    <div className="fixed inset-0 z-50 flex flex-col bg-lab-bg">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-sm text-slate-200">{t('appOpeningDataLab')}</div>}>
        <DataCleaningEditorPage
          initialDatasets={dataLabInitialDatasets}
          availableDatasets={globalDatasets}
          targetDatasetId={targetCleaningDatasetId}
          onApplyAndClose={handleApplyCleanedDatasets}
          onClose={closeDataLab}
          onCancelPopStateExit={handleCancelDataLabPopStateExit}
        />
      </Suspense>
    </div>
  ) : null;

  // ROUTING VIEW RENDERERS
  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">{t('loading')}</div>;
  }

  const onboardingModalElement = (
    <OnboardingTourModal
      isOpen={showTutorial}
      onClose={() => setShowTutorial(false)}
      isReplay={isTourReplay}
      isAuthenticated={!!currentUser}
      activePage={activePage}
      activeWorkspaceView={activeWorkspaceView}
      hasDatasets={globalDatasets.length > 0}
      onNavigateSection={(section) => handleNavigate(section)}
      onOpenDataLab={() => handleOpenDataCleaning()}
      onSwitchToDataModel={() => setActiveWorkspaceView('data_model')}
    />
  );

  if (activePage === 'home') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          <HomePage currentUser={currentUser} onNavigate={handleNavigate} />
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  if (activePage === 'features') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          <FeaturesPage currentUser={currentUser} onNavigate={handleNavigate} />
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  if (activePage === 'pricing') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          <PricingPage currentUser={currentUser} onNavigate={handleNavigate} />
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  if (activePage === 'about') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          <AboutPage currentUser={currentUser} onNavigate={handleNavigate} />
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  if (activePage === 'login') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  if (activePage === 'signup') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          <SignupPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  if (activePage === 'dashboard_hub') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          <DashboardHubPage
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenDashboard={handleOpenDashboardFromHub}
            onNavigate={handleNavigate}
            globalDatasets={globalDatasets}
          />
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  if (activePage === 'data_hub') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          {/* the hub stays mounted under the editor (keeps scroll/filters) but must not be reachable while it is covered */}
          <div inert={isDataCleaningOpen} aria-hidden={isDataCleaningOpen}>
            <DataHubPage
              currentUser={currentUser}
              globalDatasets={globalDatasets}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
              onOpenDataCleaning={(id) => handleOpenDataCleaning(id)}
              onInspectDataset={(ds) => setInspectedDataset(ds)}
              onAddGlobalDataset={handleAddGlobalDataset}
              onDeleteGlobalDataset={handleDeleteGlobalDataset}
              onCreateDashboardWithDataset={handleCreateDashboardWithDataset}
            />
          </div>
          {dataCleaningOverlay}
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  if (activePage === 'sample_graphs') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          <SampleGraphsPage currentUser={currentUser} onNavigate={handleNavigate} onLogout={handleLogout} />
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  if (activePage === 'forecasts') {
    return (
      <>
        <Suspense fallback={<AppSuspenseFallback />}>
          <ForecastStudioPage
            currentUser={currentUser}
            globalDatasets={globalDatasets}
            savedDashboards={savedDashboards}
            initialForecastId={activeForecastId}
            initialDatasetId={targetForecastDatasetId}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onAddForecastToDashboard={handleAddForecastToDashboard}
            onForecastSelected={(fId) => setActiveForecastId(fId)}
          />
        </Suspense>
        {onboardingModalElement}
      </>
    );
  }

  // BENCH / CANVAS WORKSPACE
  const currentPages = dashboard.pages && dashboard.pages.length > 0
    ? dashboard.pages
    : [{ id: 'p_1', name: t('appPageN', { n: 1 }) }];
  const activePageId = dashboard.activePageId || currentPages[0].id;

  const selectedWidget = dashboard.widgets.find((w) => w.id === selectedWidgetId) || null;
  const configuringWidget = dashboard.widgets.find((w) => w.id === configuringWidgetId) || null;
  const activeFiltersCount = (dashboard.globalFilters || []).filter(
    (f) =>
      Boolean(f.column) &&
      ((Array.isArray(f.values) && f.values.length > 0) ||
        typeof f.min === 'number' ||
        typeof f.max === 'number')
  ).length;

  return (
    <div className="w-full h-dvh bg-slate-100 flex flex-col overflow-hidden text-slate-900 font-sans antialiased select-none">
      {/* Top Navigation & Toolbar */}
      {!isPreviewMode && (
        <TopToolbar
          dashboardTitle={dashboard.name}
          projectType={dashboard.type}
          pages={currentPages}
          activePageId={activePageId}
          widgetCount={dashboard.widgets.length}
          autoSaveStatus={autoSaveStatus}
          canvas={dashboard.canvas}
          canUndo={canUndo}
          canRedo={canRedo}
          activeFilterCount={activeFiltersCount}
          activeWorkspaceView={activeWorkspaceView}
          onChangeWorkspaceView={(v) => setActiveWorkspaceView(v)}
          onOpenSelectDatasets={() => setIsSelectDatasetsOpen(true)}
          onBackToHub={() => handleNavigate('dashboard_hub')}
          onOpenFilters={() => setIsFilterPopoverOpen(true)}
          onExportPdf={() => setIsExportPdfModalOpen(true)}
          onUndo={undo}
          onRedo={redo}
          onTitleChange={(newTitle) => updateDashboardState((prev) => ({ ...prev, name: newTitle }))}
          onUpdateCanvas={handleUpdateCanvas}
          onTogglePreviewMode={() => setIsPreviewMode(true)}
          onSaveDashboard={() => saveNow(dashboard)}
          onOpenDashboardManager={() => setIsDashboardManagerOpen(true)}
          onNewDashboard={handleNewDashboard}
          onNewReport={handleNewReport}
          onAddPage={handleAddPage}
          onSelectPage={handleSelectPage}
          onRenamePage={handleRenamePage}
          onDeletePage={handleDeletePage}
          onAddWidget={handleAddWidget}
          onOpenDataCleaning={() => handleOpenDataCleaning()}
        />
      )}

      {/* Global Data Filter Bar */}
      {!isPreviewMode && activeWorkspaceView === 'canvas' && (
        <GlobalFilterBar
          datasets={resolvedDashboardDatasets}
          globalFilters={dashboard.globalFilters || []}
          onUpdateGlobalFilters={handleUpdateGlobalFilters}
          isPopoverOpenExternal={isFilterPopoverOpen}
          onClosePopoverExternal={() => setIsFilterPopoverOpen(false)}
          droppedLegacyCount={droppedFiltersNoticeCount}
          onDismissDroppedNotice={() => setDroppedFiltersNoticeCount(0)}
        />
      )}

      {/* Workspace Area */}
      <div className="flex-1 min-w-0 min-h-0 flex overflow-hidden relative">
        {/* Mobile/Tablet Sidebar Toggle Buttons */}
        {!isPreviewMode && activeWorkspaceView === 'canvas' && (
          <div className="lg:hidden fixed bottom-4 start-4 z-30 flex items-center gap-2 max-w-[calc(100vw-2rem)]">
            <button
              type="button"
              onClick={() => setMobileLeftOpen(true)}
              className="h-9 px-3 rounded-xl bg-navy-900 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <PanelLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('benchToggleLeft')}</span>
            </button>
            {selectedWidget && !configuringWidget && (
              <button
                type="button"
                onClick={() => setConfiguringWidgetId(selectedWidget.id)}
                className="h-9 px-3 rounded-xl bg-sky-600 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{t('benchToggleRight')}</span>
              </button>
            )}
          </div>
        )}

        {/* Mobile Left Drawer Backdrop */}
        {!isPreviewMode && activeWorkspaceView === 'canvas' && mobileLeftOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30"
            onClick={() => setMobileLeftOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        {!isPreviewMode && activeWorkspaceView === 'canvas' && (
          <div className={mobileLeftOpen ? 'fixed inset-y-0 start-0 z-40 h-full w-[min(280px,88vw)] flex lg:static lg:w-auto' : 'hidden lg:flex h-full'}>
            <LeftSidebar
              datasets={resolvedDashboardDatasets}
              onAddDataset={handleAddDataset}
              onSelectDatasetToInspect={(ds) => {
                setInspectedDataset(ds);
                setMobileLeftOpen(false);
              }}
              onAddWidgetToCanvas={(type) => {
                handleAddWidget(type);
                setMobileLeftOpen(false);
              }}
              onDeleteDataset={handleDeleteDataset}
              onOpenDataCleaning={(dsId) => {
                setMobileLeftOpen(false);
                handleOpenDataCleaning(dsId);
              }}
              onOpenSelectDatasets={() => {
                setMobileLeftOpen(false);
                setIsSelectDatasetsOpen(true);
              }}
              onOpenDataModel={() => {
                setMobileLeftOpen(false);
                setActiveWorkspaceView('data_model');
              }}
              onCloseDrawer={() => setMobileLeftOpen(false)}
            />
          </div>
        )}

        {/* Main Canvas Workspace OR Star Schema Data Model */}
        {activeWorkspaceView === 'data_model' ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-sm text-slate-400">{t('loading')}</div>}>
            <DataModelWorkspace
              dataModel={dashboard.dataModel}
              datasets={resolvedDashboardDatasets}
              dashboardName={dashboard.name}
              onUpdateModel={handleUpdateDataModel}
              onAddDatasetToContext={handleAddGlobalDataset}
              onBackToCanvas={() => setActiveWorkspaceView('canvas')}
              onOpenDataCleaning={handleOpenDataCleaning}
            />
          </Suspense>
        ) : (
          <CanvasWorkspace
            widgets={dashboard.widgets}
            datasets={resolvedDashboardDatasets}
            canvas={dashboard.canvas}
            pages={currentPages}
            activePageId={activePageId}
            globalFilters={dashboard.globalFilters || []}
            dataModel={dashboard.dataModel}
            selectedWidgetId={selectedWidgetId}
            configuringWidgetId={configuringWidgetId}
            isPreviewMode={isPreviewMode}
            onSelectWidget={(id) => {
              setSelectedWidgetId(id);
              if (id === null) {
                setConfiguringWidgetId(null);
              }
            }}
            onUpdateWidgetPosition={handleUpdateWidgetPosition}
            onDuplicateWidget={handleDuplicateWidget}
            onDeleteWidget={handleDeleteWidget}
            onOpenWidgetConfig={(id) => {
              setSelectedWidgetId(id);
              setConfiguringWidgetId((prev) => (prev === id ? null : id));
            }}
            onUpdateCanvas={handleUpdateCanvas}
          />
        )}

        {/* Right Configuration Drawer - only opens when user clicks the gear icon */}
        {!isPreviewMode && configuringWidget && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30"
              onClick={() => setConfiguringWidgetId(null)}
            />
            <div className="fixed inset-y-0 end-0 z-40 h-full w-[min(340px,92vw)] flex lg:static lg:w-auto">
              <RightConfigPanel
                widget={configuringWidget}
                datasets={resolvedDashboardDatasets}
                dataModel={dashboard.dataModel}
                onUpdateWidgetConfig={handleUpdateWidgetConfig}
                onClose={() => setConfiguringWidgetId(null)}
              />
            </div>
          </>
        )}

        {/* Distraction-Free Preview Floating Controls */}
        {isPreviewMode && (
          <div className="fixed top-4 end-4 z-50 flex items-center gap-2 max-w-[calc(100vw-2rem)]">
            <button
              onClick={() => setIsPreviewMode(false)}
              className="py-2 px-4 bg-white/95 border border-slate-300 hover:border-sky-500 text-slate-800 font-bold text-xs rounded-xl shadow-2xl backdrop-blur flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <EyeOff className="w-4 h-4 text-rose-500" />
              <span>{t('appExitPreviewEsc')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Dataset Inspection Modal */}
      {inspectedDataset && (
        <DatasetPreviewModal
          dataset={inspectedDataset}
          onClose={() => setInspectedDataset(null)}
          onOpenDataCleaning={handleOpenDataCleaning}
        />
      )}

      {dataCleaningOverlay}

      {/* Select Datasets Modal */}
      <SelectDatasetsModal
        isOpen={isSelectDatasetsOpen}
        globalDatasets={globalDatasets}
        selectedDatasetIds={dashboard.selectedDatasetIds || resolvedDashboardDatasets.map((d) => d.id)}
        currentDashboard={dashboard}
        onClose={() => setIsSelectDatasetsOpen(false)}
        onApplySelection={handleSelectDatasetIds}
      />

      {/* Dashboard Manager Modal */}
      {isDashboardManagerOpen && (
        <ManageDashboardsModal
          currentDashboard={dashboard}
          savedDashboards={savedDashboards}
          onLoadDashboard={(loaded) => {
            setActiveDashboardId(loaded.id);
            pushState(withCanvasDefaults(loaded));
            setDroppedFiltersNoticeCount(consumeDroppedFilterCount(loaded.id));
          }}
          onDeleteDashboard={(id) => {
            deleteDashboardFromDb(id)
              .then(() => setSavedDashboards((prev) => prev.filter((s) => s.id !== id)))
              .catch((e) => console.error('Failed to delete dashboard from database', e));
          }}
          onImportDashboardJson={(imported) => {
            const { dashboard: clean, dropped } = normalizeDashboardFilters(imported);
            setActiveDashboardId(clean.id);
            pushState(withCanvasDefaults(clean));
            setDroppedFiltersNoticeCount(dropped);
          }}
          onClose={() => setIsDashboardManagerOpen(false)}
        />
      )}

      {/* PDF Export Options Modal */}
      {isExportPdfModalOpen && (
        <Suspense fallback={null}>
          <ExportPdfModal
            isOpen={isExportPdfModalOpen}
            dashboard={dashboard}
            activePageId={activePageId}
            onClose={() => setIsExportPdfModalOpen(false)}
            onUpdateCanvasSettings={handleUpdateCanvas}
          />
        </Suspense>
      )}

      {/* Onboarding Tour Modal */}
      {onboardingModalElement}

      {/* Inline Error Banner */}
      {errorBanner && (
        <div
          role="alert"
          className="fixed top-16 start-4 end-4 sm:start-auto sm:end-6 z-50 sm:max-w-md px-4 py-3 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 shadow-2xl flex items-start gap-2.5 text-xs font-semibold"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="flex-1 min-w-0 leading-relaxed" dir="auto">{errorBanner}</span>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            aria-label={t('close')}
            className="ms-2 text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Non-blocking Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 start-4 end-4 sm:start-auto sm:end-6 z-50 sm:max-w-md px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 min-w-0">{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} aria-label={t('close')} className="ms-2 text-slate-400 hover:text-white p-0.5 cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function AppSuspenseFallback() {
  const { t } = useLanguage();
  return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-400">{t('loading')}</div>;
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
