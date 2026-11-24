import React from 'react';
import { Dataset } from '../../types/dashboard';
import {
  CalendarEffectCountry,
  ConcreteForecastFrequency,
  ForecastAggregation,
  ForecastConfidenceLevel,
  ForecastConfiguration,
  ForecastFrequency,
  ForecastLimits,
  ForecastMode,
  ForecastModelId,
  ForecastRecord,
  FrequencyDetectionResponse,
} from '../../types/forecast';
import {
  BUSINESS_DOMAIN_LABELS,
  BusinessForecastPreset,
  BusinessForecastTemplate,
  BusinessTemplateDomain,
  FORECAST_MODELS_INFO,
  coerceValidHorizonSteps,
  getMaxHorizonStepsForFrequency,
  getPeriodUnitTranslationKey,
  getPresetHorizonStepsForFrequency,
  horizonDaysToSteps,
  horizonStepsToApproxDays,
} from '../../data/forecastTemplates';
import { Button, Card, HelpHint, SectionDisclosure, Segmented, cx } from '../../ui';
import { useLanguage } from '../../i18n/LanguageContext';
import { Briefcase, Info, Play, Save, Sliders, Square } from 'lucide-react';

export interface ForecastConfigPanelProps {
  mode: ForecastMode;
  activeDomain: BusinessTemplateDomain;
  activePresetId: string;
  activeTemplateObj: BusinessForecastTemplate | null;
  activePresetObj: BusinessForecastPreset | null;
  domainPresets: BusinessForecastPreset[];
  forecastName: string;
  datasetId: string;
  globalDatasets: Dataset[];
  selectedDataset: Dataset | null;
  config: ForecastConfiguration;
  suggestedGroupColumns: string[];
  availableGroupValues: string[];
  effectiveFrequency?: ForecastFrequency;
  detection: FrequencyDetectionResponse | null;
  activeForecast: ForecastRecord | null;
  limits: ForecastLimits | null;
  isDetecting: boolean;
  isRunning: boolean;
  isSaving: boolean;
  isBatchRunning?: boolean;
  onChangeMode: (nextMode: ForecastMode) => void;
  onSelectDomain: (domain: BusinessTemplateDomain) => void;
  onSelectBusinessPreset: (preset: BusinessForecastPreset) => void;
  onChangeForecastName: (name: string) => void;
  onSelectDataset: (nextId: string) => void;
  onUpdateConfig: (updater: (prev: ForecastConfiguration) => ForecastConfiguration) => void;
  onClearDetection: () => void;
  onClearInlineError: () => void;
  onDetectFrequency: () => void;
  onRunForecast: (overrideFrequency?: ConcreteForecastFrequency) => void;
  onRunAllGroups?: () => void;
  onCancelRun: () => void;
  onSaveForecast: () => void;
}

/**
 * Left-hand configuration rail for Forecast Studio.
 * Handles forecasting mode (general vs. business presets), dataset/field mapping,
 * grouping, frequency detection, horizon/model selection, and run/save actions.
 */
export const ForecastConfigPanel: React.FC<ForecastConfigPanelProps> = ({
  mode,
  activeDomain,
  activePresetId,
  activeTemplateObj,
  activePresetObj,
  domainPresets,
  forecastName,
  datasetId,
  globalDatasets,
  selectedDataset,
  config,
  suggestedGroupColumns,
  availableGroupValues,
  effectiveFrequency,
  detection,
  activeForecast,
  limits,
  isDetecting,
  isRunning,
  isSaving,
  isBatchRunning = false,
  onChangeMode,
  onSelectDomain,
  onSelectBusinessPreset,
  onChangeForecastName,
  onSelectDataset,
  onUpdateConfig,
  onClearDetection,
  onClearInlineError,
  onDetectFrequency,
  onRunForecast,
  onRunAllGroups,
  onCancelRun,
  onSaveForecast,
}) => {
  const { t } = useLanguage();
  const resolvedFreq: ForecastFrequency = effectiveFrequency || config.frequency;
  const presetSteps = getPresetHorizonStepsForFrequency(resolvedFreq);
  const maxSteps =
    limits?.maxHorizonStepsByFrequency?.[resolvedFreq] ??
    getMaxHorizonStepsForFrequency(resolvedFreq);
  const activeSteps = Math.max(
    1,
    Math.min(
      maxSteps,
      config.horizonSteps ?? horizonDaysToSteps(resolvedFreq, config.horizonDays),
    ),
  );
  const periodUnit = t(getPeriodUnitTranslationKey(resolvedFreq) as any);
  const [customStepsDraft, setCustomStepsDraft] = React.useState(String(activeSteps));

  React.useEffect(() => {
    setCustomStepsDraft(String(activeSteps));
  }, [activeSteps]);

  const applyHorizonSteps = (nextStepsRaw: number) => {
    const nextSteps = Math.max(1, Math.min(maxSteps, Math.round(nextStepsRaw)));
    onUpdateConfig((p) => ({
      ...p,
      horizonSteps: nextSteps,
      horizonDays: horizonStepsToApproxDays(resolvedFreq, nextSteps),
    }));
  };

  return (
    <Card className="space-y-5 xl:sticky xl:top-20 min-w-0">
      {/* Mode Switcher */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          {t('fcModeLabel')}
        </label>
        <Segmented<ForecastMode>
          value={mode}
          onChange={onChangeMode}
          options={[
            {
              value: 'general',
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  {t('fcModeGeneral')}
                </span>
              ),
            },
            {
              value: 'business',
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  {t('fcModeBusiness')}
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Business Workflow Categories & Presets */}
      {mode === 'business' && (
        <div className="space-y-2.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            {t('fcBusinessTemplatesLabel')}
          </label>

          {/* Domain Tabs: Sales · Finance · Inventory · Marketing · General */}
          <div className="flex flex-wrap gap-1">
            {BUSINESS_DOMAIN_LABELS.map((dom) => {
              const active = activeDomain === dom.id;
              return (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => onSelectDomain(dom.id)}
                  className={cx(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer',
                    active
                      ? 'bg-navy-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900',
                  )}
                >
                  {t(dom.titleKey as any)}
                </button>
              );
            })}
          </div>

          {/* Domain Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {domainPresets.map((preset) => {
              const active = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectBusinessPreset(preset)}
                  className={cx(
                    'p-2 rounded-xl border text-start transition-all cursor-pointer min-w-0',
                    active
                      ? 'border-pulse-500 bg-pulse-50/70 text-slate-900 ring-1 ring-pulse-500/30'
                      : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-white hover:border-slate-300',
                  )}
                >
                  <div className="text-[11px] font-bold truncate">{t(preset.titleKey as any)}</div>
                </button>
              );
            })}
          </div>

          {(activePresetObj || activeTemplateObj) && (
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t(((activePresetObj?.descKey || activeTemplateObj?.descKey) ?? '') as any)}
            </p>
          )}

          {(activePresetObj?.limitationNoteKey || activeTemplateObj?.limitationNoteKey) && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {t(((activePresetObj?.limitationNoteKey || activeTemplateObj?.limitationNoteKey) ?? '') as any)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Forecast Name */}
      <div className="min-w-0">
        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('fcNameLabel')}</label>
        <input
          type="text"
          value={forecastName}
          onChange={(e) => onChangeForecastName(e.target.value)}
          placeholder={t('fcNamePlaceholder')}
          dir="auto"
          className="w-full min-w-0 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
        />
      </div>

      {/* Dataset Selector */}
      <div className="min-w-0">
        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('fcDatasetLabel')}</label>
        <select
          value={datasetId}
          onChange={(e) => onSelectDataset(e.target.value)}
          dir="auto"
          className="w-full min-w-0 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
        >
          {globalDatasets.map((ds) => (
            <option key={ds.id} value={ds.id}>
              {ds.name} ({ds.rowCount.toLocaleString()} × {ds.columnCount})
            </option>
          ))}
        </select>
      </div>

      {/* Date & Target Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
            <span className="truncate">{t('fcDateColLabel')}</span>
            <HelpHint text={t('fcPlainHintDate')} />
          </label>
          <select
            value={config.dateColumn}
            onChange={(e) => {
              onClearDetection();
              onUpdateConfig((p) => ({ ...p, dateColumn: e.target.value }));
            }}
            dir="auto"
            className="w-full min-w-0 h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
          >
            <option value="">{t('configSelectFieldOpt')}</option>
            {selectedDataset?.columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name} ({col.type})
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
            <span className="truncate">{t('fcTargetColLabel')}</span>
            <HelpHint text={t('fcPlainHintTarget')} />
          </label>
          <select
            value={config.targetColumn}
            onChange={(e) => onUpdateConfig((p) => ({ ...p, targetColumn: e.target.value }))}
            dir="auto"
            className="w-full min-w-0 h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
          >
            <option value="">{t('configSelectFieldOpt')}</option>
            {selectedDataset?.columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name} ({col.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregation */}
      <div className="min-w-0">
        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('fcAggregationLabel')}</label>
        <select
          value={config.aggregation}
          onChange={(e) => onUpdateConfig((p) => ({ ...p, aggregation: e.target.value as ForecastAggregation }))}
          className="w-full min-w-0 h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
        >
          <option value="sum">{t('fcAggSum')}</option>
          <option value="avg">{t('fcAggAvg')}</option>
          <option value="count">{t('fcAggCount')}</option>
          <option value="min">{t('fcAggMin')}</option>
          <option value="max">{t('fcAggMax')}</option>
        </select>
      </div>

      {/* Frequency & Detection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700">{t('fcFrequencyLabel')}</label>
          <button
            type="button"
            disabled={isDetecting || !config.dateColumn || !config.targetColumn}
            onClick={onDetectFrequency}
            className="text-[11px] font-bold text-pulse-600 hover:text-pulse-700 disabled:opacity-40 cursor-pointer"
          >
            {isDetecting ? t('fcDetectingBtn') : t('fcDetectBtn')}
          </button>
        </div>
        <select
          value={config.frequency}
          onChange={(e) => {
            const nextFreq = e.target.value as ForecastFrequency;
            onUpdateConfig((p) => {
              const currentSteps = p.horizonSteps ?? horizonDaysToSteps(p.frequency, p.horizonDays);
              const nextSteps = coerceValidHorizonSteps(nextFreq, currentSteps);
              return {
                ...p,
                frequency: nextFreq,
                horizonSteps: nextSteps,
                horizonDays: horizonStepsToApproxDays(nextFreq, nextSteps),
              };
            });
            onClearInlineError();
          }}
          className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900"
        >
          <option value="auto">{t('fcFreqAuto')}</option>
          <option value="daily">{t('fcFreqDaily')}</option>
          <option value="weekly">{t('fcFreqWeekly')}</option>
          <option value="monthly">{t('fcFreqMonthly')}</option>
          <option value="quarterly">{t('fcFreqQuarterly')}</option>
          <option value="yearly">{t('fcFreqYearly')}</option>
        </select>
        {detection && (
          <p
            className={cx(
              'text-[11px] font-medium',
              detection.needsOverride ? 'text-amber-700' : 'text-emerald-700',
            )}
          >
            {detection.message}
          </p>
        )}
      </div>

      {/* Horizon Selector (next N periods with frequency presets + custom input) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <span>{t('fcHorizonLabel')}</span>
            <HelpHint text={t('fcPlainHintHorizon')} />
          </label>
          <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
            {activeSteps} {periodUnit}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presetSteps.map((steps) => {
            const isSelected = activeSteps === steps;
            return (
              <button
                key={steps}
                type="button"
                aria-pressed={isSelected}
                onClick={() => applyHorizonSteps(steps)}
                className={cx(
                  'h-8 px-3 rounded-lg border text-xs font-bold tabular-nums transition-colors cursor-pointer',
                  isSelected
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {steps} {periodUnit}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="fc-custom-horizon-steps" className="text-[11px] font-medium text-slate-500 shrink-0">
            {t('fcHorizonCustomLabel')}
          </label>
          <input
            id="fc-custom-horizon-steps"
            type="number"
            min={1}
            max={maxSteps}
            value={customStepsDraft}
            onChange={(e) => {
              const raw = e.target.value;
              setCustomStepsDraft(raw);
              const parsed = Number(raw);
              if (raw.trim() !== '' && Number.isFinite(parsed) && parsed >= 1) {
                applyHorizonSteps(Math.min(maxSteps, parsed));
              }
            }}
            onBlur={() => {
              const parsed = Number(customStepsDraft);
              if (!Number.isFinite(parsed) || parsed < 1) {
                setCustomStepsDraft(String(activeSteps));
                return;
              }
              const clamped = Math.max(1, Math.min(maxSteps, Math.round(parsed)));
              setCustomStepsDraft(String(clamped));
              applyHorizonSteps(clamped);
            }}
            dir="ltr"
            className="w-24 h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
          />
          <span className="text-[11px] text-slate-400 truncate">
            {t('fcHorizonPeriodsHint', { max: maxSteps })}
          </span>
        </div>
      </div>

      {/* Model Selector */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('fcModelLabel')}</label>
        <select
          value={config.model}
          onChange={(e) => onUpdateConfig((p) => ({ ...p, model: e.target.value as ForecastModelId }))}
          className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900"
        >
          {FORECAST_MODELS_INFO.map((m) => (
            <option key={m.id} value={m.id}>
              {t(m.labelKey as any)}
            </option>
          ))}
        </select>
      </div>

      {/* Progressive Disclosure: Grouping, Calendar Effects & Confidence Level */}
      <SectionDisclosure
        title={t('fcAdvancedOptionsToggle')}
        defaultOpen={Boolean(
          config.groupColumn || config.confidenceLevel !== '95' || config.calendarEffects?.enabled,
        )}
      >
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('fcGroupColLabel')}</label>
          <select
            value={config.groupColumn || ''}
            onChange={(e) =>
              onUpdateConfig((p) => ({
                ...p,
                groupColumn: e.target.value || null,
                groupValue: null,
              }))
            }
            dir="auto"
            className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900"
          >
            <option value="">{t('configNoneOpt')}</option>
            {selectedDataset?.columns
              .filter((c) => c.name !== config.dateColumn && c.name !== config.targetColumn)
              .map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        {mode === 'business' && suggestedGroupColumns.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">{t('fcGroupSuggestHint')}:</span>
            {suggestedGroupColumns.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() =>
                  onUpdateConfig((p) => ({
                    ...p,
                    groupColumn: p.groupColumn === col ? null : col,
                    groupValue: null,
                  }))
                }
                className={cx(
                  'px-2 py-0.5 rounded-md border text-[10px] font-semibold cursor-pointer',
                  config.groupColumn === col
                    ? 'border-pulse-500 bg-pulse-50 text-pulse-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {col}
              </button>
            ))}
          </div>
        )}

        {config.groupColumn && (
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('fcGroupValLabel')}</label>
              <select
                value={config.groupValue || ''}
                onChange={(e) => onUpdateConfig((p) => ({ ...p, groupValue: e.target.value || null }))}
                dir="auto"
                className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900"
              >
                <option value="">{t('fcAllCategoriesAggregated')}</option>
                {availableGroupValues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            {onRunAllGroups && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={isRunning || isBatchRunning || !datasetId || !config.dateColumn || !config.targetColumn}
                onClick={onRunAllGroups}
              >
                {t('fcForecastAllGroupsBtn')}
              </Button>
            )}
          </div>
        )}

        <div className="space-y-2 pt-1 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-700">{t('fcCalendarEffectsLabel')}</label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(config.calendarEffects?.enabled)}
              onChange={(e) =>
                onUpdateConfig((p) => ({
                  ...p,
                  calendarEffects: {
                    enabled: e.target.checked,
                    country: p.calendarEffects?.country || 'EG',
                  },
                }))
              }
              className="rounded border-slate-300 text-pulse-600 focus:ring-pulse-500"
            />
            <span>{t('fcCalendarEffectsToggle')}</span>
          </label>
          {config.calendarEffects?.enabled && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t('fcCalendarCountryLabel')}
              </label>
              <select
                value={config.calendarEffects?.country || 'EG'}
                onChange={(e) =>
                  onUpdateConfig((p) => ({
                    ...p,
                    calendarEffects: {
                      enabled: true,
                      country: e.target.value as CalendarEffectCountry,
                    },
                  }))
                }
                className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900"
              >
                <option value="EG">{t('fcCalendarCountryEG')}</option>
                <option value="SA">{t('fcCalendarCountrySA')}</option>
                <option value="AE">{t('fcCalendarCountryAE')}</option>
                <option value="US">{t('fcCalendarCountryUS')}</option>
                <option value="GB">{t('fcCalendarCountryGB')}</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('fcConfidenceLabel')}</label>
          <select
            value={config.confidenceLevel}
            onChange={(e) =>
              onUpdateConfig((p) => ({ ...p, confidenceLevel: e.target.value as ForecastConfidenceLevel }))
            }
            className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold tabular-nums text-slate-900"
          >
            <option value="80">80%</option>
            <option value="90">90%</option>
            <option value="95">95%</option>
          </select>
        </div>
      </SectionDisclosure>

      {/* Run / Save / Cancel / Limits */}
      <div className="pt-2 space-y-2 border-t border-slate-100">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            className="flex-1 min-w-[140px]"
            disabled={isRunning || isSaving || !datasetId || !config.dateColumn || !config.targetColumn}
            onClick={() => onRunForecast()}
            icon={<Play className="w-4 h-4" />}
          >
            {isRunning
              ? t('fcRunningBtn')
              : activeForecast?.latestResult
              ? t('fcRerunBtn')
              : t('fcGenerateBtn')}
          </Button>
          {isRunning ? (
            <Button
              variant="danger"
              size="lg"
              className="shrink-0"
              onClick={onCancelRun}
              icon={<Square className="w-3.5 h-3.5" />}
            >
              {t('fcCancelBtn')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              className="shrink-0"
              disabled={isSaving || !datasetId || !config.dateColumn || !config.targetColumn}
              onClick={onSaveForecast}
              icon={<Save className="w-4 h-4" />}
            >
              {isSaving ? t('savingChanges') : t('fcSaveForecastBtn')}
            </Button>
          )}
        </div>

        {limits && (
          <p className="text-[10px] text-slate-400 tabular-nums text-center">
            {t('fcLimitsCaption', {
              obs: limits.maxObservations.toLocaleString(),
              days: limits.maxHorizonDays,
            })}
          </p>
        )}
      </div>
    </Card>
  );
};
