import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
  Plugin,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  ForecastConfidenceLevel,
  ForecastHistoricalPoint,
  ForecastPredictedPoint,
  ForecastScenarioRecord,
} from '../../types/forecast';
import { useLanguage } from '../../i18n/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Props {
  historicalData: ForecastHistoricalPoint[];
  predictedData: ForecastPredictedPoint[];
  confidenceLevel: ForecastConfidenceLevel;
  activeScenario?: ForecastScenarioRecord | null;
  historyWindow?: 'all' | '30' | '90';
  compact?: boolean;
  valuePrefix?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  heightClass?: string;
}

function formatAxisNumber(value: number, prefix = ''): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${prefix}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${prefix}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${prefix}${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export const ForecastChart: React.FC<Props> = ({
  historicalData,
  predictedData,
  confidenceLevel,
  activeScenario,
  historyWindow = 'all',
  compact = false,
  valuePrefix = '',
  xAxisLabel,
  yAxisLabel,
  heightClass = 'h-[360px]',
}) => {
  const { t } = useLanguage();

  const slicedHistory = useMemo(() => {
    if (historyWindow === '30' && historicalData.length > 30) {
      return historicalData.slice(-30);
    }
    if (historyWindow === '90' && historicalData.length > 90) {
      return historicalData.slice(-90);
    }
    return historicalData;
  }, [historicalData, historyWindow]);

  const splitIndex = Math.max(0, slicedHistory.length - 1);

  const { chartData, boundaryLabel } = useMemo(() => {
    const histLabels = slicedHistory.map((p) => p.date);
    const predLabels = predictedData.map((p) => p.date);
    const labels = [...histLabels, ...predLabels];

    const histLen = slicedHistory.length;
    const predLen = predictedData.length;
    const totalLen = histLen + predLen;

    const historicalSeries: Array<number | null> = [
      ...slicedHistory.map((p) => p.value),
      ...new Array(predLen).fill(null),
    ];

    const lastHistValue = histLen > 0 ? slicedHistory[histLen - 1].value : null;

    // Connect baseline forecast seamlessly from the last historical point
    const forecastSeries: Array<number | null> = new Array(totalLen).fill(null);
    const lowerBand: Array<number | null> = new Array(totalLen).fill(null);
    const upperBand: Array<number | null> = new Array(totalLen).fill(null);

    if (histLen > 0 && predLen > 0) {
      forecastSeries[histLen - 1] = lastHistValue;
      lowerBand[histLen - 1] = lastHistValue;
      upperBand[histLen - 1] = lastHistValue;
    }

    const lowKey = `lower${confidenceLevel}` as 'lower80' | 'lower90' | 'lower95';
    const upKey = `upper${confidenceLevel}` as 'upper80' | 'upper90' | 'upper95';

    predictedData.forEach((pt, idx) => {
      const targetIdx = histLen + idx;
      forecastSeries[targetIdx] = pt.value;
      lowerBand[targetIdx] = pt[lowKey];
      upperBand[targetIdx] = pt[upKey];
    });

    const datasets: ChartData<'line'>['datasets'] = [
      {
        label: t('fcLegendLowerBound', { pct: confidenceLevel }),
        data: lowerBand,
        borderColor: 'rgba(2, 132, 199, 0.22)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [2, 3],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.22,
        fill: false,
      },
      {
        label: t('fcLegendConfidenceBand', { pct: confidenceLevel }),
        data: upperBand,
        borderColor: 'rgba(2, 132, 199, 0.22)',
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        borderWidth: 1,
        borderDash: [2, 3],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.22,
        fill: '-1',
      },
      {
        label: t('fcLegendHistorical'),
        data: historicalSeries,
        borderColor: '#0F172A',
        backgroundColor: '#0F172A',
        borderWidth: compact ? 2 : 2.5,
        pointRadius: slicedHistory.length > 60 ? 0 : 2.5,
        pointHoverRadius: 5,
        tension: 0.2,
        fill: false,
      },
      {
        label: t('fcLegendForecast'),
        data: forecastSeries,
        borderColor: '#0284C7',
        backgroundColor: '#0284C7',
        borderWidth: compact ? 2 : 2.5,
        borderDash: [6, 4],
        pointRadius: predictedData.length > 60 ? 0 : 3,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#0284C7',
        pointBorderWidth: 2,
        pointHoverRadius: 5,
        tension: 0.22,
        fill: false,
      },
    ];

    if (activeScenario?.scenarioResults?.predictedData?.length) {
      const scenarioByDate = new Map<string, number>();
      for (const spt of activeScenario.scenarioResults.predictedData) {
        if (spt?.date && Number.isFinite(Number(spt.value))) {
          scenarioByDate.set(spt.date, Number(spt.value));
        }
      }
      const scenarioSeries: Array<number | null> = new Array(totalLen).fill(null);
      let hasMatchedDate = false;
      predictedData.forEach((pt, idx) => {
        const sVal = scenarioByDate.get(pt.date);
        if (sVal !== undefined) {
          scenarioSeries[histLen + idx] = sVal;
          hasMatchedDate = true;
        }
      });
      if (hasMatchedDate) {
        if (histLen > 0) {
          scenarioSeries[histLen - 1] = lastHistValue;
        }
        datasets.push({
          label: `${t('fcScenarioPrefix')}: ${activeScenario.name}`,
          data: scenarioSeries,
          borderColor: '#10B981',
          backgroundColor: '#10B981',
          borderWidth: 2.25,
          borderDash: [4, 3],
          pointRadius: predictedData.length > 60 ? 0 : 2.5,
          pointHoverRadius: 5,
          tension: 0.22,
          fill: false,
        });
      }
    }

    return {
      chartData: { labels, datasets } as ChartData<'line'>,
      boundaryLabel: t('fcChartForecastStart'),
    };
  }, [slicedHistory, predictedData, confidenceLevel, activeScenario, compact, t]);

  const boundaryPlugin: Plugin<'line'> = useMemo(
    () => ({
      id: `forecastBoundary_${splitIndex}_${boundaryLabel}`,
      afterDatasetsDraw(chart) {
        if (splitIndex <= 0 || !predictedData.length) return;
        const meta = chart.getDatasetMeta(2); // Historical line
        const pt = meta?.data?.[splitIndex];
        if (!pt) return;
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)';
        ctx.lineWidth = 1.25;
        ctx.moveTo(pt.x, chartArea.top);
        ctx.lineTo(pt.x, chartArea.bottom);
        ctx.stroke();

        if (!compact) {
          ctx.fillStyle = '#475569';
          ctx.font = '600 10px system-ui, sans-serif';
          ctx.textAlign = 'left';
          const textX = Math.min(pt.x + 6, chartArea.right - 85);
          ctx.fillText(boundaryLabel, textX, chartArea.top + 12);
        }
        ctx.restore();
      },
    }),
    [splitIndex, predictedData.length, compact, boundaryLabel],
  );

  const resolvedXTitle = xAxisLabel || t('fcAxisDateLabel');
  const resolvedYTitle = yAxisLabel || t('fcAxisValueLabel');
  const histLabel = t('fcChartPeriodHistorical');
  const predLabel = t('fcChartPeriodForecast');

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: compact ? false : { duration: 250 },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'start',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            font: { size: compact ? 10 : 11, weight: 'bold' },
            color: '#475569',
            filter: (item) => item.datasetIndex !== 0,
          },
        },
        tooltip: {
          backgroundColor: '#0F172A',
          titleColor: '#F8FAFC',
          bodyColor: '#E2E8F0',
          padding: 10,
          cornerRadius: 10,
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              const phase = idx > splitIndex ? predLabel : histLabel;
              return `${items[0].label} · ${phase}`;
            },
            label: (ctx) => {
              const val = ctx.parsed.y;
              if (val === null || val === undefined) return '';
              // Hide duplicate lower-bound line from tooltip when upper interval renders both
              if (ctx.datasetIndex === 0) return '';
              if (ctx.datasetIndex === 1) {
                const lowRaw = ctx.chart.data.datasets[0]?.data?.[ctx.dataIndex];
                const lowNum = typeof lowRaw === 'number' ? lowRaw : val;
                return `${ctx.dataset.label}: ${valuePrefix}${Number(lowNum).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} – ${valuePrefix}${Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
              }
              return `${ctx.dataset.label}: ${valuePrefix}${Number(val).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          title: {
            display: !compact,
            text: resolvedXTitle,
            color: '#64748B',
            font: { size: 11, weight: 'bold' },
            padding: { top: 6 },
          },
          ticks: {
            color: '#64748B',
            font: { size: compact ? 9 : 11 },
            maxTicksLimit: compact ? 6 : 10,
            maxRotation: 0,
          },
        },
        y: {
          grid: { color: '#F1F5F9' },
          title: {
            display: !compact,
            text: resolvedYTitle,
            color: '#64748B',
            font: { size: 11, weight: 'bold' },
            padding: { bottom: 6 },
          },
          ticks: {
            color: '#64748B',
            font: { size: compact ? 9 : 11 },
            callback: (val) => formatAxisNumber(Number(val), valuePrefix),
          },
        },
      },
    }),
    [compact, valuePrefix, splitIndex, histLabel, predLabel, resolvedXTitle, resolvedYTitle],
  );

  if (historicalData.length === 0 && predictedData.length === 0) {
    return (
      <div className={`w-full ${heightClass} flex items-center justify-center text-xs text-slate-400`}>
        {t('fcNoChartData')}
      </div>
    );
  }

  return (
    <div className={`w-full ${heightClass} relative`} dir="ltr">
      <Line data={chartData} options={options} plugins={[boundaryPlugin]} />
    </div>
  );
};
