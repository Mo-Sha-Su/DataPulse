import { DataFilter, DashboardState } from '../types/dashboard';

function toFiniteNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function normalizeFilters(raw: unknown): { filters: DataFilter[]; dropped: number } {
  if (!Array.isArray(raw)) {
    return { filters: [], dropped: 0 };
  }

  const filters: DataFilter[] = [];
  let dropped = 0;

  raw.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      dropped += 1;
      return;
    }

    const rec = item as Record<string, any>;
    const column =
      typeof rec.column === 'string'
        ? rec.column.trim()
        : typeof rec.field === 'string'
        ? rec.field.trim()
        : '';

    if (!column) {
      dropped += 1;
      return;
    }

    if (rec.enabled === false) {
      dropped += 1;
      return;
    }

    const id =
      typeof rec.id === 'string' && rec.id.trim()
        ? rec.id
        : `filter_${index}_${column}`;
    const datasetId =
      typeof rec.datasetId === 'string' && rec.datasetId.trim()
        ? rec.datasetId
        : undefined;

    // New shape (no legacy operator)
    if (rec.operator === undefined) {
      const values = Array.isArray(rec.values)
        ? rec.values.filter(
            (v: unknown): v is string | number =>
              typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))
          )
        : undefined;
      const min = toFiniteNumber(rec.min);
      const max = toFiniteNumber(rec.max);

      if ((values && values.length > 0) || min !== undefined || max !== undefined) {
        filters.push({
          id,
          ...(datasetId ? { datasetId } : {}),
          column,
          ...(values && values.length > 0 ? { values } : {}),
          ...(min !== undefined ? { min } : {}),
          ...(max !== undefined ? { max } : {}),
        });
      }
      return;
    }

    // Legacy shape with operator
    const op = String(rec.operator);
    switch (op) {
      case 'equals': {
        const val = rec.value;
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          dropped += 1;
          return;
        }
        const normalizedVal: string | number =
          typeof val === 'number' && Number.isFinite(val) ? val : String(val);
        filters.push({
          id,
          ...(datasetId ? { datasetId } : {}),
          column,
          values: [normalizedVal],
        });
        return;
      }

      case 'between': {
        const min = toFiniteNumber(rec.value);
        const max = toFiniteNumber(rec.value2);
        if (min === undefined && max === undefined) {
          dropped += 1;
          return;
        }
        filters.push({
          id,
          ...(datasetId ? { datasetId } : {}),
          column,
          ...(min !== undefined ? { min } : {}),
          ...(max !== undefined ? { max } : {}),
        });
        return;
      }

      case 'greater_than':
      case 'greater_equal': {
        const min = toFiniteNumber(rec.value);
        if (min === undefined) {
          dropped += 1;
          return;
        }
        filters.push({
          id,
          ...(datasetId ? { datasetId } : {}),
          column,
          min,
        });
        return;
      }

      case 'less_than':
      case 'less_equal': {
        const max = toFiniteNumber(rec.value);
        if (max === undefined) {
          dropped += 1;
          return;
        }
        filters.push({
          id,
          ...(datasetId ? { datasetId } : {}),
          column,
          max,
        });
        return;
      }

      default:
        dropped += 1;
        return;
    }
  });

  return { filters, dropped };
}

export function normalizeDashboardFilters(dashboard: DashboardState): {
  dashboard: DashboardState;
  dropped: number;
} {
  const { filters, dropped } = normalizeFilters((dashboard as any).globalFilters);
  const widgets = (dashboard.widgets || []).map((w) => {
    if (w?.config && 'filters' in (w.config as any)) {
      const { filters: _ignored, ...restConfig } = w.config as any;
      return { ...w, config: restConfig };
    }
    return w;
  });

  return {
    dashboard: {
      ...dashboard,
      globalFilters: filters,
      widgets,
    },
    dropped,
  };
}
