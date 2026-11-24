import React, { useRef, useState, useEffect } from 'react';
import { Widget, Dataset, CanvasSettings, DataFilter, ReportPage } from '../../types/dashboard';
import { WidgetCard } from '../Widget/WidgetCard';
import { DataModelState } from '../../types/dataModel';
import { getCanvasDimensionsFromSettings } from '../../utils/reportPageDimensions';
import { Maximize2, Sliders, Check, X, Lock, Unlock, BarChart3 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
  widgets: Widget[];
  datasets: Dataset[];
  canvas: CanvasSettings;
  pages?: ReportPage[];
  activePageId?: string;
  globalFilters?: DataFilter[];
  dataModel?: DataModelState;
  selectedWidgetId: string | null;
  configuringWidgetId?: string | null;
  isPreviewMode?: boolean;
  onSelectWidget: (widgetId: string | null) => void;
  onUpdateWidgetPosition: (widgetId: string, x: number, y: number, width: number, height: number) => void;
  onDuplicateWidget: (widgetId: string) => void;
  onDeleteWidget: (widgetId: string) => void;
  onOpenWidgetConfig: (widgetId: string) => void;
  onUpdateCanvas?: (updatedCanvas: Partial<CanvasSettings>) => void;
}

export const CanvasWorkspace: React.FC<Props> = ({
  widgets,
  datasets,
  canvas,
  pages = [],
  activePageId,
  globalFilters,
  dataModel,
  selectedWidgetId,
  configuringWidgetId,
  isPreviewMode = false,
  onSelectWidget,
  onUpdateWidgetPosition,
  onDuplicateWidget,
  onDeleteWidget,
  onOpenWidgetConfig,
  onUpdateCanvas,
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive canvas dimensions and printable page margins
  const { widthPx, heightPx, marginsPx } = getCanvasDimensionsFromSettings(canvas);

  // Interactive manual canvas resizing state
  const [resizingEdge, setResizingEdge] = useState<'right' | 'bottom' | 'corner' | null>(null);
  const [liveSize, setLiveSize] = useState<{ width: number; height: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number }>({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  // Quick In-Canvas Manual Size Dialog
  const [isQuickSizeOpen, setIsQuickSizeOpen] = useState(false);
  const [quickWidth, setQuickWidth] = useState(widthPx);
  const [quickHeight, setQuickHeight] = useState(heightPx);
  const [quickLockRatio, setQuickLockRatio] = useState(false);

  useEffect(() => {
    setQuickWidth(widthPx);
    setQuickHeight(heightPx);
  }, [widthPx, heightPx]);

  const activeWidth = liveSize ? liveSize.width : widthPx;
  const activeHeight = liveSize ? liveSize.height : heightPx;

  // Filter widgets belonging to current active page
  const activeWidgets = widgets.filter((w) => {
    if (!activePageId) return true;
    if (!w.pageId) {
      const firstPageId = pages && pages.length > 0 ? pages[0].id : null;
      return !firstPageId || activePageId === firstPageId;
    }
    return w.pageId === activePageId;
  });

  // Dynamic Background Style
  const getBackgroundStyle = (): React.CSSProperties => {
    if (canvas.backgroundType === 'gradient') {
      return { background: canvas.gradientValue };
    }
    if (canvas.backgroundType === 'image' && canvas.imageUrl) {
      return {
        backgroundImage: `url(${canvas.imageUrl})`,
        backgroundSize: canvas.imageFit,
        backgroundRepeat: canvas.imageFit === 'tile' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
      };
    }
    return { backgroundColor: canvas.backgroundColor || '#FFFFFF' };
  };

  const effectivePageId = activePageId || (pages && pages[0]?.id) || 'p_1';

  // Manual interactive drag resizing handlers
  const handleStartResize = (e: React.MouseEvent, edge: 'right' | 'bottom' | 'corner') => {
    if (isPreviewMode || !onUpdateCanvas) return;
    e.stopPropagation();
    e.preventDefault();

    setResizingEdge(edge);
    setLiveSize({ width: widthPx, height: heightPx });
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: widthPx,
      startHeight: heightPx,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const zoom = canvas.zoom || 1;
      const dx = (moveEvent.clientX - resizeStartRef.current.startX) / zoom;
      const dy = (moveEvent.clientY - resizeStartRef.current.startY) / zoom;

      let newW = resizeStartRef.current.startWidth;
      let newH = resizeStartRef.current.startHeight;

      if (edge === 'right' || edge === 'corner') {
        newW = Math.max(400, Math.min(8000, Math.round(resizeStartRef.current.startWidth + dx)));
        if (canvas.snapToGrid && canvas.gridGap > 0) {
          newW = Math.round(newW / canvas.gridGap) * canvas.gridGap;
        }
      }

      if (edge === 'bottom' || edge === 'corner') {
        newH = Math.max(300, Math.min(8000, Math.round(resizeStartRef.current.startHeight + dy)));
        if (canvas.snapToGrid && canvas.gridGap > 0) {
          newH = Math.round(newH / canvas.gridGap) * canvas.gridGap;
        }
      }

      setLiveSize({ width: newW, height: newH });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setResizingEdge(null);

      setLiveSize((finalSize) => {
        if (finalSize && (finalSize.width !== widthPx || finalSize.height !== heightPx)) {
          onUpdateCanvas({
            width: finalSize.width,
            height: finalSize.height,
            pageSizePreset: 'Custom Size',
            presetName: `Custom (${finalSize.width}×${finalSize.height})`,
          });
        }
        return null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleApplyQuickSize = () => {
    if (!onUpdateCanvas) return;
    const w = Math.max(400, Math.min(8000, Math.round(quickWidth)));
    const h = Math.max(300, Math.min(8000, Math.round(quickHeight)));
    onUpdateCanvas({
      width: w,
      height: h,
      pageSizePreset: 'Custom Size',
      presetName: `Custom (${w}×${h})`,
    });
    setIsQuickSizeOpen(false);
  };

  return (
    <main
      ref={containerRef}
      data-tour-target="dashboard-canvas"
      onClick={() => {
        if (!isPreviewMode) onSelectWidget(null);
      }}
      className="flex-1 min-w-0 h-full overflow-auto bg-slate-200/80 relative p-3 sm:p-6 md:p-8 pb-20 lg:pb-8 flex flex-col items-center select-none"
    >
      {/* Zoom-adjusted layout footprint prevents phantom horizontal overflow when zoomed out */}
      <div
        dir="ltr"
        className="relative shrink-0 mx-auto"
        style={{
          width: `${Math.round(activeWidth * canvas.zoom)}px`,
          height: `${Math.round(activeHeight * canvas.zoom)}px`,
        }}
      >
        {/* Printable Document Paper Canvas Container */}
        <div
          id="report-canvas-root"
          data-report-page-id={effectivePageId}
          dir="ltr"
          style={{
            width: `${activeWidth}px`,
            height: `${activeHeight}px`,
            transform: `scale(${canvas.zoom})`,
            transformOrigin: 'top left',
            transition: resizingEdge ? 'none' : 'transform 0.15s ease-out, width 0.15s ease, height 0.15s ease',
            ...getBackgroundStyle(),
          }}
          className="absolute top-0 left-0 shadow-2xl rounded-sm border border-slate-300 overflow-hidden bg-white"
        >
          {/* Printable Margins Bounding Box Guideline Overlay */}
          {!isPreviewMode && marginsPx && (
            <div
              data-no-print="true"
              style={{
                top: `${marginsPx.top}px`,
                right: `${marginsPx.right}px`,
                bottom: `${marginsPx.bottom}px`,
                left: `${marginsPx.left}px`,
              }}
              className="absolute border border-dashed border-sky-400/50 pointer-events-none z-10"
            >
              <span className="absolute -top-4 left-0 text-[9px] font-bold tracking-wider text-sky-500 uppercase opacity-70">
                {t('canvasPrintMargin')} (<span dir="ltr">{canvas.margins?.top || 12}{canvas.margins?.unit || 'mm'}</span>)
              </span>
            </div>
          )}

          {/* Grid Pattern Overlay */}
          {canvas.showGrid && (
            <div
              data-no-print="true"
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle, #64748B 1px, transparent 1px)`,
                backgroundSize: `${canvas.gridGap * 2}px ${canvas.gridGap * 2}px`,
              }}
            />
          )}

          {/* Render Canvas Widgets for Active Page */}
          {activeWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              datasets={datasets}
              canvas={canvas}
              globalFilters={globalFilters}
              dataModel={dataModel}
              isSelected={selectedWidgetId === widget.id}
              isConfiguring={configuringWidgetId === widget.id}
              isPreviewMode={isPreviewMode}
              onSelect={(id) => onSelectWidget(id)}
              onUpdatePosition={onUpdateWidgetPosition}
              onDuplicate={onDuplicateWidget}
              onDelete={onDeleteWidget}
              onOpenConfig={onOpenWidgetConfig}
            />
          ))}

          {/* Empty Page Prompt */}
          {activeWidgets.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none p-4 sm:p-6 text-center">
              <div className="p-5 sm:p-8 bg-white/95 rounded-3xl border border-slate-200 shadow-xl backdrop-blur w-full max-w-md pointer-events-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto text-sky-600 mb-3 sm:mb-4">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  {datasets.length === 0 ? t('canvasNoDatasetsTitle') : t('canvasNoWidgetsTitle')}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed mb-4">
                  {datasets.length === 0 ? t('canvasNoDatasetsDesc') : t('canvasNoWidgetsDesc')}
                </p>
                <div className="text-xs font-semibold text-slate-400">
                  {datasets.length === 0 ? t('canvasNoDatasetsHint') : t('canvasNoWidgetsHint')}
                </div>
              </div>
            </div>
          )}

          {/* --- INTERACTIVE CANVAS RESIZE HANDLES (VISIBLE WHEN NOT PREVIEWING) --- */}
          {!isPreviewMode && onUpdateCanvas && (
            <>
              {/* Right Edge Resize Handle */}
              <div
                onMouseDown={(e) => handleStartResize(e, 'right')}
                className="absolute top-0 right-0 w-3 h-full cursor-ew-resize hover:bg-sky-500/30 transition-colors z-30 group"
                title={t('canvasResizeWidthTip')}
              >
                <div className="w-1 h-12 bg-slate-400/80 group-hover:bg-sky-600 rounded-full mx-auto my-auto relative top-1/2 -translate-y-1/2 transition-colors shadow-xs" />
              </div>

              {/* Bottom Edge Resize Handle */}
              <div
                onMouseDown={(e) => handleStartResize(e, 'bottom')}
                className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize hover:bg-sky-500/30 transition-colors z-30 group"
                title={t('canvasResizeHeightTip')}
              >
                <div className="h-1 w-12 bg-slate-400/80 group-hover:bg-sky-600 rounded-full mx-auto my-auto relative left-1/2 -translate-x-1/2 transition-colors shadow-xs" />
              </div>

              {/* Bottom-Right Corner Resize Handle */}
              <div
                onMouseDown={(e) => handleStartResize(e, 'corner')}
                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-white/95 border-2 border-sky-600 rounded-tl-xl shadow-lg flex items-center justify-center text-sky-600 hover:bg-sky-600 hover:text-white transition-all z-40 group"
                title={t('canvasResizeCornerTip')}
              >
                <Maximize2 className="w-3.5 h-3.5 rotate-90" />
              </div>
            </>
          )}

          {/* Live Resizing Tooltip / Badge */}
          {resizingEdge && (
            <div className="absolute bottom-4 right-8 z-50 bg-navy-900/95 text-white border border-slate-700 px-3 py-1.5 rounded-xl shadow-2xl font-mono text-xs font-bold flex items-center gap-2 backdrop-blur animate-in fade-in duration-100">
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {activeWidth} × {activeHeight} px
              </span>
              <span className="text-slate-400 font-sans font-normal text-[10px]">
                ({(activeWidth / activeHeight).toFixed(2)}:1)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Canvas Size Badge & Manual Adjuster Button */}
      {!isPreviewMode && onUpdateCanvas && (
        <div className="mt-4 flex items-center gap-2 z-20 max-w-full">
          <div className="bg-white/90 backdrop-blur border border-slate-300 rounded-xl px-3 py-1.5 shadow-md flex flex-wrap items-center justify-center gap-2 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900" dir="ltr">
              <span>{t('canvasSizeBadgeLabel', { width: widthPx, height: heightPx })}</span>
            </div>
            <span className="w-1 h-3 bg-slate-200 rounded-full hidden sm:inline-block" />
            <button
              type="button"
              onClick={() => setIsQuickSizeOpen(true)}
              className="px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              title={t('canvasAdjustSizeTitle')}
            >
              <Sliders className="w-3 h-3" />
              <span>{t('canvasAdjustSizeBtn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Viewport-Safe Quick Size Modal */}
      {isQuickSizeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsQuickSizeOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 sm:p-5 w-full max-w-sm text-xs text-slate-800 space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">{t('canvasManualSizeTitle')}</span>
              <button
                type="button"
                onClick={() => setIsQuickSizeOpen(false)}
                aria-label={t('close')}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Width & Height Number Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t('canvasWidthPx')}
                </label>
                <input
                  type="number"
                  min={400}
                  max={8000}
                  step={10}
                  dir="ltr"
                  value={quickWidth}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 400;
                    setQuickWidth(val);
                    if (quickLockRatio && quickWidth > 0) {
                      const ratio = quickHeight / quickWidth;
                      setQuickHeight(Math.round(val * ratio));
                    }
                  }}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t('canvasHeightPx')}
                </label>
                <input
                  type="number"
                  min={300}
                  max={8000}
                  step={10}
                  dir="ltr"
                  value={quickHeight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 300;
                    setQuickHeight(val);
                    if (quickLockRatio && quickHeight > 0) {
                      const ratio = quickWidth / quickHeight;
                      setQuickWidth(Math.round(val * ratio));
                    }
                  }}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15"
                />
              </div>
            </div>

            {/* Lock Ratio */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-medium text-slate-600">{t('canvasLockRatio')}</span>
              <button
                type="button"
                onClick={() => setQuickLockRatio((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  quickLockRatio
                    ? 'bg-sky-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {quickLockRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{quickLockRatio ? t('canvasLocked') : t('canvasUnlocked')}</span>
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                {t('canvasPopularPresets')}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setQuickWidth(1920);
                    setQuickHeight(1080);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold text-start transition-colors cursor-pointer"
                >
                  {t('canvasPresetFhd')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickWidth(1366);
                    setQuickHeight(768);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold text-start transition-colors cursor-pointer"
                >
                  {t('canvasPresetLaptop')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickWidth(2560);
                    setQuickHeight(1440);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold text-start transition-colors cursor-pointer"
                >
                  {t('canvasPresetQhd')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickWidth(1080);
                    setQuickHeight(1080);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold text-start transition-colors cursor-pointer"
                >
                  {t('canvasPresetSquare')}
                </button>
              </div>
            </div>

            {/* Apply / Cancel */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQuickSizeOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleApplyQuickSize}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('canvasApplySize')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
