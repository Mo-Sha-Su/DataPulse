export type Cardinality = '1:*' | '*:1' | '1:1';

export interface FactTable {
  id: string;
  name: string;
  datasetId: string;
  primaryKey?: string;
  foreignKeys: string[];
  measures: string[];
  attributes?: string[];
  position: { x: number; y: number };
  isExpanded?: boolean;
}

export interface DimensionHierarchy {
  id: string;
  name: string;
  dimensionTableId: string;
  levels: string[]; // e.g. ['Year', 'Quarter', 'Month', 'Day'] or ['Country', 'Region', 'City']
}

export interface DimensionTable {
  id: string;
  name: string;
  datasetId: string;
  primaryKey: string;
  attributes: string[];
  hierarchies?: DimensionHierarchy[];
  position: { x: number; y: number };
  isExpanded?: boolean;
}

export interface Relationship {
  id: string;
  name?: string;
  fromTableId: string;
  fromColumn: string;
  toTableId: string;
  toColumn: string;
  cardinality: Cardinality;
  isActive: boolean;
  confidence?: number; // 0 to 100 for auto-suggested
}

export type MeasureAggregation = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'divide' | 'distinct_count';

export interface ModelMeasure {
  id: string;
  name: string;
  description?: string;
  expression: string; // e.g. "SUM(FACT_SALES[Sales_Amount])" or "DIVIDE([Total Profit], [Total Sales])"
  aggregation: MeasureAggregation;
  targetTable: string;
  targetColumn: string;
  secondaryMeasure?: string; // For ratios like DIVIDE([Profit], [Sales])
  format: 'number' | 'currency' | 'percentage' | 'compact';
  currencySymbol?: string;
}

export interface ModelVersion {
  id: string;
  versionName: string;
  createdAt: string;
  description?: string;
  snapshot: {
    factTables: FactTable[];
    dimensionTables: DimensionTable[];
    relationships: Relationship[];
    measures: ModelMeasure[];
    hierarchies: DimensionHierarchy[];
  };
}

export interface DataModelState {
  id: string;
  name: string;
  factTables: FactTable[];
  dimensionTables: DimensionTable[];
  relationships: Relationship[];
  measures: ModelMeasure[];
  hierarchies: DimensionHierarchy[];
  versions: ModelVersion[];
  updatedAt: string;
}

export interface ModelValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  tableId?: string;
  relationshipId?: string;
  suggestedAction?: string;
}

export interface ModelValidationResult {
  score: number; // 0 to 100
  passedChecks: number;
  totalChecks: number;
  issues: ModelValidationIssue[];
}

export interface SuggestedStarSchema {
  confidence: 'High' | 'Medium' | 'Low';
  confidenceScore: number; // 0 to 100
  summary: string;
  factTables: FactTable[];
  dimensionTables: DimensionTable[];
  relationships: Relationship[];
  reasons: string[];
}
