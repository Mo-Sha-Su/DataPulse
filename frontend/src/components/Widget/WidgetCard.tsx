import React, { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { Widget, Dataset, CanvasSettings, DataFilter } from '../../types/dashboard';
import { StandardChartRenderer } from './WidgetRenderers/StandardChartRenderer';
import { AnalyticsRenderer } from './WidgetRenderers/AnalyticsRenderer';
import { DataModelState } from '../../types/dataModel';
import { ErrorBoundary } from '../ErrorBoundary';
import { TextBoxRenderer } from './WidgetRenderers/TextBoxRenderer';
import { ForecastWidgetRenderer } from './WidgetRenderers/ForecastWidgetRenderer';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Move,
  Settings,
  Copy,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  MoreVertical,
  Layers,
} from 'lucide-react';

// 3D charts pull in Plotly (~3.5 MB); load it only when a 3D widget is actually on screen.
const Plotly3DRenderer = lazy(() =>
  import('./WidgetRenderers/Plotly3DRenderer').then((m) => ({ default: m.Plotly3DRenderer }))
);

interface Props {
  widget: Widget;
  datasets: Dataset[];
  canvas: CanvasSettings;
  globalFilters?: DataFilter[];
  dataModel?: DataModelState;
  isSelected: boolean;
  isConfiguring?: boolean;
  isPreviewMode?: boolean;
  onSelect: (widgetId: string) => void;
  onUpdatePosition: (widgetId: string, x: number, y: number, width: number, height: number) => void;
  onDuplicate: (widgetId: string) => void;
  onDelete: (widgetId: string) => void;
  onOpenConfig: (widgetId: string) => void;
}

export const WidgetCard: React.FC<Props> = ({
  widget,
  datasets,
  canvas,
  globalFilters,
  dataModel,
  isSelected,
  isConfiguring = false,
  isPreviewMode = false,
  onSelect,
  onUpdatePosition,
  onDuplicate,
  onDelete,
  onOpenConfig,
}) => {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const startMouseRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: widget.position.x, y: widget.position.y, w: widget.position.width, h: widget.position.height });

  const activeDataset = datasets.find((d) => d.id === widget.config.datasetId) || datasets[0];

  // Grid Snapping
  const snap = (val: number) => {
    if (!canvas.snapToGrid || canvas.gridGap <= 0) return val;
    return Math.round(val / canvas.gridGap) * canvas.gridGap;
  };

  // Dragging logic
  const handleMouseDownMove = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    onSelect(widget.id);

    isDraggingRef.current = true;
    startMouseRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = {
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.width,
      h: widget.position.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      requestAnimationFrame(() => {
        const dx = (moveEvent.clientX - startMouseRef.current.x) / canvas.zoom;
        const dy = (moveEvent.clientY - startMouseRef.current.y) / canvas.zoom;

        const newX = Math.max(0, snap(startPosRef.current.x + dx));
        const newY = Math.max(0, snap(startPosRef.current.y + dy));

        onUpdatePosition(widget.id, newX, newY, startPosRef.current.w, startPosRef.current.h);
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resizing logic
  const handleMouseDownResize = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    onSelect(widget.id);

    isResizingRef.current = true;
    startMouseRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = {
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.width,
      h: widget.position.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      requestAnimationFrame(() => {
        const dx = (moveEvent.clientX - startMouseRef.current.x) / canvas.zoom;
        const dy = (moveEvent.clientY - startMouseRef.current.y) / canvas.zoom;

        const newW = Math.max(220, snap(startPosRef.current.w + dx));
        const newH = Math.max(140, snap(startPosRef.current.h + dy));

        onUpdatePosition(widget.id, startPosRef.current.x, startPosRef.current.y, newW, newH);
      });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Render internal component by category
  const renderContent = () => {
    if (widget.type === 'textbox') {
      return (
        <TextBoxRenderer
          config={widget.config}
          isPreviewMode={isPreviewMode}
        />
      );
    }
    if (widget.type === 'forecast') {
      return (
        <ForecastWidgetRenderer
          config={widget.config}
          datasets={datasets}
          isPreviewMode={isPreviewMode}
        />
      );
    }
    if (widget.category === 'charts') {
      return (
        <StandardChartRenderer
          type={widget.type}
          config={widget.config}
          dataset={activeDataset}
          dataModel={dataModel}
          datasets={datasets}
          globalFilters={globalFilters}
        />
      );
    }
    if (widget.category === 'analytics') {
      return (
        <AnalyticsRenderer
          type={widget.type}
          config={widget.config}
          dataset={activeDataset}
          dataModel={dataModel}
          datasets={datasets}
          globalFilters={globalFilters}
        />
      );
    }
    if (widget.category === '3d') {
      return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-xs text-slate-400">{t('widgetLoading3d')}</div>}>
          <Plotly3DRenderer
            type={widget.type}
            config={widget.config}
            dataset={activeDataset}
          dataModel={dataModel}
          datasets={datasets}
            globalFilters={globalFilters}
          />
        </Suspense>
      );
    }
    return null;
  };

  const isTextBox = widget.type === 'textbox';
  const showHeader = !isPreviewMode || !isTextBox;
  const isTransparent = widget.config.backgroundColor === 'transparent';

  return (
    <div
      ref={cardRef}
      onClick={(e) => {
        if (!isPreviewMode) {
          e.stopPropagation();
          onSelect(widget.id);
        }
      }}
      style={{
        position: 'absolute',
        left: `${widget.position.x}px`,
        top: `${widget.position.y}px`,
        width: `${widget.position.width}px`,
        height: `${widget.position.height}px`,
        zIndex: !isPreviewMode && isSelected ? 999 : widget.position.zIndex,
        backgroundColor: isTransparent ? 'transparent' : (widget.config.backgroundColor || '#FFFFFF'),
      }}
      className={`group rounded-xl border transition-all flex flex-col overflow-hidden ${
        isPreviewMode
          ? isTransparent || (isTextBox && isTransparent)
            ? 'border-transparent shadow-none'
            : 'border-slate-200/80 shadow-md'
          : isSelected
          ? 'border-[#0284C7] ring-2 ring-sky-500/40 shadow-2xl'
          : isTransparent
          ? 'border-dashed border-slate-300 hover:border-sky-500 shadow-xs'
          : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Widget Header Bar */}
      {showHeader && (
        <div
          onMouseDown={handleMouseDownMove}
          className={`h-9 px-3 flex items-center justify-between border-b select-none ${
            isTransparent ? 'border-slate-200/40' : 'border-slate-100'
          } ${
            isPreviewMode ? 'bg-slate-50/50' : 'bg-slate-50/90 cursor-move'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {!isPreviewMode && (
              <Move className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
            )}
            <span
              className="text-xs font-bold truncate"
              dir="auto"
              style={{ color: widget.config.titleColor || '#0F172A' }}
            >
              {widget.config.title || widget.title}
            </span>
          </div>

          {/* Action Controls (Hidden in Preview Mode) */}
          {!isPreviewMode && (
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenConfig(widget.id);
                }}
                title={isConfiguring ? t('widgetCloseConfigTip') : t('widgetOpenConfigTip')}
                aria-label={isConfiguring ? t('widgetCloseConfigTip') : t('widgetOpenConfigTip')}
                className={`p-1 rounded transition-all cursor-pointer ${
                  isConfiguring
                    ? 'text-sky-600 bg-sky-100 ring-1 ring-sky-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-sky-600 hover:bg-slate-200/60'
                }`}
              >
                <Settings className={`w-3.5 h-3.5 ${isConfiguring ? 'animate-spin-slow text-sky-600' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(widget.id);
                }}
                title={t('widgetDuplicateTitle')}
                aria-label={t('widgetDuplicateTitle')}
                className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(widget.id);
                }}
                title={t('widgetDeleteTitle')}
                aria-label={t('widgetDeleteTitle')}
                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="ps-1 text-sky-500/80" title={t('widgetMoveHandleTip')}>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widget Body Workspace */}
      <div className="flex-1 p-2 min-h-0 min-w-0 relative overflow-hidden">
        <ErrorBoundary variant="inline" resetKey={widget.id + JSON.stringify(widget.config).length}>
          {renderContent()}
        </ErrorBoundary>
      </div>

      {/* Bottom-Right Diagonal Resize Handle (Hidden in Preview Mode) */}
      {!isPreviewMode && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-1 right-1 w-5 h-5 flex items-center justify-center cursor-se-resize text-sky-500/80 hover:text-sky-600 opacity-60 group-hover:opacity-100 transition-opacity"
          title={t('widgetResizeTip')}
        >
          <ArrowDownRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
