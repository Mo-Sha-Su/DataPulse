import { DashboardState, CanvasSettings } from '../types/dashboard';
import { getJsPdfPageConfig, getCanvasDimensionsFromSettings } from './reportPageDimensions';

/** Configuration controlling client-side multi-page PDF capture. */
export interface PdfExportOptions {
  filename: string;
  pageRange: 'all' | 'current' | 'custom';
  customPages?: number[];
  /** Rasterization multiplier passed to html2canvas (typically 2 or 3). */
  scaleFactor?: number;
}

/** Strips filesystem-unsafe characters and ensures a `.pdf` suffix. */
export function sanitizeFilename(name: string): string {
  if (!name || !name.trim()) return 'Report.pdf';
  const clean = name.trim().replace(/[/\\?%*:|"<>]/g, '_');
  return clean.endsWith('.pdf') ? clean : `${clean}.pdf`;
}

/**
 * Generates and downloads a clean, high-resolution PDF for the given dashboard/report.
 */
export async function exportReportToPdf(
  dashboard: DashboardState,
  options: PdfExportOptions,
  activePageId?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  // Loaded on demand: these two libraries are ~600 KB and only needed when exporting.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const filename = sanitizeFilename(options.filename || dashboard.name);
  const pdfConfig = getJsPdfPageConfig(dashboard.canvas);
  
  // Create jsPDF instance
  const pdf = new jsPDF({
    orientation: pdfConfig.orientation as 'p' | 'l' | 'portrait' | 'landscape',
    unit: pdfConfig.unit as 'mm' | 'in' | 'pt',
    format: pdfConfig.format as any,
  });

  const pages = dashboard.pages && dashboard.pages.length > 0
    ? dashboard.pages
    : [{ id: 'p_1', name: 'Page 1' }];

  // Determine pages to render
  let targetPages = pages;
  if (options.pageRange === 'current' && activePageId) {
    targetPages = pages.filter((p) => p.id === activePageId);
  } else if (options.pageRange === 'custom' && options.customPages && options.customPages.length > 0) {
    targetPages = pages.filter((_, idx) => options.customPages?.includes(idx + 1));
  }

  if (targetPages.length === 0) {
    targetPages = [pages[0]];
  }

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < targetPages.length; i++) {
    const page = targetPages[i];
    if (onProgress) {
      onProgress(Math.round(((i + 0.2) / targetPages.length) * 100), `Rendering ${page.name}...`);
    }

    // Locate the canvas workspace element in DOM
    const pageCanvasElement = document.querySelector(`[data-report-page-id="${page.id}"]`) as HTMLElement ||
      document.querySelector('#report-canvas-root') as HTMLElement ||
      document.querySelector('main > div') as HTMLElement;

    if (!pageCanvasElement) {
      console.warn(`Report canvas element for page ${page.name} not found.`);
      continue;
    }

    // Temporarily hide selection handles, grids, or editor controls
    const hiddenElements = pageCanvasElement.querySelectorAll('.no-print, [data-no-print="true"]');
    hiddenElements.forEach((el) => ((el as HTMLElement).style.display = 'none'));

    try {
      const canvas = await html2canvas(pageCanvasElement, {
        scale: options.scaleFactor || 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: dashboard.canvas.backgroundColor || '#FFFFFF',
        logging: false,
        onclone: (clonedDoc) => {
          // Remove selected borders, edit handles, grid lines in cloned DOM
          const selectedBorders = clonedDoc.querySelectorAll('.border-indigo-500, .border-dashed, .ring-2');
          selectedBorders.forEach((el) => el.classList.remove('border-indigo-500', 'ring-2', 'ring-indigo-500'));
        },
      });

      const imgData = canvas.toDataURL('image/png', 0.98);

      if (i > 0) {
        pdf.addPage(pdfConfig.format as any, pdfConfig.orientation as any);
      }

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    } finally {
      // Restore hidden elements
      hiddenElements.forEach((el) => ((el as HTMLElement).style.display = ''));
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / targetPages.length) * 100), `Page ${i + 1} completed.`);
    }
  }

  // Save PDF
  pdf.save(filename);
}
