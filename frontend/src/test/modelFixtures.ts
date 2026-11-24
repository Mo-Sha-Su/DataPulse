import { Dataset, DataFilter, Widget, WidgetConfig } from '../types/dashboard';
import { DataModelState } from '../types/dataModel';

/** Sales fact + customer dimension. Country exists ONLY in the customer dataset, so any chart that shows
 *  revenue by Country (or filters on Country) can only be right if the Data Model joins the two tables. */
export const salesDs: Dataset = {
  id: 'ds_sales',
  name: 'Sales',
  rowCount: 4,
  columnCount: 4,
  columns: [
    { name: 'CustomerID', type: 'string', sampleValue: 'c1' },
    { name: 'ProductID', type: 'string', sampleValue: 'p1' },
    { name: 'Amount', type: 'number', sampleValue: 100 },
    { name: 'Qty', type: 'number', sampleValue: 1 },
  ],
  data: [
    { CustomerID: 'c1', ProductID: 'p1', Amount: 100, Qty: 1 },
    { CustomerID: 'c1', ProductID: 'p2', Amount: 50, Qty: 2 },
    { CustomerID: 'c2', ProductID: 'p1', Amount: 200, Qty: 3 },
    { CustomerID: 'c3', ProductID: 'p2', Amount: 400, Qty: 4 },
  ],
  uploadedAt: '2026-01-01',
  sourceType: 'csv',
};

export const customerDs: Dataset = {
  id: 'ds_cust',
  name: 'Customers',
  rowCount: 3,
  columnCount: 2,
  columns: [
    { name: 'CustomerID', type: 'string', sampleValue: 'c1' },
    { name: 'Country', type: 'string', sampleValue: 'US' },
  ],
  data: [
    { CustomerID: 'c1', Country: 'US' },
    { CustomerID: 'c2', Country: 'US' },
    { CustomerID: 'c3', Country: 'DE' },
  ],
  uploadedAt: '2026-01-01',
  sourceType: 'csv',
};

export const datasets = [salesDs, customerDs];

export const model: DataModelState = {
  id: 'model_1',
  name: 'Sales Model',
  factTables: [
    {
      id: 'f1',
      name: 'FACT_SALES',
      datasetId: 'ds_sales',
      foreignKeys: ['CustomerID', 'ProductID'],
      measures: ['Amount', 'Qty'],
      position: { x: 0, y: 0 },
    },
  ],
  dimensionTables: [
    { id: 'd1', name: 'DIM_CUSTOMER', datasetId: 'ds_cust', primaryKey: 'CustomerID', attributes: ['Country'], position: { x: 0, y: 0 } },
  ],
  relationships: [
    { id: 'r1', fromTableId: 'd1', fromColumn: 'CustomerID', toTableId: 'f1', toColumn: 'CustomerID', cardinality: '1:*', isActive: true },
  ],
  measures: [
    { id: 'm1', name: 'Total Amount', expression: 'SUM(FACT_SALES[Amount])', aggregation: 'sum', targetTable: 'FACT_SALES', targetColumn: 'Amount', format: 'number' },
    { id: 'm2', name: 'Total Qty', expression: 'SUM(FACT_SALES[Qty])', aggregation: 'sum', targetTable: 'FACT_SALES', targetColumn: 'Qty', format: 'number' },
    { id: 'm3', name: 'Amount per Unit', expression: 'DIVIDE([Total Amount], [Total Qty])', aggregation: 'divide', targetTable: 'FACT_SALES', targetColumn: 'Total Amount', secondaryMeasure: 'Total Qty', format: 'number' },
  ],
  hierarchies: [],
  versions: [],
  updatedAt: '2026-01-01',
};

export const baseConfig = (over: Partial<WidgetConfig> = {}): WidgetConfig => ({
  datasetId: 'ds_sales',
  xAxisField: '',
  yAxisField: 'Amount',
  aggregation: 'sum',
  numberFormat: 'number',
  title: 'Test',
  titleColor: '#000',
  primaryColor: '#0284C7',
  colorPalette: [],
  backgroundColor: '#ffffff',
  ...over,
});

export const countryFilter = (value: string): DataFilter => ({
  id: 'gf1',
  datasetId: 'ds_cust',
  column: 'Country',
  values: [value],
});

export const kpiWidget = (over: Partial<WidgetConfig> = {}): Widget => ({
  id: 'w1',
  type: 'kpi',
  category: 'analytics',
  title: 'KPI',
  position: { x: 0, y: 0, width: 300, height: 200 },
  config: baseConfig(over),
} as Widget);
