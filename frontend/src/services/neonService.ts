import { getAuthHeaders } from './authService';

/**
 * Client service for PostgreSQL/Neon health checks (`/api/neon/status`), standalone semantic
 * data models (`/api/models`), and user preferences (`/api/settings`).
 */
export interface NeonStatus {
  connected: boolean;
  provider: string;
  endpoint?: string;
  database?: string;
  user?: string;
  version?: string;
  latencyMs?: number;
  stats?: {
    tables: number;
    datasets: number;
    dashboards: number;
    users: number;
  };
  error?: string;
}

/** Polls backend PostgreSQL connectivity and latency for the navbar status badge. */
export async function fetchNeonStatus(): Promise<NeonStatus> {
  try {
    const res = await fetch('/api/neon/status');
    if (res.ok) {
      const data = await res.json();
      if (data.neon) {
        return data.neon;
      }
    }
  } catch (err: any) {
    console.warn('Neon status check failed:', err);
  }
  return {
    connected: false,
    provider: 'Neon Serverless PostgreSQL',
    error: 'Backend communication offline',
  };
}

export async function fetchDataModelsFromNeon(): Promise<any[]> {
  try {
    const res = await fetch('/api/models', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.models)) {
        return data.models;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch data models from Neon:', err);
  }
  return [];
}

export async function saveDataModelToNeon(model: any): Promise<any> {
  try {
    const res = await fetch('/api/models', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(model),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.model) {
        return data.model;
      }
    }
  } catch (err) {
    console.warn('Failed to save data model to Neon:', err);
  }
  return model;
}

export async function deleteDataModelFromNeon(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/models/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (err) {
    console.warn('Failed to delete data model from Neon:', err);
  }
  return false;
}

export async function fetchUserSettingsFromNeon(): Promise<{ preferences: any; theme: string }> {
  try {
    const res = await fetch('/api/settings', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        return data.settings;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch user settings from Neon:', err);
  }
  return { preferences: {}, theme: 'light' };
}

export async function saveUserSettingsToNeon(settings: { preferences?: any; theme?: string }): Promise<any> {
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        return data.settings;
      }
    }
  } catch (err) {
    console.warn('Failed to save user settings to Neon:', err);
  }
  return settings;
}

