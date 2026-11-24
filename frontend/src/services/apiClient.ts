/**
 * Shared HTTP response parsing and error construction helpers for frontend API services.
 */

/** Extracts a safe human-readable error message from a failed `fetch` Response. */
export async function buildApiError(res: Response, actionLabel: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  return new Error(body?.message || `${actionLabel} failed (HTTP ${res.status})`);
}
