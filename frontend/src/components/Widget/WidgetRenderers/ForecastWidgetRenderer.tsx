import React, { useEffect, useMemo, useState } from 'react';
import { Dataset, WidgetConfig } from '../../../types/dashboard';
import { ForecastRecord } from '../../../types/forecast';
import { getForecastById, runForecastById } from '../../../services/forecastService';
import { ForecastChart } from '../../Forecast/ForecastChart';
import {
  BUSINESS_FORECAST_TEMPLATES,
  getPeriodUnitTranslationKey,
} from '../../../data/forecastTemplates';
import { useLanguage } from '../../../i18n/LanguageContext';
import { TrendingUp, RefreshCw, ExternalLink, AlertTriangle, Loader2, Sparkles } from 'lucide-react';

interface Props {
  config: WidgetConfig;
  datasets?: Dataset[];
  isPreviewMode?: boolean;
}

export const ForecastWidgetRenderer: React.FC<Props> = ({
  config,
  datasets = [],
  isPreviewMode = false,
}) => {
  const { t } = useLanguage();
  const [forecast, setForecast] = useState<ForecastRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forecastId = config.forecastId;

  useEffect(() => {
    if (!forecastId) {
      setForecast(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getForecastById(forecastId)
      .then((rec) => {
        if (!cancelled) setForecast(rec);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || t('fcLoadOneErr'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [forecastId, t]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!forecastId || refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const updated = await runForecastById(forecastId);
      setForecast(updated);
    } catch (err: any) {
      setError(err?.message || t('fcRunErrFallback'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenInStudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!forecastId) return;
    window.dispatchEvent(new CustomEvent('datapulse:open-forecast', { detail: { forecastId } }));
  };

  const handleCreateForecast = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fallbackDsId = config.datasetId || datasets[0]?.id;
    window.dispatchEvent(
      new CustomEvent('datapulse:open-forecast', {
        detail: fallbackDsId ? { datasetId: fallbackDsId } : {},
      }),
    );
  };

  const valuePrefix = useMemo(() => {
    if (config.prefix) return config.prefix;
    if (forecast?.businessTemplate) {
      return BUSINESS_FORECAST_TEMPLATES.find((b) => b.id === forecast.businessTemplate)?.valuePrefix || '';
    }
    return '';
  }, [config.prefix, forecast?.businessTemplate]);

  const activeScenario = useMemo(() => {
    if (!forecast?.scenarios?.length || !config.forecastScenarioId) return null;
    return forecast.scenarios.find((s) => s.id === config.forecastScenarioId) || null;
  }, [forecast?.scenarios, config.forecastScenarioId]);

  const sourceDataset = useMemo(() => {
    const dsId = forecast?.datasetId || config.datasetId;
    if (!dsId) return null;
    return datasets.find((d) => d.id === dsId) || null;
  }, [datasets, forecast?.datasetId, config.datasetId]);

  const isDatasetStale = useMemo(() => {
    const fcVer = forecast?.latestResult?.datasetVersionId ?? forecast?.datasetVersionId ?? null;
    const liveVer = sourceDataset?.current_version_id ?? null;
    return Boolean(fcVer && liveVer && fcVer !== liveVer);
  }, [forecast?.latestResult?.datasetVersionId, forecast?.datasetVersionId, sourceDataset?.current_version_id]);

  if (!forecastId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 gap-2.5 text-slate-400">
        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 grid place-items-center">
          <TrendingUp className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold text-slate-700">{t('fcWidgetSelectPromptTitle')}</p>
        <p className="text-[11px] text-slate-500 max-w-[260px] leading-relaxed">{t('fcWidgetSelectPromptDesc')}</p>
        {!isPreviewMode && (
          <button
            type="button"
            data-no-print="true"
            onClick={handleCreateForecast}
            className="no-print mt-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('fcWidgetCreateInStudio')}</span>
          </button>
        )}
      </div>
    );
  }

  if (loading && !forecast) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (error && !forecast) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 gap-2 text-rose-600">
        <AlertTriangle className="w-5 h-5" />
        <p className="text-xs font-semibold">{error}</p>
      </div>
    );
  }

  const result = forecast?.latestResult;
  if (!result) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 gap-2 text-slate-500">
        {forecast?.status === 'failed' ? (
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        ) : (
          <TrendingUp className="w-5 h-5 text-slate-400" />
        )}
        <p className="text-xs font-semibold text-slate-700">
          {forecast?.status === 'failed' && forecast.errorMessage
            ? forecast.errorMessage
            : t('fcWidgetNoResult')}
        </p>
        {!isPreviewMode && (
          <button
            type="button"
            data-no-print="true"
            onClick={handleRefresh}
            className="no-print px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-bold hover:bg-sky-700 cursor-pointer"
          >
            {forecast?.status === 'failed' ? t('fcRetryBtn') : t('fcGenerateBtn')}
          </button>
        )}
      </div>
    );
  }

  const baselineEndVal = result.summary?.endPredictedValue;
  const scenarioEndVal = activeScenario?.scenarioResults?.summary?.endScenarioValue;
  const rawDisplayEndVal = scenarioEndVal !== undefined ? scenarioEndVal : baselineEndVal;
  const hasDisplayEndVal =
    rawDisplayEndVal !== undefined &&
    rawDisplayEndVal !== null &&
    Number.isFinite(Number(rawDisplayEndVal));
  const deltaPct = result.summary?.projectedChangePct;
  const hasDeltaPct = typeof deltaPct === 'number' && Number.isFinite(deltaPct);
  const confidenceLevel = config.forecastConfidenceLevel || forecast?.configuration?.confidenceLevel || '95';
  const latestRunFailed = forecast?.status === 'failed' ? forecast.errorMessage : null;

  return (
    <div className="w-full h-full flex flex-col gap-1.5 min-h-0 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-1 shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[10px] font-semibold text-slate-600 truncate min-w-0">
            {result.selectedModelLabel || result.selectedModel} · {result.frequency} ·{' '}
            {result.horizonSteps} {t(getPeriodUnitTranslationKey(result.frequency) as any)}
            {activeScenario ? ` · ${t('fcScenarioPrefix')}: ${activeScenario.name}` : ` · ${t('fcBaselineModeLabel')}`}
          </span>
          {activeScenario?.isStale && (
            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold shrink-0">
              {t('fcScenarioStaleBadge')}
            </span>
          )}
          {hasDisplayEndVal && (
            <span className="text-xs font-extrabold text-slate-900 tabular-nums shrink-0" dir="ltr">
              {valuePrefix}
              {Number(rawDisplayEndVal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              {!activeScenario && hasDeltaPct && (
                <span className={`ms-1.5 text-[10px] font-bold ${deltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ({deltaPct >= 0 ? '+' : ''}
                  {deltaPct}%)
                </span>
              )}
            </span>
          )}
        </div>

        {!isPreviewMode && (
          <div className="no-print flex items-center gap-1 shrink-0" data-no-print="true">
            {isDatasetStale && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-[10px] font-bold cursor-pointer disabled:opacity-40"
              >
                {t('fcDatasetStaleWidget')}
              </button>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title={t('fcWidgetRefreshTip')}
              aria-label={t('fcWidgetRefreshTip')}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-sky-600 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleOpenInStudio}
              title={t('fcWidgetOpenStudioTip')}
              aria-label={t('fcWidgetOpenStudioTip')}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-sky-600 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {(error || latestRunFailed) && (
        <p className="text-[10px] text-rose-600 px-1 truncate">
          {error || `${t('fcFailedBannerTitle')}: ${latestRunFailed}`}
        </p>
      )}

      <div className="flex-1 min-h-0">
        <ForecastChart
          historicalData={result.historicalData}
          predictedData={result.predictedData}
          confidenceLevel={confidenceLevel}
          activeScenario={activeScenario}
          compact
          valuePrefix={valuePrefix}
          heightClass="h-full"
        />
      </div>
    </div>
  );
};
