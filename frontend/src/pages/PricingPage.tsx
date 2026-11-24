import React, { useState } from 'react';
import { User } from '../types/auth';
import { MarketingNavbar } from '../components/Navbar/MarketingNavbar';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { BrandHomeLink } from '../components/BrandLogo';
import {
  Check,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  currentUser: User | null;
  onNavigate: (
    page: 'home' | 'features' | 'pricing' | 'about' | 'login' | 'signup' | 'dashboard_hub' | 'bench' | 'sample_graphs' | 'data_hub',
    dashboardId?: string
  ) => void;
}

export const PricingPage: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const plans = [
    {
      id: 'basic',
      name: t('pricingPlanFreeName'),
      badge: t('pricingPlanFreeBadge'),
      price: '$0',
      period: t('pricingPerMonth'),
      originalPrice: null as string | null,
      offerText: null as string | null,
      description: t('pricingPlanFreeDesc'),
      features: [
        t('pricingPlanFreeF1'),
        t('pricingPlanFreeF2'),
        t('pricingPlanFreeF3'),
        t('pricingPlanFreeF4'),
        t('pricingPlanFreeF5'),
        t('pricingPlanFreeF6'),
        t('pricingPlanFreeF7'),
      ],
      ctaText: t('pricingPlanFreeCta'),
      popular: false,
    },
    {
      id: 'upgrade',
      name: t('pricingPlanProName'),
      badge: t('pricingPlanProBadge'),
      price: '$25',
      period: t('pricingPerMonth'),
      originalPrice: '$30',
      offerText: t('pricingPlanProOffer'),
      description: t('pricingPlanProDesc'),
      features: [
        t('pricingPlanProF1'),
        t('pricingPlanProF2'),
        t('pricingPlanProF3'),
        t('pricingPlanProF4'),
        t('pricingPlanProF5'),
        t('pricingPlanProF6'),
        t('pricingPlanProF7'),
        t('pricingPlanProF8'),
      ],
      ctaText: t('pricingPlanProCta'),
      popular: true,
    },
  ];

  const faqs = [
    { q: t('pricingFaq1Q'), a: t('pricingFaq1A') },
    { q: t('pricingFaq2Q'), a: t('pricingFaq2A') },
    { q: t('pricingFaq3Q'), a: t('pricingFaq3A') },
    { q: t('pricingFaq4Q'), a: t('pricingFaq4A') },
    { q: t('pricingFaq5Q'), a: t('pricingFaq5A') },
  ];

  return (
    <div className="min-h-dvh bg-[#f7f9fc] text-navy-900 font-sans flex flex-col relative overflow-x-clip selection:bg-sky-600 selection:text-white">
      <AnimatedBackground />
      <MarketingNavbar currentUser={currentUser} activeNav="pricing" onNavigate={onNavigate} />

      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto w-full flex-1">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-3">
            {t('pricingHeroBadge')}
          </p>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-navy-900 leading-[1.1] mb-4">
            {t('pricingHeroTitle1')}{' '}
            <span className="text-sky-600">{t('pricingHeroTitle2')}</span>
          </h1>

          <p className="text-slate-600 text-base leading-relaxed">
            {t('pricingHeroDesc')}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`min-w-0 rounded-2xl p-5 sm:p-8 flex flex-col justify-between transition-all relative text-start bg-white ${
                plan.popular
                  ? 'border-2 border-sky-600 shadow-lift'
                  : 'border border-slate-200/90 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-navy-900">{plan.name}</h3>
                    <span className="text-xs font-semibold text-sky-600">
                      {plan.badge}
                    </span>
                  </div>
                  {plan.offerText && (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold whitespace-nowrap">
                      {plan.offerText}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  {plan.originalPrice && (
                    <span dir="ltr" className="text-xl line-through text-slate-400 font-bold tabular">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span dir="ltr" className="text-4xl font-black text-navy-900 tabular">{plan.price}</span>
                  <span className="text-xs font-semibold text-slate-500">{plan.period}</span>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {plan.description}
                </p>

                <div className="h-px bg-slate-100 mb-5" />

                <div className="space-y-3 mb-7">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {t('pricingIncludedCapabilities')}
                  </span>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate(currentUser ? 'dashboard_hub' : 'signup')}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  plan.popular
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                    : 'bg-navy-900 hover:bg-navy-800 text-white'
                }`}
              >
                <span>{plan.ctaText}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-8 shadow-lift mb-16">
          <h3 className="text-xl font-extrabold text-navy-900 mb-5 text-start">
            {t('pricingCompareTitle')}
          </h3>

          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full min-w-[460px] text-start text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">{t('pricingColFeature')}</th>
                <th className="py-3 px-4">{t('pricingColStarter')}</th>
                <th className="py-3 px-4 text-sky-600">{t('pricingColPro')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr>
                <td className="py-3 px-4 font-semibold text-navy-900">{t('pricingRow1Label')}</td>
                <td className="py-3 px-4">{t('pricingRow1Starter')}</td>
                <td className="py-3 px-4 text-sky-700 font-semibold">{t('pricingRow1Pro')}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-navy-900">{t('pricingRow2Label')}</td>
                <td className="py-3 px-4">{t('pricingRow2Starter')}</td>
                <td className="py-3 px-4 text-sky-700 font-semibold">{t('pricingRow2Pro')}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-navy-900">{t('pricingRow3Label')}</td>
                <td className="py-3 px-4">{t('pricingRow3Starter')}</td>
                <td className="py-3 px-4 text-sky-700 font-semibold">{t('pricingRow3Pro')}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-navy-900">{t('pricingRow4Label')}</td>
                <td className="py-3 px-4">{t('pricingRow4Starter')}</td>
                <td className="py-3 px-4 text-sky-700 font-semibold">{t('pricingRow4Pro')}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-navy-900">{t('pricingRow5Label')}</td>
                <td className="py-3 px-4">{t('pricingRow5Starter')}</td>
                <td className="py-3 px-4 text-sky-700 font-semibold">{t('pricingRow5Pro')}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-extrabold text-navy-900 tracking-tight mb-2">
              {t('pricingFaqTitle')}
            </h3>
            <p className="text-slate-500 text-sm">
              {t('pricingFaqDesc')}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4.5 text-start font-semibold text-navy-900 text-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4.5 pb-4.5 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 pt-3 text-start">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Callout */}
        <div className="text-center bg-sky-50 border border-sky-200/80 rounded-2xl p-8 max-w-2xl mx-auto">
          <h4 className="font-bold text-navy-900 text-base mb-1.5">{t('pricingNeedCustomTitle')}</h4>
          <p className="text-slate-600 text-xs sm:text-sm mb-4">
            {t('pricingNeedCustomDesc')}
          </p>
          <button
            type="button"
            onClick={() => onNavigate(currentUser ? 'dashboard_hub' : 'signup')}
            className="px-6 py-2.5 rounded-xl bg-navy-900 hover:bg-sky-600 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {t('pricingSpeakEngineer')}
          </button>
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
          <p className="text-xs text-slate-400" dir="ltr">
            &copy; 2026 Data Pulse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
