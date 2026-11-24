import React, { useCallback, useEffect, useRef, useState } from 'react';
import { User } from '../types/auth';
import { MarketingNavbar } from '../components/Navbar/MarketingNavbar';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { BrandHomeLink } from '../components/BrandLogo';
import {
  Database,
  Sparkles,
  Network,
  LayoutGrid,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  BarChart3,
  CheckCircle2,
  Table,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  currentUser: User | null;
  onNavigate: (
    page: 'home' | 'features' | 'pricing' | 'about' | 'login' | 'signup' | 'dashboard_hub' | 'bench' | 'sample_graphs' | 'data_hub',
    dashboardId?: string
  ) => void;
}

export const FeaturesPage: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const { t, isRtl, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'hub' | 'explore' | 'model' | 'widgets' | 'security'>('hub');
  const tablistRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const featureTabs = [
    {
      id: 'hub' as const,
      label: t('featTabHubLabel'),
      icon: Database,
      title: t('featTabHubTitle'),
      desc: t('featTabHubDesc'),
      highlights: [
        t('featTabHubH1'),
        t('featTabHubH2'),
        t('featTabHubH3'),
        t('featTabHubH4'),
      ],
      previewBadge: t('featTabHubBadge'),
    },
    {
      id: 'explore' as const,
      label: t('featTabExploreLabel'),
      icon: Sparkles,
      title: t('featTabExploreTitle'),
      desc: t('featTabExploreDesc'),
      highlights: [
        t('featTabExploreH1'),
        t('featTabExploreH2'),
        t('featTabExploreH3'),
        t('featTabExploreH4'),
      ],
      previewBadge: t('featTabExploreBadge'),
    },
    {
      id: 'model' as const,
      label: t('featTabModelLabel'),
      icon: Network,
      title: t('featTabModelTitle'),
      desc: t('featTabModelDesc'),
      highlights: [
        t('featTabModelH1'),
        t('featTabModelH2'),
        t('featTabModelH3'),
        t('featTabModelH4'),
      ],
      previewBadge: t('featTabModelBadge'),
    },
    {
      id: 'widgets' as const,
      label: t('featTabWidgetsLabel'),
      icon: LayoutGrid,
      title: t('featTabWidgetsTitle'),
      desc: t('featTabWidgetsDesc'),
      highlights: [
        t('featTabWidgetsH1'),
        t('featTabWidgetsH2'),
        t('featTabWidgetsH3'),
        t('featTabWidgetsH4'),
      ],
      previewBadge: t('featTabWidgetsBadge'),
    },
    {
      id: 'security' as const,
      label: t('featTabSecLabel'),
      icon: ShieldCheck,
      title: t('featTabSecTitle'),
      desc: t('featTabSecDesc'),
      highlights: [
        t('featTabSecH1'),
        t('featTabSecH2'),
        t('featTabSecH3'),
        t('featTabSecH4'),
      ],
      previewBadge: t('featTabSecBadge'),
    },
  ];

  const currentTabObj = featureTabs.find((tab) => tab.id === activeTab) || featureTabs[0];

  const updateScrollIndicators = useCallback(() => {
    const container = tablistRef.current;
    if (!container) return;
    if (container.scrollWidth <= container.clientWidth + 2) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const firstEl = tabRefs.current[featureTabs[0].id];
    const lastEl = tabRefs.current[featureTabs[featureTabs.length - 1].id];
    if (!firstEl || !lastEl) return;

    const containerRect = container.getBoundingClientRect();
    const firstRect = firstEl.getBoundingClientRect();
    const lastRect = lastEl.getBoundingClientRect();

    const minEdge = Math.min(firstRect.left, lastRect.left);
    const maxEdge = Math.max(firstRect.right, lastRect.right);

    setCanScrollLeft(minEdge < containerRect.left - 2);
    setCanScrollRight(maxEdge > containerRect.right + 2);
  }, [featureTabs]);

  useEffect(() => {
    updateScrollIndicators();
    if (typeof window === 'undefined') return;

    const handleResize = () => updateScrollIndicators();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && tablistRef.current) {
      observer = new ResizeObserver(updateScrollIndicators);
      observer.observe(tablistRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [updateScrollIndicators, language]);

  const handleSelectTab = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    const targetBtn = tabRefs.current[tabId];
    if (targetBtn && typeof targetBtn.scrollIntoView === 'function') {
      targetBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const scrollTabsBy = (direction: 'left' | 'right') => {
    const container = tablistRef.current;
    if (!container) return;
    const distance = Math.max(200, Math.round(container.clientWidth * 0.6));
    container.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const handleTablistWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = tablistRef.current;
    if (!container || container.scrollWidth <= container.clientWidth + 2) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const step =
      (e.key === 'ArrowRight' && !isRtl) || (e.key === 'ArrowLeft' && isRtl) ? 1 : -1;
    const nextIndex = (currentIndex + step + featureTabs.length) % featureTabs.length;
    const nextTab = featureTabs[nextIndex];
    handleSelectTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  };

  return (
    <div className="min-h-dvh bg-[#f7f9fc] text-navy-900 font-sans flex flex-col relative overflow-x-clip selection:bg-sky-600 selection:text-white">
      <AnimatedBackground />
      <MarketingNavbar currentUser={currentUser} activeNav="features" onNavigate={onNavigate} />

      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto w-full flex-1">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-3">
            {t('featuresHeroBadge')}
          </p>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-navy-900 leading-[1.1] mb-4">
            {t('featuresHeroTitle1')}{' '}
            <span className="text-sky-600">{t('featuresHeroTitle2')}</span>
          </h1>

          <p className="text-slate-600 text-base leading-relaxed">
            {t('featuresHeroDesc')}
          </p>
        </div>

        {/* Feature Tabs Selector */}
        <div className="flex justify-center mb-8">
          <div className="relative inline-flex max-w-full items-center rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
            {canScrollLeft && (
              <div className="absolute left-0 inset-y-0 z-10 flex items-center pl-1.5 pr-6 bg-gradient-to-r from-white via-white/95 to-transparent pointer-events-none">
                <button
                  type="button"
                  onClick={() => scrollTabsBy('left')}
                  aria-label={isRtl ? t('next') : t('previous')}
                  className="pointer-events-auto w-8 h-8 rounded-xl bg-white border border-slate-200/90 shadow-sm text-navy-900 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 grid place-items-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            <div
              ref={tablistRef}
              role="tablist"
              aria-label={t('productFeaturesTitle')}
              onScroll={updateScrollIndicators}
              onWheel={handleTablistWheel}
              className="flex max-w-full items-center gap-1 p-1.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-proximity"
            >
              {featureTabs.map((tab, index) => {
                const Icon = tab.icon;
                const isSelected = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[tab.id] = el;
                    }}
                    role="tab"
                    type="button"
                    aria-selected={isSelected}
                    onClick={() => handleSelectTab(tab.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                    className={`group relative snap-center min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-[13px] flex items-center gap-2 transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                      isSelected
                        ? 'bg-navy-900 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80 font-semibold'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg grid place-items-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-white/15 text-sky-300'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {canScrollRight && (
              <div className="absolute right-0 inset-y-0 z-10 flex items-center pr-1.5 pl-6 bg-gradient-to-l from-white via-white/95 to-transparent pointer-events-none">
                <button
                  type="button"
                  onClick={() => scrollTabsBy('right')}
                  aria-label={isRtl ? t('previous') : t('next')}
                  className="pointer-events-auto w-8 h-8 rounded-xl bg-white border border-slate-200/90 shadow-sm text-navy-900 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 grid place-items-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-10 shadow-lift grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center mb-16">
          <div className="lg:col-span-7 min-w-0 space-y-5 text-start">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              {currentTabObj.previewBadge}
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              {currentTabObj.title}
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {currentTabObj.desc}
            </p>

            <div className="space-y-2.5 pt-1">
              {currentTabObj.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate(currentUser ? 'dashboard_hub' : 'signup')}
                className="px-6 py-3 rounded-xl bg-navy-900 hover:bg-sky-600 text-white font-semibold text-xs sm:text-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{t('featuresTryBtn')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 min-w-0 bg-navy-950 rounded-2xl border border-navy-800 p-4 sm:p-5 shadow-lg text-slate-200 text-xs overflow-hidden text-start space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-200">{currentTabObj.previewBadge}</span>
              <span className="text-sky-300 font-semibold">{currentTabObj.label}</span>
            </div>

            <div className="space-y-2.5 py-1">
              {activeTab === 'hub' && (
                <>
                  <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-100">Sales Summary 2026</p>
                        <p className="text-[11px] text-slate-400">14,200 rows · Excel</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-300 font-semibold">99%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {['Overview', 'Regional', 'Monthly'].map((dash) => (
                      <div key={dash} className="p-2 rounded-lg bg-navy-900/70 border border-navy-800 text-[11px] font-semibold text-slate-300">
                        {dash}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'explore' && (
                <div className="space-y-2">
                  {currentTabObj.highlights.slice(0, 3).map((stepLabel, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-[10px] grid place-items-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[11.5px] text-slate-200 leading-snug">{stepLabel}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'model' && (
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-between">
                    <span className="font-bold text-sky-200">ORDERS</span>
                    <span className="text-[11px] text-sky-300 font-semibold">1 : *</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Customers', 'Products', 'Dates', 'Stores'].map((dim) => (
                      <div key={dim} className="p-2 rounded-lg bg-navy-900 border border-navy-800 text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                        <Network className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">{dim}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'widgets' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Sales</p>
                    <p dir="ltr" className="text-lg font-extrabold text-emerald-400 mt-0.5">$482K</p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">+18.4%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 flex flex-col justify-between">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Monthly Trend</p>
                    <div className="flex items-end gap-1.5 h-9 pt-1">
                      {[40, 65, 55, 85, 100].map((h, i) => (
                        <span key={i} className="flex-1 rounded-t bg-sky-400/85" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-2">
                  {[t('featTabSecH1'), t('featTabSecH2'), t('featTabSecH4')].map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-[11px] text-slate-200 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>{t('featuresZeroLatency')}</span>
              <span className="text-sky-400 font-semibold">{t('featuresEngineReady')}</span>
            </div>
          </div>
        </div>

        {/* 6 Core Capabilities */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mb-2">
              {t('featuresFullStackTitle')}
            </h3>
            <p className="text-slate-600 text-sm">
              {t('featuresFullStackDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Table, tone: 'bg-sky-50 text-sky-600', title: t('featuresCard1Title'), desc: t('featuresCard1Desc') },
              { icon: Sparkles, tone: 'bg-navy-900/5 text-navy-900', title: t('featuresCard2Title'), desc: t('featuresCard2Desc') },
              { icon: Layers, tone: 'bg-amber-50 text-amber-600', title: t('featuresCard3Title'), desc: t('featuresCard3Desc') },
              { icon: Calendar, tone: 'bg-emerald-50 text-emerald-600', title: t('featuresCard4Title'), desc: t('featuresCard4Desc') },
              { icon: BarChart3, tone: 'bg-sky-50 text-sky-600', title: t('featuresCard5Title'), desc: t('featuresCard5Desc') },
              { icon: ShieldCheck, tone: 'bg-rose-50 text-rose-600', title: t('featuresCard6Title'), desc: t('featuresCard6Desc') },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-sky-300 transition-all text-start">
                  <div className={`w-10 h-10 rounded-xl ${card.tone} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-navy-900 text-base mb-1.5">{card.title}</h4>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-navy-900 rounded-2xl p-8 sm:p-10 text-center text-white shadow-lift">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('featuresCtaTitle')}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{t('featuresCtaDesc')}</p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate(currentUser ? 'dashboard_hub' : 'signup')}
                className="w-full sm:w-auto px-7 py-3 bg-sky-500 hover:bg-sky-400 text-navy-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                {t('getStartedFree')}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('sample_graphs')}
                className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm transition-colors border border-white/20 cursor-pointer"
              >
                {t('featuresViewGallery')}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 bg-navy-950 text-slate-300 py-10 px-4 sm:px-6 md:px-10 border-t border-navy-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <BrandHomeLink size={32} textSize="text-lg" tone="dark" onNavigateHome={() => onNavigate('home')} />
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-400">
            <button onClick={() => onNavigate('features')} className="hover:text-white transition-colors cursor-pointer">{t('features')}</button>
            <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors cursor-pointer">{t('pricing')}</button>
            <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">{t('about')}</button>
          </div>
          <p className="text-xs text-slate-400" dir="ltr">&copy; 2026 Data Pulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
