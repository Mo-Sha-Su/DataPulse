/**
 * Converts a database timestamp (Date object, ISO string, or nullable value) into an ISO-8601 string.
 * Falls back to the current timestamp when the source column is null/undefined.
 */
export function toIsoTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value) {
    return String(value);
  }
  return new Date().toISOString();
}
