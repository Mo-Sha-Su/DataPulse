import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Bar, Line, Pie, Scatter, Bubble } from 'react-chartjs-2';
import { WidgetConfig, Dataset, DataFilter } from '../../../types/dashboard';
import { DataModelState } from '../../../types/dataModel';
import { queryWidgetData } from '../../../utils/semanticQueryEngine';
import { Network, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  type: string;
  config: WidgetConfig;
  dataset?: Dataset;
  dataModel?: DataModelState;
  datasets?: Dataset[];
  globalFilters?: DataFilter[];
}

const DEFAULT_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', 
  '#06B6D4', '#F97316', '#6366F1', '#14B8A6', '#EAB308'
];

const isDarkBg = (hex?: string) => {
  if (!hex) return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

export const StandardChartRenderer: React.FC<Props> = ({
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
        <span className="text-xs font-bold text-amber-900">{t('chartModelNotice')}</span>
        <span className="text-[11px] text-amber-700 mt-1 max-w-[240px] leading-snug" dir="auto">
          {queryResult.error}
        </span>
      </div>
    );
  }

  if (processed.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 select-none">
        <AlertCircle className="w-5 h-5 text-slate-400 mb-1" />
        <span className="text-xs font-bold text-slate-600">{t('chartNoDataMapped')}</span>
        <span className="text-[10px] text-slate-400 max-w-[200px] mt-0.5">
          {t('chartNoDataMappedDesc')}
        </span>
      </div>
    );
  }

  const labels = processed.map((p) => String(p.x));
  const dataValues = processed.map((p) => p.y);

  const colors = config.colorPalette && config.colorPalette.length > 0
    ? config.colorPalette
    : DEFAULT_PALETTE;

  const isDark = config.backgroundColor ? isDarkBg(config.backgroundColor) : false;
  const textColor = isDark ? '#E2E8F0' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const baseOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        display: ['pie', 'bubble', 'scatter'].includes(type),
        position: 'top',
        labels: {
          color: textColor,
          font: { family: 'sans-serif', size: 11 },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#0F172A',
        titleColor: '#F8FAFC',
        bodyColor: '#38BDF8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const rawVal = context.raw;
            if (typeof rawVal === 'object' && rawVal !== null) {
              return `${t('chartValuePrefix')} ${rawVal.y ?? rawVal.r ?? JSON.stringify(rawVal)}`;
            }
            const idx = context.dataIndex;
            return `${t('chartValuePrefix')} ${processed[idx]?.formattedY || rawVal}`;
          },
        },
      },
    },
    scales: ['pie', 'donut'].includes(type)
      ? undefined
      : {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 10 } },
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 10 } },
          },
        },
  };

  if (!processed || processed.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
        <p className="text-sm font-medium">{t('chartNoDataMapped')}</p>
        <p className="text-xs text-slate-500 mt-1">{t('chartNoDataMappedDesc')}</p>
      </div>
    );
  }

  // --- BAR & HISTOGRAM ---
  if (type === 'bar' || type === 'histogram') {
    const barData: ChartData<'bar'> = {
      labels,
      datasets: [
        {
          label: config.yAxisField || 'Value',
          data: dataValues,
          backgroundColor: colors.map((c) => c),
          borderColor: colors.map((c) => c),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    const barOptions = {
      ...baseOptions,
      indexAxis: config.horizontal ? ('y' as const) : ('x' as const),
    };

    return (
      <div className="w-full h-full min-w-0 min-h-0 relative">
        <Bar data={barData} options={barOptions} />
      </div>
    );
  }

  // --- LINE CHART ---
  if (type === 'line') {
    const lineData: ChartData<'line'> = {
      labels,
      datasets: [
        {
          label: config.yAxisField || 'Value',
          data: dataValues,
          borderColor: config.primaryColor || colors[0],
          backgroundColor: `${config.primaryColor || colors[0]}22`,
          fill: true,
          tension: config.smoothLines ? 0.4 : 0,
          pointRadius: config.showMarkers ? 4 : 0,
          pointHoverRadius: 6,
          pointBackgroundColor: config.primaryColor || colors[0],
        },
      ],
    };

    return (
      <div className="w-full h-full min-w-0 min-h-0 relative">
        <Line data={lineData} options={baseOptions} />
      </div>
    );
  }

  // --- PIE / DONUT ---
  if (type === 'pie') {
    const pieData: ChartData<'pie'> = {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: colors,
          borderColor: '#1E293B',
          borderWidth: 2,
        },
      ],
    };

    const pieOptions = {
      ...baseOptions,
      cutout: config.donutStyle ? '65%' : 0,
    };

    return (
      <div className="w-full h-full min-w-0 min-h-0 relative">
        <Pie data={pieData} options={pieOptions} />
      </div>
    );
  }

  // --- SCATTER ---
  if (type === 'scatter') {
    const scatterPoints = processed.map((p, i) => ({
      x: typeof p.x === 'number' ? p.x : i + 1,
      y: p.y,
    }));

    const scatterData: ChartData<'scatter'> = {
      datasets: [
        {
          label: `${config.xAxisField} vs ${config.yAxisField}`,
          data: scatterPoints,
          backgroundColor: config.primaryColor || colors[0],
          pointRadius: 6,
        },
      ],
    };

    return (
      <div className="w-full h-full min-w-0 min-h-0 relative">
        <Scatter data={scatterData} options={baseOptions} />
      </div>
    );
  }

  // --- BUBBLE ---
  if (type === 'bubble') {
    const bubblePoints = processed.map((p, i) => ({
      x: typeof p.x === 'number' ? p.x : i + 1,
      y: p.y,
      r: Math.max(4, Math.min(25, (p.z ?? 10) / 2)),
    }));

    const bubbleData: ChartData<'bubble'> = {
      datasets: [
        {
          label: config.yAxisField || 'Bubbles',
          data: bubblePoints,
          backgroundColor: colors.map((c) => `${c}AA`),
          borderColor: colors.map((c) => c),
        },
      ],
    };

    return (
      <div className="w-full h-full min-w-0 min-h-0 relative">
        <Bubble data={bubbleData} options={baseOptions} />
      </div>
    );
  }

  // --- HEATMAP & BOXPLOT FALLBACK / CUSTOM RENDERING ---
  if (type === 'heatmap') {
    return (
      <div className="w-full h-full p-2 flex flex-col justify-start overflow-y-auto min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {processed.slice(0, 16).map((pt, idx) => {
            const opacity = Math.min(1, Math.max(0.15, (pt.y / (dataValues.reduce((a, b) => Math.max(a, b), 1) || 1))));
            return (
              <div
                key={idx}
                className="min-h-[44px] min-w-0 rounded flex flex-col items-center justify-center text-xs p-1.5 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: config.primaryColor || '#3B82F6',
                  opacity,
                  color: '#FFFFFF',
                }}
                title={`${pt.x}: ${pt.formattedY}`}
              >
                <span className="font-semibold text-[10px] truncate max-w-full">{pt.x}</span>
                <span className="text-[11px] font-bold truncate max-w-full tabular-nums">{pt.formattedY}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'boxplot') {
    // Elegant boxplot representation using styled bars and ranges
    const sortedVals = [...dataValues].sort((a, b) => a - b);
    const min = sortedVals[0] || 0;
    const max = sortedVals[sortedVals.length - 1] || 100;
    const q1 = sortedVals[Math.floor(sortedVals.length * 0.25)] || min;
    const median = sortedVals[Math.floor(sortedVals.length * 0.5)] || (min + max) / 2;
    const q3 = sortedVals[Math.floor(sortedVals.length * 0.75)] || max;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 text-slate-200 min-w-0 overflow-hidden">
        <p className="text-xs text-slate-400 mb-2 truncate max-w-full">{t('chartBoxWhiskerTitle')}</p>
        <div className="w-full max-w-xs space-y-3 bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 min-w-0">
          <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-400">
            <span>{t('chartBoxMin')}: <span dir="ltr" className="tabular-nums">{min}</span></span>
            <span className="text-amber-400 font-bold">{t('chartBoxMedian')}: <span dir="ltr" className="tabular-nums">{median}</span></span>
            <span>{t('chartBoxMax')}: <span dir="ltr" className="tabular-nums">{max}</span></span>
          </div>
          <div className="relative h-6 bg-slate-800 rounded flex items-center px-2 overflow-hidden">
            <div className="absolute left-1/4 right-1/4 h-4 bg-indigo-600/80 rounded border border-indigo-400 flex items-center justify-center px-1.5 text-[10px] font-mono text-white overflow-hidden">
              <span className="truncate" dir="ltr">Q1–Q3 ({q1} – {q3})</span>
            </div>
            <div className="absolute left-1/2 w-0.5 h-full bg-amber-400 z-10" title={`${t('chartBoxMedian')}: ${median}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-w-0 min-h-0 relative">
      <Bar data={{ labels, datasets: [{ data: dataValues, backgroundColor: colors }] }} options={baseOptions} />
    </div>
  );
};
