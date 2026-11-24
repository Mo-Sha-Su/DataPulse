import { CanvasSettings, DashboardState } from '../types/dashboard';

/**
 * Default canvas dimensions and visual grid settings for freeform BI dashboards.
 */
export const DEFAULT_CANVAS: CanvasSettings = {
  presetName: '1920×1080 Full HD',
  width: 1920,
  height: 1080,
  zoom: 0.85,
  backgroundType: 'color',
  backgroundColor: '#F8FAFC',
  gradientValue: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  imageUrl: '',
  imageFit: 'cover',
  showGrid: true,
  snapToGrid: true,
  gridGap: 10,
};

/**
 * Default A4 print-oriented canvas settings for multi-page paginated reports.
 */
export const DEFAULT_REPORT_CANVAS: CanvasSettings = {
  presetName: 'A4 Portrait',
  pageSizePreset: 'A4 Portrait',
  orientation: 'portrait',
  unit: 'mm',
  widthPhysical: 210,
  heightPhysical: 297,
  width: 794,
  height: 1123,
  zoom: 0.95,
  backgroundType: 'color',
  backgroundColor: '#FFFFFF',
  gradientValue: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
  imageUrl: '',
  imageFit: 'cover',
  showGrid: false,
  snapToGrid: true,
  gridGap: 10,
  margins: {
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
    unit: 'mm',
  },
};

/**
 * Creates an empty dashboard state with an initialized semantic data model container.
 */
export const createEmptyDashboard = (id?: string, name?: string): DashboardState => ({
  id: id || `dash_${Date.now()}`,
  name: name || 'New Dashboard',
  description: '',
  type: 'dashboard',
  usedFor: 'Analytics',
  updatedAt: new Date().toISOString(),
  datasets: [],
  selectedDatasetIds: [],
  canvas: DEFAULT_CANVAS,
  widgets: [],
  globalFilters: [],
  dataModel: {
    id: `model_${Date.now()}`,
    name: `${name || 'New Dashboard'} Data Model`,
    factTables: [],
    dimensionTables: [],
    relationships: [],
    measures: [],
    hierarchies: [],
    versions: [],
    updatedAt: new Date().toISOString(),
  },
});

/**
 * Creates an empty paginated report state starting with a single A4 page (`p_1`).
 */
export const createEmptyReport = (id?: string, name?: string): DashboardState => ({
  id: id || `report_${Date.now()}`,
  name: name || 'New Report',
  description: '',
  type: 'report',
  usedFor: 'Reporting',
  updatedAt: new Date().toISOString(),
  datasets: [],
  selectedDatasetIds: [],
  canvas: DEFAULT_REPORT_CANVAS,
  pages: [{ id: 'p_1', name: 'Page 1' }],
  activePageId: 'p_1',
  widgets: [],
  globalFilters: [],
  dataModel: {
    id: `model_${Date.now()}`,
    name: `${name || 'New Report'} Data Model`,
    factTables: [],
    dimensionTables: [],
    relationships: [],
    measures: [],
    hierarchies: [],
    versions: [],
    updatedAt: new Date().toISOString(),
  },
});
