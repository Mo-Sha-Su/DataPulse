/**
 * PostgreSQL jsonb does not keep object key order (it sorts keys by length, then bytes), so a row saved as
 * {"Order ID", "Customer ID", "Region"} comes back as {"Region", "Order ID", "Customer ID"}. The dataset's
 * `columns` list is the source of truth for column order, so rows are put back in that order when read.
 * Keys not listed in `columns` keep their relative order after the listed ones.
 */
export function orderRowKeys<T extends Record<string, any>>(rows: T[], columns: { name: string }[]): T[] {
  if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(columns) || columns.length === 0) return rows;
  const order = columns.map((c) => c?.name).filter((n): n is string => typeof n === 'string');
  return rows.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    const out: Record<string, any> = {};
    for (const k of order) if (Object.prototype.hasOwnProperty.call(row, k)) out[k] = row[k];
    for (const k of Object.keys(row)) if (!(k in out)) out[k] = row[k];
    return out as T;
  });
}
