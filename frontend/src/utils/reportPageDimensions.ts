import { CanvasSettings, PageMargins, PageOrientation, PageUnit, ReportPageSizePreset } from '../types/dashboard';

export interface PageSizeDefinition {
  name: ReportPageSizePreset;
  widthPhysical: number;
  heightPhysical: number;
  unit: PageUnit;
  orientation: PageOrientation;
}

// Physical sizes in mm or inches
export const REPORT_PAGE_PRESETS: Record<string, PageSizeDefinition> = {
  'A4 Portrait': { name: 'A4 Portrait', widthPhysical: 210, heightPhysical: 297, unit: 'mm', orientation: 'portrait' },
  'A4 Landscape': { name: 'A4 Landscape', widthPhysical: 297, heightPhysical: 210, unit: 'mm', orientation: 'landscape' },
  'A3 Portrait': { name: 'A3 Portrait', widthPhysical: 297, heightPhysical: 420, unit: 'mm', orientation: 'portrait' },
  'A3 Landscape': { name: 'A3 Landscape', widthPhysical: 420, heightPhysical: 297, unit: 'mm', orientation: 'landscape' },
  'Letter Portrait': { name: 'Letter Portrait', widthPhysical: 8.5, heightPhysical: 11, unit: 'in', orientation: 'portrait' },
  'Letter Landscape': { name: 'Letter Landscape', widthPhysical: 11, heightPhysical: 8.5, unit: 'in', orientation: 'landscape' },
  'Legal Portrait': { name: 'Legal Portrait', widthPhysical: 8.5, heightPhysical: 14, unit: 'in', orientation: 'portrait' },
  'Legal Landscape': { name: 'Legal Landscape', widthPhysical: 14, heightPhysical: 8.5, unit: 'in', orientation: 'landscape' },
};

export const DEFAULT_PAGE_MARGINS: PageMargins = {
  top: 12,
  right: 12,
  bottom: 12,
  left: 12,
  unit: 'mm',
};

// Convert physical length (mm, cm, in, px) to Screen Pixels (standard 96 DPI)
export function unitToPx(value: number, unit: PageUnit): number {
  switch (unit) {
    case 'in':
      return Math.round(value * 96);
    case 'cm':
      return Math.round((value / 2.54) * 96);
    case 'mm':
      return Math.round((value / 25.4) * 96);
    case 'px':
    default:
      return Math.round(value);
  }
}

export function pxToUnit(px: number, unit: PageUnit): number {
  switch (unit) {
    case 'in':
      return Number((px / 96).toFixed(2));
    case 'cm':
      return Number(((px / 96) * 2.54).toFixed(2));
    case 'mm':
      return Number(((px / 96) * 25.4).toFixed(1));
    case 'px':
    default:
      return Math.round(px);
  }
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

export function getCanvasDimensionsFromSettings(canvas: CanvasSettings): { widthPx: number; heightPx: number; marginsPx: { top: number; right: number; bottom: number; left: number } } {
  const preset = canvas.pageSizePreset && REPORT_PAGE_PRESETS[canvas.pageSizePreset];

  if (preset && canvas.pageSizePreset !== 'Custom Size') {
    const unit = preset.unit;
    const widthPhysical = preset.widthPhysical;
    const heightPhysical = preset.heightPhysical;

    const widthPx = unitToPx(widthPhysical, unit) || 794;
    const heightPx = unitToPx(heightPhysical, unit) || 1123;

    const margins = canvas.margins || DEFAULT_PAGE_MARGINS;
    const marginsPx = {
      top: unitToPx(margins.top, margins.unit),
      right: unitToPx(margins.right, margins.unit),
      bottom: unitToPx(margins.bottom, margins.unit),
      left: unitToPx(margins.left, margins.unit),
    };

    return { widthPx, heightPx, marginsPx };
  }

  // Pure digital/dashboard canvas with pixel width/height (e.g. 1920x1080)
  const widthPx = canvas.width || 1920;
  const heightPx = canvas.height || 1080;
  const margins = canvas.margins || { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' };
  const marginsPx = {
    top: margins.top || 0,
    right: margins.right || 0,
    bottom: margins.bottom || 0,
    left: margins.left || 0,
  };

  return { widthPx, heightPx, marginsPx };
}

// Convert preset or physical selection to jsPDF paper format array/string
export function getJsPdfPageConfig(canvas: CanvasSettings): { format: string | number[]; orientation: 'p' | 'l' | 'portrait' | 'landscape'; unit: 'mm' | 'in' | 'pt' } {
  const presetKey = canvas.pageSizePreset || 'A4 Portrait';
  
  if (presetKey.startsWith('A4')) {
    return {
      format: 'a4',
      orientation: canvas.orientation || (presetKey.includes('Landscape') ? 'landscape' : 'portrait'),
      unit: 'mm',
    };
  }
  if (presetKey.startsWith('A3')) {
    return {
      format: 'a3',
      orientation: canvas.orientation || (presetKey.includes('Landscape') ? 'landscape' : 'portrait'),
      unit: 'mm',
    };
  }
  if (presetKey.startsWith('Letter')) {
    return {
      format: 'letter',
      orientation: canvas.orientation || (presetKey.includes('Landscape') ? 'landscape' : 'portrait'),
      unit: 'in',
    };
  }
  if (presetKey.startsWith('Legal')) {
    return {
      format: 'legal',
      orientation: canvas.orientation || (presetKey.includes('Landscape') ? 'landscape' : 'portrait'),
      unit: 'in',
    };
  }

  // Custom physical size or fallback
  const unit = canvas.unit === 'in' ? 'in' : 'mm';
  const widthPhys = canvas.widthPhysical || 210;
  const heightPhys = canvas.heightPhysical || 297;

  return {
    format: [widthPhys, heightPhys],
    orientation: widthPhys > heightPhys ? 'landscape' : 'portrait',
    unit,
  };
}
