import React, { useState, useEffect } from 'react';
import { Widget, Dataset, WidgetConfig, AggregationMethod, NumberFormatType } from '../../types/dashboard';
import { DataModelState } from '../../types/dataModel';
import { processWidgetData } from '../../utils/dataProcessor';
import { hasActiveDataModel, queryWidgetData } from '../../utils/semanticQueryEngine';
import { useLanguage } from '../../i18n/LanguageContext';
import { ForecastRecord } from '../../types/forecast';
import { getForecastById, listForecasts } from '../../services/forecastService';
import { HelpHint, SectionDisclosure } from '../../ui';
import {
  X,
  Sliders,
  Palette,
  Check,
  RotateCcw,
  Eye,
  Table,
  Layers,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Type,
  Filter,
  Network,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';

interface Props {
  widget: Widget | null;
  datasets: Dataset[];
  dataModel?: DataModelState;
  onUpdateWidgetConfig: (widgetId: string, updatedConfig: WidgetConfig) => void;
  onClose: () => void;
}

const PALETTE_PRESETS = [
  ['#0284C7', '#0B1936', '#38BDF8', '#10B981', '#F59E0B'],
  ['#0B1936', '#38BDF8', '#0284C7', '#EC4899', '#10B981'],
  ['#0284C7', '#10B981', '#F59E0B', '#0EA5E9', '#F43F5E'],
  ['#38BDF8', '#0284C7', '#0B1936', '#84CC16', '#F97316'],
];

const BG_COLOR_PRESETS = [
  { key: 'configBgPureWhite' as const, hex: '#FFFFFF' },
  { key: 'configBgSoftSlate' as const, hex: '#F8FAFC' },
  { key: 'configBgSkyMist' as const, hex: '#F0F9FF' },
  { key: 'configBgMintTint' as const, hex: '#ECFDF5' },
  { key: 'configBgAmberGlow' as const, hex: '#FFFBEB' },
  { key: 'configBgDeepObsidian' as const, hex: '#0B1936' },
  { key: 'configBgDeepObsidian' as const, hex: '#0F172A' },
  { key: 'configBgRoseBlush' as const, hex: '#FFF1F2' },
];

const FONT_FAMILY_OPTIONS = [
  { id: 'sans', key: 'configFontInter' as const, fontCss: 'system-ui, sans-serif' },
  { id: 'display', key: 'configFontSegoe' as const, fontCss: '"Plus Jakarta Sans", sans-serif' },
  { id: 'serif', key: 'configFontGeorgia' as const, fontCss: 'Georgia, serif' },
  { id: 'mono', key: 'configFontMono' as const, fontCss: 'monospace' },
  { id: 'cursive', key: 'configFontGeorgia' as const, fontCss: 'cursive' },
];

const TITLE_COLOR_PRESETS = [
  '#0F172A', '#0284C7', '#10B981', '#F59E0B', '#FFFFFF', '#64748B', '#E11D48', '#0B1936'
];

export const RightConfigPanel: React.FC<Props> = ({
  widget,
  datasets,
  dataModel,
  onUpdateWidgetConfig,
  onClose,
}) => {
  const { t, tPlural } = useLanguage();
  const [tempConfig, setTempConfig] = useState<WidgetConfig>(() => ({ ...(widget?.config || ({} as WidgetConfig)) }));
  const [activeTab, setActiveTab] = useState<'mapping' | 'styling' | 'preview'>('mapping');
  const [availableForecasts, setAvailableForecasts] = useState<ForecastRecord[]>([]);
  const [selectedForecastDetail, setSelectedForecastDetail] = useState<ForecastRecord | null>(null);
  const [loadingForecasts, setLoadingForecasts] = useState(false);

  useEffect(() => {
    if (widget) {
      setTempConfig({ ...widget.config });
    }
  }, [widget]);

  useEffect(() => {
    if (widget?.type !== 'forecast') return;
    let cancelled = false;
    setLoadingForecasts(true);
    listForecasts()
      .then((list) => {
        if (!cancelled) setAvailableForecasts(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingForecasts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [widget?.type]);

  useEffect(() => {
    if (widget?.type !== 'forecast' || !tempConfig.forecastId) {
      setSelectedForecastDetail(null);
      return;
    }
    let cancelled = false;
    getForecastById(tempConfig.forecastId)
      .then((full) => {
        if (!cancelled) setSelectedForecastDetail(full);
      })
      .catch(() => {
        if (!cancelled) setSelectedForecastDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [widget?.type, tempConfig.forecastId]);

  if (!widget) return null;

  const selectedForecastObj =
    (selectedForecastDetail?.id === tempConfig.forecastId ? selectedForecastDetail : null) ||
    availableForecasts.find((f) => f.id === tempConfig.forecastId) ||
    null;

  const activeDataset = datasets.find((d) => d.id === tempConfig.datasetId) || datasets[0];

  const modelActive = hasActiveDataModel(dataModel);

  // A column name that exists in several model tables (e.g. a key shared by a fact and a dimension) is emitted as
  // "TABLE.Column" so the query engine binds the exact table; unique names stay bare for backward compatibility.
  const nameCounts = new Map<string, number>();
  if (modelActive && dataModel) {
    const bump = (n?: string) => n && nameCounts.set(n.toLowerCase(), (nameCounts.get(n.toLowerCase()) || 0) + 1);
    dataModel.factTables.forEach((f) => [...f.measures, ...f.foreignKeys, ...(f.attributes || [])].forEach(bump));
    dataModel.dimensionTables.forEach((d) => [d.primaryKey, ...d.attributes].forEach(bump));
  }
  const fieldValue = (table: string, col: string) =>
    (nameCounts.get(col.toLowerCase()) || 0) > 1 ? `${table}.${col}` : col;

  const renderFieldOptions = () => {
    if (modelActive && dataModel) {
      return (
        <>
          {dataModel.factTables.map((f) => (
            <optgroup key={f.id} label={f.name}>
              {f.measures.map((m) => (
                <option key={`f_m_${f.id}_${m}`} value={fieldValue(f.name, m)}>
                  {m}
                </option>
              ))}
              {f.foreignKeys.map((k) => (
                <option key={`f_k_${f.id}_${k}`} value={fieldValue(f.name, k)}>
                  {k}
                </option>
              ))}
            </optgroup>
          ))}
          {dataModel.dimensionTables.map((d) => (
            <optgroup key={d.id} label={d.name}>
              <option value={fieldValue(d.name, d.primaryKey)}>{d.primaryKey}</option>
              {d.attributes.map((a) => (
                <option key={`d_a_${d.id}_${a}`} value={fieldValue(d.name, a)}>
                  {a}
                </option>
              ))}
            </optgroup>
          ))}
          {dataModel.measures && dataModel.measures.length > 0 && (
            <optgroup label={t('measuresBtn')}>
              {dataModel.measures.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          )}
        </>
      );
    }

    return activeDataset?.columns.map((c) => (
      <option key={c.name} value={c.name}>
        {c.name} ({c.type})
      </option>
    ));
  };

  const handleApply = () => {
    onUpdateWidgetConfig(widget.id, tempConfig);
  };

  const handleReset = () => {
    setTempConfig({ ...widget.config });
  };

  // Preview with exactly what the canvas will render: through the Data Model when there is one.
  const modelPreview = modelActive
    ? queryWidgetData({ config: tempConfig, dataset: activeDataset, dataModel, datasets })
    : null;
  const sampleProcessed = modelPreview
    ? modelPreview.data
    : processWidgetData(
        activeDataset,
        tempConfig.xAxisField,
        tempConfig.yAxisField,
        tempConfig.aggregation,
        tempConfig.zAxisField,
        tempConfig.secondaryField,
        tempConfig.numberFormat,
        tempConfig.currencySymbol
      );

  return (
    <aside data-tour-target="config-panel" className="w-full lg:w-[340px] h-full bg-white border-s border-slate-200 flex flex-col z-20 shrink-0 text-slate-800 shadow-xl select-none min-w-0">
      {/* Drawer Header */}
      <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Sliders className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="font-bold text-sm text-slate-900 truncate" dir="auto">
            {t('widgetSettings')}: {widget.title}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 p-1 gap-1">
        <button
          onClick={() => setActiveTab('mapping')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
            activeTab === 'mapping' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('dataBinding')}
        </button>
        <button
          onClick={() => setActiveTab('styling')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
            activeTab === 'styling' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('stylingOptions')}
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
            activeTab === 'preview' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('sampleData')}
        </button>
      </div>

      {/* BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: DATA BINDING / TEXT CONTENT */}
        {activeTab === 'mapping' && (
          <>
            {widget.type !== 'forecast' && (
              <div
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] leading-snug ${
                  modelActive
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <Network className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {modelActive
                    ? `${t('configModelDriven')}: ${dataModel!.name}`
                    : t('configNoModelYet')}
                </span>
              </div>
            )}
            {widget.type === 'forecast' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-900 leading-snug">
                  <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sky-600" />
                  <span>{t('fcWidgetConfigHint')}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block text-xs">{t('fcSavedForecastsLabel')}</label>
                  <select
                    value={tempConfig.forecastId || ''}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const picked = availableForecasts.find((f) => f.id === nextId);
                      setTempConfig({
                        ...tempConfig,
                        forecastId: nextId || undefined,
                        forecastScenarioId: undefined,
                        datasetId: picked?.datasetId || tempConfig.datasetId,
                        title: picked ? picked.name : tempConfig.title,
                      });
                    }}
                    dir="auto"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                  >
                    <option value="">
                      {loadingForecasts ? t('loading') : t('fcWidgetSelectOpt')}
                    </option>
                    {availableForecasts.map((fc) => (
                      <option key={fc.id} value={fc.id}>
                        {fc.name} ({fc.configuration.horizonSteps ? `${fc.configuration.horizonSteps} ${t('fcStepsWord')}` : `${fc.configuration.horizonDays}d`})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block text-xs">{t('fcConfidenceLabel')}</label>
                  <select
                    value={tempConfig.forecastConfidenceLevel || '95'}
                    onChange={(e) =>
                      setTempConfig({
                        ...tempConfig,
                        forecastConfidenceLevel: e.target.value as '80' | '90' | '95',
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                  >
                    <option value="80">80%</option>
                    <option value="90">90%</option>
                    <option value="95">95%</option>
                  </select>
                </div>

                {selectedForecastObj?.scenarios && selectedForecastObj.scenarios.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block text-xs">{t('fcScenarioPrefix')}</label>
                    <select
                      value={tempConfig.forecastScenarioId || ''}
                      onChange={(e) =>
                        setTempConfig({
                          ...tempConfig,
                          forecastScenarioId: e.target.value || undefined,
                        })
                      }
                      dir="auto"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                    >
                      <option value="">{t('configNoneOpt')}</option>
                      {selectedForecastObj.scenarios.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                          {sc.isStale ? ` (${t('fcScenarioStaleBadge')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  {tempConfig.forecastId && (
                    <button
                      type="button"
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent('datapulse:open-forecast', {
                            detail: { forecastId: tempConfig.forecastId },
                          }),
                        )
                      }
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('fcWidgetOpenStudioTip')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('datapulse:open-forecast', {
                          detail: activeDataset?.id ? { datasetId: activeDataset.id } : {},
                        }),
                      )
                    }
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t('fcWidgetCreateInStudio')}</span>
                  </button>
                </div>
              </div>
            ) : widget.type === 'textbox' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t('configTextContent')}</span>
                  </label>
                  <textarea
                    rows={4}
                    value={tempConfig.textContent ?? tempConfig.title ?? ''}
                    onChange={(e) =>
                      setTempConfig({
                        ...tempConfig,
                        textContent: e.target.value,
                        title: e.target.value,
                      })
                    }
                    dir="auto"
                    placeholder={t('configTextPlaceholder')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 font-sans"
                  />
                </div>

                {/* Font Family Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">{t('configFontFamily')}</label>
                  <select
                    value={tempConfig.fontFamily || 'sans'}
                    onChange={(e) => setTempConfig({ ...tempConfig, fontFamily: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  >
                    {FONT_FAMILY_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {t(f.key)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Formatting */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700">
                      {t('configFontSizeLabel')} (<span dir="ltr">{tempConfig.fontSize || 18}px</span>)
                    </label>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={60}
                    step={1}
                    value={tempConfig.fontSize || 18}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, fontSize: Number(e.target.value) })
                    }
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                {/* Formatting Toggles */}
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="font-bold text-slate-700 block">{t('configWeightStyle')}</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setTempConfig({ ...tempConfig, isBold: !tempConfig.isBold })}
                        className={`p-2 rounded-lg border flex-1 flex items-center justify-center font-bold cursor-pointer ${
                          tempConfig.isBold
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        title={t('configBold')}
                        aria-label={t('configBold')}
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempConfig({ ...tempConfig, isItalic: !tempConfig.isItalic })}
                        className={`p-2 rounded-lg border flex-1 flex items-center justify-center font-bold cursor-pointer ${
                          tempConfig.isItalic
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        title={t('configItalic')}
                        aria-label={t('configItalic')}
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="font-bold text-slate-700 block">{t('configAlignmentLabel')}</label>
                    <div className="flex gap-1" dir="ltr">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => setTempConfig({ ...tempConfig, textAlign: align })}
                          className={`p-2 rounded-lg border flex-1 flex items-center justify-center cursor-pointer ${
                            (tempConfig.textAlign || 'left') === align
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          title={t('configAlignTip')}
                          aria-label={t('configAlignTip')}
                        >
                          {align === 'left' && <AlignLeft className="w-4 h-4" />}
                          {align === 'center' && <AlignCenter className="w-4 h-4" />}
                          {align === 'right' && <AlignRight className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Transparent Background button for text box */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      setTempConfig({
                        ...tempConfig,
                        backgroundColor:
                          tempConfig.backgroundColor === 'transparent' ? '#FFFFFF' : 'transparent',
                      })
                    }
                    className={`w-full py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      tempConfig.backgroundColor === 'transparent'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t('configTransparentBg')}</span>
                    {tempConfig.backgroundColor === 'transparent' && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t('cfgSectionEssential')}
                  </p>

                  {/* Target Dataset Selection */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <span>{t('targetDataset')}</span>
                      <HelpHint text={t('cfgPlainHintDataset')} />
                    </label>
                    <select
                      value={tempConfig.datasetId}
                      onChange={(e) => {
                        const newDs = datasets.find((d) => d.id === e.target.value);
                        setTempConfig({
                          ...tempConfig,
                          datasetId: e.target.value,
                          xAxisField: newDs?.columns[0]?.name || '',
                          yAxisField: newDs?.columns[1]?.name || '',
                        });
                      }}
                      dir="auto"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                    >
                      {datasets.map((d) => (
                        <option key={d.id} value={d.id} dir="auto">
                          {d.name} ({tPlural('rows', d.rowCount)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 1. Category / X-Axis Field (Hidden for Histogram, KPI, Gauge, Sparkline, Progress Bar) */}
                  {!['histogram', 'kpi', 'gauge', 'sparkline', 'progress_bar'].includes(widget.type) && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                        <span>
                          {widget.type === 'heatmap'
                            ? t('configFieldRowReq')
                            : widget.type === 'treemap'
                            ? t('configFieldParentCatReq')
                            : widget.type === 'funnel'
                            ? t('configFieldStageReq')
                            : ['pie'].includes(widget.type)
                            ? t('configFieldCatLabelsReq')
                            : widget.type === 'scatter'
                            ? t('configFieldXReq')
                            : widget.type === 'target_vs_actual'
                            ? t('configFieldActualReq')
                            : widget.type === 'metric'
                            ? t('configFieldPrevOpt')
                            : widget.category === '3d'
                            ? t('configFieldXReq')
                            : t('configFieldCatXReq')}
                        </span>
                        <HelpHint text={t('cfgPlainHintCategory')} />
                      </label>
                      <select
                        value={tempConfig.xAxisField}
                        onChange={(e) => setTempConfig({ ...tempConfig, xAxisField: e.target.value })}
                        dir="auto"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                      >
                        <option value="">{t('configSelectFieldOpt')}</option>
                        {renderFieldOptions()}
                      </select>
                    </div>
                  )}

                  {/* 2. Value / Y-Axis Field */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <span>
                        {widget.type === 'heatmap'
                          ? t('configFieldColReq')
                          : widget.type === 'treemap'
                          ? t('configFieldChildCatReq')
                          : widget.type === 'funnel'
                          ? t('configFieldValReq')
                          : ['pie'].includes(widget.type)
                          ? t('configFieldValReq')
                          : widget.type === 'scatter'
                          ? t('configFieldYReq')
                          : widget.type === 'target_vs_actual'
                          ? t('configFieldTargetReq')
                          : widget.type === 'metric'
                          ? t('configFieldCurrReq')
                          : widget.type === 'histogram'
                          ? t('configFieldNumColReq')
                          : ['kpi', 'gauge', 'sparkline', 'progress_bar'].includes(widget.type)
                          ? t('configFieldNumFieldReq')
                          : t('configFieldYReq')}
                      </span>
                      <HelpHint text={t('cfgPlainHintValue')} />
                    </label>
                    <select
                      value={tempConfig.yAxisField}
                      onChange={(e) => setTempConfig({ ...tempConfig, yAxisField: e.target.value })}
                      dir="auto"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                    >
                      {renderFieldOptions()}
                    </select>
                  </div>

                  {/* 3. Aggregation Method */}
                  {!['histogram', 'progress_bar', 'sparkline', 'text_box'].includes(widget.type) && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                        <span>{t('configAggMethod')}</span>
                        <HelpHint text={t('cfgPlainHintAggregation')} />
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['sum', 'avg', 'count', 'min', 'max', 'none'] as AggregationMethod[]).map(
                          (m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setTempConfig({ ...tempConfig, aggregation: m })}
                              className={`py-1.5 rounded-lg font-bold uppercase text-[10px] border transition-all cursor-pointer ${
                                tempConfig.aggregation === m
                                  ? 'bg-[#0284C7] border-sky-600 text-white shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {m}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progressive Disclosure: Secondary Axes, Groupings, Chart Display Toggles & Number Formatting */}
                <SectionDisclosure title={t('cfgSectionAdvancedData')} defaultOpen={widget.category === '3d'}>
                  {/* Secondary / Z-Axis Field (For 3D, Heatmap, Treemap, Scatter, Bubble, Group By, Metric Card) */}
                  {(widget.category === '3d' ||
                    ['heatmap', 'treemap', 'scatter', 'bubble', 'bar', 'line', 'metric'].includes(widget.type)) && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-xs">
                        {widget.category === '3d'
                          ? t('configFieldZReq')
                          : widget.type === 'heatmap'
                          ? t('configFieldValReq')
                          : widget.type === 'treemap'
                          ? t('configFieldValMetricOpt')
                          : ['scatter', 'bubble'].includes(widget.type)
                          ? t('configFieldSizeByOpt')
                          : widget.type === 'metric'
                          ? t('configFieldTargetOpt')
                          : t('configFieldGroupByOpt')}
                      </label>
                      <select
                        value={tempConfig.zAxisField || ''}
                        onChange={(e) =>
                          setTempConfig({
                            ...tempConfig,
                            zAxisField: e.target.value || undefined,
                          })
                        }
                        dir="auto"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                      >
                        <option value="">{t('configNoneOpt')}</option>
                        {renderFieldOptions()}
                      </select>
                    </div>
                  )}

                  {/* Color By Field (For Scatter Plot & 3D Charts) */}
                  {(widget.type === 'scatter' || widget.category === '3d') && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-xs">{t('configFieldColorByOpt')}</label>
                      <select
                        value={tempConfig.secondaryField || ''}
                        onChange={(e) =>
                          setTempConfig({
                            ...tempConfig,
                            secondaryField: e.target.value || undefined,
                          })
                        }
                        dir="auto"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                      >
                        <option value="">{t('configNoneOpt')}</option>
                        {renderFieldOptions()}
                      </select>
                    </div>
                  )}

                  {/* Prefix & Suffix (KPI, Metric Card, Funnel, Treemap, Gauge) */}
                  {['kpi', 'metric', 'funnel', 'treemap', 'gauge'].includes(widget.type) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 text-xs block">{t('configPrefix')}</label>
                        <input
                          type="text"
                          placeholder="$"
                          dir="auto"
                          value={tempConfig.prefix || ''}
                          onChange={(e) => setTempConfig({ ...tempConfig, prefix: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 text-xs block">{t('configSuffix')}</label>
                        <input
                          type="text"
                          placeholder="%"
                          dir="auto"
                          value={tempConfig.suffix || ''}
                          onChange={(e) => setTempConfig({ ...tempConfig, suffix: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Max Value (Gauge, Progress Bar) */}
                  {['gauge', 'progress_bar'].includes(widget.type) && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-xs">{t('configMaxTargetVal')}</label>
                      <input
                        type="number"
                        dir="ltr"
                        value={tempConfig.maxValue ?? 100}
                        onChange={(e) => setTempConfig({ ...tempConfig, maxValue: Number(e.target.value) })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                      />
                    </div>
                  )}

                  {/* Sort Option (Bar Chart, Funnel Chart) */}
                  {['bar', 'funnel'].includes(widget.type) && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 block text-xs">{t('configSortDir')}</label>
                      <select
                        value={tempConfig.sortBy || 'none'}
                        onChange={(e) => setTempConfig({ ...tempConfig, sortBy: e.target.value as any })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                      >
                        <option value="none">{t('configSortDefault')}</option>
                        <option value="asc">{t('configSortAsc')}</option>
                        <option value="desc">{t('configSortDesc')}</option>
                      </select>
                    </div>
                  )}

                  {/* Histogram Specific Options */}
                  {widget.type === 'histogram' && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span>{t('configBinsLabel')} (<span dir="ltr">{tempConfig.binCount || 10}</span>)</span>
                        </div>
                        <input
                          type="range"
                          min={3}
                          max={30}
                          value={tempConfig.binCount || 10}
                          onChange={(e) => setTempConfig({ ...tempConfig, binCount: Number(e.target.value) })}
                          className="w-full accent-sky-600 cursor-pointer"
                        />
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!tempConfig.density}
                            onChange={(e) => setTempConfig({ ...tempConfig, density: e.target.checked })}
                            className="rounded text-sky-600 focus:ring-0"
                          />
                          <span>{t('configDensityMode')}</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!tempConfig.cumulative}
                            onChange={(e) => setTempConfig({ ...tempConfig, cumulative: e.target.checked })}
                            className="rounded text-sky-600 focus:ring-0"
                          />
                          <span>{t('configCumulative')}</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Display Feature Toggles */}
                  {['bar', 'line', 'pie', 'scatter'].includes(widget.type) && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <span className="font-bold text-slate-700 text-xs block">{t('configSpecificViewOpts')}</span>

                      {widget.type === 'bar' && (
                        <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs">
                          <span className="text-slate-700 font-medium">{t('configHorizontalBars')}</span>
                          <input
                            type="checkbox"
                            checked={!!tempConfig.horizontal}
                            onChange={(e) => setTempConfig({ ...tempConfig, horizontal: e.target.checked })}
                            className="rounded text-sky-600 focus:ring-0"
                          />
                        </label>
                      )}

                      {widget.type === 'line' && (
                        <>
                          <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs">
                            <span className="text-slate-700 font-medium">{t('configSmoothLines')}</span>
                            <input
                              type="checkbox"
                              checked={!!tempConfig.smoothLines}
                              onChange={(e) => setTempConfig({ ...tempConfig, smoothLines: e.target.checked })}
                              className="rounded text-sky-600 focus:ring-0"
                            />
                          </label>
                          <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs">
                            <span className="text-slate-700 font-medium">{t('configShowMarkers')}</span>
                            <input
                              type="checkbox"
                              checked={!!tempConfig.showMarkers}
                              onChange={(e) => setTempConfig({ ...tempConfig, showMarkers: e.target.checked })}
                              className="rounded text-sky-600 focus:ring-0"
                            />
                          </label>
                        </>
                      )}

                      {['pie'].includes(widget.type) && (
                        <>
                          <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs">
                            <span className="text-slate-700 font-medium">{t('configDonutStyle')}</span>
                            <input
                              type="checkbox"
                              checked={!!tempConfig.donutStyle}
                              onChange={(e) => setTempConfig({ ...tempConfig, donutStyle: e.target.checked })}
                              className="rounded text-sky-600 focus:ring-0"
                            />
                          </label>
                          <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs">
                            <span className="text-slate-700 font-medium">{t('configShowPctLabels')}</span>
                            <input
                              type="checkbox"
                              checked={!!tempConfig.showPercentages}
                              onChange={(e) => setTempConfig({ ...tempConfig, showPercentages: e.target.checked })}
                              className="rounded text-sky-600 focus:ring-0"
                            />
                          </label>
                        </>
                      )}

                      {widget.type === 'scatter' && (
                        <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs">
                          <span className="text-slate-700 font-medium">{t('configShowTrendline')}</span>
                          <input
                            type="checkbox"
                            checked={!!tempConfig.showTrendline}
                            onChange={(e) => setTempConfig({ ...tempConfig, showTrendline: e.target.checked })}
                            className="rounded text-sky-600 focus:ring-0"
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Number Formatting */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <label className="font-bold text-slate-700 block text-xs">{t('configNumFormatting')}</label>
                    <select
                      value={tempConfig.numberFormat}
                      onChange={(e) =>
                        setTempConfig({
                          ...tempConfig,
                          numberFormat: e.target.value as NumberFormatType,
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500 text-xs"
                    >
                      <option value="number">{t('configNumRaw')}</option>
                      <option value="currency">{t('configNumCurrency')}</option>
                      <option value="percentage">{t('configNumPct')}</option>
                      <option value="compact">{t('configNumCompact')}</option>
                    </select>
                  </div>
                </SectionDisclosure>
              </>
            )}
          </>
        )}

        {/* TAB 2: STYLING & WIDGET OPTIONS */}
        {activeTab === 'styling' && (
          <>
            {/* Widget Title */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">{t('configWidgetHeaderLabel')}</label>
              <input
                type="text"
                dir="auto"
                value={tempConfig.title}
                onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Graph / Widget Background Color */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-600" />
                  <span>{t('configBgColorLabel')}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={tempConfig.backgroundColor === 'transparent' ? '#FFFFFF' : (tempConfig.backgroundColor || '#FFFFFF')}
                    onChange={(e) => setTempConfig({ ...tempConfig, backgroundColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
                    title={t('configBgColorTip')}
                  />
                  <span className="font-mono text-[10px] text-slate-500 uppercase" dir="ltr">
                    {tempConfig.backgroundColor === 'transparent' ? t('configTransparentLabel') : (tempConfig.backgroundColor || '#FFFFFF')}
                  </span>
                </div>
              </div>

              {/* Transparent Background Option Button */}
              <button
                type="button"
                onClick={() =>
                  setTempConfig({
                    ...tempConfig,
                    backgroundColor:
                      tempConfig.backgroundColor === 'transparent' ? '#FFFFFF' : 'transparent',
                  })
                }
                className={`w-full py-1.5 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tempConfig.backgroundColor === 'transparent'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{t('configTransparentBg')}</span>
                {tempConfig.backgroundColor === 'transparent' && <Check className="w-4 h-4" />}
              </button>

              {/* Background Color Swatches */}
              <div className="grid grid-cols-5 gap-1.5">
                {BG_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setTempConfig({ ...tempConfig, backgroundColor: preset.hex })}
                    className={`h-7 rounded-md border flex items-center justify-center transition-all shadow-2xs relative cursor-pointer ${
                      tempConfig.backgroundColor !== 'transparent' &&
                      (tempConfig.backgroundColor || '#FFFFFF').toUpperCase() === (preset.hex || '').toUpperCase()
                        ? 'ring-2 ring-sky-500 border-sky-600 scale-105'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={t(preset.key)}
                  >
                    {tempConfig.backgroundColor !== 'transparent' &&
                      (tempConfig.backgroundColor || '#FFFFFF').toUpperCase() === (preset.hex || '').toUpperCase() && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          ['#FFFFFF', '#F8FAFC', '#F0F9FF', '#EEF2FF', '#ECFDF5', '#FFFBEB', '#FFF1F2'].includes(preset.hex)
                            ? 'text-slate-900'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography & Font Settings */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('configTypographySection')}</span>
              </label>

              {/* Font Family */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">{t('configFontFamily')}</label>
                <select
                  value={tempConfig.fontFamily || 'sans'}
                  onChange={(e) => setTempConfig({ ...tempConfig, fontFamily: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                >
                  {FONT_FAMILY_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {t(f.key)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-slate-600">
                    {t('configFontSizeLabel')} (<span dir="ltr">{tempConfig.fontSize || (widget.type === 'textbox' ? 18 : 14)}px</span>)
                  </label>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  step={1}
                  value={tempConfig.fontSize || (widget.type === 'textbox' ? 18 : 14)}
                  onChange={(e) =>
                    setTempConfig({ ...tempConfig, fontSize: Number(e.target.value) })
                  }
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Style & Alignment Toggles */}
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">{t('configWeightStyle')}</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTempConfig({ ...tempConfig, isBold: !tempConfig.isBold })}
                      className={`p-2 rounded-lg border flex-1 flex items-center justify-center font-bold cursor-pointer ${
                        tempConfig.isBold
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={t('configBold')}
                      aria-label={t('configBold')}
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempConfig({ ...tempConfig, isItalic: !tempConfig.isItalic })}
                      className={`p-2 rounded-lg border flex-1 flex items-center justify-center font-bold cursor-pointer ${
                        tempConfig.isItalic
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={t('configItalic')}
                      aria-label={t('configItalic')}
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">{t('configAlignmentLabel')}</label>
                  <div className="flex gap-1" dir="ltr">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => setTempConfig({ ...tempConfig, textAlign: align })}
                        className={`p-2 rounded-lg border flex-1 flex items-center justify-center cursor-pointer ${
                          (tempConfig.textAlign || 'left') === align
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        title={t('configAlignTip')}
                        aria-label={t('configAlignTip')}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Title / Text Color */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">{t('configTitleColorLabel')}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={tempConfig.titleColor || '#0F172A'}
                    onChange={(e) => setTempConfig({ ...tempConfig, titleColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
                    title={t('configTitleColorTip')}
                  />
                  <span className="font-mono text-[10px] text-slate-500 uppercase" dir="ltr">{tempConfig.titleColor || '#0F172A'}</span>
                </div>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {TITLE_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTempConfig({ ...tempConfig, titleColor: color })}
                    className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                      tempConfig.titleColor === color ? 'ring-2 ring-sky-500 scale-110' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Color Palette Selection */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <label className="font-bold text-slate-700">{t('configPaletteLabel')}</label>
              <div className="grid grid-cols-2 gap-2">
                {PALETTE_PRESETS.map((palette, i) => (
                  <div
                    key={i}
                    onClick={() => setTempConfig({ ...tempConfig, colorPalette: palette, primaryColor: palette[0] })}
                    className={`p-2 rounded-lg border cursor-pointer flex gap-1 items-center justify-center transition-all ${
                      tempConfig.primaryColor === palette[0]
                        ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {palette.map((c, idx) => (
                      <div key={idx} className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Specific Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-700">{t('configDisplayOpts')}</span>

              <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <span className="text-slate-700 font-medium">{t('configHorizontalBars')}</span>
                <input
                  type="checkbox"
                  checked={!!tempConfig.horizontal}
                  onChange={(e) => setTempConfig({ ...tempConfig, horizontal: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <span className="text-slate-700 font-medium">{t('configSmoothLines')}</span>
                <input
                  type="checkbox"
                  checked={!!tempConfig.smoothLines}
                  onChange={(e) => setTempConfig({ ...tempConfig, smoothLines: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <span className="text-slate-700 font-medium">{t('configDonutStyle')}</span>
                <input
                  type="checkbox"
                  checked={!!tempConfig.donutStyle}
                  onChange={(e) => setTempConfig({ ...tempConfig, donutStyle: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <span className="text-slate-700 font-medium">{t('configShowMarkers')}</span>
                <input
                  type="checkbox"
                  checked={!!tempConfig.showMarkers}
                  onChange={(e) => setTempConfig({ ...tempConfig, showMarkers: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-0"
                />
              </label>
            </div>
          </>
        )}

        {/* TAB 3: DATA PREVIEW */}
        {activeTab === 'preview' && (
          <div className="space-y-2">
            <span className="font-bold text-slate-700">
              {t('configAggSampleOutput')} (<span dir="ltr">{sampleProcessed.length}</span>)
            </span>
            {modelPreview?.error && sampleProcessed.length === 0 && (
              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" dir="auto">
                {modelPreview.error}
              </div>
            )}
            <div className="max-h-64 max-w-full overflow-auto border border-slate-200 rounded-lg bg-slate-50">
              <table className="w-full text-start text-[11px] text-slate-700">
                <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2">{t('configCategoryXCol')}</th>
                    <th className="p-2">{t('configMetricYCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sampleProcessed.map((pt, i) => (
                    <tr key={i} className="hover:bg-slate-100/80">
                      <td className="p-2 font-mono text-sky-600 truncate max-w-[120px]" dir="auto">{String(pt.x)}</td>
                      <td className="p-2 font-mono font-bold text-slate-900" dir="ltr">{pt.formattedY}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex gap-2">
        <button
          onClick={handleReset}
          className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('reset')}</span>
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#0B1936] to-[#0284C7] hover:from-[#0B1936] hover:to-sky-600 rounded-lg font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition-all border border-sky-400/20 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{t('applyConfiguration')}</span>
        </button>
      </div>
    </aside>
  );
};
