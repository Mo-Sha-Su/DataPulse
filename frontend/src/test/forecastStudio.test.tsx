import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Language, LanguageContext, translateWithLanguage, translations } from '../i18n/LanguageContext';
import {
  BUSINESS_DOMAIN_LABELS,
  BUSINESS_FORECAST_PRESETS,
  BUSINESS_FORECAST_TEMPLATES,
  coerceValidHorizon,
  coerceValidHorizonSteps,
  findBestDateColumn,
  findBestTargetColumn,
  findBestTargetColumnForPreset,
  findSuggestedGroupColumns,
  getApplicableScenarioDrivers,
  getMaxHorizonStepsForFrequency,
  getPresetHorizonStepsForFrequency,
  getValidHorizonsForFrequency,
  horizonDaysToSteps,
  horizonStepsToApproxDays,
} from '../data/forecastTemplates';
import { WIDGET_DEFINITIONS } from '../data/widgetDefinitions';
import { ForecastStudioPage } from '../pages/ForecastStudioPage';
import { ForecastResultsPanel } from '../components/Forecast/ForecastResultsPanel';
import { ForecastScenariosPanel } from '../components/Forecast/ForecastScenariosPanel';
import { ForecastWidgetRenderer } from '../components/Widget/WidgetRenderers/ForecastWidgetRenderer';
import {
  buildForecastCsvContent,
  buildForecastExportRows,
  escapeSpreadsheetCell,
} from '../utils/forecastExport';
import { evaluateForecastVsActual } from '../utils/forecastAccuracy';
import { rankTopGroupsByVolume, runBatchGroupForecasts } from '../utils/batchGroupForecast';
import { Dataset, WidgetConfig } from '../types/dashboard';
import { ForecastConfiguration, ForecastRecord, ForecastResultRecord } from '../types/forecast';

const noop = () => {};

function renderWithLanguage(lang: Language, element: React.ReactElement): string {
  const isRtl = lang === 'ar';
  return renderToStaticMarkup(
    <LanguageContext.Provider
      value={{
        language: lang,
        setLanguage: noop,
        t: (key, params) => translateWithLanguage(lang, key, params),
        tPlural: (prefix, count) => `${count} ${prefix}`,
        formatNumber: (v) => String(v),
        formatDate: (v) => String(v),
        isRtl,
        dir: isRtl ? 'rtl' : 'ltr',
      }}
    >
      <div dir={isRtl ? 'rtl' : 'ltr'}>{element}</div>
    </LanguageContext.Provider>,
  );
}

const sampleDataset: Dataset = {
  id: 'ds_forecast_test',
  name: 'Retail Operations',
  rowCount: 30,
  columnCount: 5,
  current_version_id: 'ver_abc123',
  columns: [
    { name: 'order_date', type: 'date', sampleValue: '2025-01-01' },
    { name: 'revenue', type: 'number', sampleValue: 1200 },
    { name: 'units_sold', type: 'number', sampleValue: 40 },
    { name: 'expenses', type: 'number', sampleValue: 400 },
    { name: 'region', type: 'string', sampleValue: 'North' },
  ],
  data: [
    { order_date: '2025-01-01', revenue: 1200, units_sold: 40, expenses: 400, region: 'North' },
    { order_date: '2025-01-02', revenue: 1350, units_sold: 45, expenses: 410, region: 'South' },
  ],
  uploadedAt: '2025-02-01',
  sourceType: 'csv',
};

describe('Forecast Studio domain helpers & templates', () => {
  it('provides all 8 required canonical business templates and categorized Sales/Finance/Inventory/Marketing domains', () => {
    const ids = BUSINESS_FORECAST_TEMPLATES.map((tpl) => tpl.id);
    expect(ids).toEqual([
      'sales',
      'revenue',
      'profit',
      'expenses',
      'inventory',
      'demand',
      'website_traffic',
      'general_business',
    ]);

    const domains = BUSINESS_DOMAIN_LABELS.map((d) => d.id);
    expect(domains).toEqual(['sales', 'finance', 'inventory', 'marketing', 'general']);

    const presetIds = BUSINESS_FORECAST_PRESETS.map((p) => p.id);
    expect(presetIds).toContain('sales_revenue');
    expect(presetIds).toContain('sales_volume');
    expect(presetIds).toContain('finance_revenue');
    expect(presetIds).toContain('finance_expenses');
    expect(presetIds).toContain('finance_profit');
    expect(presetIds).toContain('inventory_trends');
    expect(presetIds).toContain('stock_consumption');
    expect(presetIds).toContain('product_demand');
    expect(presetIds).toContain('website_traffic');
    expect(presetIds).toContain('marketing_leads');
    expect(presetIds).toContain('marketing_conversions');
  });

  it('communicates inventory replenishment & lead-time limitations transparently in EN and AR', () => {
    expect(translations.en.fcTplInventoryLimitation.toLowerCase()).toContain('replenishment');
    expect(translations.en.fcTplInventoryLimitation.toLowerCase()).toContain('lead time');
    expect(translations.ar.fcTplInventoryLimitation).toContain('التوريد');
    expect(translations.ar.fcTplInventoryLimitation).toContain('مهلة الموردين');
  });

  it('enforces valid horizons per frequency and coerces incompatible horizons', () => {
    expect(getValidHorizonsForFrequency('daily')).toEqual([7, 30, 90, 180, 365]);
    expect(getValidHorizonsForFrequency('monthly')).toEqual([30, 90, 180, 365]);
    expect(getValidHorizonsForFrequency('quarterly')).toEqual([90, 180, 365]);
    expect(getValidHorizonsForFrequency('yearly')).toEqual([365]);

    expect(coerceValidHorizon('monthly', 7)).toBe(30);
    expect(coerceValidHorizon('quarterly', 30)).toBe(90);
    expect(coerceValidHorizon('yearly', 90)).toBe(365);
    expect(coerceValidHorizon('daily', 90)).toBe(90);
  });

  it('matches date, business target, and grouping columns accurately', () => {
    expect(findBestDateColumn(sampleDataset)).toBe('order_date');
    expect(findBestTargetColumn(sampleDataset, 'revenue')).toBe('revenue');
    expect(findBestTargetColumn(sampleDataset, 'expenses')).toBe('expenses');
    expect(findBestTargetColumnForPreset(sampleDataset, 'sales_volume')).toBe('units_sold');
    expect(findSuggestedGroupColumns(sampleDataset)).toContain('region');
  });

  it('registers the forecast widget type cleanly in WIDGET_DEFINITIONS', () => {
    const fcWidget = WIDGET_DEFINITIONS.find((w) => w.type === 'forecast');
    expect(fcWidget).toBeDefined();
    expect(fcWidget?.category).toBe('analytics');
  });
});

describe('Forecast Studio UI rendering (English & Arabic RTL)', () => {
  it('renders Forecast Studio controls, Save button, and empty-dataset guidance cleanly in English', () => {
    const emptyHtml = renderWithLanguage(
      'en',
      <ForecastStudioPage
        currentUser={{ id: 'u1', email: 'a@b.com', first_name: 'Ada', last_name: 'Lovelace', role: 'analyst' }}
        globalDatasets={[]}
        savedDashboards={[]}
        onLogout={vi.fn()}
        onNavigate={vi.fn()}
        onAddForecastToDashboard={vi.fn()}
      />,
    );
    expect(emptyHtml).toContain(translations.en.fcNoDatasetsTitle);

    const readyHtml = renderWithLanguage(
      'en',
      <ForecastStudioPage
        currentUser={{ id: 'u1', email: 'a@b.com', first_name: 'Ada', last_name: 'Lovelace', role: 'analyst' }}
        globalDatasets={[sampleDataset]}
        savedDashboards={[]}
        onLogout={vi.fn()}
        onNavigate={vi.fn()}
        onAddForecastToDashboard={vi.fn()}
      />,
    );
    expect(readyHtml).toContain(translations.en.fcModeGeneral);
    expect(readyHtml).toContain(translations.en.fcModeBusiness);
    expect(readyHtml).toContain(translations.en.fcGenerateBtn);
    expect(readyHtml).toContain(translations.en.fcSaveForecastBtn);
    expect(readyHtml).toContain('Retail Operations');
  });

  it('renders Forecast Studio in Arabic RTL without missing translations', () => {
    const html = renderWithLanguage(
      'ar',
      <ForecastStudioPage
        currentUser={{ id: 'u1', email: 'a@b.com', first_name: 'سارة', last_name: 'علي', role: 'analyst' }}
        globalDatasets={[sampleDataset]}
        savedDashboards={[]}
        onLogout={vi.fn()}
        onNavigate={vi.fn()}
        onAddForecastToDashboard={vi.fn()}
      />,
    );
    expect(html).toContain('dir="rtl"');
    expect(html).toContain(translations.ar.forecastStudio);
    expect(html).toContain(translations.ar.fcSaveForecastBtn);
    expect(html).toContain(translations.ar.fcModeBusiness);
  });

  it('renders What-If scenario assumptions disclaimer and unconfigured forecast widget create workflow cleanly', () => {
    const scenHtml = renderWithLanguage(
      'en',
      <ForecastScenariosPanel
        scenarios={[]}
        activeScenarioId={null}
        businessTemplate="sales"
        valuePrefix="$"
        isSubmitting={false}
        onSelectScenario={vi.fn()}
        onCreateScenario={vi.fn()}
        onDeleteScenario={vi.fn()}
      />,
    );
    expect(scenHtml).toContain(translations.en.fcWhatIfTitle);
    expect(scenHtml).toContain(translations.en.fcCreateScenarioBtn);
    expect(scenHtml).toContain(translations.en.fcScenarioDisclaimer);

    const baseConfig: WidgetConfig = {
      datasetId: 'ds_forecast_test',
      xAxisField: '',
      yAxisField: '',
      aggregation: 'sum',
      numberFormat: 'number',
      title: 'Revenue Projection',
      titleColor: '#0F172A',
      primaryColor: '#0284C7',
      colorPalette: ['#0284C7'],
      backgroundColor: '#FFFFFF',
    };
    const widgetHtml = renderWithLanguage(
      'en',
      <ForecastWidgetRenderer config={baseConfig} datasets={[sampleDataset]} />,
    );
    expect(widgetHtml).toContain(translations.en.fcWidgetSelectPromptTitle);
    expect(widgetHtml).toContain(translations.en.fcWidgetCreateInStudio);
  });

  it('renders em-dash for missing/NaN KPIs, config staleness banner, stale scenario badges, and failed widget status cleanly', () => {
    const mockConfig: ForecastConfiguration = {
      dateColumn: 'order_date',
      targetColumn: 'revenue',
      aggregation: 'sum',
      frequency: 'daily',
      horizonDays: 30,
      model: 'auto',
      groupColumn: null,
      groupValue: null,
      confidenceLevel: '95',
    };

    const sparseResult: ForecastResultRecord = {
      id: 'res_1',
      forecastId: 'fc_1',
      datasetVersionId: 'ver_abc123',
      selectedModel: 'ets',
      selectedModelLabel: 'Exponential Smoothing (ETS)',
      frequency: 'daily',
      horizonDays: 30,
      horizonSteps: 30,
      historicalData: [{ date: '2025-01-01', value: 100, isObserved: true }],
      predictedData: [
        {
          date: '2025-01-02',
          value: 105,
          lower80: 95,
          upper80: 115,
          lower90: 92,
          upper90: 118,
          lower95: 88,
          upper95: 122,
        },
      ],
      predictionIntervals: {},
      summary: {
        lastActualValue: undefined,
        totalForecastedValue: Number.NaN,
        averageForecastedValue: undefined,
        projectedChangePct: null,
      },
      evaluationMetrics: {
        mae: null,
        rmse: null,
        mase: null,
        mape: null,
        backtestingWindows: 1,
        trainingObservations: 10,
        validationObservations: 2,
        candidates: [],
      },
      modelMetadata: {
        intervalMethod: 'finite_sample_t_cv_calibrated',
        evaluatedConfiguration: mockConfig,
      },
      dataQuality: {},
      warnings: [],
      notes: [],
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    const failedRecord: ForecastRecord = {
      id: 'fc_1',
      name: 'Revenue Forecast',
      mode: 'general',
      businessTemplate: null,
      datasetId: 'ds_forecast_test',
      datasetVersionId: 'ver_abc123',
      configuration: mockConfig,
      selectedModel: 'ets',
      status: 'failed',
      errorMessage: 'Insufficient observations after edit.',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      latestResult: sparseResult,
      scenarios: [
        {
          id: 'sc_stale',
          forecastId: 'fc_1',
          name: 'Old Holiday Plan',
          assumptions: { growthRateDeltaPct: 0, salesDeltaPct: 10, priceChangePct: 0, demandDeltaPct: 0, expenseDeltaPct: 0 },
          scenarioResults: {
            predictedData: [],
            summary: { baselineTotal: 100, scenarioTotal: 110, totalDelta: 10, totalDeltaPct: 10, endBaselineValue: 100, endScenarioValue: 110 },
            warnings: [],
            notes: [],
          },
          baselineResultId: 'res_0',
          isStale: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    };

    const resultsHtml = renderWithLanguage(
      'en',
      <ForecastResultsPanel
        inlineError={null}
        statusNotice={null}
        isLoadingList={false}
        isRunning={false}
        isScenarioBusy={false}
        latestResult={sparseResult}
        activeForecast={failedRecord}
        selectedDataset={sampleDataset}
        config={mockConfig}
        historyWindow="all"
        activeScenario={failedRecord.scenarios![0]}
        activeScenarioId="sc_stale"
        isConfigStale={true}
        valuePrefix="$"
        showMetricHelp={false}
        onDismissStatusNotice={vi.fn()}
        onChangeHistoryWindow={vi.fn()}
        onToggleMetricHelp={vi.fn()}
        onRunForecast={vi.fn()}
        onSelectScenario={vi.fn()}
        onCreateScenario={vi.fn()}
        onDeleteScenario={vi.fn()}
      />,
    );

    expect(resultsHtml).toContain('—');
    expect(resultsHtml).not.toContain('NaN');
    expect(resultsHtml).toContain(translations.en.fcConfigStaleBanner);
    expect(resultsHtml).toContain(translations.en.fcFailedBannerTitle);
    expect(resultsHtml).toContain(translations.en.fcIntervalNoteCv);
    expect(resultsHtml).toContain(translations.en.fcScenarioStaleBadge);
    expect(resultsHtml).toContain(translations.en.fcScenarioStaleNotice);
  });

  it('enforces period horizon presets/caps and renders Next N Periods controls in EN and AR', () => {
    expect(getPresetHorizonStepsForFrequency('daily')).toEqual([7, 14, 30, 90]);
    expect(getPresetHorizonStepsForFrequency('weekly')).toEqual([4, 8, 13, 26]);
    expect(getPresetHorizonStepsForFrequency('monthly')).toEqual([3, 6, 12, 24]);
    expect(getPresetHorizonStepsForFrequency('quarterly')).toEqual([2, 4, 8]);
    expect(getPresetHorizonStepsForFrequency('yearly')).toEqual([1, 3, 5]);

    expect(getMaxHorizonStepsForFrequency('daily')).toBe(365);
    expect(getMaxHorizonStepsForFrequency('weekly')).toBe(104);
    expect(getMaxHorizonStepsForFrequency('monthly')).toBe(36);
    expect(getMaxHorizonStepsForFrequency('quarterly')).toBe(12);
    expect(getMaxHorizonStepsForFrequency('yearly')).toBe(5);

    expect(coerceValidHorizonSteps('yearly', 10)).toBe(5);
    expect(coerceValidHorizonSteps('monthly', 0)).toBe(6);
    expect(horizonDaysToSteps('monthly', 180)).toBe(6);
    expect(horizonStepsToApproxDays('monthly', 6)).toBe(180);

    const readyEn = renderWithLanguage(
      'en',
      <ForecastStudioPage
        currentUser={{ id: 'u1', email: 'a@b.com', first_name: 'Ada', last_name: 'Lovelace', role: 'analyst' }}
        globalDatasets={[sampleDataset]}
        savedDashboards={[]}
        onLogout={vi.fn()}
        onNavigate={vi.fn()}
        onAddForecastToDashboard={vi.fn()}
      />,
    );
    expect(readyEn).toContain(translations.en.fcHorizonLabel);
    expect(readyEn).toContain(translations.en.fcHorizonCustomLabel);

    const readyAr = renderWithLanguage(
      'ar',
      <ForecastStudioPage
        currentUser={{ id: 'u1', email: 'a@b.com', first_name: 'سارة', last_name: 'علي', role: 'analyst' }}
        globalDatasets={[sampleDataset]}
        savedDashboards={[]}
        onLogout={vi.fn()}
        onNavigate={vi.fn()}
        onAddForecastToDashboard={vi.fn()}
      />,
    );
    expect(readyAr).toContain(translations.ar.fcHorizonLabel);
    expect(readyAr).toContain(translations.ar.fcHorizonCustomLabel);
  });

  it('surfaces empirical_cv_quantile vs heuristic_fallback interval notices and restricts scenario fields by template', () => {
    const baseCfg: ForecastConfiguration = {
      dateColumn: 'order_date',
      targetColumn: 'revenue',
      aggregation: 'sum',
      frequency: 'monthly',
      horizonDays: 180,
      horizonSteps: 6,
      model: 'ets',
      groupColumn: null,
      groupValue: null,
      confidenceLevel: '95',
    };

    const makeResult = (intervalMethod: string): ForecastResultRecord => ({
      id: `res_${intervalMethod}`,
      forecastId: 'fc_1',
      datasetVersionId: 'ver_abc123',
      selectedModel: 'ets',
      selectedModelLabel: 'Exponential Smoothing (ETS)',
      frequency: 'monthly',
      horizonDays: 180,
      horizonSteps: 6,
      historicalData: [{ date: '2025-01-01', value: 100, isObserved: true }],
      predictedData: [
        { date: '2025-02-01', value: 110, lower80: 95, upper80: 125, lower90: 90, upper90: 130, lower95: 85, upper95: 135 },
      ],
      predictionIntervals: {},
      summary: { lastActualValue: 100, totalForecastedValue: 660, averageForecastedValue: 110, projectedChangePct: 10 },
      evaluationMetrics: { mae: 4, rmse: 5, mase: 0.5, mape: 4, backtestingWindows: 3, trainingObservations: 24, validationObservations: 6, candidates: [] },
      modelMetadata: { intervalMethod, evaluatedConfiguration: baseCfg },
      dataQuality: {},
      warnings: [],
      notes: [],
      createdAt: '2025-01-01T00:00:00.000Z',
    });

    const empHtml = renderWithLanguage(
      'en',
      <ForecastResultsPanel
        inlineError={null}
        statusNotice={null}
        isLoadingList={false}
        isRunning={false}
        isScenarioBusy={false}
        latestResult={makeResult('empirical_cv_quantile')}
        activeForecast={null}
        selectedDataset={sampleDataset}
        config={baseCfg}
        historyWindow="all"
        activeScenario={null}
        activeScenarioId={null}
        valuePrefix="$"
        showMetricHelp={false}
        onDismissStatusNotice={vi.fn()}
        onChangeHistoryWindow={vi.fn()}
        onToggleMetricHelp={vi.fn()}
        onRunForecast={vi.fn()}
        onSelectScenario={vi.fn()}
        onCreateScenario={vi.fn()}
        onDeleteScenario={vi.fn()}
      />,
    );
    expect(empHtml).toContain('6 months');
    expect(empHtml).toContain('empirical rolling-origin backtest error quantiles');

    const fbHtml = renderWithLanguage(
      'en',
      <ForecastResultsPanel
        inlineError={null}
        statusNotice={null}
        isLoadingList={false}
        isRunning={false}
        isScenarioBusy={false}
        latestResult={makeResult('heuristic_fallback')}
        activeForecast={null}
        selectedDataset={sampleDataset}
        config={baseCfg}
        historyWindow="all"
        activeScenario={null}
        activeScenarioId={null}
        valuePrefix="$"
        showMetricHelp={false}
        onDismissStatusNotice={vi.fn()}
        onChangeHistoryWindow={vi.fn()}
        onToggleMetricHelp={vi.fn()}
        onRunForecast={vi.fn()}
        onSelectScenario={vi.fn()}
        onCreateScenario={vi.fn()}
        onDeleteScenario={vi.fn()}
      />,
    );
    expect(fbHtml).toContain(translations.en.fcIntervalNoteFallback);

    // Template-applicable scenario driver fields
    expect(getApplicableScenarioDrivers('sales')).toEqual({
      growthRateDeltaPct: true,
      volumeDeltaPct: true,
      priceChangePct: true,
      priceElasticity: true,
      costDeltaPct: false,
    });
    expect(getApplicableScenarioDrivers('expenses').costDeltaPct).toBe(true);
    expect(getApplicableScenarioDrivers('expenses').priceChangePct).toBe(false);

    const salesScenHtml = renderWithLanguage(
      'en',
      <ForecastScenariosPanel
        scenarios={[]}
        activeScenarioId={null}
        businessTemplate="sales"
        valuePrefix="$"
        isSubmitting={false}
        onSelectScenario={vi.fn()}
        onCreateScenario={vi.fn()}
        onDeleteScenario={vi.fn()}
      />,
    );
    expect(salesScenHtml).toContain(translations.en.fcAssumptionVolume);
    expect(salesScenHtml).toContain(translations.en.fcAssumptionPrice);
    expect(salesScenHtml).toContain(translations.en.fcAssumptionElasticity);
    expect(salesScenHtml).not.toContain(translations.en.fcAssumptionCost);

    const expenseScenHtml = renderWithLanguage(
      'en',
      <ForecastScenariosPanel
        scenarios={[]}
        activeScenarioId={null}
        businessTemplate="expenses"
        valuePrefix="$"
        isSubmitting={false}
        onSelectScenario={vi.fn()}
        onCreateScenario={vi.fn()}
        onDeleteScenario={vi.fn()}
      />,
    );
    expect(expenseScenHtml).toContain(translations.en.fcAssumptionCost);
    expect(expenseScenHtml).toContain(translations.en.fcAssumptionVolume);
    expect(expenseScenHtml).not.toContain(translations.en.fcAssumptionPrice);
    expect(expenseScenHtml).not.toContain(translations.en.fcAssumptionElasticity);
  });

  it('Step 3: renders reliability badge, plain-language typical error, Why this model, and collapses Technical details by default', () => {
    const cfg: ForecastConfiguration = {
      dateColumn: 'order_date',
      targetColumn: 'revenue',
      aggregation: 'sum',
      frequency: 'monthly',
      horizonDays: 180,
      horizonSteps: 6,
      model: 'auto',
      groupColumn: null,
      groupValue: null,
      confidenceLevel: '95',
    };
    const resWithRel: ForecastResultRecord = {
      id: 'res_rel',
      forecastId: 'fc_1',
      datasetVersionId: 'ver_abc123',
      selectedModel: 'ets',
      selectedModelLabel: 'Smooth Trend (ETS)',
      frequency: 'monthly',
      horizonDays: 180,
      horizonSteps: 6,
      historicalData: [{ date: '2025-01-01', value: 100, isObserved: true }],
      predictedData: [
        { date: '2025-02-01', value: 110, lower80: 95, upper80: 125, lower90: 90, upper90: 130, lower95: 85, upper95: 135 },
      ],
      predictionIntervals: {},
      summary: { lastActualValue: 100, totalForecastedValue: 660, averageForecastedValue: 110, projectedChangePct: 10 },
      evaluationMetrics: {
        mae: 4.5,
        rmse: 5.2,
        mase: 0.55,
        mape: 6.4,
        beatsBaseline: true,
        backtestingWindows: 4,
        trainingObservations: 36,
        validationObservations: 12,
        candidates: [
          {
            model: 'ets',
            label: 'ETS',
            status: 'evaluated',
            mae: 4.5,
            rmse: 5.2,
            mase: 0.55,
            mape: 6.4,
            beatsBaseline: true,
            backtestingWindows: 4,
            trainingObservations: 36,
            validationObservations: 12,
            selected: true,
          },
        ],
      },
      modelMetadata: { intervalMethod: 'empirical_cv_quantile', evaluatedConfiguration: cfg },
      reliability: {
        level: 'high',
        score: 88,
        reasons: ['Beat naive baseline on backtesting (MASE < 1.0)', 'At least 2 full seasonal cycles'],
        measuredCvCoverage: { '80': 0.81, '95': 0.94 },
      },
      dataQuality: {},
      warnings: [],
      notes: [],
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    const html = renderWithLanguage(
      'en',
      <ForecastResultsPanel
        inlineError={null}
        statusNotice={null}
        isLoadingList={false}
        isRunning={false}
        isScenarioBusy={false}
        latestResult={resWithRel}
        activeForecast={null}
        selectedDataset={sampleDataset}
        config={cfg}
        historyWindow="all"
        activeScenario={null}
        activeScenarioId={null}
        valuePrefix="$"
        showMetricHelp={false}
        onDismissStatusNotice={vi.fn()}
        onChangeHistoryWindow={vi.fn()}
        onToggleMetricHelp={vi.fn()}
        onRunForecast={vi.fn()}
        onSelectScenario={vi.fn()}
        onCreateScenario={vi.fn()}
        onDeleteScenario={vi.fn()}
      />,
    );
    expect(html).toContain(translations.en.fcReliabilityHigh);
    expect(html).toContain('Score: 88/100');
    expect(html).toContain('Typical error about 6.4% over the last 12 periods');
    expect(html).toContain(translations.en.fcWhyThisModel);
    expect(html).toContain(translations.en.fcTechnicalDetailsTitle);
    // Candidates table & MASE are inside collapsed Technical details disclosure by default
    expect(html).not.toContain('<table');
    expect(html).not.toContain('0.550');

    // When MAPE is null (zeros in series), falls back cleanly to unit error
    const unitRes: ForecastResultRecord = {
      ...resWithRel,
      evaluationMetrics: { ...resWithRel.evaluationMetrics, mape: null, mae: 3.25 },
    };
    const unitHtml = renderWithLanguage(
      'en',
      <ForecastResultsPanel
        inlineError={null}
        statusNotice={null}
        isLoadingList={false}
        isRunning={false}
        isScenarioBusy={false}
        latestResult={unitRes}
        activeForecast={null}
        selectedDataset={sampleDataset}
        config={cfg}
        historyWindow="all"
        activeScenario={null}
        activeScenarioId={null}
        valuePrefix="$"
        showMetricHelp={false}
        onDismissStatusNotice={vi.fn()}
        onChangeHistoryWindow={vi.fn()}
        onToggleMetricHelp={vi.fn()}
        onRunForecast={vi.fn()}
        onSelectScenario={vi.fn()}
        onCreateScenario={vi.fn()}
        onDeleteScenario={vi.fn()}
      />,
    );
    expect(unitHtml).toContain('Typical error about $3.25 units over the last 12 periods');
  });

  it('Step 4: exports CSV/Excel with headers, chosen confidence level, scenario columns, and formula-injection escaping', () => {
    expect(escapeSpreadsheetCell('=CMD()')).toBe("'=CMD()");
    expect(escapeSpreadsheetCell('+1+1')).toBe("'+1+1");
    expect(escapeSpreadsheetCell('-50')).toBe("'-50");
    expect(escapeSpreadsheetCell('@SUM(A1:A2)')).toBe("'@SUM(A1:A2)");
    expect(escapeSpreadsheetCell(-12.5)).toBe(-12.5);

    const maliciousName = '=HYPERLINK("http://evil.com","click")';
    const cfg: ForecastConfiguration = {
      dateColumn: 'order_date',
      targetColumn: 'revenue',
      aggregation: 'sum',
      frequency: 'monthly',
      horizonDays: 60,
      horizonSteps: 2,
      model: 'ets',
      groupColumn: null,
      groupValue: null,
      confidenceLevel: '80',
    };
    const result: ForecastResultRecord = {
      id: 'res_exp',
      forecastId: 'fc_exp',
      datasetVersionId: null,
      selectedModel: 'ets',
      selectedModelLabel: '+ETS',
      frequency: 'monthly',
      horizonDays: 60,
      horizonSteps: 2,
      historicalData: [],
      predictedData: [
        { date: '2025-02-01', value: 100, lower80: 90, upper80: 110, lower90: 85, upper90: 115, lower95: 80, upper95: 120 },
        { date: '2025-03-01', value: -5, lower80: -10, upper80: 0, lower90: -12, upper90: 2, lower95: -15, upper95: 5 },
      ],
      predictionIntervals: {},
      summary: {},
      evaluationMetrics: { mae: 2, rmse: 3, mase: 0.4, mape: 2, backtestingWindows: 2, trainingObservations: 20, validationObservations: 4, candidates: [] },
      modelMetadata: {},
      reliability: { level: 'high', score: 90, reasons: [] },
      dataQuality: {},
      warnings: [],
      notes: [],
      createdAt: '2025-01-31T12:00:00.000Z',
    };
    const forecast: ForecastRecord = {
      id: 'fc_exp',
      name: maliciousName,
      mode: 'general',
      businessTemplate: null,
      datasetId: 'ds_1',
      datasetVersionId: null,
      configuration: cfg,
      selectedModel: 'ets',
      status: 'completed',
      errorMessage: null,
      createdAt: '2025-01-31T12:00:00.000Z',
      updatedAt: '2025-01-31T12:00:00.000Z',
    };
    const scenario = {
      id: 'sc_1',
      forecastId: 'fc_exp',
      name: 'Promo',
      assumptions: { growthRateDeltaPct: 0 },
      scenarioResults: {
        predictedData: [
          { date: '2025-02-01', baselineValue: 100, value: 120, delta: 20, lower80: 108, upper80: 132, lower90: 102, upper90: 138, lower95: 96, upper95: 144 },
          { date: '2025-03-01', baselineValue: -5, value: -4, delta: 1, lower80: -9, upper80: 1, lower90: -11, upper90: 3, lower95: -14, upper95: 6 },
        ],
        summary: { baselineTotal: 95, scenarioTotal: 116, totalDelta: 21, totalDeltaPct: 22.1, endBaselineValue: -5, endScenarioValue: -4 },
        warnings: [],
        notes: [],
      },
      createdAt: '2025-01-31T12:00:00.000Z',
      updatedAt: '2025-01-31T12:00:00.000Z',
    };

    const rows = buildForecastExportRows({ forecast, result, confidenceLevel: '80', activeScenario: scenario });
    expect(rows[0][1]).toBe(`'${maliciousName}`);
    expect(rows[1][1]).toBe(`'+ETS`);
    expect(rows.some((r) => r[0] === 'Reliability' && r[1] === 'high (90/100)')).toBe(true);

    const csv = buildForecastCsvContent({ forecast, result, confidenceLevel: '80', activeScenario: scenario });
    expect(csv).toContain('date,forecast,lower,upper,scenario_forecast,scenario_lower,scenario_upper,scenario_delta');
    expect(csv).toContain('2025-02-01,100,90,110,120,108,132,20');
    // Negative numbers in CSV cells are also prefixed to prevent spreadsheet formula interpretation
    expect(csv).toContain("2025-03-01,'-5,'-10,0,'-4,'-9,1,1");
  });

  it('Step 5: ranks top 50 groups by volume, skips low-history groups cleanly, and renders batch summary table', async () => {
    const manyGroupRows: Array<Record<string, any>> = [];
    for (let g = 1; g <= 55; g++) {
      for (let d = 1; d <= 6; d++) {
        manyGroupRows.push({
          order_date: `2025-01-${String(d).padStart(2, '0')}`,
          revenue: g * 10,
          region: `Region_${g}`,
        });
      }
    }
    const bigDataset: Dataset = { ...sampleDataset, data: manyGroupRows, rowCount: manyGroupRows.length };
    const ranked = rankTopGroupsByVolume(bigDataset, 'order_date', 'revenue', 'region', 50);
    expect(ranked.length).toBe(50);
    expect(ranked[0].groupValue).toBe('Region_55');
    expect(ranked[49].groupValue).toBe('Region_6');

    const smallDs: Dataset = {
      ...sampleDataset,
      data: [
        { order_date: '2025-01-01', revenue: 500, region: 'Alpha' },
        { order_date: '2025-01-02', revenue: 510, region: 'Alpha' },
        { order_date: '2025-01-03', revenue: 520, region: 'Alpha' },
        { order_date: '2025-01-04', revenue: 530, region: 'Alpha' },
        { order_date: '2025-01-05', revenue: 540, region: 'Alpha' },
        { order_date: '2025-01-01', revenue: 20, region: 'Tiny' },
        { order_date: '2025-01-02', revenue: 25, region: 'Tiny' },
      ],
    };
    const baseCfg: ForecastConfiguration = {
      dateColumn: 'order_date',
      targetColumn: 'revenue',
      aggregation: 'sum',
      frequency: 'daily',
      horizonDays: 7,
      horizonSteps: 7,
      model: 'auto',
      groupColumn: 'region',
      groupValue: null,
      confidenceLevel: '95',
    };
    const items = await runBatchGroupForecasts({
      dataset: smallDs,
      baseName: 'Sales',
      mode: 'general',
      businessTemplate: null,
      config: baseCfg,
      maxConcurrentJobs: 2,
      runGroupForecast: async (payload) => ({
        id: `fc_${payload.configuration.groupValue}`,
        name: payload.name,
        mode: payload.mode,
        businessTemplate: payload.businessTemplate,
        datasetId: payload.datasetId,
        datasetVersionId: 'ver_1',
        configuration: payload.configuration,
        selectedModel: 'ets',
        status: 'completed',
        errorMessage: null,
        createdAt: '2025-01-05T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
        latestResult: {
          id: 'r1',
          forecastId: 'fc_Alpha',
          datasetVersionId: 'ver_1',
          selectedModel: 'ets',
          frequency: 'daily',
          horizonDays: 7,
          horizonSteps: 7,
          historicalData: [],
          predictedData: [],
          predictionIntervals: {},
          summary: { lastActualValue: 540, totalForecastedValue: 3900, projectedChangePct: 5.5 },
          evaluationMetrics: { mae: 2, rmse: 3, mase: 0.4, mape: 1, backtestingWindows: 2, trainingObservations: 5, validationObservations: 2, candidates: [] },
          modelMetadata: {},
          reliability: { level: 'medium', score: 72, reasons: [] },
          dataQuality: {},
          warnings: [],
          notes: [],
          createdAt: '2025-01-05T00:00:00Z',
        },
      }),
    });
    expect(items).toHaveLength(2);
    expect(items[0].status).toBe('completed');
    expect(items[0].forecastTotal).toBe(3900);
    expect(items[1].status).toBe('skipped');
    expect(items[1].skipReason).toMatch(/Insufficient history/i);
  });

  it('Step 6 & Step 7: renders calendar effects section & computes Forecast vs Actual accuracy card when new rows exist', () => {
    const cfg: ForecastConfiguration = {
      dateColumn: 'order_date',
      targetColumn: 'revenue',
      aggregation: 'sum',
      frequency: 'daily',
      horizonDays: 3,
      horizonSteps: 3,
      model: 'linear_regression',
      groupColumn: null,
      groupValue: null,
      confidenceLevel: '80',
      calendarEffects: { enabled: true, country: 'EG' },
    };

    const result: ForecastResultRecord = {
      id: 'res_fva',
      forecastId: 'fc_fva',
      datasetVersionId: 'ver_abc123',
      selectedModel: 'linear_regression',
      selectedModelLabel: 'Time-Indexed Regression',
      frequency: 'daily',
      horizonDays: 3,
      horizonSteps: 3,
      historicalData: [
        { date: '2025-01-01', value: 100, isObserved: true },
        { date: '2025-01-02', value: 105, isObserved: true },
      ],
      predictedData: [
        { date: '2025-01-03', value: 110, lower80: 95, upper80: 125, lower90: 90, upper90: 130, lower95: 85, upper95: 135 },
        { date: '2025-01-04', value: 115, lower80: 100, upper80: 130, lower90: 95, upper90: 135, lower95: 90, upper95: 140 },
        { date: '2025-01-05', value: 120, lower80: 105, upper80: 135, lower90: 100, upper90: 140, lower95: 95, upper95: 145 },
      ],
      predictionIntervals: {},
      summary: { lastActualDate: '2025-01-02', lastActualValue: 105, totalForecastedValue: 345, averageForecastedValue: 115, projectedChangePct: 14.3 },
      evaluationMetrics: { mae: 3, rmse: 4, mase: 0.5, mape: 3, backtestingWindows: 2, trainingObservations: 15, validationObservations: 4, candidates: [] },
      modelMetadata: { evaluatedConfiguration: cfg },
      calendarEffects: {
        enabled: true,
        country: 'EG',
        appliedToModel: 'linear_regression',
        effects: [{ id: 'ramadan', label: 'Ramadan', effect: 42.5, effectPct: 38.6, observedPeriods: 10 }],
      },
      dataQuality: {},
      warnings: [],
      notes: [],
      createdAt: '2025-01-02T00:00:00.000Z',
    };

    const updatedDataset: Dataset = {
      ...sampleDataset,
      data: [
        { order_date: '2025-01-01', revenue: 100 },
        { order_date: '2025-01-02', revenue: 105 },
        { order_date: '2025-01-03', revenue: 121 }, // within [95, 125], error = 11/121 = 9.09%
        { order_date: '2025-01-04', revenue: 115 }, // within [100, 130], error = 0%
      ],
    };

    const summary = evaluateForecastVsActual(updatedDataset, result, cfg);
    expect(summary).not.toBeNull();
    expect(summary?.matchedPeriods).toBe(2);
    expect(summary?.within80All).toBe(true);
    expect(summary?.within80Count).toBe(2);
    expect(summary?.meanAbsPctError).toBeCloseTo(4.5, 1);

    const html = renderWithLanguage(
      'en',
      <ForecastResultsPanel
        inlineError={null}
        statusNotice={null}
        isLoadingList={false}
        isRunning={false}
        isScenarioBusy={false}
        latestResult={result}
        activeForecast={null}
        selectedDataset={updatedDataset}
        config={cfg}
        historyWindow="all"
        activeScenario={null}
        activeScenarioId={null}
        valuePrefix="$"
        showMetricHelp={false}
        onDismissStatusNotice={vi.fn()}
        onChangeHistoryWindow={vi.fn()}
        onToggleMetricHelp={vi.fn()}
        onRunForecast={vi.fn()}
        onSelectScenario={vi.fn()}
        onCreateScenario={vi.fn()}
        onDeleteScenario={vi.fn()}
      />,
    );
    expect(html).toContain(translations.en.fcActualAccuracyTitle);
    expect(html).toContain('Realized error: 4.5% across 2 new period(s)');
    expect(html).toContain('Actuals stayed within the 80% expected range (2/2).');
    expect(html).toContain(translations.en.fcCalendarEffectsTitle.replace('&', '&amp;'));
    expect(html).toContain('Ramadan');
    expect(html).toContain(translations.en.fcDownloadCsvBtn);
    expect(html).toContain(translations.en.fcDownloadExcelBtn);
  });
});

