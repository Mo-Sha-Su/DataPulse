import React from 'react';
import { WidgetConfig, Dataset, DataFilter } from '../../../types/dashboard';
import { DataModelState } from '../../../types/dataModel';
import { calculateSummaryMetrics, formatNumber } from '../../../utils/dataProcessor';
import { queryWidgetData } from '../../../utils/semanticQueryEngine';
import { useLanguage } from '../../../i18n/LanguageContext';
import { TrendingUp, TrendingDown, Target, Award, Activity, Gauge, Sliders, Network } from 'lucide-react';

interface Props {
  type: string;
  config: WidgetConfig;
  dataset?: Dataset;
  dataModel?: DataModelState;
  datasets?: Dataset[];
  globalFilters?: DataFilter[];
}

export const AnalyticsRenderer: React.FC<Props> = ({
  type,
  config,
  dataset,
  dataModel,
  datasets,
  globalFilters,
}) => {
  const { t } = useLanguage();
  const queryResult = queryWidgetData({
    config,
    dataset,
    dataModel,
    datasets,
    globalFilters,
  });

  const processed = queryResult.data;

  // Render meaningful error / warning if model relationship or table is missing
  if (queryResult.error && processed.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-amber-50/70 border border-dashed border-amber-200/90 rounded-xl select-none">
        <Network className="w-5 h-5 text-amber-600 mb-1.5" />
        <span className="text-xs font-bold text-amber-900">{t('analyticsSemanticNotice')}</span>
        <span className="text-[11px] text-amber-700 mt-1 max-w-[220px] leading-snug" dir="auto">
          {queryResult.error}
        </span>
      </div>
    );
  }

  if (processed.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
        <Activity className="w-6 h-6 text-slate-400 mb-1.5" />
        <span className="text-xs font-bold text-slate-700">{t('widgetNoDataTitle')}</span>
        <span className="text-[11px] text-slate-400 max-w-[200px] mt-0.5 leading-snug">
          {t('widgetNoDataDesc')}
        </span>
      </div>
    );
  }

  const metrics = calculateSummaryMetrics(processed);
  const primaryVal = processed[0]?.y ?? metrics.sum;
  const formattedVal = formatNumber(primaryVal, config.numberFormat, config.currencySymbol);

  // --- KPI CARD ---
  if (type === 'kpi') {
    const isPositive = primaryVal >= (config.targetValue || 0);
    return (
      <div className="w-full h-full flex flex-col justify-between p-3 sm:p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-inner min-w-0 overflow-hidden">
        <div className="flex justify-between items-start gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase truncate min-w-0" dir="auto">
            {config.title || t('analyticsKpiDefault')}
          </span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1 truncate tabular-nums" dir="ltr">
            {formattedVal}
          </h2>
          {config.subtitle && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium min-w-0">
              {isPositive ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
              <span dir="auto" className="truncate">{config.subtitle}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- METRIC CARD ---
  if (type === 'metric') {
    return (
      <div className="w-full h-full flex flex-col justify-between p-3 sm:p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 min-w-0 overflow-hidden">
        <div className="flex justify-between items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-slate-400 truncate min-w-0" dir="auto">
            {config.title || t('analyticsMetricDefault')}
          </span>
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
        </div>
        <div className="min-w-0">
          <span className="block text-xl sm:text-2xl font-bold text-white truncate tabular-nums" dir="ltr">{formattedVal}</span>
          <div className="w-full bg-slate-700/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, (primaryVal / (metrics.max || 1)) * 100))}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // --- FUNNEL CHART ---
  if (type === 'funnel') {
    const maxVal = Math.max(...processed.map((p) => p.y), 1);
    return (
      <div className="w-full h-full p-2.5 sm:p-3 flex flex-col justify-start gap-1.5 overflow-y-auto min-w-0">
        {processed.map((item, idx) => {
          const widthPct = Math.max(18, (item.y / maxVal) * 100);
          return (
            <div key={idx} className="flex items-center gap-2 text-xs shrink-0 min-w-0">
              <span className="w-16 sm:w-24 shrink-0 truncate text-slate-300 text-end font-medium" dir="auto">{item.x}</span>
              <div className="flex-1 min-w-0 bg-slate-900/60 h-7 rounded relative overflow-hidden flex items-center px-2">
                <div
                  className="absolute inset-y-0 start-0 bg-gradient-to-r from-indigo-600 to-violet-500 rounded transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                />
                <span className="relative z-10 font-bold text-white text-[11px] ms-1 truncate tabular-nums" dir="ltr">{item.formattedY}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --- TREEMAP ---
  if (type === 'treemap') {
    const total = processed.reduce((acc, p) => acc + p.y, 0) || 1;
    return (
      <div className="w-full h-full p-2 flex flex-wrap gap-1 content-start overflow-y-auto min-w-0">
        {processed.map((item, idx) => {
          const flexBasis = `${Math.max(15, Math.min(100, (item.y / total) * 100 * 1.5))}%`;
          return (
            <div
              key={idx}
              className="p-2 rounded bg-indigo-900/40 border border-indigo-500/30 flex flex-col justify-between hover:border-indigo-400 transition-all cursor-pointer min-h-[60px] min-w-0"
              style={{ flexGrow: Math.max(1, Math.round(item.y / 1000)), flexBasis }}
            >
              <span className="text-[10px] font-bold text-indigo-200 truncate" dir="auto">{item.x}</span>
              <span className="text-xs font-black text-white truncate tabular-nums" dir="ltr">{item.formattedY}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // --- RADIAL GAUGE ---
  if (type === 'gauge') {
    const goal = config.goalValue || 100;
    const currentPct = Math.min(100, Math.max(0, (primaryVal / goal) * 100));
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-700"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-amber-500 transition-all duration-700 ease-out"
              strokeDasharray={`${currentPct}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-black text-white" dir="ltr">{Math.round(currentPct)}%</span>
            <span className="text-[10px] text-slate-400 uppercase">{t('analyticsTargetLabel')}</span>
          </div>
        </div>
        <span className="text-xs text-slate-300 mt-2 font-medium" dir="ltr">{formattedVal} / {goal}</span>
      </div>
    );
  }

  // --- SPARKLINE ---
  if (type === 'sparkline') {
    const max = Math.max(...processed.map((p) => p.y), 1);
    return (
      <div className="w-full h-full p-3 flex flex-col justify-between bg-slate-900/60 rounded-lg min-w-0 overflow-hidden">
        <div className="flex justify-between items-center gap-2 text-xs text-slate-400 min-w-0">
          <span dir="auto" className="truncate min-w-0">{config.title || t('analyticsSparklineDefault')}</span>
          <span className="font-bold text-white shrink-0 tabular-nums" dir="ltr">{formattedVal}</span>
        </div>
        <div className="flex items-end gap-1 h-16 pt-2" dir="ltr">
          {processed.map((pt, i) => {
            const heightPct = Math.max(10, (pt.y / max) * 100);
            return (
              <div
                key={i}
                className="flex-1 bg-emerald-500/80 rounded-t hover:bg-emerald-400 transition-colors"
                style={{ height: `${heightPct}%` }}
                title={`${pt.x}: ${pt.formattedY}`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // --- PROGRESS BAR ---
  if (type === 'progress') {
    const goal = config.goalValue || metrics.max || 100;
    const pct = Math.min(100, Math.max(0, (primaryVal / goal) * 100));
    return (
      <div className="w-full h-full p-3 sm:p-4 flex flex-col justify-center gap-3 min-w-0 overflow-hidden">
        <div className="flex justify-between gap-2 text-xs text-slate-300 font-medium min-w-0">
          <span dir="auto" className="truncate min-w-0">{config.title || t('analyticsProgressDefault')}</span>
          <span className="font-bold text-cyan-400 shrink-0 tabular-nums" dir="ltr">{pct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-700/80 h-4 rounded-full overflow-hidden p-0.5 border border-slate-600/50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between gap-2 text-[11px] text-slate-400 min-w-0">
          <span className="truncate">{t('analyticsCurrentLabel')}: <span dir="ltr" className="tabular-nums">{formattedVal}</span></span>
          <span className="truncate">{t('analyticsTargetGoalLabel')}: <span dir="ltr" className="tabular-nums">{formatNumber(goal, config.numberFormat, config.currencySymbol)}</span></span>
        </div>
      </div>
    );
  }

  // --- TARGET VS ACTUAL ---
  if (type === 'target_vs_actual') {
    return (
      <div className="w-full h-full p-2.5 sm:p-3 flex flex-col justify-start gap-2 overflow-y-auto min-w-0">
        {processed.map((pt, idx) => {
          const target = pt.secondary ?? config.targetValue ?? (pt.y * 0.9);
          const achieved = pt.y >= target;
          return (
            <div key={idx} className="space-y-1 text-xs shrink-0 min-w-0">
              <div className="flex justify-between gap-2 text-slate-300 font-medium min-w-0">
                <span dir="auto" className="truncate min-w-0">{pt.x}</span>
                <span className={`shrink-0 tabular-nums ${achieved ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}`} dir="ltr">
                  {pt.formattedY} / {formatNumber(target, config.numberFormat, config.currencySymbol)}
                </span>
              </div>
              <div className="relative w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${achieved ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, (pt.y / (target || 1)) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --- CANDLESTICK / OHLC / WATERFALL ---
  if (type === 'candlestick' || type === 'ohlc' || type === 'waterfall') {
    return (
      <div className="w-full h-full p-3 flex flex-col justify-between min-w-0 overflow-hidden">
        <div className="flex justify-between items-center gap-2 text-xs text-slate-300 min-w-0">
          <span className="font-semibold uppercase tracking-wider truncate min-w-0">
            {(type || 'CHART').toUpperCase()} {t('analyticsViewSuffix')}
          </span>
          <span className="text-emerald-400 font-bold shrink-0">{t('analyticsLiveFeed')}</span>
        </div>
        <div className="flex items-end justify-around gap-1.5 h-36 border-b border-slate-700/60 pb-2 overflow-x-auto no-scrollbar" dir="ltr">
          {processed.slice(0, 10).map((pt, idx) => {
            const isUp = idx % 2 === 0;
            return (
              <div key={idx} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-0.5 h-6 bg-slate-500" />
                <div
                  className={`w-4 h-12 rounded ${isUp ? 'bg-emerald-500 border border-emerald-300' : 'bg-rose-500 border border-rose-300'}`}
                />
                <div className="w-0.5 h-6 bg-slate-500" />
                <span className="text-[9px] text-slate-400 truncate max-w-[36px]" dir="auto">{pt.x}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-3 sm:p-4 flex flex-col justify-center text-slate-300 min-w-0 overflow-hidden">
      <span className="font-bold text-sm truncate" dir="auto">{config.title || t('analyticsCardDefault')}</span>
      <span className="text-2xl font-black text-white mt-2 truncate tabular-nums" dir="ltr">{formattedVal}</span>
    </div>
  );
};
