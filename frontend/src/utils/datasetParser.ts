import Papa from 'papaparse';
import { loadXLSX } from './xlsxLazy';
import { decodeBytes, detectEncoding, DetectedEncoding } from './encodingDetector';
import { DatasetColumn } from '../types/dashboard';

export interface ParseOptions {
  encoding?: string;
  separator?: string; // 'auto' | ',' | ';' | '\t' | '|'
  sheetName?: string;
}

export interface ParsedDatasetResult {
  name: string;
  columns: DatasetColumn[];
  rows: Record<string, any>[];
  rowCount: number;
  columnCount: number;
  detectedEncoding: DetectedEncoding;
  effectiveEncoding: string;
  hasReplacementChar: boolean;
  sheets?: string[];
  selectedSheet?: string;
  fileType: 'delimited' | 'excel' | 'json';
}

/**
 * Checks whether a string represents a canonical number that can be safely converted to a JS number
 * without losing precision or mutating significant leading zeroes (such as "007" or credit cards/IDs).
 */
export function parseCanonicalNumber(val: any): { isNumber: boolean; value: any } {
  if (typeof val === 'number') {
    return { isNumber: !Number.isNaN(val), value: val };
  }
  if (typeof val !== 'string') {
    return { isNumber: false, value: val };
  }

  const s = val.trim();
  if (s === '') {
    return { isNumber: false, value: val };
  }

  // Preserve leading zeros in integer digit sequences like "007" or "01234"
  if (/^0\d+$/.test(s)) {
    return { isNumber: false, value: s };
  }

  // Preserve long digit sequences that would lose IEEE 754 precision (credit cards, barcodes, IDs >= 16 digits)
  if (/^\d{16,}$/.test(s)) {
    return { isNumber: false, value: s };
  }

  // Canonical decimal / scientific number regex:
  // Examples: "42", "-15", "3.14159", "-0.05", "1.2e5"
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)) {
    const num = Number(s);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      return { isNumber: true, value: num };
    }
  }

  return { isNumber: false, value: s };
}

/**
 * Deduplicates and cleans column headers:
 * - Strips leading BOM if present
 * - Renames empty/blank headers to "Column N"
 * - Deduplicates duplicates by appending " (2)", " (3)", etc.
 */
export function normalizeHeaders(rawHeaders: (string | null | undefined)[]): string[] {
  const seenCount = new Map<string, number>();
  const out: string[] = [];

  for (let i = 0; i < rawHeaders.length; i++) {
    let h = String(rawHeaders[i] ?? '').replace(/^\uFEFF/, '').trim();
    if (!h) {
      h = `Column ${i + 1}`;
    }

    const lower = h.toLowerCase();
    const count = seenCount.get(lower) || 0;
    seenCount.set(lower, count + 1);

    if (count > 0) {
      out.push(`${h} (${count + 1})`);
    } else {
      out.push(h);
    }
  }

  return out;
}

/**
 * Infers column types by inspecting ALL rows in the dataset.
 */
export function inferColumnTypes(headers: string[], rows: Record<string, any>[]): DatasetColumn[] {
  return headers.map((colName) => {
    let nonNullCount = 0;
    let numberCount = 0;
    let dateCount = 0;
    let sampleVal: any = null;

    for (const r of rows) {
      const v = r[colName];
      if (v === null || v === undefined || v === '') continue;

      nonNullCount++;
      if (sampleVal === null) sampleVal = v;

      if (typeof v === 'number') {
        numberCount++;
      } else if (typeof v === 'string') {
        const canonical = parseCanonicalNumber(v);
        if (canonical.isNumber) {
          numberCount++;
        } else if (isValidDateString(v)) {
          dateCount++;
        }
      } else if (v instanceof Date) {
        dateCount++;
      }
    }

    let type: 'number' | 'date' | 'string' = 'string';
    if (nonNullCount > 0) {
      if (numberCount === nonNullCount) {
        type = 'number';
      } else if (dateCount === nonNullCount) {
        type = 'date';
      }
    }

    return {
      name: colName,
      type,
      sampleValue: sampleVal ?? '',
    };
  });
}

function isValidDateString(s: string): boolean {
  if (/^\d{1,4}$/.test(s)) return false; // purely a year or small number
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(s)) return false; // time string
  const d = Date.parse(s);
  if (Number.isNaN(d)) return false;
  // Year check to avoid false positives on random strings
  const year = new Date(d).getFullYear();
  return year >= 1900 && year <= 2100;
}

/**
 * Detects whether byte buffer has magic bytes for Excel (ZIP/CFB) or JSON.
 */
export function detectFileMagic(bytes: Uint8Array): 'excel-zip' | 'excel-cfb' | 'json' | 'text' {
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'excel-zip'; // XLSX / ODS
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0xD0 &&
    bytes[1] === 0xCF &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xE0 &&
    bytes[4] === 0xA1 &&
    bytes[5] === 0xB1 &&
    bytes[6] === 0x1A &&
    bytes[7] === 0xE1
  ) {
    return 'excel-cfb'; // XLS
  }

  // Check if JSON
  for (let i = 0; i < Math.min(bytes.length, 128); i++) {
    const b = bytes[i];
    if (b === 0x20 || b === 0x09 || b === 0x0A || b === 0x0D) continue;
    if (b === 0x5B || b === 0x7B) return 'json'; // '[' or '{'
    break;
  }

  return 'text';
}

/**
 * Main parser function: processes file bytes into a clean, typed Dataset payload.
 */
export async function parseDatasetBuffer(
  bytes: Uint8Array,
  fileName: string,
  options: ParseOptions = {}
): Promise<ParsedDatasetResult> {
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const magic = detectFileMagic(bytes);

  // 1. Excel files (XLSX, XLS, ODS)
  if (magic === 'excel-zip' || magic === 'excel-cfb') {
    const XLSX = await loadXLSX();
    const workbook = XLSX.read(bytes, { type: 'array', cellDates: true });
    const sheets = workbook.SheetNames || [];
    const selectedSheet = options.sheetName && sheets.includes(options.sheetName) ? options.sheetName : sheets[0];
    const worksheet = workbook.Sheets[selectedSheet];

    if (!worksheet) {
      throw new Error(`Sheet "${selectedSheet}" not found in Excel workbook`);
    }

    // Convert sheet to JSON rows; dates converted to ISO strings
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawData.length === 0) {
      return {
        name: baseName,
        columns: [],
        rows: [],
        rowCount: 0,
        columnCount: 0,
        detectedEncoding: { encoding: 'binary', confidence: 1, reason: 'Excel workbook binary stream' },
        effectiveEncoding: 'binary',
        hasReplacementChar: false,
        sheets,
        selectedSheet,
        fileType: 'excel',
      };
    }

    const rawHeaders = (rawData[0] || []).map((v) => (v !== null && v !== undefined ? String(v) : ''));
    const headers = normalizeHeaders(rawHeaders);
    const rows: Record<string, any>[] = [];

    for (let r = 1; r < rawData.length; r++) {
      const rowArr = rawData[r];
      if (!rowArr || rowArr.length === 0 || rowArr.every((cell) => cell === '' || cell === null || cell === undefined)) {
        continue;
      }
      const rowObj: Record<string, any> = {};
      for (let c = 0; c < headers.length; c++) {
        let val = rowArr[c];
        if (val instanceof Date) {
          val = val.toISOString();
        } else if (typeof val === 'string') {
          const canonical = parseCanonicalNumber(val);
          val = canonical.isNumber ? canonical.value : val.trim();
        }
        rowObj[headers[c]] = val ?? '';
      }
      rows.push(rowObj);
    }

    const columns = inferColumnTypes(headers, rows);

    return {
      name: baseName,
      columns,
      rows,
      rowCount: rows.length,
      columnCount: columns.length,
      detectedEncoding: { encoding: 'binary', confidence: 1, reason: 'Excel workbook' },
      effectiveEncoding: 'binary',
      hasReplacementChar: false,
      sheets,
      selectedSheet,
      fileType: 'excel',
    };
  }

  // 2. Decode text using our encoding engine
  const requestedEncoding = options.encoding || 'auto';
  const decoded = decodeBytes(bytes, requestedEncoding);
  const detected = detectEncoding(bytes);

  // 3. JSON files
  if (magic === 'json') {
    try {
      const parsed = JSON.parse(decoded.text);
      let arr: any[] = [];
      if (Array.isArray(parsed)) {
        arr = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const firstArrayProp = Object.values(parsed).find((v) => Array.isArray(v));
        if (firstArrayProp) arr = firstArrayProp as any[];
        else arr = [parsed];
      }

      if (arr.length > 0 && typeof arr[0] === 'object') {
        const rawHeaders = Array.from(new Set(arr.flatMap((item) => Object.keys(item || {}))));
        const headers = normalizeHeaders(rawHeaders);
        const rows = arr.map((item) => {
          const rowObj: Record<string, any> = {};
          for (const h of headers) {
            let val = item?.[h];
            if (typeof val === 'string') {
              const canonical = parseCanonicalNumber(val);
              val = canonical.isNumber ? canonical.value : val;
            }
            rowObj[h] = val ?? '';
          }
          return rowObj;
        });

        const columns = inferColumnTypes(headers, rows);
        return {
          name: baseName,
          columns,
          rows,
          rowCount: rows.length,
          columnCount: columns.length,
          detectedEncoding: detected,
          effectiveEncoding: decoded.encoding,
          hasReplacementChar: decoded.hasReplacementChar,
          fileType: 'json',
        };
      }
    } catch {
      // If JSON parse failed, fall through to delimited text parser
    }
  }

  // 4. Delimited text (CSV, TSV, TXT)
  let separator = options.separator || 'auto';
  if (separator === 'auto') {
    separator = autoDetectSeparator(decoded.text);
  }

  const parsed = Papa.parse(decoded.text, {
    delimiter: separator,
    skipEmptyLines: 'greedy',
    dynamicTyping: false, // CRITICAL: NEVER dynamicTyping (would turn "007" into 7)
  });

  if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(parsed.errors[0].message || 'Failed to parse delimited file');
  }

  const rawRows = parsed.data as string[][];
  if (!rawRows || rawRows.length === 0) {
    return {
      name: baseName,
      columns: [],
      rows: [],
      rowCount: 0,
      columnCount: 0,
      detectedEncoding: detected,
      effectiveEncoding: decoded.encoding,
      hasReplacementChar: decoded.hasReplacementChar,
      fileType: 'delimited',
    };
  }

  // First row is headers
  const rawHeaders = rawRows[0];
  const headers = normalizeHeaders(rawHeaders);
  const rows: Record<string, any>[] = [];

  for (let r = 1; r < rawRows.length; r++) {
    const rowArr = rawRows[r];
    if (!rowArr || rowArr.length === 0 || rowArr.every((c) => c === '' || c === null || c === undefined)) {
      continue;
    }
    const rowObj: Record<string, any> = {};
    for (let c = 0; c < headers.length; c++) {
      const rawVal = rowArr[c] !== undefined ? rowArr[c] : '';
      const canonical = parseCanonicalNumber(rawVal);
      rowObj[headers[c]] = canonical.isNumber ? canonical.value : rawVal;
    }
    rows.push(rowObj);
  }

  const columns = inferColumnTypes(headers, rows);

  return {
    name: baseName,
    columns,
    rows,
    rowCount: rows.length,
    columnCount: columns.length,
    detectedEncoding: detected,
    effectiveEncoding: decoded.encoding,
    hasReplacementChar: decoded.hasReplacementChar,
    fileType: 'delimited',
  };
}

/**
 * Detects delimiter by checking frequencies of common delimiters in the first 10 non-empty lines.
 */
function autoDetectSeparator(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 10);
  if (lines.length === 0) return ',';

  const candidates = [',', ';', '\t', '|'];
  let bestSep = ',';
  let bestScore = -1;

  for (const sep of candidates) {
    const counts = lines.map((line) => line.split(sep).length - 1);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

    // Prefer separators that appear consistently (> 0 and same count on every line)
    if (minCount > 0) {
      const variance = maxCount - minCount;
      const score = avgCount * 10 - variance * 5;
      if (score > bestScore) {
        bestScore = score;
        bestSep = sep;
      }
    }
  }

  return bestSep;
}
