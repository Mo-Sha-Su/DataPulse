import {
  ForecastConfidenceLevel,
  ForecastRecord,
  ForecastResultRecord,
  ForecastScenarioRecord,
} from '../types/forecast';
import { loadXLSX } from './xlsxLazy';

export interface ForecastExportInput {
  forecast: ForecastRecord | null;
  result: ForecastResultRecord;
  confidenceLevel: ForecastConfidenceLevel;
  activeScenario?: ForecastScenarioRecord | null;
  generatedAt?: string;
}

/**
 * Escapes cells starting with `=`, `+`, `-`, or `@` (spreadsheet formula injection protection)
 * by prefixing a leading apostrophe `'`.
 */
export function escapeSpreadsheetCell(value: unknown): string | number {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return value;
  }
  const str = String(value);
  if (/^[\t\r ]*[=+\-@]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/** Escapes any string or numeric cell safely for CSV output (always escaping leading =, +, -, @). */
export function formatCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str: string;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    str = String(value);
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
  } else {
    str = String(value);
    if (/^[\t\r ]*[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildForecastExportRows({
  forecast,
  result,
  confidenceLevel,
  activeScenario,
  generatedAt,
}: ForecastExportInput): Array<Array<string | number>> {
  const lowKey = `lower${confidenceLevel}` as 'lower80' | 'lower90' | 'lower95';
  const upKey = `upper${confidenceLevel}` as 'upper80' | 'upper90' | 'upper95';

  const relText = result.reliability
    ? `${result.reliability.level} (${result.reliability.score}/100)`
    : 'N/A';

  const generatedDate = generatedAt || result.createdAt || new Date().toISOString();

  const rows: Array<Array<string | number>> = [
    [escapeSpreadsheetCell('Model'), escapeSpreadsheetCell(result.selectedModelLabel || result.selectedModel)],
    [escapeSpreadsheetCell('Frequency'), escapeSpreadsheetCell(result.frequency)],
    [escapeSpreadsheetCell('Reliability'), escapeSpreadsheetCell(relText)],
    [escapeSpreadsheetCell('Confidence Level'), escapeSpreadsheetCell(`${confidenceLevel}%`)],
    [escapeSpreadsheetCell('Generated Date'), escapeSpreadsheetCell(generatedDate)],
  ];

  if (forecast?.name) {
    rows.unshift([escapeSpreadsheetCell('Forecast Name'), escapeSpreadsheetCell(forecast.name)]);
  }

  rows.push([]);

  const scenarioByDate = new Map<string, NonNullable<ForecastScenarioRecord['scenarioResults']>['predictedData'][number]>();
  if (activeScenario?.scenarioResults?.predictedData?.length) {
    for (const spt of activeScenario.scenarioResults.predictedData) {
      if (spt?.date) scenarioByDate.set(spt.date, spt);
    }
  }
  const hasScenario = scenarioByDate.size > 0;

  const headerRow = [
    'date',
    'forecast',
    'lower',
    'upper',
    ...(hasScenario ? ['scenario_forecast', 'scenario_lower', 'scenario_upper', 'scenario_delta'] : []),
  ];
  rows.push(headerRow);

  for (const pt of result.predictedData) {
    const baseRow: Array<string | number> = [
      escapeSpreadsheetCell(pt.date),
      escapeSpreadsheetCell(pt.value),
      escapeSpreadsheetCell(pt[lowKey]),
      escapeSpreadsheetCell(pt[upKey]),
    ];
    if (hasScenario) {
      const spt = scenarioByDate.get(pt.date);
      if (spt) {
        baseRow.push(
          escapeSpreadsheetCell(spt.value),
          escapeSpreadsheetCell(spt[lowKey]),
          escapeSpreadsheetCell(spt[upKey]),
          escapeSpreadsheetCell(spt.delta),
        );
      } else {
        baseRow.push('', '', '', '');
      }
    }
    rows.push(baseRow);
  }

  return rows;
}

export function buildForecastCsvContent(input: ForecastExportInput): string {
  const matrix = buildForecastExportRows(input);
  return matrix.map((row) => row.map((cell) => formatCsvCell(cell)).join(',')).join('\r\n');
}

function safeDownloadFilename(name: string | undefined, ext: 'csv' | 'xlsx'): string {
  const base = (name || 'forecast')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF_-]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return `${base || 'forecast'}_projection.${ext}`;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadForecastCsv(input: ForecastExportInput): void {
  const csvText = `\uFEFF${buildForecastCsvContent(input)}`;
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, safeDownloadFilename(input.forecast?.name, 'csv'));
}

export async function downloadForecastExcel(input: ForecastExportInput): Promise<void> {
  const XLSX = await loadXLSX();
  const matrix = buildForecastExportRows(input);
  // Ensure every string cell inside XLSX worksheet is formula-escaped cleanly
  const safeMatrix = matrix.map((row) => row.map((cell) => escapeSpreadsheetCell(cell)));
  const ws = XLSX.utils.aoa_to_sheet(safeMatrix);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Forecast');
  const bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, safeDownloadFilename(input.forecast?.name, 'xlsx'));
}
