import React, { useEffect, useRef, useState } from 'react';
import { User } from '../../types/auth';
import { BrandHomeLink } from '../BrandLogo';
import { Menu, X, ArrowRight, LayoutGrid } from 'lucide-react';
import { useLanguage, LanguageToggle } from '../../i18n/LanguageContext';

interface Props {
  currentUser: User | null;
  activeNav?: 'home' | 'features' | 'pricing' | 'about';
  onNavigate: (
    page: 'home' | 'features' | 'pricing' | 'about' | 'login' | 'signup' | 'dashboard_hub' | 'bench' | 'sample_graphs' | 'data_hub',
    dashboardId?: string
  ) => void;
}

export const MarketingNavbar: React.FC<Props> = ({
  currentUser,
  activeNav,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [mobileMenuOpen]);

  const navItems: { id: 'features' | 'pricing' | 'about'; label: string }[] = [
    { id: 'features', label: t('features') },
    { id: 'pricing', label: t('pricing') },
    { id: 'about', label: t('about') },
  ];

  return (
    <header ref={headerRef} className="fixed top-0 inset-x-0 h-18 bg-white/92 backdrop-blur-md border-b border-slate-200/80 z-50 transition-all">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 md:px-10 flex items-center justify-between gap-3 sm:gap-6 min-w-0">
        {/* Left: Brand Logo & Name */}
        <div className="min-w-0 shrink">
          <BrandHomeLink
            size={34}
            textSize="text-base sm:text-lg"
            onNavigateHome={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
          />
        </div>

        {/* Center: Clean typography links */}
        <nav className="hidden md:flex items-center gap-1" aria-label={t('navSectionsLabel')}>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative px-3.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeNav === item.id
                  ? 'text-navy-900 bg-sky-50/70'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
              }`}
            >
              {item.label}
              {activeNav === item.id && (
                <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-sky-600" />
              )}
            </button>
          ))}
        </nav>

        {/* Right: Locale + Primary Actions */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <LanguageToggle className="h-9" />

          {currentUser ? (
            <button
              type="button"
              onClick={() => onNavigate('dashboard_hub')}
              className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.985] text-white font-semibold text-xs whitespace-nowrap shadow-xs shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
              title={t('navGoToHub')}
              aria-label={t('navGoToHub')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t('dashboards')}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="h-9 px-3.5 rounded-xl text-slate-700 hover:text-navy-900 hover:bg-slate-100 font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer"
                title={t('signIn')}
                aria-label={t('signIn')}
              >
                {t('signIn')}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="h-9 px-4 rounded-xl bg-navy-900 hover:bg-sky-600 active:scale-[0.985] text-white font-semibold text-xs whitespace-nowrap shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title={t('getStartedFree')}
                aria-label={t('getStartedFree')}
              >
                <span>{t('getStartedFree')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer shrink-0"
          aria-label={t('navSectionsLabel')}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto bg-white/95 backdrop-blur-xl border-b border-slate-200 px-5 py-4 shadow-xl">
          <div className="flex flex-col gap-2 font-semibold text-sm">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-start py-2.5 px-3 rounded-xl transition-colors cursor-pointer ${
                  activeNav === item.id ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="h-px bg-slate-200 my-2" />

            <LanguageToggle className="w-full justify-center py-2.5" />

            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  onNavigate('dashboard_hub');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>{t('dashboards')}</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold text-center cursor-pointer"
                >
                  {t('signIn')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-navy-900 text-white font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t('getStartedFree')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
