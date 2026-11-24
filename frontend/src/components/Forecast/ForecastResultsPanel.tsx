import React from 'react';
import { Dataset } from '../../types/dashboard';
import {
  ConcreteForecastFrequency,
  ForecastConfiguration,
  ForecastRecord,
  ForecastResultRecord,
  ForecastScenarioAssumptions,
  ForecastScenarioRecord,
} from '../../types/forecast';
import { ForecastChart } from './ForecastChart';
import { ForecastScenariosPanel } from './ForecastScenariosPanel';
import { FORECAST_MODELS_INFO, getPeriodUnitTranslationKey } from '../../data/forecastTemplates';
import { downloadForecastCsv, downloadForecastExcel } from '../../utils/forecastExport';
import { evaluateForecastVsActual } from '../../utils/forecastAccuracy';
import { GroupForecastBatchItem } from '../../utils/batchGroupForecast';
import { Badge, Button, Card, EmptyState, SectionDisclosure, Segmented, cx } from '../../ui';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Download,
  HelpCircle,
  Info,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

export interface BatchGroupRunState {
  running: boolean;
  completed: number;
  total: number;
  currentGroup?: string;
  items: GroupForecastBatchItem[];
  onCancel?: () => void;
  onDismiss?: () => void;
  onSelectGroupForecast?: (item: GroupForecastBatchItem) => void;
}

export interface ForecastResultsPanelProps {
  inlineError: {
    message: string;
    code?: string;
    suggestedFrequency?: ConcreteForecastFrequency | null;
  } | null;
  statusNotice: string | null;
  isLoadingList: boolean;
  isRunning: boolean;
  isScenarioBusy: boolean;
  latestResult: ForecastResultRecord | null;
  activeForecast: ForecastRecord | null;
  selectedDataset: Dataset | null;
  config: ForecastConfiguration;
  historyWindow: 'all' | '30' | '90';
  activeScenario: ForecastScenarioRecord | null;
  activeScenarioId: string | null;
  isConfigStale?: boolean;
  valuePrefix: string;
  showMetricHelp: boolean;
  batchGroupState?: BatchGroupRunState | null;
  onDismissStatusNotice: () => void;
  onChangeHistoryWindow: (win: 'all' | '30' | '90') => void;
  onToggleMetricHelp: () => void;
  onRunForecast: (overrideFrequency?: ConcreteForecastFrequency) => void;
  onSelectScenario: (id: string | null) => void;
  onCreateScenario: (name: string, assumptions: ForecastScenarioAssumptions) => Promise<void>;
  onDeleteScenario: (scenarioId: string) => Promise<void>;
}

function formatMetricValue(val: unknown, prefix = '', maxFrac = 2): string {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (!Number.isFinite(num)) return '—';
  return `${prefix}${num.toLocaleString(undefined, { maximumFractionDigits: maxFrac })}`;
}

function getReliabilityTone(level?: 'high' | 'medium' | 'low' | null): 'emerald' | 'amber' | 'rose' {
  if (level === 'high') return 'emerald';
  if (level === 'medium') return 'amber';
  return 'rose';
}

/**
 * Right-hand analytics workspace for Forecast Studio.
 * Displays errors/notices, dataset/config staleness alerts, batch group summary,
 * reliability assessment & plain-language guidance, KPI cards, interactive chart with CSV/Excel export,
 * realized Forecast-vs-Actual accuracy, calendar effects, collapsed technical details, and What-If scenarios.
 */
export const ForecastResultsPanel: React.FC<ForecastResultsPanelProps> = ({
  inlineError,
  statusNotice,
  isLoadingList,
  isRunning,
  isScenarioBusy,
  latestResult,
  activeForecast,
  selectedDataset,
  config,
  historyWindow,
  activeScenario,
  activeScenarioId,
  isConfigStale = false,
  valuePrefix,
  showMetricHelp,
  batchGroupState = null,
  onDismissStatusNotice,
  onChangeHistoryWindow,
  onToggleMetricHelp,
  onRunForecast,
  onSelectScenario,
  onCreateScenario,
  onDeleteScenario,
}) => {
  const { t } = useLanguage();
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  const isDatasetStale = Boolean(
    activeForecast &&
      latestResult &&
      selectedDataset?.current_version_id &&
      (latestResult.datasetVersionId || activeForecast.datasetVersionId) &&
      selectedDataset.current_version_id !==
        (latestResult.datasetVersionId || activeForecast.datasetVersionId),
  );
  const evalCfg = latestResult?.modelMetadata?.evaluatedConfiguration;
  const shownTargetCol = evalCfg?.targetColumn || config.targetColumn;
  const shownDateCol = evalCfg?.dateColumn || config.dateColumn;
  const shownAgg = evalCfg?.aggregation || config.aggregation;
  const shownGroupCol = evalCfg?.groupColumn ?? config.groupColumn;
  const pctVal = latestResult?.summary?.projectedChangePct;
  const hasPct = typeof pctVal === 'number' && Number.isFinite(pctVal);
  const periodUnitLabel = t(getPeriodUnitTranslationKey(latestResult?.frequency) as any);

  const reliability = latestResult?.reliability || latestResult?.modelMetadata?.reliability || null;
  const calendarEffects = latestResult?.calendarEffects || latestResult?.modelMetadata?.calendarEffects || null;

  const vsActualSummary = React.useMemo(
    () => evaluateForecastVsActual(selectedDataset, latestResult, config),
    [selectedDataset, latestResult, config],
  );

  const modelInfoObj = React.useMemo(
    () => FORECAST_MODELS_INFO.find((m) => m.id === latestResult?.selectedModel) || null,
    [latestResult?.selectedModel],
  );

  const handleDownloadCsv = () => {
    if (!latestResult) return;
    setExportError(null);
    try {
      downloadForecastCsv({
        forecast: activeForecast,
        result: latestResult,
        confidenceLevel: config.confidenceLevel,
        activeScenario,
      });
    } catch {
      setExportError(t('fcExportFailedErr'));
    }
  };

  const handleDownloadExcel = async () => {
    if (!latestResult || isExportingExcel) return;
    setIsExportingExcel(true);
    setExportError(null);
    try {
      await downloadForecastExcel({
        forecast: activeForecast,
        result: latestResult,
        confidenceLevel: config.confidenceLevel,
        activeScenario,
      });
    } catch {
      setExportError(t('fcExportFailedErr'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  const renderTypicalErrorSentence = () => {
    if (!latestResult) return null;
    const valObs = latestResult.evaluationMetrics.validationObservations;
    const mape = latestResult.evaluationMetrics.mape;
    const mae = latestResult.evaluationMetrics.mae;
    if (mape !== null && mape !== undefined && Number.isFinite(Number(mape))) {
      return t('fcTypicalErrorPct', { pct: Number(mape).toFixed(1), n: valObs });
    }
    if (mae !== null && mae !== undefined && Number.isFinite(Number(mae))) {
      return t('fcTypicalErrorUnits', { mae: formatMetricValue(mae, valuePrefix, 2), n: valObs });
    }
    return null;
  };

  const typicalErrorSentence = renderTypicalErrorSentence();

  return (
    <div className="space-y-6 min-w-0">
      {inlineError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs font-semibold min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <p className="break-words">{inlineError.message}</p>
              {inlineError.code === 'NEEDS_FREQUENCY_OVERRIDE' && (
                <p className="text-[11px] font-medium text-rose-700 break-words">{t('fcFreqOverrideHint')}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {inlineError.code === 'NEEDS_FREQUENCY_OVERRIDE' && inlineError.suggestedFrequency && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onRunForecast(inlineError.suggestedFrequency!)}
              >
                {t('fcApplySuggestedFreq', { freq: inlineError.suggestedFrequency })}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => onRunForecast()}
            >
              {t('fcRetryBtn')}
            </Button>
          </div>
        </div>
      )}

      {statusNotice && !inlineError && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="break-words">{statusNotice}</span>
          </span>
          <button
            type="button"
            onClick={onDismissStatusNotice}
            aria-label={t('close')}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Batch Group Forecasting Progress & Summary Table */}
      {batchGroupState && (batchGroupState.running || batchGroupState.items.length > 0) && (
        <Card className="space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{t('fcBatchTitle')}</h3>
              {batchGroupState.running ? (
                <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                  {t('fcBatchProgress', {
                    done: batchGroupState.completed,
                    total: batchGroupState.total,
                    group: batchGroupState.currentGroup || '...',
                  })}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('fcBatchDesc', { count: batchGroupState.items.length })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {batchGroupState.running && batchGroupState.onCancel && (
                <Button variant="danger" size="sm" onClick={batchGroupState.onCancel}>
                  {t('fcCancelBtn')}
                </Button>
              )}
              {!batchGroupState.running && batchGroupState.onDismiss && (
                <Button variant="secondary" size="sm" onClick={batchGroupState.onDismiss}>
                  {t('fcBatchCloseBtn')}
                </Button>
              )}
            </div>
          </div>

          {batchGroupState.running && batchGroupState.total > 0 && (
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-pulse-600 transition-all duration-200"
                style={{
                  width: `${Math.min(100, Math.round((batchGroupState.completed / batchGroupState.total) * 100))}%`,
                }}
              />
            </div>
          )}

          {batchGroupState.items.length > 0 && (
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[560px] text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2 pe-3 text-start">{t('fcBatchColGroup')}</th>
                    <th className="py-2 px-3 text-end">{t('fcBatchColLastActual')}</th>
                    <th className="py-2 px-3 text-end">{t('fcBatchColForecastTotal')}</th>
                    <th className="py-2 px-3 text-end">{t('fcBatchColChange')}</th>
                    <th className="py-2 ps-3 text-end">{t('fcBatchColReliability')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {batchGroupState.items.map((item) => {
                    const clickable = item.status === 'completed' && Boolean(batchGroupState.onSelectGroupForecast);
                    return (
                      <tr
                        key={item.groupValue}
                        onClick={() => clickable && batchGroupState.onSelectGroupForecast?.(item)}
                        className={cx(
                          clickable ? 'cursor-pointer hover:bg-sky-50/60' : 'bg-slate-50/40 text-slate-500',
                        )}
                      >
                        <td className="py-2.5 pe-3 font-semibold text-slate-900" dir="auto">
                          <span>{item.groupValue}</span>
                          {item.skipReason && (
                            <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                              {item.skipReason}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-end" dir="ltr">
                          {item.status === 'completed' ? formatMetricValue(item.lastActual, valuePrefix) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-end font-semibold text-slate-900" dir="ltr">
                          {item.status === 'completed' ? formatMetricValue(item.forecastTotal, valuePrefix) : '—'}
                        </td>
                        <td
                          className={cx(
                            'py-2.5 px-3 text-end font-semibold',
                            item.status === 'completed' && item.changePct !== null && item.changePct !== undefined
                              ? item.changePct >= 0
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                              : 'text-slate-400',
                          )}
                          dir="ltr"
                        >
                          {item.status === 'completed' && item.changePct !== null && item.changePct !== undefined
                            ? `${item.changePct >= 0 ? '+' : ''}${item.changePct}%`
                            : '—'}
                        </td>
                        <td className="py-2.5 ps-3 text-end">
                          {item.status === 'completed' && item.reliability ? (
                            <Badge tone={getReliabilityTone(item.reliability.level)}>
                              {t(
                                item.reliability.level === 'high'
                                  ? 'fcReliabilityHigh'
                                  : item.reliability.level === 'medium'
                                  ? 'fcReliabilityMedium'
                                  : 'fcReliabilityLow',
                              )}
                            </Badge>
                          ) : item.status === 'skipped' ? (
                            <Badge tone="amber">{t('fcBatchSkippedLabel')}</Badge>
                          ) : item.status === 'failed' ? (
                            <Badge tone="rose">{t('fcBatchFailedLabel')}</Badge>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {isLoadingList && !latestResult ? (
        <Card className="h-[420px] flex items-center justify-center text-sm text-slate-400">
          {t('loading')}
        </Card>
      ) : !latestResult ? (
        <EmptyState
          icon={<Sparkles className="w-7 h-7" />}
          title={t('fcReadyStateTitle')}
          description={t('fcReadyStateDesc')}
          action={
            <Button
              variant="primary"
              size="lg"
              disabled={isRunning || !config.dateColumn || !config.targetColumn}
              onClick={() => onRunForecast()}
              icon={<Play className="w-4 h-4" />}
            >
              {t('fcGenerateBtn')}
            </Button>
          }
        />
      ) : (
        <>
          {/* Latest Run Failed Banner (when displaying an older completed result) */}
          {activeForecast?.status === 'failed' && activeForecast.errorMessage && !inlineError && (
            <div
              role="alert"
              className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <span className="flex items-start gap-2 font-semibold min-w-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="min-w-0 break-words">
                  {t('fcFailedBannerTitle')}: {activeForecast.errorMessage}
                </span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={isRunning}
                onClick={() => onRunForecast()}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                {t('fcRetryBtn')}
              </Button>
            </div>
          )}

          {/* Dataset Version Staleness Banner */}
          {isDatasetStale && (
            <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                {t('fcDatasetStaleBanner')}
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={isRunning}
                onClick={() => onRunForecast()}
                icon={<RefreshCw className={cx('w-3.5 h-3.5', isRunning && 'animate-spin')} />}
              >
                {t('fcRefreshForecastBtn')}
              </Button>
            </div>
          )}

          {/* Configuration Staleness Banner */}
          {!isDatasetStale && isConfigStale && (
            <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                {t('fcConfigStaleBanner')}
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={isRunning}
                onClick={() => onRunForecast()}
                icon={<RefreshCw className={cx('w-3.5 h-3.5', isRunning && 'animate-spin')} />}
              >
                {t('fcRerunBtn')}
              </Button>
            </div>
          )}

          {/* Prominent Reliability Badge & Plain-Language Explanation */}
          <Card className="space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-pulse-600 shrink-0" />
                <span className="text-sm font-extrabold text-slate-900">{t('fcReliabilityTitle')}</span>
                {reliability && (
                  <>
                    <Badge tone={getReliabilityTone(reliability.level)}>
                      {t(
                        reliability.level === 'high'
                          ? 'fcReliabilityHigh'
                          : reliability.level === 'medium'
                          ? 'fcReliabilityMedium'
                          : 'fcReliabilityLow',
                      )}
                    </Badge>
                    <span className="text-xs font-bold text-slate-500 tabular-nums">
                      {t('fcReliabilityScore', { score: reliability.score })}
                    </span>
                  </>
                )}
              </div>
              {typicalErrorSentence && (
                <p className="text-xs font-semibold text-slate-700">{typicalErrorSentence}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">{t('fcWhyThisModel')}</p>
                <p className="leading-relaxed">
                  {latestResult.selectedModelLabel || latestResult.selectedModel}
                  {modelInfoObj ? ` — ${t(modelInfoObj.descKey as any)}` : ''}
                </p>
              </div>
              {reliability && reliability.reasons?.length > 0 && (
                <ul className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 list-disc list-inside leading-relaxed">
                  {reliability.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* Forecast vs Actual Realized Accuracy Card (Step 7) */}
          {vsActualSummary && (
            <Card className="space-y-3 min-w-0 border-sky-200/80 bg-sky-50/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-sky-600 shrink-0" />
                  <h3 className="text-sm font-extrabold text-slate-900">{t('fcActualAccuracyTitle')}</h3>
                </div>
                <Badge tone={vsActualSummary.within80All ? 'emerald' : 'amber'}>
                  {vsActualSummary.within80RatePct}% ({vsActualSummary.within80Count}/{vsActualSummary.matchedPeriods})
                </Badge>
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-semibold">
                  {vsActualSummary.meanAbsPctError !== null
                    ? t('fcActualAccuracyPct', {
                        pct: vsActualSummary.meanAbsPctError.toFixed(1),
                        n: vsActualSummary.matchedPeriods,
                      })
                    : t('fcActualAccuracyMae', {
                        mae: formatMetricValue(vsActualSummary.meanAbsError, valuePrefix, 2),
                        n: vsActualSummary.matchedPeriods,
                      })}
                </p>
                <p>
                  {vsActualSummary.within80All
                    ? t('fcActualWithin80Yes', {
                        count: vsActualSummary.within80Count,
                        total: vsActualSummary.matchedPeriods,
                      })
                    : t('fcActualWithin80No', {
                        count: vsActualSummary.within80Count,
                        total: vsActualSummary.matchedPeriods,
                      })}
                </p>
              </div>
            </Card>
          )}

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
            <SummaryMetricCard
              label={t('fcSumLastActual')}
              value={formatMetricValue(latestResult.summary.lastActualValue, valuePrefix)}
              sub={latestResult.summary.lastActualDate || ''}
            />
            <SummaryMetricCard
              label={t('fcSumTotalHorizon')}
              value={formatMetricValue(latestResult.summary.totalForecastedValue, valuePrefix)}
              sub={
                latestResult.summary.endPredictedValue !== undefined &&
                latestResult.summary.endPredictedValue !== null &&
                Number.isFinite(Number(latestResult.summary.endPredictedValue))
                  ? `End ${formatMetricValue(latestResult.summary.endPredictedValue, valuePrefix)}`
                  : ''
              }
            />
            <SummaryMetricCard
              label={t('fcSumAverageForecast')}
              value={formatMetricValue(latestResult.summary.averageForecastedValue, valuePrefix)}
              sub={hasPct ? `${pctVal >= 0 ? '+' : ''}${pctVal}% vs latest` : ''}
              tone={hasPct ? (pctVal >= 0 ? 'positive' : 'negative') : 'default'}
            />
            <SummaryMetricCard
              label={t('fcSumHorizonCard')}
              value={`${latestResult.horizonSteps} ${periodUnitLabel}`}
              sub={`${latestResult.frequency} · ${latestResult.horizonDays}d`}
            />
            <SummaryMetricCard
              label={t('fcSumSelectedModel')}
              value={latestResult.selectedModelLabel || latestResult.selectedModel}
              sub={
                latestResult.modelMetadata.trainingPeriod
                  ? `${latestResult.modelMetadata.trainingPeriod.start} → ${latestResult.modelMetadata.trainingPeriod.end}`
                  : latestResult.frequency
              }
            />
          </div>

          {/* Main Forecast Chart Card with Export Buttons */}
          <Card className="space-y-4 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-extrabold text-slate-900 truncate max-w-full" dir="auto">
                    {activeForecast?.name}
                  </h2>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums shrink-0">
                    {latestResult.frequency} · {latestResult.horizonSteps} {periodUnitLabel}
                    {activeForecast?.datasetVersionId ? ` · v:${activeForecast.datasetVersionId.slice(-8)}` : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {shownTargetCol} ({shownAgg}) ·{' '}
                  {latestResult.modelMetadata.selectedGroup
                    ? `${shownGroupCol || ''}: ${latestResult.modelMetadata.selectedGroup}`
                    : t('fcAllRecords')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 max-w-full shrink-0">
                <Segmented<'all' | '30' | '90'>
                  value={historyWindow}
                  onChange={onChangeHistoryWindow}
                  options={[
                    { value: 'all', label: t('fcWinAll') },
                    { value: '90', label: t('fcWinLast90') },
                    { value: '30', label: t('fcWinLast30') },
                  ]}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleDownloadCsv}
                >
                  {t('fcDownloadCsvBtn')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isExportingExcel}
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleDownloadExcel}
                >
                  {t('fcDownloadExcelBtn')}
                </Button>
              </div>
            </div>

            {exportError && (
              <p role="alert" className="text-xs font-semibold text-rose-700">
                {exportError}
              </p>
            )}

            <ForecastChart
              historicalData={latestResult.historicalData}
              predictedData={latestResult.predictedData}
              confidenceLevel={config.confidenceLevel}
              activeScenario={activeScenario}
              historyWindow={historyWindow}
              valuePrefix={valuePrefix}
              xAxisLabel={shownDateCol || t('fcAxisDateLabel')}
              yAxisLabel={shownTargetCol || t('fcAxisValueLabel')}
              heightClass="h-[280px] sm:h-[360px]"
            />
          </Card>

          {/* Estimated Calendar & Holiday Effects Card (Step 6) */}
          {calendarEffects?.enabled && calendarEffects.effects?.length > 0 && (
            <Card className="space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pulse-600 shrink-0" />
                  <h3 className="text-sm font-extrabold text-slate-900">{t('fcCalendarEffectsTitle')}</h3>
                </div>
                <Badge tone="sky">{calendarEffects.country}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
                {calendarEffects.effects.map((ef) => {
                  const pos = ef.effect >= 0;
                  return (
                    <div key={ef.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{ef.label}</span>
                        <span className="text-[11px] text-slate-500">
                          {t('fcCalendarEffectPeriods', { n: ef.observedPeriods })}
                        </span>
                      </div>
                      <p
                        className={cx('text-sm font-extrabold', pos ? 'text-emerald-600' : 'text-rose-600')}
                        dir="ltr"
                      >
                        {pos ? '+' : ''}
                        {formatMetricValue(ef.effect, valuePrefix, 2)}
                        {ef.effectPct !== null && ef.effectPct !== undefined
                          ? ` (${pos ? '+' : ''}${ef.effectPct}%)`
                          : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Uncertainty, Limitations & Data Quality */}
          <Card className="space-y-4 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">{t('fcDataQualityTitle')}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 tabular-nums">
                <span>
                  <strong className="text-slate-900">{latestResult.dataQuality.observedPeriods ?? 0}</strong>{' '}
                  {t('fcDqObserved')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-slate-900">{latestResult.dataQuality.missingPeriodCount ?? 0}</strong>{' '}
                  {t('fcDqMissing')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-slate-900">
                    {latestResult.dataQuality.duplicateTimestampCount ?? 0}
                  </strong>{' '}
                  {t('fcDqDuplicates')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-slate-900">{latestResult.dataQuality.outlierCount ?? 0}</strong>{' '}
                  {t('fcDqOutliers')}
                </span>
              </div>
            </div>

            {/* Explicit Uncertainty & Model Limitations Communication */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-pulse-600 shrink-0" />
                <span>{t('fcUncertaintyTitle')}</span>
              </p>
              <p>{t('fcUncertaintyConfidenceExplain', { pct: config.confidenceLevel })}</p>
              {latestResult.modelMetadata.intervalMethod === 'empirical_cv_quantile' && (
                <p className="text-[11px] font-medium text-emerald-700">
                  {t('fcIntervalNoteEmpirical', { pct: config.confidenceLevel })}
                </p>
              )}
              {latestResult.modelMetadata.intervalMethod === 'heuristic_fallback' && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-900 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{t('fcIntervalNoteFallback')}</span>
                </div>
              )}
              {latestResult.modelMetadata.intervalMethod === 'finite_sample_t_cv_calibrated' && (
                <p className="text-[11px] text-slate-600">{t('fcIntervalNoteCv')}</p>
              )}
              {latestResult.modelMetadata.trainingPeriod && (
                <p className="text-[11px] text-slate-600 tabular-nums">
                  {t('fcUncertaintyTrainingSpan', {
                    start: latestResult.modelMetadata.trainingPeriod.start,
                    end: latestResult.modelMetadata.trainingPeriod.end,
                    observed: latestResult.modelMetadata.trainingPeriod.observedPeriods,
                    calendar: latestResult.modelMetadata.trainingPeriod.calendarPeriods,
                  })}
                </p>
              )}
              {latestResult.evaluationMetrics.beatsBaseline !== null &&
                latestResult.evaluationMetrics.beatsBaseline !== undefined && (
                  <p className="text-[11px] text-slate-600">
                    {latestResult.evaluationMetrics.beatsBaseline
                      ? t('fcUncertaintyBeatsBaseline')
                      : t('fcUncertaintyLimitedBaseline')}
                  </p>
                )}
              {activeForecast?.businessTemplate &&
                (activeForecast.businessTemplate === 'inventory' ||
                  activeForecast.businessTemplate === 'demand') && (
                  <p className="text-[11px] font-medium text-amber-800">
                    {t('fcTplInventoryLimitation')}
                  </p>
                )}
            </div>

            {(latestResult.warnings.length > 0 || latestResult.notes.length > 0) && (
              <div className="space-y-2">
                {latestResult.warnings.map((w, idx) => (
                  <div
                    key={`w_${idx}`}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
                {latestResult.notes.map((n, idx) => (
                  <div
                    key={`n_${idx}`}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2"
                  >
                    <Info className="w-3.5 h-3.5 text-pulse-600 shrink-0 mt-0.5" />
                    <span>{n}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Technical Details (Collapsed by Default): MASE / RMSE / MAE + Candidate Comparison Table */}
          <SectionDisclosure
            title={t('fcTechnicalDetailsTitle')}
            subtitle={t('fcModelEvalTitle')}
            defaultOpen={false}
          >
            <div className="space-y-4 min-w-0 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs tabular-nums">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-400">RMSE</span>
                  <span className="text-sm font-extrabold text-slate-900" dir="ltr">
                    {formatMetricValue(latestResult.evaluationMetrics.rmse, '', 3)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-400">MAE</span>
                  <span className="text-sm font-extrabold text-slate-900" dir="ltr">
                    {formatMetricValue(latestResult.evaluationMetrics.mae, '', 3)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-400">MASE</span>
                  <span className="text-sm font-extrabold text-slate-900" dir="ltr">
                    {latestResult.evaluationMetrics.mase !== null &&
                    latestResult.evaluationMetrics.mase !== undefined &&
                    Number.isFinite(Number(latestResult.evaluationMetrics.mase))
                      ? Number(latestResult.evaluationMetrics.mase).toFixed(3)
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900">{t('fcModelEvalTitle')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 break-words">
                    {t('fcModelEvalDesc', {
                      windows: latestResult.evaluationMetrics.backtestingWindows,
                      train: latestResult.evaluationMetrics.trainingObservations,
                      val: latestResult.evaluationMetrics.validationObservations,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleMetricHelp}
                  className="text-xs font-semibold text-pulse-600 hover:text-pulse-700 flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {t('fcMetricsExplainToggle')}
                </button>
              </div>

              {showMetricHelp && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-2.5 leading-relaxed">
                  <p>
                    <strong className="text-slate-900">RMSE:</strong> {t('fcHelpRmse')}
                  </p>
                  <p>
                    <strong className="text-slate-900">MAE:</strong> {t('fcHelpMae')}
                  </p>
                  <p>
                    <strong className="text-slate-900">MASE:</strong> {t('fcHelpMase')}
                  </p>
                  <p>
                    <strong className="text-slate-900">MAPE:</strong> {t('fcHelpMape')}
                  </p>
                </div>
              )}

              {latestResult.evaluationMetrics.mapeNote && (
                <p className="text-[11px] text-slate-500 italic">{latestResult.evaluationMetrics.mapeNote}</p>
              )}

              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-[620px] text-xs text-start border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2 pe-3 text-start">{t('fcColModel')}</th>
                      <th className="py-2 px-3 text-start">{t('fcColStatus')}</th>
                      <th className="py-2 px-3 text-end">RMSE</th>
                      <th className="py-2 px-3 text-end">MAE</th>
                      <th className="py-2 px-3 text-end">MASE</th>
                      <th className="py-2 px-3 text-end">MAPE</th>
                      <th className="py-2 ps-3 text-end">{t('fcColBaseline')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {latestResult.evaluationMetrics.candidates.map((cand) => (
                      <tr
                        key={cand.model}
                        className={cand.selected ? 'bg-sky-50/60 font-semibold' : 'hover:bg-slate-50/70'}
                      >
                        <td className="py-2.5 pe-3 text-slate-900">
                          <span className="flex items-center gap-2">
                            {cand.label}
                            {cand.selected && <Badge tone="sky">{t('fcSelectedBadge')}</Badge>}
                          </span>
                          {cand.skipReason && (
                            <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
                              {cand.skipReason}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            tone={
                              cand.status === 'evaluated'
                                ? 'emerald'
                                : cand.status === 'skipped'
                                ? 'slate'
                                : 'rose'
                            }
                          >
                            {cand.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-end" dir="ltr">
                          {cand.rmse !== null ? cand.rmse.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-end" dir="ltr">
                          {cand.mae !== null ? cand.mae.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-end" dir="ltr">
                          {cand.mase !== null ? cand.mase.toFixed(3) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-end" dir="ltr">
                          {cand.mape !== null ? `${cand.mape.toFixed(2)}%` : '—'}
                        </td>
                        <td className="py-2.5 ps-3 text-end">
                          {cand.beatsBaseline === true
                            ? t('fcYes')
                            : cand.beatsBaseline === false
                            ? t('fcNo')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionDisclosure>

          {/* What-If Scenarios */}
          {activeForecast && (
            <ForecastScenariosPanel
              scenarios={activeForecast.scenarios || []}
              activeScenarioId={activeScenarioId}
              businessTemplate={activeForecast.businessTemplate}
              valuePrefix={valuePrefix}
              isSubmitting={isScenarioBusy}
              onSelectScenario={onSelectScenario}
              onCreateScenario={onCreateScenario}
              onDeleteScenario={onDeleteScenario}
            />
          )}
        </>
      )}
    </div>
  );
};

const SummaryMetricCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'positive' | 'negative';
}> = ({ label, value, sub, tone = 'default' }) => (
  <Card padded={false} className="p-3.5 sm:p-4 space-y-1 min-w-0">
    <p className="text-[11px] font-bold text-slate-400 truncate">{label}</p>
    <p
      className={cx(
        'text-base sm:text-lg font-extrabold tabular-nums truncate',
        tone === 'positive'
          ? 'text-emerald-600'
          : tone === 'negative'
          ? 'text-rose-600'
          : 'text-slate-900',
      )}
      dir="auto"
      title={value}
    >
      {value}
    </p>
    {sub && (
      <p className="text-[11px] font-medium text-slate-500 truncate tabular-nums" dir="auto">
        {sub}
      </p>
    )}
  </Card>
);
