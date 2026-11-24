export type ColumnDataType = 
  | 'Text' 
  | 'Whole Number' 
  | 'Decimal Number' 
  | 'Percentage' 
  | 'Currency' 
  | 'Date' 
  | 'Date/Time' 
  | 'Time' 
  | 'Boolean';

export interface CleaningColumn {
  name: string;
  originalName: string;
  dataType: ColumnDataType;
  validCount: number;
  emptyCount: number;
  errorCount: number;
}

export type DataCleaningStepType =
  | 'source'
  | 'promoted_headers'
  | 'changed_type'
  | 'rename_column'
  | 'remove_columns'
  | 'duplicate_column'
  | 'reorder_columns'
  | 'move_column'
  | 'replace_values'
  | 'replace_errors'
  | 'fill_down'
  | 'fill_up'
  | 'filter_rows'
  | 'remove_rows'
  | 'keep_rows'
  | 'sort'
  | 'text_transform'
  | 'number_transform'
  | 'date_transform'
  | 'split_column'
  | 'merge_columns'
  | 'remove_duplicates'
  | 'replace_nulls'
  | 'edit_cell'
  | 'add_custom_column';

export interface DataCleaningStep {
  id: string;
  name: string;
  type: DataCleaningStepType;
  description: string;
  mFormula: string;
  params: Record<string, any>;
  iconName?: string;
}

export interface CellError {
  __isError: true;
  rawValue: any;
  message: string;
}

export interface StepEvaluationResult {
  columns: CleaningColumn[];
  rows: Record<string, any>[];
  totalErrors: number;
  totalEmpty: number;
  totalRows: number;
  totalColumns: number;
}

export interface QueryModel {
  id: string;
  name: string;
  sourceType: 'sample' | 'csv' | 'excel';
  originalDatasetId?: string;
  rawRows: Record<string, any>[];
  steps: DataCleaningStep[];
  selectedStepId: string;
  cachedState?: StepEvaluationResult;
}
