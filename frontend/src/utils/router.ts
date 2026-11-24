/**
 * Pure client-side routing module for Data Pulse.
 * Translates between window.location pathname and application routes,
 * enforces protected route boundaries, and formats canonical URLs for pushState.
 */

export type AppRoute =
  | { page: 'home' }
  | { page: 'features' }
  | { page: 'pricing' }
  | { page: 'about' }
  | { page: 'login' }
  | { page: 'signup' }
  | { page: 'dashboard_hub' }
  | { page: 'bench'; dashboardId?: string }
  | { page: 'data_hub' }
  | { page: 'sample_graphs' }
  | { page: 'data_lab'; datasetId?: string; dashboardId?: string }
  | { page: 'forecasts'; forecastId?: string; datasetId?: string };

export const PROTECTED_PAGES: ReadonlySet<string> = new Set([
  'dashboard_hub',
  'bench',
  'data_hub',
  'data_lab',
  'forecasts',
]);

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Parses a pathname string into an AppRoute.
 */
export function pathToRoute(pathname: string): AppRoute {
  if (!pathname || pathname === '' || pathname === '/') {
    return { page: 'home' };
  }

  // Strip query/hash if passed and trailing slashes
  const cleanPath = pathname.split('?')[0].split('#')[0];
  const normalized = cleanPath.replace(/\/+$/, '') || '/';
  const parts = normalized.split('/').filter(Boolean);

  if (parts.length === 0) {
    return { page: 'home' };
  }

  const first = parts[0].toLowerCase();

  switch (first) {
    case 'features':
      return { page: 'features' };
    case 'pricing':
      return { page: 'pricing' };
    case 'about':
      return { page: 'about' };
    case 'login':
      return { page: 'login' };
    case 'signup':
      return { page: 'signup' };
    case 'dashboards': {
      if (parts.length === 1) {
        return { page: 'dashboard_hub' };
      }
      if (parts.length >= 3 && parts[parts.length - 1].toLowerCase() === 'lab') {
        const dashboardId = safeDecode(parts.slice(1, -1).join('/'));
        return { page: 'data_lab', dashboardId };
      }
      if (parts.length >= 4 && parts[parts.length - 2].toLowerCase() === 'lab') {
        const dashboardId = safeDecode(parts.slice(1, -2).join('/'));
        const datasetId = safeDecode(parts[parts.length - 1]);
        return { page: 'data_lab', dashboardId, datasetId };
      }
      return { page: 'bench', dashboardId: safeDecode(parts.slice(1).join('/')) };
    }
    case 'bench':
    case 'workbench':
      if (parts.length > 1) {
        return { page: 'bench', dashboardId: safeDecode(parts.slice(1).join('/')) };
      }
      return { page: 'bench' };
    case 'data':
      if (parts.length >= 2 && parts[1].toLowerCase() === 'lab') {
        if (parts.length >= 3) {
          return { page: 'data_lab', datasetId: safeDecode(parts.slice(2).join('/')) };
        }
        return { page: 'data_lab' };
      }
      return { page: 'data_hub' };
    case 'data-hub':
    case 'datasets':
      return { page: 'data_hub' };
    case 'data-lab':
    case 'datalab':
      if (parts.length > 1) {
        return { page: 'data_lab', datasetId: safeDecode(parts.slice(1).join('/')) };
      }
      return { page: 'data_lab' };
    case 'gallery':
    case 'sample-graphs':
    case 'sample_graphs':
      return { page: 'sample_graphs' };
    case 'forecasts':
    case 'forecast-studio':
    case 'forecast_studio':
      if (parts.length > 1) {
        return { page: 'forecasts', forecastId: safeDecode(parts.slice(1).join('/')) };
      }
      return { page: 'forecasts' };
    default:
      return { page: 'home' };
  }
}

/**
 * Serializes an AppRoute into a canonical URL path.
 */
export function routeToPath(route: AppRoute): string {
  switch (route.page) {
    case 'home':
      return '/';
    case 'features':
      return '/features';
    case 'pricing':
      return '/pricing';
    case 'about':
      return '/about';
    case 'login':
      return '/login';
    case 'signup':
      return '/signup';
    case 'dashboard_hub':
      return '/dashboards';
    case 'bench':
      return route.dashboardId ? `/dashboards/${encodeURIComponent(route.dashboardId)}` : '/workbench';
    case 'data_hub':
      return '/data';
    case 'data_lab':
      if (route.dashboardId) {
        return `/dashboards/${encodeURIComponent(route.dashboardId)}/lab`;
      }
      return route.datasetId ? `/data/lab/${encodeURIComponent(route.datasetId)}` : '/data/lab';
    case 'sample_graphs':
      return '/gallery';
    case 'forecasts':
      return route.forecastId ? `/forecasts/${encodeURIComponent(route.forecastId)}` : '/forecasts';
    default:
      return '/';
  }
}

/**
 * Checks whether the given route requires authenticated access.
 */
export function isRouteProtected(route: AppRoute): boolean {
  return PROTECTED_PAGES.has(route.page);
}

/**
 * Resolves the effective route taking authentication status into account:
 * - Unauthenticated users accessing protected routes are redirected to /login.
 * - Authenticated users visiting '/' or auth pages are redirected to '/dashboards'.
 */
export function resolveEffectiveRoute(route: AppRoute, isAuthenticated: boolean): AppRoute {
  if (route.page === 'home' && isAuthenticated) {
    return { page: 'dashboard_hub' };
  }
  if (isRouteProtected(route) && !isAuthenticated) {
    return { page: 'login' };
  }
  if ((route.page === 'login' || route.page === 'signup') && isAuthenticated) {
    return { page: 'dashboard_hub' };
  }
  return route;
}

/**
 * Returns the route to navigate to right after login/signup completes.
 * Restores the requested protected route if one was saved; otherwise goes to the hub.
 */
export function getPostLoginRedirectRoute(pendingRoute: AppRoute | null | undefined): AppRoute {
  if (pendingRoute && isRouteProtected(pendingRoute)) {
    return pendingRoute;
  }
  return { page: 'dashboard_hub' };
}
