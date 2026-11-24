import { Dataset } from '../types/dashboard';
import { getAuthHeaders } from './authService';
import { buildApiError } from './apiClient';

/**
 * Datasets live in PostgreSQL only. `memoryCache` is a plain in-memory variable (gone on reload) that avoids
 * refetching during a session; there is no browser-storage copy and no offline fallback.
 */
const API_BASE = '/api/datasets';

const KNOWN_SAMPLE_IDS = new Set([
  'ds_sales_2026',
  'ds_customers',
  'ds_products',
  'ds_inventory',
  'ds_marketing',
  'ds_sales_2024',
  'ds_web_analytics',
  'ds_hr_performance',
  'ds_financial_gl',
  'ds_supply_chain',
]);

export function isSampleDataset(d: any): boolean {
  if (!d) return false;
  // If explicitly tagged with Neon DB or custom source file, never treat as sample
  if (d.tags && Array.isArray(d.tags) && d.tags.includes('Neon DB')) return false;
  if (KNOWN_SAMPLE_IDS.has(d.id)) return true;
  if (d.sourceType === 'sample' || d.source_type === 'sample') return true;
  const name = String(d.name || '').trim().toLowerCase();
  if (['sales 2026', 'global sales & revenue 2024', 'products 2026', 'inventory levels', 'marketing campaigns'].includes(name)) {
    return true;
  }
  return false;
}

let memoryCache: Dataset[] | null = null;

/** Clears the session-only in-memory dataset list cache (e.g., on logout or external refresh). */
export function invalidateDatasetsCache() {
  memoryCache = null;
}

/** Fetches all workspace datasets from PostgreSQL (reusing in-memory cache within the current page session). */
export async function fetchGlobalDatasets(): Promise<Dataset[]> {
  if (memoryCache !== null) return memoryCache;

  const res = await fetch(API_BASE, { headers: getAuthHeaders() });
  if (!res.ok) throw await buildApiError(res, 'Loading datasets');
  const json = await res.json();
  if (!json.success || !Array.isArray(json.datasets)) throw new Error('Unexpected response while loading datasets');
  memoryCache = json.datasets.filter((d: any) => !isSampleDataset(d));
  return memoryCache!;
}

/** Looks up a single dataset by id (checks in-memory cache first, then queries `/api/datasets/:id`). */
export async function getGlobalDatasetById(id: string): Promise<Dataset | null> {
  const all = await fetchGlobalDatasets();
  const cached = all.find((d) => d.id === id);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.dataset && !isSampleDataset(json.dataset)) {
        return json.dataset;
      }
    }
  } catch (e) {
    console.warn('Error fetching dataset by id:', e);
  }
  return null;
}

/** Creates (`POST`) or updates (`PUT`) a dataset and refreshes the in-memory cache with the confirmed server copy. */
export async function saveGlobalDataset(dataset: Dataset, signal?: AbortSignal): Promise<Dataset> {
  const current = await fetchGlobalDatasets();
  const isExisting = current.some((d) => d.id === dataset.id);

  const res = await fetch(isExisting ? `${API_BASE}/${encodeURIComponent(dataset.id)}` : API_BASE, {
    method: isExisting ? 'PUT' : 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dataset),
    signal,
  });
  if (!res.ok) throw await buildApiError(res, 'Saving dataset');
  const json = await res.json();
  if (!json.success || !json.dataset) throw new Error('Unexpected response while saving dataset');

  // Cache only what the database confirmed.
  const saved: Dataset = json.dataset;
  memoryCache = isExisting ? current.map((d) => (d.id === saved.id ? saved : d)) : [saved, ...current];
  return saved;
}

/** Deletes a dataset and its version history from PostgreSQL. */
export async function deleteGlobalDataset(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await buildApiError(res, 'Deleting dataset');
  const json = await res.json();
  if (json.success && memoryCache) memoryCache = memoryCache.filter((d) => d.id !== id);
  return !!json.success;
}

export async function updateDatasetCleaning(
  id: string,
  pipeline: any[],
  cleanedData: Record<string, any>[]
): Promise<Dataset | null> {
  const current = await fetchGlobalDatasets();
  const target = current.find((d) => d.id === id);
  if (!target) return null;

  const updated: Dataset = {
    ...target,
    cleaningPipeline: pipeline,
    cleanedData,
    rowCount: cleanedData.length,
    uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  return saveGlobalDataset(updated);
}

export async function fetchDatasetPreview(id: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/preview`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.preview) {
        return json.preview;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch dataset preview from backend:', err);
  }
  return null;
}

export async function fetchDatasetVersions(id: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/versions`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.versions)) {
        return json.versions;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch dataset versions:', err);
  }
  return [];
}
