/**
 * JSON for a PostgreSQL jsonb column. jsonb cannot store the NUL character (\u0000) and rejects the whole value
 * ("unsupported Unicode escape sequence"), which would make saving a dataset containing one fail with a 500.
 * Real-world CSV/Excel exports occasionally contain them, so they are removed on the way in.
 * The regex only matches a genuine escape (an odd number of backslashes), never the literal text "\\u0000".
 */
export function toJson(value: unknown): string {
  const s = JSON.stringify(value);
  return s === undefined ? 'null' : s.replace(/(?<!\\)((?:\\\\)*)\\u0000/g, '$1');
}
