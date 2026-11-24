import { DashboardState } from '../types/dashboard';
import {
  DEFAULT_CANVAS,
  DEFAULT_REPORT_CANVAS,
  createEmptyDashboard,
  createEmptyReport,
} from './dashboardDefaults';

export {
  DEFAULT_CANVAS,
  DEFAULT_REPORT_CANVAS,
  createEmptyDashboard,
  createEmptyReport,
};

/**
 * Intentionally empty: Data Pulse never seeds pre-built sample dashboards for new accounts.
 * Kept for backwards compatibility with legacy callers; prefer importing factories from `./dashboardDefaults`.
 */
export const SAMPLE_DASHBOARDS: DashboardState[] = [];
