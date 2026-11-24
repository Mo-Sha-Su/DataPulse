import React from 'react';
import { User } from '../types/auth';
import { MarketingNavbar } from '../components/Navbar/MarketingNavbar';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { BrandHomeLink } from '../components/BrandLogo';
import {
  Sparkles,
  Layers,
  Cpu,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  currentUser: User | null;
  onNavigate: (
    page: 'home' | 'features' | 'pricing' | 'about' | 'login' | 'signup' | 'dashboard_hub' | 'bench' | 'sample_graphs' | 'data_hub',
    dashboardId?: string
  ) => void;
}

export const AboutPage: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const { t } = useLanguage();

  const stats = [
    { label: t('aboutStat1Label'), value: '150M+' },
    { label: t('aboutStat2Label'), value: '< 12ms' },
    { label: t('aboutStat3Label'), value: '99.99%' },
    { label: t('aboutStat4Label'), value: '25,000+' },
  ];

  const pillars = [
    { icon: Cpu, title: t('aboutPillar1Title'), desc: t('aboutPillar1Desc') },
    { icon: Layers, title: t('aboutPillar2Title'), desc: t('aboutPillar2Desc') },
    { icon: Lock, title: t('aboutPillar3Title'), desc: t('aboutPillar3Desc') },
    { icon: Sparkles, title: t('aboutPillar4Title'), desc: t('aboutPillar4Desc') },
  ];

  return (
    <div className="min-h-dvh bg-[#f7f9fc] text-navy-900 font-sans flex flex-col relative overflow-x-clip selection:bg-sky-600 selection:text-white">
      <AnimatedBackground />
      <MarketingNavbar currentUser={currentUser} activeNav="about" onNavigate={onNavigate} />

      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto w-full flex-1">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-3">
            {t('aboutBadge')}
          </p>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-navy-900 leading-[1.1] mb-4">
            {t('aboutHeroTitle1')}{' '}
            <span className="text-sky-600">{t('aboutHeroTitle2')}</span>
          </h1>

          <p className="text-slate-600 text-base leading-relaxed">
            {t('aboutHeroDesc')}
          </p>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-7 rounded-2xl bg-navy-900 text-white shadow-lift mb-16">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center p-2">
              <span dir="ltr" className="block text-3xl sm:text-4xl font-black text-sky-400 mb-1 tabular">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Story & Workflow Diagram */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-10 shadow-lift mb-16 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
          <div className="lg:col-span-6 min-w-0 space-y-4 text-start">
            <span className="text-xs font-bold uppercase text-sky-600 tracking-wider">
              {t('aboutStoryEyebrow')}
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight leading-snug">
              {t('aboutStoryTitle')}
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed">{t('aboutStoryP1')}</p>
            <p className="text-slate-600 text-sm leading-relaxed">{t('aboutStoryP2')}</p>

            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-navy-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('aboutStoryC1')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-navy-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('aboutStoryC2')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 min-w-0 bg-navy-950 p-4 sm:p-6 rounded-2xl border border-navy-800 text-white text-xs space-y-3 text-start">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider pb-2 border-b border-navy-800 flex flex-wrap items-center justify-between gap-2">
              <span>{t('aboutArchFlowTitle')}</span>
              <span className="text-sky-400">{t('aboutArchBoundary')}</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                { title: t('aboutArchStep1Title'), desc: t('aboutArchStep1Desc'), badge: t('aboutArchStep1Badge'), accent: 'text-sky-400' },
                { title: t('aboutArchStep2Title'), desc: t('aboutArchStep2Desc'), badge: t('aboutArchStep2Badge'), accent: 'text-sky-300' },
                { title: t('aboutArchStep3Title'), desc: t('aboutArchStep3Desc'), badge: t('aboutArchStep3Badge'), accent: 'text-amber-300' },
                { title: t('aboutArchStep4Title'), desc: t('aboutArchStep4Desc'), badge: t('aboutArchStep4Badge'), accent: 'text-emerald-300' },
              ].map((step, i) => (
                <div key={i} className="p-3 rounded-xl bg-navy-900 border border-navy-800 flex items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <span className={`${step.accent} font-bold block text-xs`}>{step.title}</span>
                    <span className="text-[11px] text-slate-400 block">{step.desc}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-200 font-semibold shrink-0">{step.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pillars */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mb-2">
              {t('aboutPrinciplesTitle')}
            </h3>
            <p className="text-slate-600 text-sm">{t('aboutPrinciplesDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-sky-300 transition-all flex gap-4 items-start text-start"
                >
                  <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-navy-900 mb-1.5">{pillar.title}</h4>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{pillar.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-sky-600 rounded-2xl p-8 sm:p-10 text-center text-white shadow-lift">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('aboutCtaTitle')}</h3>
            <p className="text-sky-100 text-sm leading-relaxed">{t('aboutCtaDesc')}</p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate(currentUser ? 'dashboard_hub' : 'signup')}
                className="w-full sm:w-auto px-7 py-3 bg-white text-navy-900 font-bold rounded-xl text-sm transition-colors hover:bg-slate-100 cursor-pointer"
              >
                {t('getStartedFree')}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('features')}
                className="w-full sm:w-auto px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-xl text-sm transition-colors border border-sky-400/30 cursor-pointer"
              >
                {t('exploreAllFeatures')}
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
