import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types/auth';
import { MarketingNavbar } from '../components/Navbar/MarketingNavbar';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { BrandHomeLink } from '../components/BrandLogo';
import {
  Zap,
  ArrowRight,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  currentUser: User | null;
  onNavigate: (
    page: 'home' | 'features' | 'pricing' | 'about' | 'login' | 'signup' | 'dashboard_hub' | 'bench' | 'sample_graphs' | 'data_hub',
    dashboardId?: string
  ) => void;
}

/** Triggers scroll reveal once when a section enters the viewport (falls back immediately if unsupported). */
function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible || !ref.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return { ref, visible };
}

export const HomePage: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const { t } = useLanguage();
  const pillarsReveal = useRevealOnScroll<HTMLDivElement>();

  return (
    <div className="min-h-dvh bg-[#f7f9fc] text-navy-900 font-sans flex flex-col relative overflow-x-clip selection:bg-sky-600 selection:text-white">
      <AnimatedBackground />
      <MarketingNavbar currentUser={currentUser} activeNav="home" onNavigate={onNavigate} />

      {/* Centered Editorial SaaS Hero */}
      <section className="relative z-10 pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="home-fade-up text-4xl sm:text-5xl xl:text-[56px] font-black tracking-tight text-navy-900 leading-[1.08]">
            {t('heroTitle1')}{' '}
            <span className="text-sky-600">{t('heroTitleHighlight')}</span>
          </h1>

          <p
            className="home-fade-up text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ animationDelay: '80ms' }}
          >
            {t('heroDescription')}
          </p>

          <div
            className="home-fade-up flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1"
            style={{ animationDelay: '160ms' }}
          >
            <button
              type="button"
              onClick={() => onNavigate(currentUser ? 'dashboard_hub' : 'signup')}
              className="h-12 px-7 rounded-xl bg-navy-900 hover:bg-sky-600 hover:-translate-y-0.5 active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>{t('getStartedFree')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('features')}
              className="h-12 px-6 rounded-xl bg-white hover:bg-slate-50 hover:-translate-y-0.5 active:scale-[0.98] text-navy-900 border border-slate-200 hover:border-slate-300 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>{t('exploreAllFeatures')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3 Pillars Overview */}
      <section className="relative z-10 py-16 md:py-20 px-4 sm:px-6 md:px-10 bg-white border-t border-slate-200/80">
        <div ref={pillarsReveal.ref} className="max-w-7xl mx-auto">
          <div
            className={`text-center max-w-2xl mx-auto mb-12 transition-all duration-500 ${
              pillarsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mb-3">
              {t('exploreDataPulseTitle')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              {t('exploreDataPulseSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <button
              type="button"
              onClick={() => onNavigate('features')}
              style={{ transitionDelay: '40ms' }}
              className={`min-w-0 p-6 sm:p-7 rounded-2xl bg-[#f7f9fc] hover:bg-white border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-lift hover:-translate-y-1 active:scale-[0.99] transition-all duration-500 cursor-pointer flex flex-col justify-between group text-start ${
                pillarsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-sky-600 transition-colors">
                  {t('productFeaturesTitle')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  {t('productFeaturesDesc')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600">
                <span>{t('exploreAllFeatures')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              style={{ transitionDelay: '120ms' }}
              className={`min-w-0 p-6 sm:p-7 rounded-2xl bg-[#f7f9fc] hover:bg-white border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-lift hover:-translate-y-1 active:scale-[0.99] transition-all duration-500 cursor-pointer flex flex-col justify-between group text-start ${
                pillarsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-navy-900/5 text-navy-900 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-sky-600 transition-colors">
                  {t('pricing')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  {t('transparentPricingDesc')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600">
                <span>{t('pricing')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('about')}
              style={{ transitionDelay: '200ms' }}
              className={`min-w-0 p-6 sm:p-7 rounded-2xl bg-[#f7f9fc] hover:bg-white border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-lift hover:-translate-y-1 active:scale-[0.99] transition-all duration-500 cursor-pointer flex flex-col justify-between group text-start ${
                pillarsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-sky-600 transition-colors">
                  {t('about')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  {t('enterpriseArchitectureDesc')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600">
                <span>{t('about')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="relative z-10 bg-navy-950 text-slate-300 py-12 sm:py-14 px-4 sm:px-6 md:px-10 border-t border-navy-800 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="space-y-2.5">
            <BrandHomeLink size={34} textSize="text-lg" tone="dark" onNavigateHome={() => onNavigate('home')} />
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm text-start">
              <span dir="ltr">Intelligence in motion</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-xs sm:text-sm font-semibold text-slate-300">
            <button onClick={() => onNavigate('features')} className="hover:text-sky-400 transition-colors cursor-pointer">
              {t('features')}
            </button>
            <button onClick={() => onNavigate('pricing')} className="hover:text-sky-400 transition-colors cursor-pointer">
              {t('pricing')}
            </button>
            <button onClick={() => onNavigate('about')} className="hover:text-sky-400 transition-colors cursor-pointer">
              {t('about')}
            </button>
            <button onClick={() => onNavigate('sample_graphs')} className="hover:text-sky-400 transition-colors cursor-pointer">
              {t('visualGallery')}
            </button>
          </div>

          <div className="text-start md:text-end text-xs text-slate-400 space-y-1">
            <p><span dir="ltr">&copy; 2026 Data Pulse. All rights reserved.</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
};
