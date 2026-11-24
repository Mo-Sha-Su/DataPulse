import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrandLogo } from '../BrandLogo';
import { LanguageToggle, useLanguage } from '../../i18n/LanguageContext';
import { saveUserSettingsToNeon } from '../../services/neonService';
import {
  Sparkles,
  Database,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  FileSpreadsheet,
  Link2,
  LayoutGrid,
  Globe,
  SlidersHorizontal,
  FileText,
  Printer,
  Filter,
  Trash2,
  Columns3,
  UploadCloud,
  Plus,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Images,
  ShieldCheck,
} from 'lucide-react';

export type TourStepId =
  | 'welcome'
  | 'data-hub'
  | 'data-lab'
  | 'data-model'
  | 'dashboard-builder'
  | 'forecast-studio'
  | 'reports'
  | 'getting-started';

export interface TourStepMeta {
  id: TourStepId;
  liveTargets: string[];
}

export const TOUR_STEPS_META: TourStepMeta[] = [
  { id: 'welcome', liveTargets: [] },
  { id: 'data-hub', liveTargets: ['upload-dataset', 'dataset-list', 'nav-data-hub'] },
  { id: 'data-lab', liveTargets: ['apply-close', 'nav-data-hub'] },
  { id: 'data-model', liveTargets: ['data-model-toggle'] },
  { id: 'dashboard-builder', liveTargets: ['filters-btn', 'chart-panel', 'config-panel', 'dashboard-canvas', 'nav-dashboards'] },
  { id: 'forecast-studio', liveTargets: ['nav-forecasts'] },
  { id: 'reports', liveTargets: ['export-pdf', 'new-project', 'nav-dashboards'] },
  { id: 'getting-started', liveTargets: ['language-toggle', 'account-menu'] },
];

export interface SpotlightRect {
  target: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Pure selector lookup for highlighting live workspace targets matching the current tour step.
 */
export function findVisibleTourTargetRect(
  targets: string[],
  modalRect?: { top: number; left: number; right: number; bottom: number } | null
): SpotlightRect | null {
  if (typeof document === 'undefined' || typeof window === 'undefined' || targets.length === 0) {
    return null;
  }

  for (const target of targets) {
    const el = document.querySelector<HTMLElement>(`[data-tour-target="${target}"]`);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
      continue;
    }

    // Avoid highlighting an element hidden directly behind the centered modal card,
    // unless it sits in the top navbar/toolbar where the modal can shift down cleanly.
    if (modalRect && rect.top >= 84) {
      const ix = Math.max(0, Math.min(rect.right, modalRect.right) - Math.max(rect.left, modalRect.left));
      const iy = Math.max(0, Math.min(rect.bottom, modalRect.bottom) - Math.max(rect.top, modalRect.top));
      const overlapArea = ix * iy;
      const targetArea = rect.width * rect.height;
      if (targetArea > 0 && overlapArea / targetArea > 0.55) {
        continue;
      }
    }

    return {
      target,
      top: Math.max(4, rect.top - 4),
      left: Math.max(4, rect.left - 4),
      width: Math.min(window.innerWidth - 8, rect.width + 8),
      height: Math.min(window.innerHeight - 8, rect.height + 8),
    };
  }

  return null;
}

export interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  isReplay?: boolean;
  isAuthenticated?: boolean;
  activePage?: string;
  activeWorkspaceView?: 'canvas' | 'data_model';
  hasDatasets?: boolean;
  onNavigateSection?: (section: 'data_hub' | 'dashboard_hub' | 'forecasts' | 'sample_graphs' | 'signup') => void;
  onOpenDataLab?: () => void;
  onSwitchToDataModel?: () => void;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  isReplay = false,
  isAuthenticated = false,
  activePage,
  activeWorkspaceView = 'canvas',
  hasDatasets = false,
  onNavigateSection,
  onOpenDataLab,
  onSwitchToDataModel,
}) => {
  const { t, isRtl } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);

  // Reset to step 0 when opened and focus primary button
  useEffect(() => {
    if (isOpen) {
      closingRef.current = false;
      setIsCompleting(false);
      setCurrentStep(0);
      const timer = window.setTimeout(() => {
        primaryButtonRef.current?.focus();
      }, 60);
      return () => window.clearTimeout(timer);
    } else {
      setSpotlight(null);
    }
  }, [isOpen]);

  // Measure live UI spotlight target for the current step
  const refreshSpotlight = useCallback(() => {
    if (!isOpen) {
      setSpotlight((prev) => (prev === null ? prev : null));
      return;
    }
    const meta = TOUR_STEPS_META[currentStep];
    const modalBounds = modalRef.current ? modalRef.current.getBoundingClientRect() : null;
    const found = findVisibleTourTargetRect(meta?.liveTargets || [], modalBounds);
    setSpotlight((prev) => {
      if (prev === null && found === null) return prev;
      if (
        prev &&
        found &&
        prev.target === found.target &&
        Math.round(prev.top) === Math.round(found.top) &&
        Math.round(prev.left) === Math.round(found.left) &&
        Math.round(prev.width) === Math.round(found.width) &&
        Math.round(prev.height) === Math.round(found.height)
      ) {
        return prev;
      }
      return found;
    });
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const rafId = window.requestAnimationFrame(() => refreshSpotlight());
    const timer1 = window.setTimeout(() => refreshSpotlight(), 220);
    const timer2 = window.setTimeout(() => refreshSpotlight(), 700);

    let pendingMutRaf = 0;
    const observeRoot = document.getElementById('root') || document.body;
    const observer =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver((records) => {
            const external = records.some((r) => {
              const node = r.target instanceof HTMLElement ? r.target : r.target.parentElement;
              if (!node) return true;
              if (modalRef.current?.contains(node)) return false;
              if (node.hasAttribute('data-tour-spotlight') || node.closest('[data-tour-spotlight]')) return false;
              return true;
            });
            if (!external || pendingMutRaf) return;
            pendingMutRaf = window.requestAnimationFrame(() => {
              pendingMutRaf = 0;
              refreshSpotlight();
            });
          })
        : null;
    observer?.observe(observeRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'hidden', 'class'],
    });

    window.addEventListener('resize', refreshSpotlight);
    window.addEventListener('scroll', refreshSpotlight, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (pendingMutRaf) window.cancelAnimationFrame(pendingMutRaf);
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      observer?.disconnect();
      window.removeEventListener('resize', refreshSpotlight);
      window.removeEventListener('scroll', refreshSpotlight, true);
    };
  }, [isOpen, currentStep, activePage, activeWorkspaceView, refreshSpotlight]);

  // Fallback retry while waiting for lazy-loaded Suspense routes to mount a target element
  useEffect(() => {
    if (!isOpen || spotlight !== null) return;
    const targets = TOUR_STEPS_META[currentStep]?.liveTargets || [];
    if (targets.length === 0) return;
    const interval = window.setInterval(() => refreshSpotlight(), 250);
    return () => window.clearInterval(interval);
  }, [isOpen, currentStep, spotlight, refreshSpotlight]);

  const handleFinishOrSkip = useCallback(
    async (afterClose?: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      setIsCompleting(true);

      try {
        if (!isReplay && isAuthenticated) {
          await Promise.race([
            saveUserSettingsToNeon({
              preferences: {
                onboarding: { completed: true, version: 1 },
                onboardingCompleted: true,
              },
            }).catch(() => undefined),
            new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
          ]);
        }
      } finally {
        closingRef.current = false;
        setIsCompleting(false);
        onClose();
        afterClose?.();
      }
    },
    [isReplay, isAuthenticated, onClose]
  );

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS_META.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      void handleFinishOrSkip();
    }
  }, [currentStep, handleFinishOrSkip]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Keyboard navigation & focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        void handleFinishOrSkip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isRtl) {
          handlePrev();
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (isRtl) {
          handleNext();
        } else {
          handlePrev();
        }
      } else if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRtl, handleFinishOrSkip, handleNext, handlePrev]);

  if (!isOpen) return null;

  const totalSteps = TOUR_STEPS_META.length;
  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  const steps = [
    // 1. Welcome & How Everything Works
    {
      id: 'welcome' as TourStepId,
      icon: <Sparkles className="w-4 h-4 text-sky-400" />,
      title: t('tourS1Title'),
      desc: t('tourS1Desc'),
      tip: t('tourS1Tip'),
      points: [t('tourS1Pt1'), t('tourS1Pt2'), t('tourS1Pt3')],
      sectionAction: null,
      visual: (
        <div className="w-full rounded-xl bg-gradient-to-br from-[#08122e] via-[#0b1739] to-[#0d1d4a] p-4 border border-sky-500/25 space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <BrandLogo size={26} />
              <div>
                <p className="font-extrabold text-white text-sm leading-none">{t('brandName')}</p>
                <p className="text-[11px] text-sky-300/90 mt-0.5">{t('brandTagline')}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('tourS8AutoSaveNote').split('·')[0].trim()}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: Database, title: t('tourS1FlowHub'), sub: t('tourS1FlowHubSub'), color: 'text-emerald-400', border: 'border-emerald-500/25' },
              { icon: Sliders, title: t('tourS1FlowLab'), sub: t('tourS1FlowLabSub'), color: 'text-amber-300', border: 'border-amber-400/25' },
              { icon: LayoutGrid, title: t('tourS1FlowDash'), sub: t('tourS1FlowDashSub'), color: 'text-sky-400', border: 'border-sky-500/30' },
              { icon: TrendingUp, title: t('tourS1FlowForecast'), sub: t('tourS1FlowForecastSub'), color: 'text-sky-300', border: 'border-sky-400/30' },
            ].map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.title}
                  className={`relative rounded-xl bg-white/[0.04] border ${stage.border} p-2.5 flex flex-col gap-1`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${stage.color}`} />
                    <span dir="ltr" className="text-[10px] font-mono text-slate-400 font-bold">
                      0{idx + 1}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white leading-tight mt-0.5">{stage.title}</p>
                  <p className="text-[10px] text-slate-300/80 leading-snug">{stage.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },

    // 2. Upload Your Spreadsheets (Data Hub)
    {
      id: 'data-hub' as TourStepId,
      icon: <Database className="w-4 h-4 text-emerald-400" />,
      title: t('tourS2Title'),
      desc: t('tourS2Desc'),
      tip: t('tourS2Tip'),
      points: [t('tourS2Pt1'), t('tourS2Pt2'), t('tourS2Pt3')],
      sectionAction:
        isAuthenticated && activePage !== 'data_hub' && onNavigateSection
          ? {
              label: t('tourGoToDataHub'),
              onClick: () => void handleFinishOrSkip(() => onNavigateSection('data_hub')),
            }
          : null,
      visual: (
        <div className="w-full rounded-xl bg-[#08122e] border border-emerald-500/25 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2 text-slate-100 font-bold">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>{t('dataHub')}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[11px] ring-2 ring-sky-400/50 shadow-sm">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{t('tourS2UploadBtn')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p dir="ltr" className="font-mono font-bold text-white text-[11px] truncate">
                    monthly_sales.xlsx
                  </p>
                  <p className="text-[10px] text-slate-300/80 mt-0.5">{t('tourS2File1Meta')}</p>
                </div>
              </div>
              <span dir="ltr" className="text-[10px] font-mono font-bold text-emerald-400">
                99%
              </span>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p dir="ltr" className="font-mono font-bold text-white text-[11px] truncate">
                    customers_list.csv
                  </p>
                  <p className="text-[10px] text-slate-300/80 mt-0.5">{t('tourS2File2Meta')}</p>
                </div>
              </div>
              <span dir="ltr" className="text-[10px] font-mono font-bold text-sky-400">
                96%
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10 text-[10px]">
            <span className="text-slate-300 font-medium">
              {t('tourS2FormatsLabel')}:{' '}
              <span dir="ltr" className="font-mono font-bold text-emerald-300">
                Excel (.xlsx / .xls) · CSV · TSV · JSON
              </span>
            </span>
            <span className="text-slate-400">
              {t('tourS2FormatsHint')}
            </span>
          </div>
        </div>
      ),
    },

    // 3. Clean Messy Spreadsheets (Data Lab)
    {
      id: 'data-lab' as TourStepId,
      icon: <Sliders className="w-4 h-4 text-amber-300" />,
      title: t('tourS3Title'),
      desc: t('tourS3Desc'),
      tip: t('tourS3Tip'),
      points: [t('tourS3Pt1'), t('tourS3Pt2'), t('tourS3Pt3')],
      sectionAction:
        isAuthenticated && onOpenDataLab
          ? {
              label: hasDatasets ? t('tourGoToDataLab') : t('tourGoToDataHub'),
              onClick: () =>
                void handleFinishOrSkip(() => {
                  if (hasDatasets) {
                    onOpenDataLab();
                  } else {
                    onNavigateSection?.('data_hub');
                  }
                }),
            }
          : null,
      visual: (
        <div className="w-full rounded-xl bg-[#08122e] border border-amber-400/25 p-3 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div dir="ltr" className="flex items-center gap-1.5 font-mono text-[10px] text-slate-200">
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-sky-300 font-semibold">
                monthly_sales.xlsx
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[10px] ring-2 ring-amber-400/60 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t('tourS3ApplyBtn')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div dir="ltr" className="sm:col-span-2 rounded-lg bg-[#0d1a3d] border border-white/10 p-2 font-mono text-[10px] space-y-1">
              <div className="grid grid-cols-4 gap-1 text-slate-300 font-bold border-b border-white/10 pb-1">
                <span>#</span>
                <span>Customer</span>
                <span className="text-sky-300">City</span>
                <span>Total</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-slate-200 py-0.5">
                <span className="text-slate-400">1</span>
                <span className="truncate">Acme Store</span>
                <span className="bg-amber-500/20 text-amber-200 px-1 rounded border border-amber-400/50 truncate">
                  Riyadh
                </span>
                <span>$8,420</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-slate-300 py-0.5">
                <span className="text-slate-400">2</span>
                <span className="truncate">North Shop</span>
                <span>Jeddah</span>
                <span>$4,190</span>
              </div>
            </div>

            <div className="rounded-lg bg-[#0d1a3d] border border-white/10 p-2 space-y-1.5 text-[10px]">
              <p className="text-[10px] text-slate-300 font-bold">
                {t('tourS3PipelineTitle')}
              </p>
              <div className="flex items-center gap-1.5 text-sky-300">
                <Filter className="w-3 h-3 shrink-0" />
                <span className="truncate">{t('tourS3FilterAction')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <Trash2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{t('tourS3DedupeAction')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-200">
                <Columns3 className="w-3 h-3 shrink-0" />
                <span className="truncate">{t('tourS3ColAction')}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // 4. Connect Two Spreadsheets (Optional)
    {
      id: 'data-model' as TourStepId,
      icon: <Link2 className="w-4 h-4 text-sky-400" />,
      title: t('tourS4Title'),
      desc: t('tourS4Desc'),
      tip: t('tourS4Tip'),
      points: [t('tourS4Pt1'), t('tourS4Pt2'), t('tourS4Pt3')],
      sectionAction:
        isAuthenticated && activePage === 'bench' && activeWorkspaceView !== 'data_model' && onSwitchToDataModel
          ? {
              label: t('tourGoToDataModel'),
              onClick: () => void handleFinishOrSkip(() => onSwitchToDataModel()),
            }
          : isAuthenticated && activePage !== 'bench' && onNavigateSection
          ? {
              label: t('tourGoToDashboards'),
              onClick: () => void handleFinishOrSkip(() => onNavigateSection('dashboard_hub')),
            }
          : null,
      visual: (
        <div className="w-full rounded-xl bg-[#08122e] border border-sky-500/25 p-3.5 space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2.5">
            <div className="rounded-lg bg-white/[0.04] border border-sky-400/35 p-2.5">
              <div className="flex items-center justify-between text-[11px] text-sky-300 font-bold pb-1 border-b border-white/10">
                <span>{t('tourS4DimTitle')}</span>
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-slate-200 mt-1.5">Customer ID</p>
              <p className="text-[10px] text-slate-400">Name · City · Plan</p>
            </div>

            <div className="rounded-lg bg-white/[0.04] border border-amber-400/35 p-2.5 relative">
              <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold pb-1 border-b border-white/10">
                <span>{t('tourS4FactTitle')}</span>
                <Link2 className="w-3.5 h-3.5 text-sky-300" />
              </div>
              <p className="text-[11px] text-slate-200 mt-1.5">Customer ID</p>
              <p className="text-[10px] text-emerald-300 font-semibold">
                {t('tourS4MeasureLabel')}: {t('tourS4MeasureSample')}
              </p>
            </div>

            <div className="rounded-lg bg-gradient-to-br from-sky-600/20 to-[#0d1d4a] border border-sky-400/40 p-2.5 text-center">
              <BarChart3 className="w-4 h-4 text-sky-300 mx-auto" />
              <p dir="ltr" className="text-sm font-black text-white mt-1 tabular-nums">$1.24M</p>
              <p className="text-[10px] text-sky-200 mt-0.5 font-medium">{t('tourS4ConnectedDash')}</p>
            </div>
          </div>
        </div>
      ),
    },

    // 5. Build Interactive Dashboards
    {
      id: 'dashboard-builder' as TourStepId,
      icon: <LayoutGrid className="w-4 h-4 text-sky-400" />,
      title: t('tourS5Title'),
      desc: t('tourS5Desc'),
      tip: t('tourS5Tip'),
      points: [t('tourS5Pt1'), t('tourS5Pt2'), t('tourS5Pt3')],
      sectionAction:
        isAuthenticated && activePage !== 'dashboard_hub' && activePage !== 'bench' && onNavigateSection
          ? {
              label: t('tourGoToDashboards'),
              onClick: () => void handleFinishOrSkip(() => onNavigateSection('dashboard_hub')),
            }
          : null,
      visual: (
        <div className="w-full rounded-xl bg-[#08122e] border border-sky-500/25 p-3 space-y-2 text-[10px]">
          <div className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5">
            <span className="inline-flex items-center gap-1.5 text-sky-300 font-bold">
              <Filter className="w-3 h-3" />
              <span>{t('tourS5Filters')}</span>
            </span>
            <span className="text-slate-300 font-medium">
              City = All · 2025
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-3 rounded-lg bg-white/[0.04] border border-sky-500/30 p-2 space-y-1">
              <p className="font-bold text-sky-300 leading-tight">{t('tourS5ChartPanel')}</p>
              <p className="text-[9px] text-slate-300/80 leading-snug">{t('tourS5ChartTypes')}</p>
            </div>

            <div className="sm:col-span-6 rounded-lg bg-[#0d1a3d] border border-white/15 p-2 space-y-1.5">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span>{t('tourS5Canvas')}</span>
                <span dir="ltr" className="text-emerald-400 font-mono tabular-nums">$1.24M</span>
              </div>
              <div dir="ltr" className="h-10 flex items-end gap-1 px-1 pt-1 bg-black/25 rounded">
                {[38, 62, 50, 82, 68, 96, 84].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-xs"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="sm:col-span-3 rounded-lg bg-white/[0.04] border border-emerald-400/30 p-2 space-y-1">
              <p className="font-bold text-emerald-300 leading-tight">{t('tourS5Config')}</p>
              <div className="text-[9px] text-slate-300/85 space-y-0.5">
                <div className="truncate">{t('tourS5Rev')}</div>
                <div className="truncate">{t('tourS5Target')}</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // 6. Predict Future Trends (Forecast Studio)
    {
      id: 'forecast-studio' as TourStepId,
      icon: <TrendingUp className="w-4 h-4 text-sky-400" />,
      title: t('tourFcTitle'),
      desc: t('tourFcDesc'),
      tip: t('tourFcTip'),
      points: [t('tourFcPt1'), t('tourFcPt2'), t('tourFcPt3')],
      sectionAction:
        isAuthenticated && activePage !== 'forecasts' && onNavigateSection
          ? {
              label: t('tourGoToForecasts'),
              onClick: () => void handleFinishOrSkip(() => onNavigateSection('forecasts')),
            }
          : null,
      visual: (
        <div className="w-full rounded-xl bg-[#08122e] border border-sky-500/30 p-3 space-y-2.5 text-[10px]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/35 text-sky-200 font-bold">
                {t('tourFcTemplateLabel')}: {t('tourFcPresetSales')}
              </span>
              <span className="text-slate-300 font-semibold">{t('tourFcHorizonLabel')}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 font-bold">
              <LayoutGrid className="w-3 h-3" />
              <span>{t('tourFcPinBtn')}</span>
            </span>
          </div>

          {/* Forecast trend preview SVG */}
          <div className="rounded-lg bg-[#0d1a3d] border border-white/10 p-2.5 space-y-2">
            <svg viewBox="0 0 320 68" className="w-full h-14 overflow-visible" aria-hidden="true">
              {/* Forecast confidence range */}
              <path
                d="M 160 38 L 210 26 L 260 18 L 315 8 L 315 36 L 260 40 L 210 42 L 160 38 Z"
                fill="rgba(14, 165, 233, 0.2)"
              />
              {/* Historical line */}
              <path
                d="M 8 54 L 48 48 L 86 52 L 122 40 L 160 38"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Projected dashed line */}
              <path
                d="M 160 38 L 210 34 L 260 28 L 315 21"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
              <circle cx="160" cy="38" r="3.5" fill="#38bdf8" />
            </svg>
            <p className="text-[11px] text-slate-200 leading-snug">{t('tourFcSummarySample')}</p>
          </div>
        </div>
      ),
    },

    // 7. Polished Multi-Page PDF Reports
    {
      id: 'reports' as TourStepId,
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      title: t('tourS6Title'),
      desc: t('tourS6Desc'),
      tip: t('tourS6Tip'),
      points: [t('tourS6Pt1'), t('tourS6Pt2'), t('tourS6Pt3')],
      sectionAction:
        isAuthenticated && activePage !== 'dashboard_hub' && activePage !== 'bench' && onNavigateSection
          ? {
              label: t('tourGoToDashboards'),
              onClick: () => void handleFinishOrSkip(() => onNavigateSection('dashboard_hub')),
            }
          : null,
      visual: (
        <div className="w-full rounded-xl bg-[#08122e] border border-emerald-500/25 p-3 space-y-2.5 text-[10px]">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="px-2 py-1 rounded bg-white text-navy-900 font-bold whitespace-nowrap">
                {t('tourS6Page1')}
              </span>
              <span className="px-2 py-1 rounded bg-white/10 text-slate-200 font-medium whitespace-nowrap">
                {t('tourS6Page2')}
              </span>
              <span className="w-5 h-5 rounded bg-white/10 text-slate-200 grid place-items-center shrink-0">
                <Plus className="w-3 h-3" />
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold shrink-0 ring-2 ring-emerald-400/50">
              <Printer className="w-3 h-3" />
              <span>{t('tourS6ExportPdf')}</span>
            </div>
          </div>

          <div className="rounded-lg bg-white text-navy-900 p-2.5 border border-slate-300 space-y-2 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span className="font-extrabold text-[11px] text-navy-900">{t('tourS6HeaderSample')}</span>
              <span dir="ltr" className="text-[9px] font-mono text-slate-400">
                A4 · 1 / 2
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="rounded bg-slate-100 p-1.5">
                <p className="text-[9px] text-slate-500">{t('tourS5Rev')}</p>
                <p dir="ltr" className="font-black text-navy-900 text-xs tabular-nums">$1.24M</p>
              </div>
              <div className="rounded bg-slate-100 p-1.5">
                <p className="text-[9px] text-slate-500">{t('tourS5Target')}</p>
                <p dir="ltr" className="font-black text-emerald-700 text-xs tabular-nums">94.8%</p>
              </div>
              <div dir="ltr" className="h-8 rounded bg-slate-100 px-1.5 py-1 flex items-end gap-1">
                {[45, 70, 58, 92, 85].map((h, i) => (
                  <div key={i} className="flex-1 bg-sky-600 rounded-t-xs" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // 8. Quick Guide: Navigation, Visual Gallery & Help Anytime
    {
      id: 'getting-started' as TourStepId,
      icon: <Globe className="w-4 h-4 text-sky-400" />,
      title: t('tourS7Title'),
      desc: t('tourS7Desc'),
      tip: t('tourS7Tip'),
      points: [t('tourS7ReplayHint'), t('tourS7ReadyHint')],
      sectionAction: null,
      visual: (
        <div className="w-full rounded-xl bg-[#08122e] border border-sky-500/25 p-3.5 space-y-2.5 text-xs">
          {/* Plain-language Top Bar Map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { icon: LayoutGrid, title: t('tourS8TabDash'), desc: t('tourS8TabDashDesc'), color: 'text-sky-400' },
              { icon: Database, title: t('tourS8TabData'), desc: t('tourS8TabDataDesc'), color: 'text-emerald-400' },
              { icon: TrendingUp, title: t('tourS8TabFc'), desc: t('tourS8TabFcDesc'), color: 'text-sky-300' },
              { icon: Images, title: t('tourS8TabGallery'), desc: t('tourS8TabGalleryDesc'), color: 'text-amber-300' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg bg-white/[0.04] border border-white/10 p-2 flex items-start gap-2">
                  <Icon className={`w-4 h-4 ${item.color} shrink-0 mt-0.5`} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white leading-tight">{item.title}</p>
                    <p className="text-[10px] text-slate-300/80 leading-snug mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Language Switcher */}
          <div className="flex items-center justify-between gap-2 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-slate-100 font-semibold text-[11px]">
              <Globe className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{t('tourS7LangLabel')}</span>
            </div>
            <LanguageToggle className="h-8 py-1" />
          </div>

          {/* Simple Tour Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300 px-1">
            <span className="inline-flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('tourS7NavShortcut2')}</span>
              <kbd dir="ltr" className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 font-mono text-[10px] text-white">
                ← / →
              </kbd>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span>{t('tourS7NavShortcut3')}</span>
              <kbd dir="ltr" className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 font-mono text-[10px] text-white">
                Esc
              </kbd>
            </span>
          </div>

          {/* Direct Launch CTAs */}
          {isAuthenticated ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => void handleFinishOrSkip(() => onNavigateSection?.('data_hub'))}
                className="px-2.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-emerald-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('tourUploadFirstDataset')}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleFinishOrSkip(() => onNavigateSection?.('forecasts'))}
                className="px-2.5 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/35 text-sky-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('tourGoToForecasts')}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleFinishOrSkip(() => onNavigateSection?.('dashboard_hub'))}
                className="px-2.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('tourCreateFirstDashboard')}</span>
              </button>
            </div>
          ) : (
            onNavigateSection && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => void handleFinishOrSkip(() => onNavigateSection('sample_graphs'))}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Images className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('tourGoToGallery')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleFinishOrSkip(() => onNavigateSection('signup'))}
                  className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{t('tourSignUpAction')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            )
          )}
        </div>
      ),
    },
  ];

  const current = steps[currentStep];
  // If spotlight highlights an element in the top navbar/header bar, give extra top clearance so both remain visible
  const shiftBelowNavbar = spotlight !== null && spotlight.top < 84;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[70] flex justify-center p-3 sm:p-5 bg-[#040a1a]/75 backdrop-blur-xs transition-all ${
          shiftBelowNavbar ? 'items-start pt-20 sm:pt-24' : 'items-center'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
      >
        {/* Live DOM Spotlight Ring (unobtrusive & non-blocking) */}
        {spotlight && (
          <div
            aria-hidden="true"
            data-tour-spotlight={spotlight.target}
            style={{
              top: `${spotlight.top}px`,
              left: `${spotlight.left}px`,
              width: `${spotlight.width}px`,
              height: `${spotlight.height}px`,
            }}
            className="fixed z-[71] pointer-events-none rounded-xl border-2 border-sky-400 bg-sky-400/10 tour-spotlight-ring transition-all duration-200"
          >
            <span className="absolute -bottom-6 start-0 px-2 py-0.5 rounded bg-sky-500 text-navy-950 text-[10px] font-extrabold whitespace-nowrap shadow-md">
              {t('tourLiveTargetLabel')}
            </span>
          </div>
        )}

        {/* Modal Container */}
        <div
          ref={modalRef}
          className={`relative z-[72] w-full max-w-2xl bg-[#0b1739] border border-white/15 text-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
            shiftBelowNavbar ? 'max-h-[calc(100dvh-6.5rem)]' : 'max-h-[90dvh]'
          }`}
        >
          {/* Progress Rail */}
          <div className="h-1 w-full bg-white/10 shrink-0" aria-hidden="true">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-white/[0.07] border border-white/15 grid place-items-center shrink-0">
                {current.icon}
              </span>
              <div className="min-w-0">
                <p dir="ltr" className="text-[11px] font-mono font-bold text-sky-400 tabular-nums">
                  {t('stepOf', { current: currentStep + 1, total: totalSteps })}
                </p>
                <h2 id="tour-modal-title" className="text-sm sm:text-base font-extrabold text-white truncate">
                  {current.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isCompleting}
                onClick={() => void handleFinishOrSkip()}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('skipTour')}
              </button>
              <button
                type="button"
                disabled={isCompleting}
                onClick={() => void handleFinishOrSkip()}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
                aria-label={t('tourModalCloseAria')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step Body */}
          <div key={current.id} className="p-4 sm:p-6 overflow-y-auto space-y-4 tour-step-enter">
            {/* Visual UI Mockup */}
            <div className="rounded-xl overflow-hidden shadow-inner">{current.visual}</div>

            {/* Plain-Language Narrative + Key Takeaways + Good-to-Know Tip */}
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">{current.desc}</p>

              <ul className="space-y-1.5">
                {current.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-200/90 leading-snug">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl bg-sky-500/10 border border-sky-400/25 px-3.5 py-2.5 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
                <p className="text-xs text-sky-100/95 leading-snug">
                  <span className="font-bold text-sky-300">{t('tourWhenToUseLabel')}: </span>
                  {current.tip}
                </p>
              </div>
            </div>

            {/* Section Navigation CTA (if applicable) */}
            {current.sectionAction && (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={current.sectionAction.onClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-sky-300 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{current.sectionAction.label}</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-white/10 bg-[#08122e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            {/* Step Progress Tabs */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5" role="tablist" aria-label={t('tourProgressLabel')}>
              {steps.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  onClick={() => setCurrentStep(idx)}
                  aria-label={t('tourGoToStep', { step: idx + 1 })}
                  aria-selected={currentStep === idx}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-7 bg-sky-400'
                      : idx < currentStep
                      ? 'w-2.5 bg-sky-500/55 hover:bg-sky-400/80'
                      : 'w-2.5 bg-white/20 hover:bg-white/35'
                  }`}
                />
              ))}
            </div>

            {/* Back & Next / Finish Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isFirst || isCompleting}
                className="h-10 px-4 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t('tourBack')}</span>
              </button>

              <button
                ref={primaryButtonRef}
                type="button"
                disabled={isCompleting}
                onClick={handleNext}
                className="flex-1 sm:flex-initial h-10 px-5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-[0.99] transition-all shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <span>{isLast ? t('tourFinishTour') : t('next')}</span>
                {isLast ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
