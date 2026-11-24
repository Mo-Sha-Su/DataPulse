import React, { useState } from 'react';
import { DashboardState, ReportPageSizePreset, PageOrientation, PageUnit } from '../../types/dashboard';
import { REPORT_PAGE_PRESETS, sanitizeFilename, DEFAULT_PAGE_MARGINS } from '../../utils/reportPageDimensions';
import { exportReportToPdf } from '../../utils/exportToPdf';
import { Download, Printer, Layers, Sliders, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Modal, Button, FieldLabel, Input, Select } from '../../ui';

interface Props {
  isOpen: boolean;
  dashboard: DashboardState;
  activePageId?: string;
  onClose: () => void;
  onUpdateCanvasSettings: (newSettings: Partial<DashboardState['canvas']>) => void;
}

export const ExportPdfModal: React.FC<Props> = ({
  isOpen,
  dashboard,
  activePageId,
  onClose,
  onUpdateCanvasSettings,
}) => {
  const { t } = useLanguage();

  const initialFilename = dashboard.name ? `${dashboard.name}` : t('exportPdfDefaultName');
  const [filename, setFilename] = useState(initialFilename);
  const [pageSizePreset, setPageSizePreset] = useState<ReportPageSizePreset>(
    dashboard.canvas.pageSizePreset || 'A4 Portrait'
  );
  const [orientation, setOrientation] = useState<PageOrientation>(
    dashboard.canvas.orientation || 'portrait'
  );
  const [pageRange, setPageRange] = useState<'all' | 'current' | 'custom'>('all');
  const [customRangeInput, setCustomRangeInput] = useState('1');
  const [marginTop, setMarginTop] = useState(dashboard.canvas.margins?.top ?? DEFAULT_PAGE_MARGINS.top);
  const [marginRight, setMarginRight] = useState(dashboard.canvas.margins?.right ?? DEFAULT_PAGE_MARGINS.right);
  const [marginBottom, setMarginBottom] = useState(dashboard.canvas.margins?.bottom ?? DEFAULT_PAGE_MARGINS.bottom);
  const [marginLeft, setMarginLeft] = useState(dashboard.canvas.margins?.left ?? DEFAULT_PAGE_MARGINS.left);
  const [marginUnit, setMarginUnit] = useState<PageUnit>(dashboard.canvas.margins?.unit || 'mm');
  const [qualityScale, setQualityScale] = useState<number>(2);

  const [isExporting, setIsExporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  const pages = dashboard.pages && dashboard.pages.length > 0 ? dashboard.pages : [{ id: 'p_1', name: t('appPageN', { n: 1 }) }];

  const handlePageSizeChange = (presetKey: ReportPageSizePreset) => {
    setPageSizePreset(presetKey);
    const preset = REPORT_PAGE_PRESETS[presetKey];
    if (preset) {
      setOrientation(preset.orientation);
      onUpdateCanvasSettings({
        pageSizePreset: presetKey,
        orientation: preset.orientation,
        widthPhysical: preset.widthPhysical,
        heightPhysical: preset.heightPhysical,
        unit: preset.unit,
      });
    }
  };

  const handleOrientationToggle = (newOrientation: PageOrientation) => {
    setOrientation(newOrientation);
    let nextPreset = pageSizePreset;
    if (pageSizePreset.startsWith('A4')) {
      nextPreset = newOrientation === 'landscape' ? 'A4 Landscape' : 'A4 Portrait';
    } else if (pageSizePreset.startsWith('A3')) {
      nextPreset = newOrientation === 'landscape' ? 'A3 Landscape' : 'A3 Portrait';
    } else if (pageSizePreset.startsWith('Letter')) {
      nextPreset = newOrientation === 'landscape' ? 'Letter Landscape' : 'Letter Portrait';
    } else if (pageSizePreset.startsWith('Legal')) {
      nextPreset = newOrientation === 'landscape' ? 'Legal Landscape' : 'Legal Portrait';
    }

    setPageSizePreset(nextPreset);
    const preset = REPORT_PAGE_PRESETS[nextPreset];
    if (preset) {
      onUpdateCanvasSettings({
        pageSizePreset: nextPreset,
        orientation: newOrientation,
        widthPhysical: preset.widthPhysical,
        heightPhysical: preset.heightPhysical,
        unit: preset.unit,
      });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setProgressPercent(10);
    setProgressStatus(t('generatingPdfStatus'));

    let customPagesList: number[] = [1];
    if (pageRange === 'custom') {
      customPagesList = customRangeInput
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= pages.length);
    }

    onUpdateCanvasSettings({
      margins: {
        top: marginTop,
        right: marginRight,
        bottom: marginBottom,
        left: marginLeft,
        unit: marginUnit,
      },
    });

    try {
      await exportReportToPdf(
        dashboard,
        {
          filename: sanitizeFilename(filename),
          pageRange,
          customPages: customPagesList,
          scaleFactor: qualityScale,
        },
        activePageId,
        (progress, message) => {
          setProgressPercent(progress);
          setProgressStatus(message);
        }
      );
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setIsExporting(false);
      setExportError(t('pdfExportError'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isExporting) onClose();
      }}
      closeOnBackdrop={!isExporting}
      size="xl"
      title={t('exportPdfModalTitle')}
      subtitle={t('exportPdfModalSubtitle')}
      closeLabel={t('close')}
      icon={
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 grid place-items-center">
          <Printer className="w-4 h-4" />
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isExporting}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleExport}
            disabled={isExporting}
            icon={isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          >
            {isExporting ? t('generatingPdfStatus') : t('generatePdfBtn')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-slate-800">
        {exportError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Filename Input */}
        <div>
          <FieldLabel>{t('pdfFilenameLabel')}</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              dir="auto"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={t('exportPdfDefaultName')}
              className="flex-1 font-semibold"
            />
            <span
              dir="ltr"
              className="h-10 px-3 inline-flex items-center text-xs font-mono font-bold text-slate-500 bg-slate-100 rounded-xl border border-slate-200 shrink-0"
            >
              .pdf
            </span>
          </div>
        </div>

        {/* Page Size & Orientation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>{t('pageSizeLabel')}</FieldLabel>
            <Select
              value={pageSizePreset}
              onChange={(e) => handlePageSizeChange(e.target.value as ReportPageSizePreset)}
            >
              {Object.keys(REPORT_PAGE_PRESETS).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
              <option value="Custom Size">{t('exportPdfCustomSize')}</option>
            </Select>
          </div>

          <div>
            <FieldLabel>{t('orientationLabel')}</FieldLabel>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 h-10">
              <button
                type="button"
                onClick={() => handleOrientationToggle('portrait')}
                className={`rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-white text-sky-700 shadow-xs border border-sky-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('portrait')}
              </button>
              <button
                type="button"
                onClick={() => handleOrientationToggle('landscape')}
                className={`rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-white text-sky-700 shadow-xs border border-sky-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('landscape')}
              </button>
            </div>
          </div>
        </div>

        {/* Page Margins Configuration */}
        <div className="space-y-3 border border-slate-200 rounded-xl p-3.5 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              <span>{t('pageMarginsLabel')}</span>
            </span>
            <select
              value={marginUnit}
              onChange={(e) => setMarginUnit(e.target.value as PageUnit)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-600"
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="in">in</option>
              <option value="px">px</option>
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-1">{t('exportPdfMarginTop')}</span>
              <Input
                type="number"
                controlSize="sm"
                dir="ltr"
                min={0}
                max={100}
                value={marginTop}
                onChange={(e) => setMarginTop(Number(e.target.value))}
                className="bg-white font-bold"
              />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-1">{t('exportPdfMarginRight')}</span>
              <Input
                type="number"
                controlSize="sm"
                dir="ltr"
                min={0}
                max={100}
                value={marginRight}
                onChange={(e) => setMarginRight(Number(e.target.value))}
                className="bg-white font-bold"
              />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-1">{t('exportPdfMarginBottom')}</span>
              <Input
                type="number"
                controlSize="sm"
                dir="ltr"
                min={0}
                max={100}
                value={marginBottom}
                onChange={(e) => setMarginBottom(Number(e.target.value))}
                className="bg-white font-bold"
              />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-1">{t('exportPdfMarginLeft')}</span>
              <Input
                type="number"
                controlSize="sm"
                dir="ltr"
                min={0}
                max={100}
                value={marginLeft}
                onChange={(e) => setMarginLeft(Number(e.target.value))}
                className="bg-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* Page Range Selection */}
        <div className="space-y-2">
          <FieldLabel>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>{t('pageRangeLabel')}</span>
            </span>
          </FieldLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPageRange('all')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-start transition-all cursor-pointer ${
                pageRange === 'all'
                  ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div>{t('allPages')}</div>
              <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                {pages.length === 1 ? t('exportPdfPageSingular') : t('exportPdfPagesCount', { count: pages.length })}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPageRange('current')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-start transition-all cursor-pointer ${
                pageRange === 'current'
                  ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div>{t('currentPageOnly')}</div>
              <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">{t('exportPdfActiveView')}</div>
            </button>

            <button
              type="button"
              onClick={() => setPageRange('custom')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-start transition-all cursor-pointer ${
                pageRange === 'custom'
                  ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div>{t('customPagesLabel')}</div>
              <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">{t('exportPdfCustomPlaceholder')}</div>
            </button>
          </div>

          {pageRange === 'custom' && (
            <div className="pt-1">
              <Input
                type="text"
                controlSize="sm"
                dir="ltr"
                value={customRangeInput}
                onChange={(e) => setCustomRangeInput(e.target.value)}
                placeholder={t('exportPdfCustomPlaceholder')}
              />
            </div>
          )}
        </div>

        {/* Quality Scale Factor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="min-w-0">
            <span className="font-bold text-slate-800 block">{t('exportResolution')}</span>
            <span className="text-[11px] text-slate-500">{t('exportPdfQualityDesc')}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setQualityScale(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                qualityScale === 2 ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t('exportPdf2x')}
            </button>
            <button
              type="button"
              onClick={() => setQualityScale(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                qualityScale === 3 ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t('exportPdf3x')}
            </button>
          </div>
        </div>

        {/* Progress Bar indicator during generation */}
        {isExporting && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-navy-900 gap-2">
              <span className="flex items-center gap-1.5 min-w-0 truncate">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />
                <span className="truncate">{progressStatus || t('generatingPdfStatus')}</span>
              </span>
              <span dir="ltr" className="shrink-0 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full bg-sky-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
