export type ForecastMode = 'general' | 'business';

export type BusinessTemplateId =
  | 'sales'
  | 'revenue'
  | 'profit'
  | 'expenses'
  | 'inventory'
  | 'demand'
  | 'website_traffic'
  | 'general_business';

export type ForecastFrequency = 'auto' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ConcreteForecastFrequency = Exclude<ForecastFrequency, 'auto'>;

export type ForecastAggregation = 'sum' | 'avg' | 'count' | 'min' | 'max';

export type ForecastHorizonDays = 7 | 30 | 90 | 180 | 365;

export type ForecastModelId =
  | 'auto'
  | 'naive'
  | 'seasonal_naive'
  | 'moving_average'
  | 'ets'
  | 'holt_winters'
  | 'arima'
  | 'sarima'
  | 'linear_regression'
  | 'tsb';

export type ForecastConfidenceLevel = '80' | '90' | '95';

export type CalendarEffectCountry = 'EG' | 'SA' | 'AE' | 'US' | 'GB';

export interface ForecastCalendarEffectsConfig {
  enabled: boolean;
  country?: CalendarEffectCountry;
}

export interface ForecastReliability {
  level: 'high' | 'medium' | 'low';
  score: number;
  reasons: string[];
  measuredCvCoverage?: Record<string, number> | null;
}

export interface ForecastCalendarEffectItem {
  id: string;
  label: string;
  effect: number;
  effectPct: number | null;
  observedPeriods: number;
}

export interface ForecastCalendarEffectsSummary {
  enabled: boolean;
  country: CalendarEffectCountry;
  appliedToModel?: string;
  effects: ForecastCalendarEffectItem[];
}

export interface ForecastConfiguration {
  dateColumn: string;
  targetColumn: string;
  aggregation: ForecastAggregation;
  frequency: ForecastFrequency;
  horizonDays: number;
  horizonSteps?: number;
  model: ForecastModelId;
  groupColumn?: string | null;
  groupValue?: string | null;
  confidenceLevel: ForecastConfidenceLevel;
  calendarEffects?: ForecastCalendarEffectsConfig;
}

export interface ForecastHistoricalPoint {
  date: string;
  value: number;
  isObserved: boolean;
}

export interface ForecastPredictedPoint {
  date: string;
  value: number;
  lower80: number;
  upper80: number;
  lower90: number;
  upper90: number;
  lower95: number;
  upper95: number;
}

export interface ForecastCandidateEvaluation {
  model: string;
  label: string;
  status: 'evaluated' | 'skipped' | 'failed';
  skipReason?: string | null;
  mae: number | null;
  rmse: number | null;
  mase: number | null;
  mape: number | null;
  beatsBaseline: boolean | null;
  backtestingWindows: number;
  trainingObservations: number;
  validationObservations: number;
  selected: boolean;
}

export interface ForecastResultRecord {
  id: string;
  forecastId: string;
  datasetVersionId: string | null;
  selectedModel: string;
  selectedModelLabel?: string;
  frequency: ConcreteForecastFrequency;
  horizonDays: number;
  horizonSteps: number;
  trainingPeriod?: {
    start: string;
    end: string;
    observedPeriods: number;
    calendarPeriods: number;
  };
  historicalData: ForecastHistoricalPoint[];
  predictedData: ForecastPredictedPoint[];
  predictionIntervals: Record<string, Array<{ lower: number; upper: number }>>;
  summary: {
    lastActualDate?: string;
    lastActualValue?: number;
    firstPredictedValue?: number;
    endPredictedValue?: number;
    totalForecastedValue?: number;
    averageForecastedValue?: number;
    projectedChangePct?: number | null;
    expectedRange95Start?: [number, number];
    expectedRange95End?: [number, number];
  };
  evaluationMetrics: {
    mae: number | null;
    rmse: number | null;
    mase: number | null;
    mape: number | null;
    mapeNote?: string | null;
    beatsBaseline?: boolean | null;
    backtestingWindows: number;
    trainingObservations: number;
    validationObservations: number;
    cvHorizonSteps?: number;
    candidates: ForecastCandidateEvaluation[];
  };
  modelMetadata: {
    fitDetails?: Record<string, any>;
    intervalMethod?: string;
    intervalCalibrationFactor?: number;
    intervalCalibrationScales?: Record<string, number>;
    nonNegativeClamped?: boolean;
    businessDaysOnly?: boolean;
    availableModels?: string[];
    seasonalityEnabled?: boolean;
    availableGroups?: string[];
    selectedGroup?: string | null;
    evaluatedConfiguration?: Partial<ForecastConfiguration>;
    reliability?: ForecastReliability | null;
    calendarEffects?: ForecastCalendarEffectsSummary | null;
    trainingPeriod?: {
      start: string;
      end: string;
      observedPeriods: number;
      calendarPeriods: number;
    };
  };
  reliability?: ForecastReliability | null;
  calendarEffects?: ForecastCalendarEffectsSummary | null;
  dataQuality: {
    rawRowCount?: number;
    validRowCount?: number;
    observedPeriods?: number;
    calendarPeriods?: number;
    invalidDateCount?: number;
    invalidTargetCount?: number;
    duplicateTimestampCount?: number;
    periodCollapsedCount?: number;
    missingPeriodCount?: number;
    missingPeriods?: string[];
    unsortedInput?: boolean;
    zeroCount?: number;
    negativeCount?: number;
    outlierCount?: number;
    outlierDates?: string[];
  };
  warnings: string[];
  notes: string[];
  createdAt: string;
}

export interface ForecastScenarioAssumptions {
  growthRateDeltaPct: number;
  volumeDeltaPct?: number;
  priceChangePct?: number;
  priceElasticity?: number;
  costDeltaPct?: number;
  // Legacy keys preserved for backward compatibility with stored scenarios
  salesDeltaPct?: number;
  demandDeltaPct?: number;
  expenseDeltaPct?: number;
}

export interface ForecastScenarioRecord {
  id: string;
  forecastId: string;
  name: string;
  assumptions: ForecastScenarioAssumptions;
  scenarioResults: {
    predictedData: Array<{
      date: string;
      baselineValue: number;
      value: number;
      delta: number;
      lower80: number;
      upper80: number;
      lower90: number;
      upper90: number;
      lower95: number;
      upper95: number;
    }>;
    summary: {
      baselineTotal: number;
      scenarioTotal: number;
      totalDelta: number;
      totalDeltaPct: number | null;
      endBaselineValue: number;
      endScenarioValue: number;
    };
    warnings: string[];
    notes: string[];
  };
  baselineResultId?: string | null;
  isStale?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastRecord {
  id: string;
  name: string;
  mode: ForecastMode;
  businessTemplate: BusinessTemplateId | null;
  datasetId: string;
  datasetVersionId: string | null;
  configuration: ForecastConfiguration;
  selectedModel: string | null;
  status: 'draft' | 'running' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  latestResult?: ForecastResultRecord | null;
  scenarios?: ForecastScenarioRecord[];
}

export interface FrequencyDetectionResponse {
  detectedFrequency: ConcreteForecastFrequency | null;
  confidence: number;
  needsOverride: boolean;
  message: string;
  details: Record<string, any>;
  availableGroups: string[];
  validObservations: number;
  warnings: string[];
}

export interface ForecastLimits {
  maxObservations: number;
  maxHorizonDays: number;
  maxHorizonStepsByFrequency?: Record<string, number>;
  maxConcurrentJobs: number;
  timeoutMs: number;
}
