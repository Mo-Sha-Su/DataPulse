import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, Sparkles, X } from 'lucide-react';
import { BrandHomeLink } from '../BrandLogo';
import { User } from '../../types/auth';
import { cx } from '../../ui';
import { useLanguage, LanguageToggle } from '../../i18n/LanguageContext';

export type AppSection = 'dashboard_hub' | 'data_hub' | 'forecasts' | 'sample_graphs';

interface Props {
  active: AppSection;
  currentUser: User | null;
  onNavigate: (page: 'home' | 'dashboard_hub' | 'data_hub' | 'forecasts' | 'sample_graphs') => void;
  onLogout: () => void;
  /** the page's primary action, shown next to the account menu */
  action?: React.ReactNode;
}

/** Single-row workspace header shared across all authenticated SaaS pages. */
export const AppNavbar: React.FC<Props> = ({ active, currentUser, onNavigate, onLogout, action }) => {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const first = currentUser?.first_name || t('account');
  const full = currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() : t('account');

  const formatRoleLabel = (role?: string) => {
    switch ((role || '').toLowerCase()) {
      case 'admin': return t('roleAdmin');
      case 'developer': return t('roleDeveloper');
      case 'viewer': return t('roleViewer');
      case 'analyst': return t('roleAnalyst');
      default: return role || '';
    }
  };

  const LINKS: { id: AppSection; label: string; tourTarget: string }[] = [
    { id: 'dashboard_hub', label: t('dashboards'), tourTarget: 'nav-dashboards' },
    { id: 'data_hub', label: t('dataHub'), tourTarget: 'nav-data-hub' },
    { id: 'forecasts', label: t('forecastStudio'), tourTarget: 'nav-forecasts' },
    { id: 'sample_graphs', label: t('visualGallery'), tourTarget: 'nav-gallery' },
  ];

  useEffect(() => {
    if (!menuOpen && !mobileNavOpen) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMobileNavOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [menuOpen, mobileNavOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="h-16 px-3 sm:px-6 md:px-10 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Zone 1: Brand Identity + Primary Navigation */}
        <div className="flex items-center gap-4 lg:gap-8 min-w-0 shrink">
          <BrandHomeLink
            size={30}
            textSize="text-base sm:text-lg"
            onNavigateHome={() => {
              setMobileNavOpen(false);
              onNavigate('home');
            }}
          />
          <nav className="hidden md:flex items-center gap-1" role="tablist" aria-label={t('navSectionsLabel')}>
            {LINKS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={active === l.id}
                data-tour-target={l.tourTarget}
                onClick={() => onNavigate(l.id)}
                className={cx(
                  'relative h-16 px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer',
                  active === l.id ? 'text-navy-900' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {l.label}
                {active === l.id && <span className="absolute start-3 end-3 bottom-0 h-0.5 rounded-full bg-sky-600" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Zone 2: Locale + Action + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          <span data-tour-target="language-toggle" className="hidden sm:inline-flex">
            <LanguageToggle className="h-9" />
          </span>
          {action && <div className="hidden sm:inline-flex max-w-[200px] sm:max-w-none min-w-0 [&>*]:truncate">{action}</div>}
          <div className="relative" ref={ref}>
            <button
              type="button"
              data-tour-target="account-menu"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t('navAccountMenu')}
              className="h-9 flex items-center gap-1.5 sm:gap-2 p-1 pe-1.5 sm:pe-2 rounded-full border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="w-7 h-7 rounded-full bg-navy-900 text-white font-bold text-xs grid place-items-center uppercase shrink-0">
                {first.charAt(0)}
              </span>
              <span className="text-[13px] font-semibold text-slate-800 hidden lg:inline max-w-[140px] truncate">{full}</span>
              <ChevronDown className={cx('w-3.5 h-3.5 text-slate-400 transition-transform', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <div role="menu" className="lab-pop absolute end-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="font-bold text-slate-900 text-[13px] truncate">{full}</p>
                  <p className="text-[11px] text-slate-500 truncate" dir="ltr">{currentUser?.email}</p>
                  {currentUser?.role && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-sky-600">{formatRoleLabel(currentUser.role)}</p>}
                </div>
                <div className="sm:hidden px-3 py-2 border-b border-slate-100">
                  <LanguageToggle className="w-full justify-center" />
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('datapulse:open-tour'));
                  }}
                  className="w-full px-4 py-2.5 text-start font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-b border-slate-100"
                >
                  <Sparkles className="w-4 h-4 text-sky-600" /> {t('quickTour')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="w-full px-4 py-2.5 text-start font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> {t('logOut')}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label={t('navSectionsLabel')}
            aria-expanded={mobileNavOpen}
            className="md:hidden h-9 w-9 grid place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
          >
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200/80 bg-white px-4 py-3 space-y-1.5 shadow-lg">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onNavigate(l.id);
              }}
              className={cx(
                'w-full px-3.5 py-2.5 rounded-xl text-start text-sm font-semibold transition-colors cursor-pointer',
                active === l.id ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {l.label}
            </button>
          ))}
          {action && <div className="pt-2 border-t border-slate-100 sm:hidden flex justify-stretch [&>*]:w-full">{action}</div>}
        </div>
      )}
    </header>
  );
};
