import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { WidgetConfig, Dataset, DataFilter } from '../../../types/dashboard';
import { DataModelState } from '../../../types/dataModel';
import { processWidgetData } from '../../../utils/dataProcessor';
import { hasActiveDataModel, queryWidgetData } from '../../../utils/semanticQueryEngine';
import { useLanguage } from '../../../i18n/LanguageContext';

interface Props {
  type: string;
  config: WidgetConfig;
  dataset?: Dataset;
  dataModel?: DataModelState;
  datasets?: Dataset[];
  globalFilters?: DataFilter[];
}

export const Plotly3DRenderer: React.FC<Props> = ({ type, config, dataset, dataModel, datasets, globalFilters }) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  // With a Data Model the query is resolved through it (joins, relationship filters, measures);
  // without one, the single-dataset processor is used.
  const modelResult = hasActiveDataModel(dataModel)
    ? queryWidgetData({ config, dataset, dataModel, datasets, globalFilters })
    : null;
  const processed = modelResult
    ? modelResult.data
    : processWidgetData(
        dataset,
        config.xAxisField,
        config.yAxisField,
        config.aggregation,
        config.zAxisField,
        config.secondaryField,
        config.numberFormat,
        config.currencySymbol,
        globalFilters
      );

  const xAxisFallback = t('plotly3dXAxis');
  const yAxisFallback = t('plotly3dYAxis');
  const zAxisFallback = t('plotly3dZAxis');

  useEffect(() => {
    if (!containerRef.current || processed.length === 0) return;

    // Extract X, Y, Z numerical arrays
    const xVals: number[] = [];
    const yVals: number[] = [];
    const zVals: number[] = [];

    processed.forEach((pt, i) => {
      const xNum = typeof pt.x === 'number' ? pt.x : i * 2;
      const yNum = pt.y;
      const zNum = pt.z ?? pt.y;
      xVals.push(xNum);
      yVals.push(yNum);
      zVals.push(zNum);
    });

    const plotData: Plotly.Data[] = [];

    const isDarkBg = (hex?: string) => {
      if (!hex) return false;
      const clean = hex.replace('#', '');
      if (clean.length !== 6) return false;
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    };

    const isDark = config.backgroundColor ? isDarkBg(config.backgroundColor) : false;
    const fontColor = isDark ? '#CBD5E1' : '#334155';
    const gridColor = isDark ? '#334155' : '#E2E8F0';
    const zeroColor = isDark ? '#475569' : '#CBD5E1';

    const layout: Partial<Plotly.Layout> = {
      autosize: true,
      margin: { l: 0, r: 0, b: 0, t: 10 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: fontColor, size: 10 },
      scene: {
        xaxis: { title: config.xAxisField || xAxisFallback, gridcolor: gridColor, zerolinecolor: zeroColor },
        yaxis: { title: config.yAxisField || yAxisFallback, gridcolor: gridColor, zerolinecolor: zeroColor },
        zaxis: { title: config.zAxisField || zAxisFallback, gridcolor: gridColor, zerolinecolor: zeroColor },
        camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } },
      },
    };

    const plotlyOptions: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: false,
    };

    // --- 3D SCATTER / BUBBLE3D ---
    if (type === 'scatter3d' || type === 'bubble3d') {
      plotData.push({
        type: 'scatter3d',
        mode: 'markers',
        x: xVals,
        y: yVals,
        z: zVals,
        marker: {
          size: type === 'bubble3d' ? zVals.map((z) => Math.max(5, z / 2)) : 6,
          color: zVals,
          colorscale: 'Viridis',
          opacity: 0.8,
        },
      });
    }

    // --- 3D SURFACE3D / CONTOUR3D ---
    else if (type === 'surface3d' || type === 'contour3d') {
      // Reconstruct 2D matrix Z grid
      const gridSize = Math.floor(Math.sqrt(xVals.length)) || 5;
      const zMatrix: number[][] = [];
      for (let i = 0; i < gridSize; i++) {
        const row: number[] = [];
        for (let j = 0; j < gridSize; j++) {
          row.push(zVals[i * gridSize + j] ?? 10);
        }
        zMatrix.push(row);
      }

      plotData.push({
        type: 'surface',
        z: zMatrix,
        colorscale: 'Plasma',
        showscale: false,
      });
    }

    // --- 3D LINE3D ---
    else if (type === 'line3d') {
      plotData.push({
        type: 'scatter3d',
        mode: 'lines+markers',
        x: xVals,
        y: yVals,
        z: zVals,
        line: { width: 6, color: '#38BDF8' },
        marker: { size: 4, color: '#F59E0B' },
      });
    }

    // --- 3D MESH3D / BAR3D / VOLUME3D / CONE3D / STREAMTUBE3D / ISOSURFACE3D ---
    else if (type === 'mesh3d' || type === 'bar3d' || type === 'isosurface3d') {
      plotData.push({
        type: 'mesh3d',
        x: xVals,
        y: yVals,
        z: zVals,
        color: '#8B5CF6',
        opacity: 0.75,
      });
    } else {
      // General 3D Scatter representation
      plotData.push({
        type: 'scatter3d',
        mode: 'markers',
        x: xVals,
        y: yVals,
        z: zVals,
        marker: { size: 7, color: zVals, colorscale: 'Cyan2dark' },
      });
    }

    Plotly.newPlot(containerRef.current, plotData, layout, plotlyOptions);

    return () => {
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [type, config, processed, xAxisFallback, yAxisFallback, zAxisFallback]);

  if (modelResult?.error && processed.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-amber-50/70 border border-dashed border-amber-200/90 rounded-xl select-none">
        <p className="text-xs font-bold text-amber-900">{t('chartModelNotice')}</p>
        <p className="text-[11px] text-amber-700 mt-1 max-w-[240px] leading-snug" dir="auto">{modelResult.error}</p>
      </div>
    );
  }

  if ((!modelResult && (!dataset || !dataset.data || dataset.data.length === 0)) || processed.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
        <p className="text-xs font-bold text-slate-700">{t('plotly3dNoData')}</p>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
          {t('plotly3dNoDataDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden min-w-0 min-h-0" dir="ltr">
      <div ref={containerRef} className="w-full h-full min-h-[140px]" />
    </div>
  );
};
