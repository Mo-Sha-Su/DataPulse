import { Dataset } from '../types/dashboard';
import {
  BusinessTemplateId,
  ForecastAggregation,
  ForecastFrequency,
  ForecastHorizonDays,
  ForecastModelId,
} from '../types/forecast';

export type BusinessTemplateDomain = 'sales' | 'finance' | 'inventory' | 'marketing' | 'general';

export interface BusinessForecastTemplate {
  id: BusinessTemplateId;
  domain: BusinessTemplateDomain;
  titleKey: string;
  descKey: string;
  keywords: string[];
  defaultAggregation: ForecastAggregation;
  defaultHorizonDays: ForecastHorizonDays;
  recommendedFrequency: ForecastFrequency;
  valuePrefix?: string;
  valueSuffix?: string;
  limitationNoteKey?: string;
  defaultAssumptions: {
    growthRateDeltaPct: number;
    volumeDeltaPct: number;
    priceChangePct: number;
    priceElasticity: number;
    costDeltaPct: number;
  };
}

export interface BusinessForecastPreset {
  id: string;
  domain: BusinessTemplateDomain;
  templateId: BusinessTemplateId;
  titleKey: string;
  descKey: string;
  keywords: string[];
  groupKeywords?: string[];
  defaultAggregation: ForecastAggregation;
  defaultHorizonDays: ForecastHorizonDays;
  valuePrefix?: string;
  limitationNoteKey?: string;
}

export const BUSINESS_DOMAIN_LABELS: Array<{ id: BusinessTemplateDomain; titleKey: string }> = [
  { id: 'sales', titleKey: 'fcDomainSales' },
  { id: 'finance', titleKey: 'fcDomainFinance' },
  { id: 'inventory', titleKey: 'fcDomainInventory' },
  { id: 'marketing', titleKey: 'fcDomainMarketing' },
  { id: 'general', titleKey: 'fcDomainGeneral' },
];

export const BUSINESS_FORECAST_TEMPLATES: BusinessForecastTemplate[] = [
  {
    id: 'sales',
    domain: 'sales',
    titleKey: 'fcTplSalesTitle',
    descKey: 'fcTplSalesDesc',
    keywords: ['sales', 'amount', 'total_sales', 'order_value', 'gross_sales', 'units_sold', 'مبيعات'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
    recommendedFrequency: 'auto',
    valuePrefix: '$',
    defaultAssumptions: { growthRateDeltaPct: 1, volumeDeltaPct: 10, priceChangePct: 0, priceElasticity: 0, costDeltaPct: 0 },
  },
  {
    id: 'revenue',
    domain: 'finance',
    titleKey: 'fcTplRevenueTitle',
    descKey: 'fcTplRevenueDesc',
    keywords: ['revenue', 'rev', 'arr', 'mrr', 'income', 'turnover', 'إيرادات', 'ايرادات'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
    recommendedFrequency: 'auto',
    valuePrefix: '$',
    defaultAssumptions: { growthRateDeltaPct: 2, volumeDeltaPct: 8, priceChangePct: 5, priceElasticity: 0, costDeltaPct: 0 },
  },
  {
    id: 'profit',
    domain: 'finance',
    titleKey: 'fcTplProfitTitle',
    descKey: 'fcTplProfitDesc',
    keywords: ['profit', 'net_profit', 'margin', 'ebitda', 'earnings', 'net_income', 'ربح', 'أرباح'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
    recommendedFrequency: 'auto',
    valuePrefix: '$',
    defaultAssumptions: { growthRateDeltaPct: 0, volumeDeltaPct: 5, priceChangePct: 0, priceElasticity: 0, costDeltaPct: -5 },
  },
  {
    id: 'expenses',
    domain: 'finance',
    titleKey: 'fcTplExpensesTitle',
    descKey: 'fcTplExpensesDesc',
    keywords: ['expense', 'expenses', 'cost', 'opex', 'spend', 'cogs', 'مصروفات', 'تكلفة'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
    recommendedFrequency: 'auto',
    valuePrefix: '$',
    defaultAssumptions: { growthRateDeltaPct: 0, volumeDeltaPct: 0, priceChangePct: 0, priceElasticity: 0, costDeltaPct: -8 },
  },
  {
    id: 'inventory',
    domain: 'inventory',
    titleKey: 'fcTplInventoryTitle',
    descKey: 'fcTplInventoryDesc',
    keywords: ['inventory', 'stock', 'stock_level', 'on_hand', 'qty', 'warehouse', 'مخزون'],
    defaultAggregation: 'avg',
    defaultHorizonDays: 30,
    recommendedFrequency: 'auto',
    limitationNoteKey: 'fcTplInventoryLimitation',
    defaultAssumptions: { growthRateDeltaPct: 0, volumeDeltaPct: 10, priceChangePct: 0, priceElasticity: 0, costDeltaPct: 0 },
  },
  {
    id: 'demand',
    domain: 'inventory',
    titleKey: 'fcTplDemandTitle',
    descKey: 'fcTplDemandDesc',
    keywords: ['demand', 'orders', 'quantity', 'units', 'bookings', 'volume', 'طلب', 'طلبات'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 30,
    recommendedFrequency: 'auto',
    limitationNoteKey: 'fcTplInventoryLimitation',
    defaultAssumptions: { growthRateDeltaPct: 1, volumeDeltaPct: 12, priceChangePct: 0, priceElasticity: 0, costDeltaPct: 0 },
  },
  {
    id: 'website_traffic',
    domain: 'marketing',
    titleKey: 'fcTplTrafficTitle',
    descKey: 'fcTplTrafficDesc',
    keywords: ['traffic', 'visits', 'visitors', 'sessions', 'pageviews', 'clicks', 'users', 'زيارات'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 30,
    recommendedFrequency: 'auto',
    defaultAssumptions: { growthRateDeltaPct: 2, volumeDeltaPct: 15, priceChangePct: 0, priceElasticity: 0, costDeltaPct: 0 },
  },
  {
    id: 'general_business',
    domain: 'general',
    titleKey: 'fcTplGeneralBizTitle',
    descKey: 'fcTplGeneralBizDesc',
    keywords: ['kpi', 'metric', 'value', 'total', 'score', 'balance'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
    recommendedFrequency: 'auto',
    defaultAssumptions: { growthRateDeltaPct: 1, volumeDeltaPct: 5, priceChangePct: 0, priceElasticity: 0, costDeltaPct: 0 },
  },
];

export const BUSINESS_FORECAST_PRESETS: BusinessForecastPreset[] = [
  // Sales domain
  {
    id: 'sales_revenue',
    domain: 'sales',
    templateId: 'sales',
    titleKey: 'fcPresetSalesRevenue',
    descKey: 'fcTplSalesDesc',
    keywords: ['sales', 'amount', 'total_sales', 'order_value', 'gross_sales', 'revenue', 'مبيعات'],
    groupKeywords: ['product', 'sku', 'item', 'category', 'region', 'territory', 'country', 'المنتج', 'المنطقة'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
    valuePrefix: '$',
  },
  {
    id: 'sales_volume',
    domain: 'sales',
    templateId: 'sales',
    titleKey: 'fcPresetSalesVolume',
    descKey: 'fcPresetSalesVolumeDesc',
    keywords: ['units_sold', 'volume', 'quantity', 'qty', 'orders', 'units', 'الكمية', 'الوحدات'],
    groupKeywords: ['product', 'sku', 'item', 'category', 'region', 'territory', 'country', 'المنتج', 'المنطقة'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
  },
  // Finance domain
  {
    id: 'finance_revenue',
    domain: 'finance',
    templateId: 'revenue',
    titleKey: 'fcTplRevenueTitle',
    descKey: 'fcTplRevenueDesc',
    keywords: ['revenue', 'rev', 'arr', 'mrr', 'income', 'turnover', 'إيرادات', 'ايرادات'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
    valuePrefix: '$',
  },
  {
    id: 'finance_expenses',
    domain: 'finance',
    templateId: 'expenses',
    titleKey: 'fcTplExpensesTitle',
    descKey: 'fcTplExpensesDesc',
    keywords: ['expense', 'expenses', 'cost', 'opex', 'spend', 'cogs', 'مصروفات', 'تكلفة'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
    valuePrefix: '$',
  },
  {
    id: 'finance_profit',
    domain: 'finance',
    templateId: 'profit',
    titleKey: 'fcTplProfitTitle',
    descKey: 'fcTplProfitDesc',
    keywords: ['profit', 'net_profit', 'margin', 'ebitda', 'earnings', 'net_income', 'ربح', 'أرباح'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
    valuePrefix: '$',
  },
  // Inventory domain
  {
    id: 'inventory_trends',
    domain: 'inventory',
    templateId: 'inventory',
    titleKey: 'fcPresetInventoryTrends',
    descKey: 'fcTplInventoryDesc',
    keywords: ['inventory', 'stock', 'stock_level', 'on_hand', 'warehouse', 'مخزون'],
    groupKeywords: ['sku', 'product', 'item', 'warehouse', 'category'],
    defaultAggregation: 'avg',
    defaultHorizonDays: 30,
    limitationNoteKey: 'fcTplInventoryLimitation',
  },
  {
    id: 'stock_consumption',
    domain: 'inventory',
    templateId: 'inventory',
    titleKey: 'fcPresetStockConsumption',
    descKey: 'fcPresetStockConsumptionDesc',
    keywords: ['consumption', 'usage', 'outflow', 'issued', 'shipped', 'used', 'استهلاك'],
    groupKeywords: ['sku', 'product', 'item', 'warehouse'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 30,
    limitationNoteKey: 'fcTplInventoryLimitation',
  },
  {
    id: 'product_demand',
    domain: 'inventory',
    templateId: 'demand',
    titleKey: 'fcTplDemandTitle',
    descKey: 'fcTplDemandDesc',
    keywords: ['demand', 'orders', 'quantity', 'units', 'bookings', 'طلب', 'طلبات'],
    groupKeywords: ['product', 'sku', 'category', 'region'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 30,
    limitationNoteKey: 'fcTplInventoryLimitation',
  },
  // Marketing domain
  {
    id: 'website_traffic',
    domain: 'marketing',
    templateId: 'website_traffic',
    titleKey: 'fcTplTrafficTitle',
    descKey: 'fcTplTrafficDesc',
    keywords: ['traffic', 'visits', 'visitors', 'sessions', 'pageviews', 'clicks', 'زيارات'],
    groupKeywords: ['channel', 'source', 'campaign', 'medium'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 30,
  },
  {
    id: 'marketing_leads',
    domain: 'marketing',
    templateId: 'general_business',
    titleKey: 'fcPresetMarketingLeads',
    descKey: 'fcPresetMarketingLeadsDesc',
    keywords: ['leads', 'lead', 'mql', 'sql', 'signups', 'registrations', 'inquiries', 'عملاء محتملون'],
    groupKeywords: ['channel', 'source', 'campaign'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 30,
  },
  {
    id: 'marketing_conversions',
    domain: 'marketing',
    templateId: 'general_business',
    titleKey: 'fcPresetMarketingConversions',
    descKey: 'fcPresetMarketingConversionsDesc',
    keywords: ['conversion', 'conversions', 'converted', 'purchases', 'checkouts', 'تحويلات'],
    groupKeywords: ['channel', 'source', 'campaign'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 30,
  },
  // General domain
  {
    id: 'general_business',
    domain: 'general',
    templateId: 'general_business',
    titleKey: 'fcTplGeneralBizTitle',
    descKey: 'fcTplGeneralBizDesc',
    keywords: ['kpi', 'metric', 'value', 'total', 'score', 'balance'],
    defaultAggregation: 'sum',
    defaultHorizonDays: 90,
  },
];

export const ALL_HORIZON_DAYS: ForecastHorizonDays[] = [7, 30, 90, 180, 365];

export const VALID_HORIZONS_BY_FREQUENCY: Record<ForecastFrequency, ForecastHorizonDays[]> = {
  auto: [7, 30, 90, 180, 365],
  daily: [7, 30, 90, 180, 365],
  weekly: [7, 30, 90, 180, 365],
  monthly: [30, 90, 180, 365],
  quarterly: [90, 180, 365],
  yearly: [365],
};

export function getValidHorizonsForFrequency(frequency: ForecastFrequency): ForecastHorizonDays[] {
  return VALID_HORIZONS_BY_FREQUENCY[frequency] || ALL_HORIZON_DAYS;
}

export function coerceValidHorizon(frequency: ForecastFrequency, desired: ForecastHorizonDays): ForecastHorizonDays {
  const valid = getValidHorizonsForFrequency(frequency);
  if (valid.includes(desired)) return desired;
  return valid[0] ?? 365;
}

export const PRESET_HORIZON_STEPS_BY_FREQUENCY: Record<ForecastFrequency, number[]> = {
  auto: [7, 14, 30, 90],
  daily: [7, 14, 30, 90],
  weekly: [4, 8, 13, 26],
  monthly: [3, 6, 12, 24],
  quarterly: [2, 4, 8],
  yearly: [1, 3, 5],
};

export const MAX_HORIZON_STEPS_BY_FREQUENCY: Record<ForecastFrequency, number> = {
  auto: 365,
  daily: 365,
  weekly: 104,
  monthly: 36,
  quarterly: 12,
  yearly: 5,
};

export const DAYS_PER_STEP_BY_FREQUENCY: Record<ForecastFrequency, number> = {
  auto: 1,
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export function getPresetHorizonStepsForFrequency(frequency: ForecastFrequency): number[] {
  return PRESET_HORIZON_STEPS_BY_FREQUENCY[frequency] || PRESET_HORIZON_STEPS_BY_FREQUENCY.daily;
}

export function getMaxHorizonStepsForFrequency(frequency: ForecastFrequency): number {
  return MAX_HORIZON_STEPS_BY_FREQUENCY[frequency] ?? 365;
}

export function coerceValidHorizonSteps(frequency: ForecastFrequency, desiredSteps?: number | null): number {
  const maxSteps = getMaxHorizonStepsForFrequency(frequency);
  const presets = getPresetHorizonStepsForFrequency(frequency);
  const num = Number(desiredSteps);
  if (!Number.isFinite(num) || num < 1) {
    return presets[Math.min(1, presets.length - 1)] ?? 1;
  }
  return Math.max(1, Math.min(maxSteps, Math.round(num)));
}

export function horizonDaysToSteps(frequency: ForecastFrequency, horizonDays: number): number {
  const divisor = DAYS_PER_STEP_BY_FREQUENCY[frequency] || 1;
  return coerceValidHorizonSteps(frequency, Math.max(1, Math.round(horizonDays / divisor)));
}

export function horizonStepsToApproxDays(frequency: ForecastFrequency, steps: number): number {
  const mult = DAYS_PER_STEP_BY_FREQUENCY[frequency] || 1;
  return Math.max(1, Math.round(steps * mult));
}

export function getPeriodUnitTranslationKey(frequency?: ForecastFrequency | string | null): string {
  switch (frequency) {
    case 'daily':
      return 'fcPeriodUnitDaily';
    case 'weekly':
      return 'fcPeriodUnitWeekly';
    case 'monthly':
      return 'fcPeriodUnitMonthly';
    case 'quarterly':
      return 'fcPeriodUnitQuarterly';
    case 'yearly':
      return 'fcPeriodUnitYearly';
    default:
      return 'fcPeriodUnitAuto';
  }
}

export interface ApplicableScenarioDrivers {
  growthRateDeltaPct: boolean;
  volumeDeltaPct: boolean;
  priceChangePct: boolean;
  priceElasticity: boolean;
  costDeltaPct: boolean;
}

export function getApplicableScenarioDrivers(
  businessTemplate: BusinessTemplateId | null | undefined,
): ApplicableScenarioDrivers {
  const hasPrice = businessTemplate === 'sales' || businessTemplate === 'revenue' || businessTemplate === 'profit';
  const hasCost = businessTemplate === 'expenses' || businessTemplate === 'profit';
  return {
    growthRateDeltaPct: true,
    volumeDeltaPct: true,
    priceChangePct: hasPrice,
    priceElasticity: hasPrice,
    costDeltaPct: hasCost,
  };
}

export const FORECAST_MODELS_INFO: Array<{
  id: ForecastModelId;
  labelKey: string;
  descKey: string;
  seasonal: boolean;
}> = [
  { id: 'auto', labelKey: 'fcModelAuto', descKey: 'fcModelAutoDesc', seasonal: false },
  { id: 'naive', labelKey: 'fcModelNaive', descKey: 'fcModelNaiveDesc', seasonal: false },
  { id: 'seasonal_naive', labelKey: 'fcModelSeasonalNaive', descKey: 'fcModelSeasonalNaiveDesc', seasonal: true },
  { id: 'moving_average', labelKey: 'fcModelMovingAvg', descKey: 'fcModelMovingAvgDesc', seasonal: false },
  { id: 'ets', labelKey: 'fcModelEts', descKey: 'fcModelEtsDesc', seasonal: false },
  { id: 'holt_winters', labelKey: 'fcModelHoltWinters', descKey: 'fcModelHoltWintersDesc', seasonal: true },
  { id: 'arima', labelKey: 'fcModelArima', descKey: 'fcModelArimaDesc', seasonal: false },
  { id: 'sarima', labelKey: 'fcModelSarima', descKey: 'fcModelSarimaDesc', seasonal: true },
  { id: 'linear_regression', labelKey: 'fcModelLinearReg', descKey: 'fcModelLinearRegDesc', seasonal: false },
  { id: 'tsb', labelKey: 'fcModelTsb', descKey: 'fcModelTsbDesc', seasonal: false },
];

export function findBestDateColumn(dataset?: Dataset | null): string {
  if (!dataset || !dataset.columns?.length) return '';
  const exactDateCol = dataset.columns.find((c) => c.type === 'date');
  if (exactDateCol) return exactDateCol.name;
  const namedDateCol = dataset.columns.find((c) =>
    /^(date|timestamp|created_at|order_date|period|month|week|day|year|dt)$/i.test(c.name.trim()) ||
    /(date|time|month|quarter|period)/i.test(c.name)
  );
  return namedDateCol?.name || dataset.columns[0]?.name || '';
}

export function findBestTargetColumn(
  dataset?: Dataset | null,
  templateId?: BusinessTemplateId | null,
): string {
  if (!dataset || !dataset.columns?.length) return '';
  const numCols = dataset.columns.filter((c) => c.type === 'number');
  const pool = numCols.length > 0 ? numCols : dataset.columns;

  if (templateId) {
    const tpl = BUSINESS_FORECAST_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      for (const kw of tpl.keywords) {
        const hit = pool.find((c) => c.name.toLowerCase().includes(kw));
        if (hit) return hit.name;
      }
    }
  }
  return numCols[0]?.name || dataset.columns[1]?.name || dataset.columns[0]?.name || '';
}

export function findBestTargetColumnForPreset(
  dataset?: Dataset | null,
  presetId?: string | null,
): string {
  const preset = presetId ? BUSINESS_FORECAST_PRESETS.find((p) => p.id === presetId) : null;
  if (!preset) return findBestTargetColumn(dataset, null);
  if (!dataset || !dataset.columns?.length) return '';
  const numCols = dataset.columns.filter((c) => c.type === 'number');
  const pool = numCols.length > 0 ? numCols : dataset.columns;
  for (const kw of preset.keywords) {
    const hit = pool.find((c) => c.name.toLowerCase().includes(kw));
    if (hit) return hit.name;
  }
  return findBestTargetColumn(dataset, preset.templateId);
}

export function findSuggestedGroupColumns(
  dataset?: Dataset | null,
  keywords: string[] = ['product', 'sku', 'item', 'category', 'region', 'territory', 'country', 'channel'],
): string[] {
  if (!dataset || !dataset.columns?.length) return [];
  const textCols = dataset.columns.filter((c) => c.type === 'string');
  const matched = textCols.filter((c) =>
    keywords.some((kw) => c.name.toLowerCase().includes(kw)),
  );
  return (matched.length > 0 ? matched : textCols).slice(0, 4).map((c) => c.name);
}
