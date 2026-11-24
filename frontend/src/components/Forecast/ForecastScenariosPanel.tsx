import React, { useMemo, useState } from 'react';
import {
  BusinessTemplateId,
  ForecastScenarioAssumptions,
  ForecastScenarioRecord,
} from '../../types/forecast';
import {
  BUSINESS_FORECAST_TEMPLATES,
  getApplicableScenarioDrivers,
} from '../../data/forecastTemplates';
import { Badge, Button, Card, cx } from '../../ui';
import { useLanguage } from '../../i18n/LanguageContext';
import { SlidersHorizontal, Plus, Trash2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface Props {
  scenarios: ForecastScenarioRecord[];
  activeScenarioId: string | null;
  businessTemplate: BusinessTemplateId | null;
  valuePrefix?: string;
  isSubmitting: boolean;
  onSelectScenario: (id: string | null) => void;
  onCreateScenario: (name: string, assumptions: ForecastScenarioAssumptions) => Promise<void>;
  onDeleteScenario: (scenarioId: string) => Promise<void>;
}

const DEFAULT_ASSUMPTIONS: ForecastScenarioAssumptions = {
  growthRateDeltaPct: 0,
  volumeDeltaPct: 10,
  priceChangePct: 0,
  priceElasticity: 0,
  costDeltaPct: 0,
};

function normalizeTemplateDefaults(
  raw?: Partial<ForecastScenarioAssumptions> | null,
): ForecastScenarioAssumptions {
  if (!raw) return { ...DEFAULT_ASSUMPTIONS };
  const legacyVolume = (raw.salesDeltaPct ?? 0) + (raw.demandDeltaPct ?? 0);
  return {
    growthRateDeltaPct: Number(raw.growthRateDeltaPct ?? 0),
    volumeDeltaPct: Number(raw.volumeDeltaPct ?? legacyVolume),
    priceChangePct: Number(raw.priceChangePct ?? 0),
    priceElasticity: Number(raw.priceElasticity ?? 0),
    costDeltaPct: Number(raw.costDeltaPct ?? raw.expenseDeltaPct ?? 0),
  };
}

export const ForecastScenariosPanel: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  businessTemplate,
  valuePrefix = '',
  isSubmitting,
  onSelectScenario,
  onCreateScenario,
  onDeleteScenario,
}) => {
  const { t } = useLanguage();
  const applicable = useMemo(
    () => getApplicableScenarioDrivers(businessTemplate),
    [businessTemplate],
  );
  const tplDefaults = useMemo(() => {
    const found = BUSINESS_FORECAST_TEMPLATES.find((b) => b.id === businessTemplate);
    return normalizeTemplateDefaults(found?.defaultAssumptions);
  }, [businessTemplate]);

  const [name, setName] = useState('');
  const [assumptions, setAssumptions] = useState<ForecastScenarioAssumptions>(tplDefaults);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setAssumptions(tplDefaults);
  }, [tplDefaults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const growth = Number(assumptions.growthRateDeltaPct ?? 0);
    const volume = Number(assumptions.volumeDeltaPct ?? 0);
    const price = applicable.priceChangePct ? Number(assumptions.priceChangePct ?? 0) : 0;
    const elasticity = applicable.priceElasticity ? Number(assumptions.priceElasticity ?? 0) : 0;
    const cost = applicable.costDeltaPct ? Number(assumptions.costDeltaPct ?? 0) : 0;

    if (
      [growth, volume, price, cost].some((v) => !Number.isFinite(v) || v < -95 || v > 500)
    ) {
      setError('Scenario adjustments must be finite percentages between -95% and +500%.');
      return;
    }
    if (!Number.isFinite(elasticity) || elasticity < -10 || elasticity > 5) {
      setError('Price elasticity must be a finite number between -10 and +5.');
      return;
    }

    const payload: ForecastScenarioAssumptions = {
      growthRateDeltaPct: growth,
      volumeDeltaPct: volume,
      ...(applicable.priceChangePct ? { priceChangePct: price, priceElasticity: elasticity } : {}),
      ...(applicable.costDeltaPct ? { costDeltaPct: cost } : {}),
    };

    const trimmed = name.trim() || `${t('fcScenarioDefaultName')} ${scenarios.length + 1}`;
    try {
      await onCreateScenario(trimmed, payload);
      setName('');
    } catch (err: any) {
      setError(err?.message || t('fcScenarioCreateErr'));
    }
  };

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || null;

  return (
    <Card className="space-y-5 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{t('fcWhatIfTitle')}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('fcWhatIfDesc')}</p>
        </div>
        {activeScenarioId && (
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 self-start sm:self-auto"
            onClick={() => onSelectScenario(null)}
          >
            {t('fcClearOverlay')}
          </Button>
        )}
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>{t('fcScenarioDisclaimer')}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3 min-w-0">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              {t('fcScenarioNameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fcScenarioNamePlaceholder')}
              dir="auto"
              className="w-full min-w-0 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
            />
          </div>

          {applicable.growthRateDeltaPct && (
            <AssumptionField
              label={t('fcAssumptionGrowth')}
              value={assumptions.growthRateDeltaPct}
              onChange={(v) => setAssumptions((p) => ({ ...p, growthRateDeltaPct: v }))}
            />
          )}

          {applicable.volumeDeltaPct && (
            <AssumptionField
              label={t('fcAssumptionVolume')}
              value={assumptions.volumeDeltaPct ?? 0}
              onChange={(v) => setAssumptions((p) => ({ ...p, volumeDeltaPct: v }))}
            />
          )}

          {applicable.priceChangePct && (
            <AssumptionField
              label={t('fcAssumptionPrice')}
              value={assumptions.priceChangePct}
              onChange={(v) => setAssumptions((p) => ({ ...p, priceChangePct: v }))}
            />
          )}

          {applicable.priceElasticity && (
            <AssumptionField
              label={t('fcAssumptionElasticity')}
              value={assumptions.priceElasticity ?? 0}
              min={-10}
              max={5}
              step="0.1"
              unit=""
              onChange={(v) => setAssumptions((p) => ({ ...p, priceElasticity: v }))}
            />
          )}

          {applicable.costDeltaPct && (
            <AssumptionField
              label={t('fcAssumptionCost')}
              value={assumptions.costDeltaPct ?? 0}
              onChange={(v) => setAssumptions((p) => ({ ...p, costDeltaPct: v }))}
            />
          )}

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={isSubmitting}
              icon={<Plus className="w-4 h-4" />}
            >
              {isSubmitting ? t('fcSavingScenario') : t('fcCreateScenarioBtn')}
            </Button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {scenarios.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('fcSavedScenariosHeading')} ({scenarios.length})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenarios.map((scen) => {
              const isSelected = scen.id === activeScenarioId;
              const sum = scen.scenarioResults?.summary;
              const delta = Number(sum?.totalDelta || 0);
              const deltaPct = sum?.totalDeltaPct;
              return (
                <div
                  key={scen.id}
                  onClick={() => onSelectScenario(isSelected ? null : scen.id)}
                  className={cx(
                    'p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 min-w-0',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CheckCircle2
                        className={cx('w-4 h-4 shrink-0', isSelected ? 'text-emerald-600' : 'text-slate-300')}
                      />
                      <span className="text-xs font-bold text-slate-900 truncate" dir="auto">
                        {scen.name}
                      </span>
                      {scen.isStale && <Badge tone="amber">{t('fcScenarioStaleBadge')}</Badge>}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScenario(scen.id);
                      }}
                      aria-label={t('fcDeleteScenarioAria')}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {sum && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] tabular-nums">
                      <div className="min-w-0">
                        <span className="block text-slate-400 truncate">{t('fcBaselineTotal')}</span>
                        <span className="font-bold text-slate-700 block truncate" dir="ltr">
                          {valuePrefix}
                          {Number(sum.baselineTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-slate-400 truncate">{t('fcScenarioTotal')}</span>
                        <span className="font-bold text-slate-900 block truncate" dir="ltr">
                          {valuePrefix}
                          {Number(sum.scenarioTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-slate-400 truncate">{t('fcNetImpact')}</span>
                        <span
                          className={cx('font-bold block truncate', delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}
                          dir="ltr"
                        >
                          {delta >= 0 ? '+' : ''}
                          {valuePrefix}
                          {delta.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          {deltaPct !== null && deltaPct !== undefined ? ` (${deltaPct >= 0 ? '+' : ''}${deltaPct}%)` : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {activeScenario &&
            (activeScenario.isStale ||
              (activeScenario.scenarioResults?.warnings?.length ?? 0) > 0 ||
              (activeScenario.scenarioResults?.notes?.length ?? 0) > 0) && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                {activeScenario.isStale && (
                  <p className="flex items-start gap-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{t('fcScenarioStaleNotice')}</span>
                  </p>
                )}
                {[...(activeScenario.scenarioResults?.warnings || []), ...(activeScenario.scenarioResults?.notes || [])].map(
                  (msg, idx) => (
                    <p key={idx} className="flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{msg}</span>
                    </p>
                  ),
                )}
              </div>
            )}
        </div>
      )}
    </Card>
  );
};

const AssumptionField: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: string;
  unit?: string;
  onChange: (val: number) => void;
}> = ({ label, value, min = -95, max = 500, step = '0.5', unit = '%', onChange }) => {
  const [draft, setDraft] = React.useState(String(value));

  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitValue = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setDraft('0');
      onChange(0);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    setDraft(String(clamped));
    onChange(clamped);
  };

  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={draft}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            if (raw !== '' && raw !== '-' && raw !== '.' && raw !== '-.') {
              const num = Number(raw);
              if (Number.isFinite(num)) {
                onChange(Math.max(min, Math.min(max, num)));
              }
            }
          }}
          onBlur={(e) => commitValue(e.target.value)}
          dir="ltr"
          className={cx(
            'w-full min-w-0 h-9 ps-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15',
            unit ? 'pe-7' : 'pe-3',
          )}
        />
        {unit && (
          <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
