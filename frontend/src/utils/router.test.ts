import { describe, it, expect } from 'vitest';
import {
  pathToRoute,
  routeToPath,
  isRouteProtected,
  resolveEffectiveRoute,
  getPostLoginRedirectRoute,
  AppRoute,
} from './router';

describe('Router path parsing (pathToRoute)', () => {
  it('parses root and empty pathnames to home', () => {
    expect(pathToRoute('/')).toEqual({ page: 'home' });
    expect(pathToRoute('')).toEqual({ page: 'home' });
    expect(pathToRoute('///')).toEqual({ page: 'home' });
  });

  it('parses marketing and gallery routes', () => {
    expect(pathToRoute('/features')).toEqual({ page: 'features' });
    expect(pathToRoute('/features/')).toEqual({ page: 'features' });
    expect(pathToRoute('/pricing')).toEqual({ page: 'pricing' });
    expect(pathToRoute('/about')).toEqual({ page: 'about' });
    expect(pathToRoute('/gallery')).toEqual({ page: 'sample_graphs' });
    expect(pathToRoute('/sample-graphs')).toEqual({ page: 'sample_graphs' });
  });

  it('parses auth routes', () => {
    expect(pathToRoute('/login')).toEqual({ page: 'login' });
    expect(pathToRoute('/signup')).toEqual({ page: 'signup' });
  });

  it('parses dashboard routes and deep links with ids', () => {
    expect(pathToRoute('/dashboards')).toEqual({ page: 'dashboard_hub' });
    expect(pathToRoute('/dashboards/sales-q4')).toEqual({
      page: 'bench',
      dashboardId: 'sales-q4',
    });
    expect(pathToRoute('/dashboards/complex%20id%2F123')).toEqual({
      page: 'bench',
      dashboardId: 'complex id/123',
    });
  });

  it('parses workbench and data hub routes', () => {
    expect(pathToRoute('/workbench')).toEqual({ page: 'bench' });
    expect(pathToRoute('/bench')).toEqual({ page: 'bench' });
    expect(pathToRoute('/data')).toEqual({ page: 'data_hub' });
    expect(pathToRoute('/data-hub')).toEqual({ page: 'data_hub' });
    expect(pathToRoute('/datasets')).toEqual({ page: 'data_hub' });
  });

  it('parses data lab routes under /data/lab and /dashboards/:id/lab', () => {
    expect(pathToRoute('/data/lab')).toEqual({ page: 'data_lab' });
    expect(pathToRoute('/data/lab/ds_12345')).toEqual({
      page: 'data_lab',
      datasetId: 'ds_12345',
    });
    expect(pathToRoute('/dashboards/dash_9/lab')).toEqual({
      page: 'data_lab',
      dashboardId: 'dash_9',
    });
    expect(pathToRoute('/data-lab')).toEqual({ page: 'data_lab' });
    expect(pathToRoute('/data-lab/ds_legacy')).toEqual({
      page: 'data_lab',
      datasetId: 'ds_legacy',
    });
  });

  it('parses Forecast Studio routes under /forecasts and /forecasts/:id', () => {
    expect(pathToRoute('/forecasts')).toEqual({ page: 'forecasts' });
    expect(pathToRoute('/forecast-studio')).toEqual({ page: 'forecasts' });
    expect(pathToRoute('/forecasts/fc_123')).toEqual({
      page: 'forecasts',
      forecastId: 'fc_123',
    });
  });

  it('falls back unknown routes to home', () => {
    expect(pathToRoute('/unknown-404-path')).toEqual({ page: 'home' });
  });
});

describe('Router path formatting (routeToPath)', () => {
  it('formats routes to canonical URL paths', () => {
    expect(routeToPath({ page: 'home' })).toBe('/');
    expect(routeToPath({ page: 'features' })).toBe('/features');
    expect(routeToPath({ page: 'pricing' })).toBe('/pricing');
    expect(routeToPath({ page: 'about' })).toBe('/about');
    expect(routeToPath({ page: 'login' })).toBe('/login');
    expect(routeToPath({ page: 'signup' })).toBe('/signup');
    expect(routeToPath({ page: 'dashboard_hub' })).toBe('/dashboards');
    expect(routeToPath({ page: 'bench' })).toBe('/workbench');
    expect(routeToPath({ page: 'bench', dashboardId: 'sales-q4' })).toBe('/dashboards/sales-q4');
    expect(routeToPath({ page: 'data_hub' })).toBe('/data');
    expect(routeToPath({ page: 'data_lab' })).toBe('/data/lab');
    expect(routeToPath({ page: 'data_lab', datasetId: 'ds_99' })).toBe('/data/lab/ds_99');
    expect(routeToPath({ page: 'data_lab', dashboardId: 'dash_9' })).toBe('/dashboards/dash_9/lab');
    expect(routeToPath({ page: 'sample_graphs' })).toBe('/gallery');
    expect(routeToPath({ page: 'forecasts' })).toBe('/forecasts');
    expect(routeToPath({ page: 'forecasts', forecastId: 'fc_123' })).toBe('/forecasts/fc_123');
  });
});

describe('Protected routes and route resolution', () => {
  it('identifies protected workspace routes', () => {
    expect(isRouteProtected({ page: 'dashboard_hub' })).toBe(true);
    expect(isRouteProtected({ page: 'bench' })).toBe(true);
    expect(isRouteProtected({ page: 'data_hub' })).toBe(true);
    expect(isRouteProtected({ page: 'data_lab' })).toBe(true);
    expect(isRouteProtected({ page: 'forecasts' })).toBe(true);

    expect(isRouteProtected({ page: 'home' })).toBe(false);
    expect(isRouteProtected({ page: 'features' })).toBe(false);
    expect(isRouteProtected({ page: 'pricing' })).toBe(false);
    expect(isRouteProtected({ page: 'login' })).toBe(false);
    expect(isRouteProtected({ page: 'sample_graphs' })).toBe(false);
  });

  it('redirects unauthenticated users trying to access protected routes to /login', () => {
    const protectedRoute: AppRoute = { page: 'dashboard_hub' };
    expect(resolveEffectiveRoute(protectedRoute, false)).toEqual({ page: 'login' });

    const benchRoute: AppRoute = { page: 'bench', dashboardId: 'ds-1' };
    expect(resolveEffectiveRoute(benchRoute, false)).toEqual({ page: 'login' });

    const labRoute: AppRoute = { page: 'data_lab', datasetId: 'ds_7' };
    expect(resolveEffectiveRoute(labRoute, false)).toEqual({ page: 'login' });
  });

  it('redirects authenticated users on home or auth pages to dashboard_hub', () => {
    expect(resolveEffectiveRoute({ page: 'home' }, true)).toEqual({ page: 'dashboard_hub' });
    expect(resolveEffectiveRoute({ page: 'login' }, true)).toEqual({ page: 'dashboard_hub' });
    expect(resolveEffectiveRoute({ page: 'signup' }, true)).toEqual({ page: 'dashboard_hub' });
  });

  it('allows authenticated users to view marketing pages and gallery when requested', () => {
    expect(resolveEffectiveRoute({ page: 'features' }, true)).toEqual({ page: 'features' });
    expect(resolveEffectiveRoute({ page: 'pricing' }, true)).toEqual({ page: 'pricing' });
    expect(resolveEffectiveRoute({ page: 'sample_graphs' }, true)).toEqual({ page: 'sample_graphs' });
  });

  it('restores intended protected route after login or falls back to dashboard_hub', () => {
    expect(getPostLoginRedirectRoute(null)).toEqual({ page: 'dashboard_hub' });
    expect(getPostLoginRedirectRoute({ page: 'login' })).toEqual({ page: 'dashboard_hub' });
    expect(getPostLoginRedirectRoute({ page: 'bench', dashboardId: 'd_42' })).toEqual({
      page: 'bench',
      dashboardId: 'd_42',
    });
    expect(getPostLoginRedirectRoute({ page: 'data_lab', datasetId: 'ds_1' })).toEqual({
      page: 'data_lab',
      datasetId: 'ds_1',
    });
  });
});
