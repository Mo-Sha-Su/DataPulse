import { DataModelState } from './dataModel';

export type WidgetCategory = 'charts' | 'analytics' | '3d';

export type ChartWidgetType = 
  | 'bar' 
  | 'line' 
  | 'pie' 
  | 'scatter' 
  | 'bubble' 
  | 'histogram' 
  | 'heatmap' 
  | 'boxplot';

export type AnalyticsWidgetType = 
  | 'kpi' 
  | 'metric' 
  | 'funnel' 
  | 'treemap' 
  | 'gauge' 
  | 'sparkline' 
  | 'progress' 
  | 'target_vs_actual' 
  | 'candlestick' 
  | 'ohlc' 
  | 'waterfall'
  | 'forecast';

export type ThreeDWidgetType = 
  | 'scatter3d' 
  | 'surface3d' 
  | 'mesh3d' 
  | 'line3d' 
  | 'bar3d' 
  | 'bubble3d' 
  | 'contour3d' 
  | 'volume3d' 
  | 'cone3d' 
  | 'streamtube3d' 
  | 'isosurface3d';

export type TextWidgetType = 'textbox';

export type WidgetType = ChartWidgetType | AnalyticsWidgetType | ThreeDWidgetType | TextWidgetType;

export type AggregationMethod = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct_count' | 'none';

export type NumberFormatType = 'number' | 'currency' | 'percentage' | 'compact';

export interface DataFilter {
  id: string;
  datasetId?: string;
  column: string;                 // plain "Column" or "Table.Column"
  values?: (string | number)[];   // pick-list: row matches if value equals ANY of these
  min?: number;                   // numeric range, inclusive
  max?: number;
}

export interface WidgetConfig {
  datasetId: string;
  xAxisField: string;
  yAxisField: string;
  zAxisField?: string; // For bubble z-axis, 3D Z-axis, or secondary color
  secondaryField?: string; // For high/low, target, secondary values
  aggregation: AggregationMethod;
  numberFormat: NumberFormatType;
  currencySymbol?: string;
  title: string;
  titleColor: string;
  primaryColor: string;
  colorPalette: string[];
  backgroundColor: string;
  
  // Specific Options
  horizontal?: boolean;
  showMarkers?: boolean;
  smoothLines?: boolean;
  donutStyle?: boolean;
  showPercentages?: boolean;
  showTrendline?: boolean;
  binCount?: number;
  density?: boolean;
  cumulative?: boolean;
  targetValue?: number;
  goalValue?: number;
  maxValue?: number;
  subtitle?: string;
  comparisonLabel?: string;
  sparklineType?: 'line' | 'bar';
  prefix?: string;
  suffix?: string;
  sortBy?: 'none' | 'asc' | 'desc';
  colorScale?: string;
  fillLine?: boolean;
  
  // Text Box / Annotation Options
  textContent?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isItalic?: boolean;

  // Forecast Studio Widget Options
  forecastId?: string;
  forecastConfidenceLevel?: '80' | '90' | '95';
  forecastScenarioId?: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  category: WidgetCategory;
  title: string;
  position: WidgetPosition;
  config: WidgetConfig;
  pageId?: string;
}

export interface DatasetColumn {
  name: string;
  type: 'number' | 'string' | 'date';
  sampleValue: any;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  rowCount: number;
  columnCount: number;
  columns: DatasetColumn[];
  data: Record<string, any>[];
  cleanedData?: Record<string, any>[];
  cleaningPipeline?: any[];
  uploadedAt: string;
  sourceType: 'sample' | 'csv' | 'excel';
  tags?: string[];
  current_version_id?: string | null;
}

export type ImageFitOption = 'cover' | 'contain' | 'tile' | 'stretch';

export type PageUnit = 'mm' | 'cm' | 'in' | 'px';
export type PageOrientation = 'portrait' | 'landscape';
export type ReportPageSizePreset =
  | 'A4 Portrait'
  | 'A4 Landscape'
  | 'A3 Portrait'
  | 'A3 Landscape'
  | 'Letter Portrait'
  | 'Letter Landscape'
  | 'Legal Portrait'
  | 'Legal Landscape'
  | 'Custom Size';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit: PageUnit;
}

export interface CanvasSettings {
  presetName: string;
  width: number;
  height: number;
  zoom: number; // 0.25 to 2.0
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundColor: string;
  gradientValue: string;
  imageUrl: string;
  imageFit: ImageFitOption;
  showGrid: boolean;
  snapToGrid: boolean;
  gridGap: number;

  // Document / Report Specific Properties
  pageSizePreset?: ReportPageSizePreset;
  orientation?: PageOrientation;
  unit?: PageUnit;
  widthPhysical?: number;
  heightPhysical?: number;
  margins?: PageMargins;
  fitMode?: 'custom' | 'page' | 'width';
}

export type ProjectType = 'dashboard' | 'report';

export interface ReportPage {
  id: string;
  name: string;
  description?: string;
}

export interface DashboardState {
  id: string;
  name: string;
  description: string;
  type?: ProjectType;
  usedFor?: string;
  thumbnail?: string;
  createdAt?: string;
  lastAccessed?: string;
  widgets: Widget[];
  datasets: Dataset[];
  selectedDatasetIds?: string[];
  dataModel?: DataModelState;
  canvas: CanvasSettings;
  globalFilters?: DataFilter[];
  updatedAt: string;
  pages?: ReportPage[];
  activePageId?: string;
}

export interface WidgetTypeDefinition {
  type: WidgetType;
  name: string;
  category: WidgetCategory;
  description: string;
  iconName: string;
  defaultWidth: number;
  defaultHeight: number;
}
