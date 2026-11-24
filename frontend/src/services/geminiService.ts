import { Dataset, Widget } from '../types/dashboard';

/**
 * Deterministic client-side heuristic helper that builds an initial dashboard widget layout
 * from a dataset's column schema (performs zero external AI/LLM API calls).
 */
export function autoBuildDashboardForDataset(dataset: Dataset): Widget[] {
  if (!dataset || !dataset.columns || dataset.columns.length === 0) return [];

  const numericCols = dataset.columns.filter((c) => c.type === 'number');
  const stringCols = dataset.columns.filter((c) => c.type === 'string');

  const catCol = stringCols[0]?.name || dataset.columns[0]?.name || 'Category';
  const valCol1 = numericCols[0]?.name || dataset.columns[1]?.name || 'Value';
  const valCol2 = numericCols[1]?.name || numericCols[0]?.name || 'Value2';
  const valCol3 = numericCols[2]?.name || numericCols[0]?.name || 'Value3';

  const generatedWidgets: Widget[] = [
    // 1. Primary KPI Card
    {
      id: `w_ai_kpi_${Date.now()}_1`,
      type: 'kpi',
      category: 'analytics',
      title: `Total ${valCol1}`,
      position: { x: 40, y: 40, width: 320, height: 180, zIndex: 1 },
      config: {
        datasetId: dataset.id,
        xAxisField: catCol,
        yAxisField: valCol1,
        aggregation: 'sum',
        numberFormat: 'number',
        title: `Total ${valCol1}`,
        titleColor: '#0F172A',
        primaryColor: '#2563EB',
        colorPalette: ['#2563EB'],
        backgroundColor: '#FFFFFF',
      },
    },
    // 2. Average Metric Card
    {
      id: `w_ai_metric_${Date.now()}_2`,
      type: 'metric',
      category: 'analytics',
      title: `Average ${valCol2}`,
      position: { x: 380, y: 40, width: 320, height: 180, zIndex: 2 },
      config: {
        datasetId: dataset.id,
        xAxisField: catCol,
        yAxisField: valCol2,
        aggregation: 'avg',
        numberFormat: 'number',
        title: `Avg ${valCol2}`,
        titleColor: '#0F172A',
        primaryColor: '#059669',
        colorPalette: ['#059669'],
        backgroundColor: '#FFFFFF',
      },
    },
    // 3. Radial Gauge
    {
      id: `w_ai_gauge_${Date.now()}_3`,
      type: 'gauge',
      category: 'analytics',
      title: `Target Capacity`,
      position: { x: 720, y: 40, width: 340, height: 180, zIndex: 3 },
      config: {
        datasetId: dataset.id,
        xAxisField: catCol,
        yAxisField: valCol1,
        aggregation: 'avg',
        numberFormat: 'percentage',
        title: `Performance Index`,
        titleColor: '#0F172A',
        primaryColor: '#D97706',
        colorPalette: ['#D97706'],
        backgroundColor: '#FFFFFF',
        goalValue: 100,
      },
    },
    // 4. Bar Chart
    {
      id: `w_ai_bar_${Date.now()}_4`,
      type: 'bar',
      category: 'charts',
      title: `${valCol1} by ${catCol}`,
      position: { x: 40, y: 250, width: 660, height: 380, zIndex: 4 },
      config: {
        datasetId: dataset.id,
        xAxisField: catCol,
        yAxisField: valCol1,
        aggregation: 'sum',
        numberFormat: 'number',
        title: `${valCol1} Distribution by ${catCol}`,
        titleColor: '#0F172A',
        primaryColor: '#4F46E5',
        colorPalette: ['#4F46E5', '#DB2777', '#0D9488', '#D97706'],
        backgroundColor: '#FFFFFF',
      },
    },
    // 5. Line Trend
    {
      id: `w_ai_line_${Date.now()}_5`,
      type: 'line',
      category: 'charts',
      title: `${valCol2} Trend Velocity`,
      position: { x: 720, y: 250, width: 680, height: 380, zIndex: 5 },
      config: {
        datasetId: dataset.id,
        xAxisField: catCol,
        yAxisField: valCol2,
        aggregation: 'sum',
        numberFormat: 'number',
        title: `${valCol2} Growth Velocity`,
        titleColor: '#0F172A',
        primaryColor: '#0284C7',
        colorPalette: ['#0284C7'],
        backgroundColor: '#FFFFFF',
        showMarkers: true,
        smoothLines: true,
      },
    },
    // 6. 3D Surface Graph
    {
      id: `w_ai_3d_${Date.now()}_6`,
      type: 'surface3d',
      category: '3d',
      title: `3D Volumetric Terrain`,
      position: { x: 40, y: 650, width: 720, height: 390, zIndex: 6 },
      config: {
        datasetId: dataset.id,
        xAxisField: catCol,
        yAxisField: valCol1,
        zAxisField: valCol2,
        aggregation: 'none',
        numberFormat: 'number',
        title: `3D Volumetric ${valCol1} x ${valCol2}`,
        titleColor: '#0F172A',
        primaryColor: '#7C3AED',
        colorPalette: ['#7C3AED', '#2563EB', '#059669'],
        backgroundColor: '#FFFFFF',
      },
    },
    // 7. Funnel Conversion
    {
      id: `w_ai_funnel_${Date.now()}_7`,
      type: 'funnel',
      category: 'analytics',
      title: `${catCol} Conversion Stage`,
      position: { x: 780, y: 650, width: 620, height: 390, zIndex: 7 },
      config: {
        datasetId: dataset.id,
        xAxisField: catCol,
        yAxisField: valCol1,
        aggregation: 'none',
        numberFormat: 'number',
        title: `Stage Conversion Breakdown`,
        titleColor: '#0F172A',
        primaryColor: '#DB2777',
        colorPalette: ['#2563EB', '#4F46E5', '#7C3AED', '#DB2777', '#E11D48'],
        backgroundColor: '#FFFFFF',
      },
    },
  ];

  return generatedWidgets;
}
