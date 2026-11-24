import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User } from '../types/auth';
import { DashboardState, Dataset } from '../types/dashboard';
import {
  BusinessTemplateId,
  ConcreteForecastFrequency,
  ForecastConfiguration,
  ForecastFrequency,
  ForecastLimits,
  ForecastMode,
  ForecastRecord,
  ForecastScenarioAssumptions,
  FrequencyDetectionResponse,
} from '../types/forecast';
import {
  BUSINESS_FORECAST_PRESETS,
  BUSINESS_FORECAST_TEMPLATES,
  BusinessForecastPreset,
  BusinessForecastTemplate,
  BusinessTemplateDomain,
  coerceValidHorizonSteps,
  findBestDateColumn,
  findBestTargetColumn,
  findBestTargetColumnForPreset,
  findSuggestedGroupColumns,
  getMaxHorizonStepsForFrequency,
  horizonDaysToSteps,
  horizonStepsToApproxDays,
} from '../data/forecastTemplates';
import {
  ForecastApiError,
  createAndRunForecast,
  createForecastScenario,
  deleteForecastById,
  deleteForecastScenario,
  detectForecastFrequency,
  fetchForecastLimits,
  getForecastById,
  listForecasts,
  runForecastById,
  updateForecastMeta,
} from '../services/forecastService';
import { GroupForecastBatchItem, runBatchGroupForecasts } from '../utils/batchGroupForecast';
import { AppNavbar } from '../components/Navbar/AppNavbar';
import { ForecastConfigPanel } from '../components/Forecast/ForecastConfigPanel';
import { BatchGroupRunState, ForecastResultsPanel } from '../components/Forecast/ForecastResultsPanel';
import { AddForecastToDashboardModal } from '../components/Forecast/AddForecastToDashboardModal';
import { Button, EmptyState, PageHeader, cx } from '../ui';
import { useLanguage } from '../i18n/LanguageContext';
import { Database, LayoutGrid, Plus, TrendingUp, X } from 'lucide-react';

interface Props {
  currentUser: User | null;
  globalDatasets: Dataset[];
  savedDashboards: DashboardState[];
  initialForecastId?: string;
  initialDatasetId?: string;
  onLogout: () => void;
  onNavigate: (
    page: 'home' | 'login' | 'signup' | 'dashboard_hub' | 'bench' | 'sample_graphs' | 'data_hub' | 'forecasts',
    id?: string,
  ) => void;
  onAddForecastToDashboard: (forecast: ForecastRecord, dashboardId?: string) => Promise<void>;
  onForecastSelected?: (forecastId?: string) => void;
}

/**
 * Resolves a human-readable forecast title when the user runs or saves
 * without manually entering a custom forecast name.
 */
function resolveDefaultForecastName(params: {
  explicitName: string;
  mode: ForecastMode;
  activeTemplateObj: BusinessForecastTemplate | null;
  datasetName?: string;
  targetColumn: string;
  t: (key: any) => string;
}): string {
  const trimmed = params.explicitName.trim();
  if (trimmed) return trimmed;
  if (params.mode === 'business' && params.activeTemplateObj) {
    return `${params.t(params.activeTemplateObj.titleKey)} (${params.targetColumn})`;
  }
  return `${params.datasetName || params.t('forecasts')} · ${params.targetColumn}`;
}

/**
 * Forecast Studio workspace page.
 * Coordinates saved forecast history, dataset/preset configuration (`ForecastConfigPanel`),
 * Python forecasting execution/cancellation, result visualization (`ForecastResultsPanel`),
 * and dashboard pinning (`AddForecastToDashboardModal`).
 */
export const ForecastStudioPage: React.FC<Props> = ({
  currentUser,
  globalDatasets,
  savedDashboards,
  initialForecastId,
  initialDatasetId,
  onLogout,
  onNavigate,
  onAddForecastToDashboard,
  onForecastSelected,
}) => {
  const { t } = useLanguage();

  const [savedForecasts, setSavedForecasts] = useState<ForecastRecord[]>([]);
  const [activeForecast, setActiveForecast] = useState<ForecastRecord | null>(null);
  const [limits, setLimits] = useState<ForecastLimits | null>(null);

  const [mode, setMode] = useState<ForecastMode>('general');
  const [activeDomain, setActiveDomain] = useState<BusinessTemplateDomain>('sales');
  const [activePresetId, setActivePresetId] = useState<string>('sales_revenue');
  const [businessTemplate, setBusinessTemplate] = useState<BusinessTemplateId>('sales');
  const [forecastName, setForecastName] = useState('');
  const [datasetId, setDatasetId] = useState<string>(initialDatasetId || globalDatasets[0]?.id || '');

  const [config, setConfig] = useState<ForecastConfiguration>({
    dateColumn: '',
    targetColumn: '',
    aggregation: 'sum',
    frequency: 'auto',
    horizonDays: 30,
    horizonSteps: 30,
    model: 'auto',
    groupColumn: null,
    groupValue: null,
    confidenceLevel: '95',
  });

  const [detection, setDetection] = useState<FrequencyDetectionResponse | null>(null);
  const [historyWindow, setHistoryWindow] = useState<'all' | '30' | '90'>('all');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isScenarioBusy, setIsScenarioBusy] = useState(false);
  const [batchGroupState, setBatchGroupState] = useState<{
    running: boolean;
    completed: number;
    total: number;
    currentGroup?: string;
    items: GroupForecastBatchItem[];
  } | null>(null);
  const [isAddingToDashboard, setIsAddingToDashboard] = useState(false);
  const [showAddToDashboardModal, setShowAddToDashboardModal] = useState(false);
  const [selectedTargetDashboardId, setSelectedTargetDashboardId] = useState<string>(
    savedDashboards[0]?.id || '__new__',
  );
  const [showMetricHelp, setShowMetricHelp] = useState(false);
  const [inlineError, setInlineError] = useState<{
    message: string;
    code?: string;
    suggestedFrequency?: ConcreteForecastFrequency | null;
  } | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const runAbortRef = useRef<AbortController | null>(null);
  const batchAbortRef = useRef<AbortController | null>(null);
  const selectionSeqRef = useRef<number>(0);

  const selectedDataset = useMemo(
    () => globalDatasets.find((d) => d.id === datasetId) || null,
    [globalDatasets, datasetId],
  );

  const activeTemplateObj = useMemo(
    () => (mode === 'business' ? BUSINESS_FORECAST_TEMPLATES.find((b) => b.id === businessTemplate) || null : null),
    [mode, businessTemplate],
  );

  const activePresetObj = useMemo(
    () => (mode === 'business' ? BUSINESS_FORECAST_PRESETS.find((p) => p.id === activePresetId) || null : null),
    [mode, activePresetId],
  );

  const domainPresets = useMemo(
    () => BUSINESS_FORECAST_PRESETS.filter((p) => p.domain === activeDomain),
    [activeDomain],
  );

  const suggestedGroupColumns = useMemo(
    () =>
      mode === 'business'
        ? findSuggestedGroupColumns(selectedDataset, activePresetObj?.groupKeywords)
        : [],
    [mode, selectedDataset, activePresetObj],
  );

  // Compute up to 100 distinct non-empty values for the active group column
  const availableGroupValues = useMemo(() => {
    if (!selectedDataset || !config.groupColumn) return [];
    const rows =
      selectedDataset.cleanedData && selectedDataset.cleanedData.length > 0
        ? selectedDataset.cleanedData
        : selectedDataset.data;
    const vals = new Set<string>();
    for (const row of rows) {
      const raw = row?.[config.groupColumn];
      if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
        vals.add(String(raw).trim());
        if (vals.size >= 100) break;
      }
    }
    return Array.from(vals).sort();
  }, [selectedDataset, config.groupColumn]);

  const effectiveFrequencyForHorizons: ForecastFrequency = useMemo(() => {
    if (config.frequency !== 'auto') return config.frequency;
    if (detection?.detectedFrequency) return detection.detectedFrequency;
    if (activeForecast?.latestResult?.frequency) return activeForecast.latestResult.frequency;
    return 'auto';
  }, [config.frequency, detection, activeForecast]);

  const maxStepsForEffectiveFreq =
    limits?.maxHorizonStepsByFrequency?.[effectiveFrequencyForHorizons] ??
    getMaxHorizonStepsForFrequency(effectiveFrequencyForHorizons);

  // Sync valid period horizon when effective frequency narrows max allowed periods
  useEffect(() => {
    const currentSteps =
      config.horizonSteps ?? horizonDaysToSteps(effectiveFrequencyForHorizons, config.horizonDays);
    if (currentSteps > maxStepsForEffectiveFreq || currentSteps < 1) {
      const clampedSteps = Math.max(1, Math.min(maxStepsForEffectiveFreq, currentSteps));
      setConfig((prev) => ({
        ...prev,
        horizonSteps: clampedSteps,
        horizonDays: horizonStepsToApproxDays(effectiveFrequencyForHorizons, clampedSteps),
      }));
    }
  }, [effectiveFrequencyForHorizons, maxStepsForEffectiveFreq, config.horizonSteps, config.horizonDays]);

  // Initial load of saved forecasts & runtime limits
  useEffect(() => {
    let cancelled = false;
    setIsLoadingList(true);
    Promise.all([listForecasts(), fetchForecastLimits().catch(() => null)])
      .then(async ([items, lim]) => {
        if (cancelled) return;
        setSavedForecasts(items);
        if (lim) setLimits(lim);

        // When launched directly for a specific dataset without a forecastId, open a fresh composer bound to that dataset
        if (initialDatasetId && !initialForecastId) {
          const ds = globalDatasets.find((d) => d.id === initialDatasetId);
          setActiveForecast(null);
          setDatasetId(initialDatasetId);
          if (ds) {
            setConfig((prev) => ({
              ...prev,
              dateColumn: findBestDateColumn(ds),
              targetColumn: findBestTargetColumn(ds, null),
            }));
          }
          return;
        }

        const targetId = initialForecastId || items[0]?.id;
        if (targetId) {
          const seq = ++selectionSeqRef.current;
          try {
            const full = await getForecastById(targetId);
            if (!cancelled && seq === selectionSeqRef.current) {
              hydrateFromForecast(full);
            }
          } catch {
            // Keep clean blank composer if deep-linked forecast no longer exists
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setInlineError({ message: err?.message || t('fcLoadListErr') });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialForecastId, initialDatasetId]);

  // Initialize dataset & columns if datasets arrive asynchronously and no active forecast hydrated yet
  useEffect(() => {
    if (!datasetId && globalDatasets.length > 0 && !activeForecast) {
      const ds = globalDatasets.find((d) => d.id === initialDatasetId) || globalDatasets[0];
      setDatasetId(ds.id);
      setConfig((prev) => ({
        ...prev,
        dateColumn: findBestDateColumn(ds),
        targetColumn: findBestTargetColumn(ds, mode === 'business' ? businessTemplate : null),
      }));
    } else if (selectedDataset && (!config.dateColumn || !config.targetColumn)) {
      setConfig((prev) => ({
        ...prev,
        dateColumn: prev.dateColumn || findBestDateColumn(selectedDataset),
        targetColumn:
          prev.targetColumn || findBestTargetColumn(selectedDataset, mode === 'business' ? businessTemplate : null),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDatasets, selectedDataset]);

  function hydrateFromForecast(fc: ForecastRecord) {
    setActiveForecast(fc);
    setMode(fc.mode);
    if (fc.businessTemplate) {
      setBusinessTemplate(fc.businessTemplate);
      const matchingPreset = BUSINESS_FORECAST_PRESETS.find((p) => p.templateId === fc.businessTemplate);
      if (matchingPreset) {
        setActiveDomain(matchingPreset.domain);
        setActivePresetId(matchingPreset.id);
      }
    }
    setForecastName(fc.name);
    setDatasetId(fc.datasetId);
    const freq = fc.configuration.frequency || 'auto';
    const resolvedFreqForSteps: ForecastFrequency =
      freq !== 'auto' ? freq : fc.latestResult?.frequency || 'auto';
    const resolvedSteps =
      fc.configuration.horizonSteps ??
      fc.latestResult?.horizonSteps ??
      horizonDaysToSteps(resolvedFreqForSteps, fc.configuration.horizonDays || 30);
    setConfig({
      dateColumn: fc.configuration.dateColumn || '',
      targetColumn: fc.configuration.targetColumn || '',
      aggregation: fc.configuration.aggregation || 'sum',
      frequency: freq,
      horizonDays:
        fc.configuration.horizonDays ||
        horizonStepsToApproxDays(resolvedFreqForSteps, resolvedSteps),
      horizonSteps: resolvedSteps,
      model: fc.configuration.model || 'auto',
      groupColumn: fc.configuration.groupColumn ?? null,
      groupValue: fc.configuration.groupValue ?? null,
      confidenceLevel: fc.configuration.confidenceLevel || '95',
      calendarEffects: fc.configuration.calendarEffects ?? { enabled: false, country: 'EG' },
    });
    setActiveScenarioId(fc.scenarios?.[0]?.id ?? null);
    setInlineError(fc.status === 'failed' && fc.errorMessage ? { message: fc.errorMessage } : null);
    onForecastSelected?.(fc.id);
  }

  const handleSelectDataset = (nextId: string) => {
    setDatasetId(nextId);
    setDetection(null);
    setInlineError(null);
    const ds = globalDatasets.find((d) => d.id === nextId);
    if (ds) {
      setConfig((prev) => ({
        ...prev,
        dateColumn: findBestDateColumn(ds),
        targetColumn:
          mode === 'business'
            ? findBestTargetColumnForPreset(ds, activePresetId)
            : findBestTargetColumn(ds, null),
        groupColumn: null,
        groupValue: null,
      }));
    }
  };

  const handleSelectBusinessPreset = (preset: BusinessForecastPreset) => {
    setMode('business');
    setActiveDomain(preset.domain);
    setActivePresetId(preset.id);
    setBusinessTemplate(preset.templateId);
    const presetSteps = horizonDaysToSteps(effectiveFrequencyForHorizons, preset.defaultHorizonDays);
    setConfig((prev) => ({
      ...prev,
      aggregation: preset.defaultAggregation,
      horizonSteps: presetSteps,
      horizonDays: horizonStepsToApproxDays(effectiveFrequencyForHorizons, presetSteps),
      targetColumn: selectedDataset
        ? findBestTargetColumnForPreset(selectedDataset, preset.id)
        : prev.targetColumn,
    }));
    if (!forecastName.trim() || !activeForecast) {
      setForecastName(`${t(preset.titleKey as any)} — ${selectedDataset?.name || ''}`.trim());
    }
  };

  const handleSelectDomain = (domain: BusinessTemplateDomain) => {
    setActiveDomain(domain);
    const firstPreset = BUSINESS_FORECAST_PRESETS.find((p) => p.domain === domain);
    if (firstPreset) {
      handleSelectBusinessPreset(firstPreset);
    }
  };

  const handleDetectFrequency = async () => {
    if (!datasetId || !config.dateColumn || !config.targetColumn) return;
    setIsDetecting(true);
    setInlineError(null);
    try {
      const det = await detectForecastFrequency({
        datasetId,
        dateColumn: config.dateColumn,
        targetColumn: config.targetColumn,
        aggregation: config.aggregation,
        groupColumn: config.groupColumn ?? null,
        groupValue: config.groupValue ?? null,
      });
      setDetection(det);
      if (det.needsOverride) {
        setInlineError({
          message: det.message,
          code: 'NEEDS_FREQUENCY_OVERRIDE',
          suggestedFrequency: (det.details?.bestCandidate as ConcreteForecastFrequency) || null,
        });
      }
    } catch (err: any) {
      setInlineError({ message: err?.message || t('fcDetectErr') });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleRunForecast = async (overrideFrequency?: ConcreteForecastFrequency) => {
    if (!datasetId || !config.dateColumn || !config.targetColumn) {
      setInlineError({ message: t('fcMissingFieldsErr') });
      return;
    }

    const nextFreq = overrideFrequency || config.frequency;
    const stepScopeFreq: ForecastFrequency =
      nextFreq !== 'auto' ? nextFreq : effectiveFrequencyForHorizons;
    const nextSteps = coerceValidHorizonSteps(
      stepScopeFreq,
      config.horizonSteps ?? horizonDaysToSteps(stepScopeFreq, config.horizonDays),
    );
    const nextHorizonDays = horizonStepsToApproxDays(stepScopeFreq, nextSteps);
    const effectiveConfig: ForecastConfiguration = {
      ...config,
      frequency: nextFreq,
      horizonSteps: nextSteps,
      horizonDays: nextHorizonDays,
    };
    if (overrideFrequency) {
      setConfig(effectiveConfig);
    }

    runAbortRef.current?.abort();
    const ac = new AbortController();
    runAbortRef.current = ac;

    setIsRunning(true);
    setInlineError(null);
    setStatusNotice(null);

    const resolvedName = resolveDefaultForecastName({
      explicitName: forecastName,
      mode,
      activeTemplateObj,
      datasetName: selectedDataset?.name,
      targetColumn: config.targetColumn,
      t,
    });

    try {
      let result: ForecastRecord;
      if (
        activeForecast &&
        activeForecast.datasetId === datasetId &&
        activeForecast.mode === mode &&
        activeForecast.businessTemplate === (mode === 'business' ? businessTemplate : null)
      ) {
        result = await runForecastById(activeForecast.id, effectiveConfig, ac.signal);
        if (resolvedName !== result.name) {
          try {
            const renamed = await updateForecastMeta(result.id, { name: resolvedName });
            result = { ...result, name: renamed.name };
          } catch {
            // Preserve completed run even if optional rename fails
          }
        }
      } else {
        result = await createAndRunForecast(
          {
            name: resolvedName,
            mode,
            businessTemplate: mode === 'business' ? businessTemplate : null,
            datasetId,
            configuration: effectiveConfig,
            runImmediately: true,
          },
          ac.signal,
        );
      }

      hydrateFromForecast(result);
      setSavedForecasts((prev) => [result, ...prev.filter((f) => f.id !== result.id)]);
      setStatusNotice(t('fcRunSuccessNotice'));
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.code === 'FORECAST_CANCELLED') {
        setInlineError({ message: t('fcCancelledNotice'), code: 'FORECAST_CANCELLED' });
      } else if (err instanceof ForecastApiError) {
        setInlineError({
          message: err.message,
          code: err.code,
          suggestedFrequency: (err.details?.suggestedFrequency as ConcreteForecastFrequency) || null,
        });
      } else {
        setInlineError({ message: err?.message || t('fcRunErrFallback') });
      }
    } finally {
      if (runAbortRef.current === ac) {
        setIsRunning(false);
      }
    }
  };

  const handleSaveForecast = async () => {
    if (!datasetId || !config.dateColumn || !config.targetColumn) {
      setInlineError({ message: t('fcMissingFieldsErr') });
      return;
    }

    const stepScopeFreq: ForecastFrequency =
      config.frequency !== 'auto' ? config.frequency : effectiveFrequencyForHorizons;
    const nextSteps = coerceValidHorizonSteps(
      stepScopeFreq,
      config.horizonSteps ?? horizonDaysToSteps(stepScopeFreq, config.horizonDays),
    );
    const effectiveConfig: ForecastConfiguration = {
      ...config,
      horizonSteps: nextSteps,
      horizonDays: horizonStepsToApproxDays(stepScopeFreq, nextSteps),
    };

    const resolvedName = resolveDefaultForecastName({
      explicitName: forecastName,
      mode,
      activeTemplateObj,
      datasetName: selectedDataset?.name,
      targetColumn: config.targetColumn,
      t,
    });

    setIsSaving(true);
    setInlineError(null);
    setStatusNotice(null);

    try {
      let saved: ForecastRecord;
      if (activeForecast) {
        saved = await updateForecastMeta(activeForecast.id, {
          name: resolvedName,
          mode,
          businessTemplate: mode === 'business' ? businessTemplate : null,
          datasetId,
          configuration: effectiveConfig,
        });
      } else {
        saved = await createAndRunForecast({
          name: resolvedName,
          mode,
          businessTemplate: mode === 'business' ? businessTemplate : null,
          datasetId,
          configuration: effectiveConfig,
          runImmediately: false,
        });
      }
      const hydrated = {
        ...saved,
        latestResult: saved.latestResult ?? activeForecast?.latestResult ?? null,
        scenarios: saved.scenarios ?? activeForecast?.scenarios ?? [],
      };
      hydrateFromForecast(hydrated);
      setSavedForecasts((prev) => [hydrated, ...prev.filter((f) => f.id !== hydrated.id)]);
      setStatusNotice(t('fcSaveSuccessNotice'));
    } catch (err: any) {
      setInlineError({ message: err?.message || t('fcSaveErrFallback') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelRun = () => {
    runAbortRef.current?.abort();
  };

  const handleRunAllGroups = async () => {
    if (!selectedDataset || !config.groupColumn || !config.dateColumn || !config.targetColumn) {
      setInlineError({ message: t('fcMissingFieldsErr') });
      return;
    }

    batchAbortRef.current?.abort();
    const ac = new AbortController();
    batchAbortRef.current = ac;

    const stepScopeFreq: ForecastFrequency =
      config.frequency !== 'auto' ? config.frequency : effectiveFrequencyForHorizons;
    const nextSteps = coerceValidHorizonSteps(
      stepScopeFreq,
      config.horizonSteps ?? horizonDaysToSteps(stepScopeFreq, config.horizonDays),
    );
    const effectiveConfig: ForecastConfiguration = {
      ...config,
      horizonSteps: nextSteps,
      horizonDays: horizonStepsToApproxDays(stepScopeFreq, nextSteps),
    };
    const baseName = resolveDefaultForecastName({
      explicitName: forecastName,
      mode,
      activeTemplateObj,
      datasetName: selectedDataset.name,
      targetColumn: config.targetColumn,
      t,
    });

    setInlineError(null);
    setStatusNotice(null);
    setBatchGroupState({ running: true, completed: 0, total: 0, items: [] });

    try {
      const items = await runBatchGroupForecasts({
        dataset: selectedDataset,
        baseName,
        mode,
        businessTemplate: mode === 'business' ? businessTemplate : null,
        config: effectiveConfig,
        maxConcurrentJobs: limits?.maxConcurrentJobs ?? 2,
        signal: ac.signal,
        runGroupForecast: (payload, sig) => createAndRunForecast(payload, sig),
        onProgress: (completed, total, currentGroup) => {
          setBatchGroupState((prev) => ({
            running: true,
            completed,
            total,
            currentGroup,
            items: prev?.items || [],
          }));
        },
      });

      setBatchGroupState({
        running: false,
        completed: items.length,
        total: items.length,
        items,
      });

      const createdForecasts = items
        .map((it) => it.forecast)
        .filter((f): f is ForecastRecord => Boolean(f));
      if (createdForecasts.length > 0) {
        setSavedForecasts((prev) => {
          const ids = new Set(createdForecasts.map((f) => f.id));
          return [...createdForecasts, ...prev.filter((f) => !ids.has(f.id))];
        });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setInlineError({ message: err?.message || t('fcRunErrFallback') });
      }
      setBatchGroupState((prev) => (prev ? { ...prev, running: false } : null));
    }
  };

  const handleNewForecastDraft = () => {
    selectionSeqRef.current += 1;
    setActiveForecast(null);
    setActiveScenarioId(null);
    setForecastName('');
    setInlineError(null);
    setStatusNotice(null);
    setDetection(null);
    onForecastSelected?.(undefined);
  };

  const handleSelectSavedForecast = async (id: string) => {
    const seq = ++selectionSeqRef.current;
    setInlineError(null);
    try {
      const full = await getForecastById(id);
      if (seq !== selectionSeqRef.current) return;
      hydrateFromForecast(full);
    } catch (err: any) {
      if (seq === selectionSeqRef.current) {
        setInlineError({ message: err?.message || t('fcLoadOneErr') });
      }
    }
  };

  const handleDeleteForecast = async (id: string) => {
    try {
      await deleteForecastById(id);
      const remaining = savedForecasts.filter((f) => f.id !== id);
      setSavedForecasts(remaining);
      if (activeForecast?.id === id) {
        if (remaining[0]) {
          await handleSelectSavedForecast(remaining[0].id);
        } else {
          handleNewForecastDraft();
        }
      }
    } catch (err: any) {
      setInlineError({ message: err?.message || t('fcDeleteErr') });
    }
  };

  const handleCreateScenario = async (name: string, assumptions: ForecastScenarioAssumptions) => {
    if (!activeForecast) return;
    setIsScenarioBusy(true);
    try {
      const created = await createForecastScenario(activeForecast.id, { name, assumptions });
      setActiveForecast((prev) =>
        prev
          ? {
              ...prev,
              scenarios: [...(prev.scenarios || []).filter((s) => s.id !== created.id), created],
            }
          : prev,
      );
      setActiveScenarioId(created.id);
    } finally {
      setIsScenarioBusy(false);
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (!activeForecast) return;
    await deleteForecastScenario(activeForecast.id, scenarioId);
    setActiveForecast((prev) =>
      prev
        ? {
            ...prev,
            scenarios: (prev.scenarios || []).filter((s) => s.id !== scenarioId),
          }
        : prev,
    );
    if (activeScenarioId === scenarioId) {
      setActiveScenarioId(null);
    }
  };

  const handleConfirmAddToDashboard = async () => {
    if (!activeForecast) return;
    setIsAddingToDashboard(true);
    try {
      await onAddForecastToDashboard(
        activeForecast,
        selectedTargetDashboardId === '__new__' ? undefined : selectedTargetDashboardId,
      );
      setShowAddToDashboardModal(false);
    } catch (err: any) {
      setInlineError({ message: err?.message || t('fcAddWidgetErr') });
    } finally {
      setIsAddingToDashboard(false);
    }
  };

  const latestResult = activeForecast?.latestResult || null;
  const activeScenario = useMemo(
    () => activeForecast?.scenarios?.find((s) => s.id === activeScenarioId) || null,
    [activeForecast, activeScenarioId],
  );
  const valuePrefix = activeTemplateObj?.valuePrefix || '';

  const isConfigStale = useMemo(() => {
    if (!activeForecast || !latestResult) return false;
    if (activeForecast.datasetId !== datasetId) return true;
    const refCfg = latestResult.modelMetadata?.evaluatedConfiguration || activeForecast.configuration;
    if (!refCfg) return false;
    const refFreq: ForecastFrequency =
      (refCfg.frequency as ForecastFrequency) && refCfg.frequency !== 'auto'
        ? (refCfg.frequency as ForecastFrequency)
        : (latestResult.frequency as ForecastFrequency) || 'daily';
    const refSteps =
      refCfg.horizonSteps ??
      latestResult.horizonSteps ??
      horizonDaysToSteps(refFreq, Number(refCfg.horizonDays || 30));
    const curSteps =
      config.horizonSteps ?? horizonDaysToSteps(effectiveFrequencyForHorizons, config.horizonDays);
    return (
      (refCfg.dateColumn || '') !== (config.dateColumn || '') ||
      (refCfg.targetColumn || '') !== (config.targetColumn || '') ||
      (refCfg.aggregation || 'sum') !== config.aggregation ||
      (refCfg.frequency || 'auto') !== config.frequency ||
      Number(refSteps) !== Number(curSteps) ||
      (refCfg.model || 'auto') !== config.model ||
      (refCfg.groupColumn ?? null) !== (config.groupColumn ?? null) ||
      (refCfg.groupValue ?? null) !== (config.groupValue ?? null) ||
      Boolean(refCfg.calendarEffects?.enabled) !== Boolean(config.calendarEffects?.enabled) ||
      (Boolean(config.calendarEffects?.enabled) &&
        (refCfg.calendarEffects?.country || 'EG') !== (config.calendarEffects?.country || 'EG'))
    );
  }, [activeForecast, latestResult, datasetId, config, effectiveFrequencyForHorizons]);

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f7f9fc] text-slate-900 flex flex-col">
      <AppNavbar
        active="forecasts"
        currentUser={currentUser}
        onNavigate={onNavigate}
        onLogout={onLogout}
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleNewForecastDraft}
          >
            {t('fcNewForecastBtn')}
          </Button>
        }
      />

      <main className="flex-1 max-w-[1440px] w-full min-w-0 mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8 space-y-6">
        <PageHeader
          eyebrow={t('forecastStudio')}
          title={t('fcStudioHeroTitle')}
          description={t('fcStudioHeroDesc')}
          actions={
            latestResult && activeForecast ? (
              <Button
                variant="primary"
                icon={<LayoutGrid className="w-4 h-4" />}
                onClick={() => {
                  setSelectedTargetDashboardId(savedDashboards[0]?.id || '__new__');
                  setShowAddToDashboardModal(true);
                }}
              >
                {t('fcAddToDashboardBtn')}
              </Button>
            ) : undefined
          }
        />

        {/* Saved Forecasts Strip */}
        {savedForecasts.length > 0 && (
          <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 me-1">
              {t('fcSavedForecastsLabel')} ({savedForecasts.length})
            </span>
            {savedForecasts.map((fc) => {
              const isActive = activeForecast?.id === fc.id;
              return (
                <div
                  key={fc.id}
                  onClick={() => handleSelectSavedForecast(fc.id)}
                  className={cx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shrink-0 transition-all max-w-full',
                    isActive
                      ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300',
                  )}
                >
                  <TrendingUp className={cx('w-3.5 h-3.5 shrink-0', isActive ? 'text-sky-400' : 'text-pulse-600')} />
                  <span className="max-w-[160px] sm:max-w-[180px] truncate" dir="auto">
                    {fc.name}
                  </span>
                  {fc.mode === 'business' && (
                    <span
                      className={cx(
                        'text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0',
                        isActive ? 'bg-white/15 text-sky-200' : 'bg-sky-50 text-sky-700',
                      )}
                    >
                      {fc.businessTemplate}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteForecast(fc.id);
                    }}
                    aria-label={t('fcDeleteForecastAria')}
                    className={cx(
                      'p-0.5 rounded hover:bg-rose-500/20 shrink-0 cursor-pointer',
                      isActive ? 'text-slate-300 hover:text-rose-300' : 'text-slate-400 hover:text-rose-600',
                    )}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {globalDatasets.length === 0 ? (
          <EmptyState
            icon={<Database className="w-7 h-7" />}
            title={t('fcNoDatasetsTitle')}
            description={t('fcNoDatasetsDesc')}
            action={
              <Button variant="primary" onClick={() => onNavigate('data_hub')}>
                {t('dataHub')}
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[370px_minmax(0,1fr)] gap-6 items-start min-w-0">
            <ForecastConfigPanel
              mode={mode}
              activeDomain={activeDomain}
              activePresetId={activePresetId}
              activeTemplateObj={activeTemplateObj}
              activePresetObj={activePresetObj}
              domainPresets={domainPresets}
              forecastName={forecastName}
              datasetId={datasetId}
              globalDatasets={globalDatasets}
              selectedDataset={selectedDataset}
              config={config}
              suggestedGroupColumns={suggestedGroupColumns}
              availableGroupValues={availableGroupValues}
              effectiveFrequency={effectiveFrequencyForHorizons}
              detection={detection}
              activeForecast={activeForecast}
              limits={limits}
              isDetecting={isDetecting}
              isRunning={isRunning}
              isSaving={isSaving}
              isBatchRunning={Boolean(batchGroupState?.running)}
              onChangeMode={(nextMode) => {
                setMode(nextMode);
                if (nextMode === 'business' && selectedDataset) {
                  const currentPreset =
                    BUSINESS_FORECAST_PRESETS.find((p) => p.id === activePresetId) ||
                    BUSINESS_FORECAST_PRESETS[0];
                  if (currentPreset) handleSelectBusinessPreset(currentPreset);
                }
              }}
              onSelectDomain={handleSelectDomain}
              onSelectBusinessPreset={handleSelectBusinessPreset}
              onChangeForecastName={setForecastName}
              onSelectDataset={handleSelectDataset}
              onUpdateConfig={setConfig}
              onClearDetection={() => setDetection(null)}
              onClearInlineError={() => setInlineError(null)}
              onDetectFrequency={handleDetectFrequency}
              onRunForecast={handleRunForecast}
              onRunAllGroups={handleRunAllGroups}
              onCancelRun={handleCancelRun}
              onSaveForecast={handleSaveForecast}
            />

            <ForecastResultsPanel
              inlineError={inlineError}
              statusNotice={statusNotice}
              isLoadingList={isLoadingList}
              isRunning={isRunning}
              isScenarioBusy={isScenarioBusy}
              latestResult={latestResult}
              activeForecast={activeForecast}
              selectedDataset={selectedDataset}
              config={config}
              historyWindow={historyWindow}
              activeScenario={activeScenario}
              activeScenarioId={activeScenarioId}
              isConfigStale={isConfigStale}
              valuePrefix={valuePrefix}
              showMetricHelp={showMetricHelp}
              batchGroupState={
                batchGroupState
                  ? ({
                      ...batchGroupState,
                      onCancel: () => batchAbortRef.current?.abort(),
                      onDismiss: () => setBatchGroupState(null),
                      onSelectGroupForecast: (item) => {
                        if (item.forecast) {
                          hydrateFromForecast(item.forecast);
                        } else if (item.forecastId) {
                          handleSelectSavedForecast(item.forecastId);
                        }
                      },
                    } satisfies BatchGroupRunState)
                  : null
              }
              onDismissStatusNotice={() => setStatusNotice(null)}
              onChangeHistoryWindow={setHistoryWindow}
              onToggleMetricHelp={() => setShowMetricHelp((v) => !v)}
              onRunForecast={handleRunForecast}
              onSelectScenario={setActiveScenarioId}
              onCreateScenario={handleCreateScenario}
              onDeleteScenario={handleDeleteScenario}
            />
          </div>
        )}
      </main>

      {showAddToDashboardModal && activeForecast && (
        <AddForecastToDashboardModal
          savedDashboards={savedDashboards}
          selectedTargetDashboardId={selectedTargetDashboardId}
          isAddingToDashboard={isAddingToDashboard}
          onChangeTargetDashboardId={setSelectedTargetDashboardId}
          onConfirm={handleConfirmAddToDashboard}
          onClose={() => setShowAddToDashboardModal(false)}
        />
      )}
    </div>
  );
};
