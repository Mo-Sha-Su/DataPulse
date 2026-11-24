import { User, AuthResponse } from '../types/auth';

const API_URL = '/api';

/**
 * Session model: the API sets an httpOnly cookie on login/register, so the browser keeps NO token, user object or
 * cached data in localStorage / sessionStorage. The signed-in user lives only in memory and is re-read from the
 * database-backed `/api/auth/me` endpoint on every page load.
 */
let currentUser: User | null = null;

export const getCurrentUser = (): User | null => currentUser;

/** Cookies are attached automatically; only the content type is needed. */
export const getAuthHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
});

export const setCurrentUser = (user: User | null) => {
  currentUser = user;
};

/** Asks the server who we are (validates the cookie against the database). */
export const fetchSessionUser = async (): Promise<User | null> => {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        currentUser = data.user;
        return currentUser;
      }
    }
  } catch (e) {
    console.warn('Session check failed:', e);
  }
  currentUser = null;
  return null;
};

export const SESSION_EXPIRED_EVENT = 'datapulse:session-expired';

/**
 * Wraps window.fetch once: if the API rejects our session (401) while a user is signed in,
 * drop the in-memory session and tell the app to send the user back to the login screen.
 */
export const installAuthInterceptor = () => {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (w.__dpAuthInterceptor) return;
  w.__dpAuthInterceptor = true;

  const originalFetch = window.fetch;
  if (!originalFetch) return;

  const original = originalFetch.bind(window);
  const wrappedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const res = await original(input, init);
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
      const isApi = url.startsWith('/api/') || url.includes(`${window.location.origin}/api/`);
      const isAuthCall = /\/api\/auth\/(login|register|me|logout)/.test(url);
      if (res.status === 401 && isApi && !isAuthCall && currentUser) {
        currentUser = null;
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
    } catch {
      // never break the caller because of the interceptor
    }
    return res;
  };

  try {
    Object.defineProperty(window, 'fetch', {
      value: wrappedFetch,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch {
    try {
      window.fetch = wrappedFetch;
    } catch (err) {
      console.warn('Could not install auth interceptor on window.fetch:', err);
    }
  }
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.user) {
      setCurrentUser(data.user);
      return { success: true, user: data.user, message: data.message };
    }
    return { success: false, message: data.message || 'Invalid email or password' };
  } catch (err: any) {
    console.error('Backend login error:', err);
    return { success: false, message: err?.message || 'Network error connecting to database' };
  }
};

export const registerUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: string
): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password, role }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.user) {
      setCurrentUser(data.user);
      return { success: true, user: data.user, message: data.message };
    }
    return { success: false, message: data.message || 'Registration failed' };
  } catch (err: any) {
    console.error('Backend registration error:', err);
    return { success: false, message: err?.message || 'Network error connecting to database' };
  }
};

/** Ends the session on the server (clears the cookie). Resolves even if the network call fails. */
export const logoutUser = async (): Promise<void> => {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: getAuthHeaders(), keepalive: true });
  } catch {
    // ignore network errors on logout
  }
  setCurrentUser(null);
};
