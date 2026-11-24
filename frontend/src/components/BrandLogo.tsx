import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

const SHIELD_LOGO_SRC = '/assets/aistudio/Sheild_3c33d541.png';

/**
 * Shield logo mark for Data Pulse (non-interactive).
 * Renders the high-resolution brand shield PNG with a crisp inline SVG fallback.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 32 }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {!imgFailed ? (
        <img
          src={SHIELD_LOGO_SRC}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-contain drop-shadow-2xs select-none pointer-events-none"
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full select-none"
        >
          <defs>
            <clipPath id="dpShieldClipFallback">
              <path d="M 12 14 C 36 8, 64 8, 90 14 C 94 38, 88 64, 50 94 C 18 78, 9 52, 10 32 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#dpShieldClipFallback)">
            <rect x="0" y="0" width="100" height="100" fill="#0D1B4C" />
            <path d="M -5 105 L 105 28 L 105 105 L -5 105 Z" fill="#3B9EE8" />
            <path d="M -5 100 L 95 32 L 105 32 L -5 106 Z" fill="#FFFFFF" />
            <line x1="28" y1="62" x2="28" y2="47" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="28" cy="46" r="4.2" fill="#0D1B4C" stroke="#FFFFFF" strokeWidth="2.4" />
            <line x1="40" y1="55" x2="40" y2="25" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="40" cy="24" r="4.2" fill="#0D1B4C" stroke="#FFFFFF" strokeWidth="2.4" />
            <line x1="52" y1="48" x2="52" y2="31" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="52" cy="30" r="4.2" fill="#0D1B4C" stroke="#FFFFFF" strokeWidth="2.4" />
            <line x1="72" y1="36" x2="72" y2="18" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="72" cy="17" r="4.2" fill="#0D1B4C" stroke="#FFFFFF" strokeWidth="2.4" />
          </g>
          <polygon points="8,82 78,35 83,43 14,88" fill="#FFFFFF" />
          <polygon points="70,25 94,18 84,42 77,33" fill="#FFFFFF" />
        </svg>
      )}
    </span>
  );
};

export function dispatchNavigateHome(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('datapulse:navigate', { detail: 'home' }));
  }
}

export function hasDataLabUnsavedChanges(queries: Array<{ steps: unknown[] }>): boolean {
  return queries.some((q) => q.steps.length > 1);
}

export interface BrandHomeLinkProps {
  size?: number;
  textSize?: string;
  tone?: 'light' | 'dark';
  variant?: 'lockup' | 'toolbar' | 'sidebar' | 'datalab';
  className?: string;
  ariaLabel?: string;
  title?: string;
  /** Return false to intercept navigation (e.g. unsaved changes confirmation in Data Lab). */
  onBeforeNavigate?: () => boolean | void;
  /** Optional custom navigation handler; defaults to dispatching datapulse:navigate -> home. */
  onNavigateHome?: () => void;
}

/**
 * Reusable accessible home link component used across marketing pages,
 * auth screens, hubs, gallery, workbench toolbar/sidebar, and Data Lab header.
 */
export const BrandHomeLink: React.FC<BrandHomeLinkProps> = ({
  size,
  textSize = 'text-lg',
  tone = 'light',
  variant = 'lockup',
  className = '',
  ariaLabel,
  title,
  onBeforeNavigate,
  onNavigateHome,
}) => {
  const { t } = useLanguage();

  const resolvedAriaLabel = ariaLabel || t('navHomeTitle');
  const resolvedTitle = title || t('homeLinkTitle');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onBeforeNavigate && onBeforeNavigate() === false) {
      return;
    }
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      dispatchNavigateHome();
    }
  };

  if (variant === 'toolbar') {
    return (
      <a
        href="/"
        onClick={handleClick}
        title={resolvedTitle}
        aria-label={resolvedAriaLabel}
        className={`flex items-center gap-2 pe-2.5 border-e border-slate-200 shrink-0 cursor-pointer hover:opacity-85 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md ${className}`}
      >
        <BrandLogo size={size ?? 24} />
        <span className="font-extrabold text-xs tracking-tight text-navy-900 uppercase hidden md:inline">
          {t('brandName')}
        </span>
      </a>
    );
  }

  if (variant === 'sidebar') {
    return (
      <a
        href="/"
        onClick={handleClick}
        title={resolvedTitle}
        aria-label={resolvedAriaLabel}
        className={`flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg p-0.5 ${className}`}
      >
        <BrandLogo size={size ?? 32} />
        <div>
          <p className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">{t('brandName')}</p>
          <span className="text-[11px] text-sky-600 font-semibold tracking-normal">{t('brandTagline')}</span>
        </div>
      </a>
    );
  }

  if (variant === 'datalab') {
    return (
      <a
        href="/"
        onClick={handleClick}
        title={resolvedTitle}
        aria-label={resolvedAriaLabel}
        className={`flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-400 rounded-lg p-0.5 ${className}`}
      >
        <span className="w-8 h-8 rounded-lg grid place-items-center bg-lab-raised border border-lab-line-strong">
          <BrandLogo size={size ?? 22} />
        </span>
        <div className="leading-tight">
          <p className="text-[14px] font-extrabold tracking-tight text-lab-text">{t('dataLabTitle')}</p>
          <p className="text-[10px] text-lab-faint -mt-0.5">{t('dataLabSubtitle')}</p>
        </div>
      </a>
    );
  }

  const dataWordColor = tone === 'dark' ? 'text-white' : 'text-navy-900';
  const pulseWordColor = tone === 'dark' ? 'text-sky-400' : 'text-sky-600';

  return (
    <a
      href="/"
      onClick={handleClick}
      title={resolvedTitle}
      aria-label={resolvedAriaLabel}
      className={`inline-flex items-center gap-2.5 select-none cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg p-0.5 shrink-0 ${className}`}
    >
      <BrandLogo size={size ?? 34} />
      <span dir="ltr" className={`font-black tracking-tight ${textSize} font-sans uppercase flex items-center gap-1 whitespace-nowrap`}>
        <span className={dataWordColor}>DATA</span>
        <span className={pulseWordColor}>PULSE</span>
      </span>
    </a>
  );
};

export const BrandLockup = BrandHomeLink;
