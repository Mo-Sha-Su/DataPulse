import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslateFn, Translations, translations } from './translations';

export { translations };
export type { Language, TranslateFn, Translations };

/**
 * Returns the `Intl.PluralRules` category (`'zero' | 'one' | 'two' | 'few' | 'many' | 'other'`)
 * for the requested language so Arabic 6-form pluralization works accurately.
 */
export function getPluralCategory(count: number, language: Language): Intl.LDMLPluralRule {
  const pr = new Intl.PluralRules(language === 'ar' ? 'ar-EG' : 'en-US');
  return pr.select(count);
}

/**
 * Resolves a translation key for a specific language with optional `{param}` interpolation
 * and automatic plural-form lookup when `params.count` is numeric.
 */
export function translateWithLanguage(
  language: Language,
  key: keyof Translations,
  params?: Record<string, string | number>,
): string {
  let targetKey = key;
  if (params && typeof params.count === 'number') {
    const category = getPluralCategory(params.count, language);
    const pluralKey = `${String(key)}_${category}` as keyof Translations;
    if (translations[language][pluralKey] !== undefined || translations.en[pluralKey] !== undefined) {
      targetKey = pluralKey;
    }
  }
  let str = translations[language][targetKey] || translations.en[targetKey] || String(targetKey);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

export const defaultEnT: TranslateFn = (key, params) => translateWithLanguage('en', key, params);

function translatePluralWithLanguage(
  language: Language,
  keyPrefix: 'rows' | 'columns' | 'datasets' | 'steps' | 'selected',
  count: number,
): string {
  const category = getPluralCategory(count, language);
  const key = `${keyPrefix}_${category}` as keyof Translations;
  const template = translations[language][key] || translations.en[key] || `{count} ${keyPrefix}`;
  return template.replace(/\{count\}/g, String(count));
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
  tPlural: (keyPrefix: 'rows' | 'columns' | 'datasets' | 'steps' | 'selected', count: number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  isRtl: boolean;
  dir: 'ltr' | 'rtl';
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key, params) => translateWithLanguage('en', key, params),
  tPlural: (keyPrefix, count) => translatePluralWithLanguage('en', keyPrefix, count),
  formatNumber: (value, options) => new Intl.NumberFormat('en-US', options).format(value),
  formatDate: (value, options) => {
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat('en-US', options).format(d);
  },
  isRtl: false,
  dir: 'ltr',
});

/** Detects the initial UI language from browser locale preferences (`ar*` -> Arabic, otherwise English). */
export function getInitialLanguage(): Language {
  if (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('ar')) {
    return 'ar';
  }
  return 'en';
}

/**
 * Provides active locale, RTL/LTR document attributes, number/date formatters,
 * and PostgreSQL-backed user language persistence (zero browser storage).
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    if (isRtl) {
      document.documentElement.classList.add('rtl-layout');
    } else {
      document.documentElement.classList.remove('rtl-layout');
    }
  }, [language, dir, isRtl]);

  // Fetch preference from Neon on mount if user is authenticated (never uses localStorage).
  useEffect(() => {
    let active = true;
    import('../services/neonService')
      .then(({ fetchUserSettingsFromNeon }) => {
        fetchUserSettingsFromNeon()
          .then((settings) => {
            if (!active) return;
            const lang = settings.preferences?.language;
            if (lang === 'ar' || lang === 'en') {
              setLanguageState(lang);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Persist preference server-side to PostgreSQL.
    import('../services/neonService')
      .then(({ saveUserSettingsToNeon }) => {
        saveUserSettingsToNeon({ preferences: { language: lang } }).catch(() => {});
      })
      .catch(() => {});
  };

  const t = (key: keyof Translations, params?: Record<string, string | number>): string =>
    translateWithLanguage(language, key, params);

  const tPlural = (keyPrefix: 'rows' | 'columns' | 'datasets' | 'steps' | 'selected', count: number): string =>
    translatePluralWithLanguage(language, keyPrefix, count);

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string =>
    // Preserve Western digits by default for data clarity while respecting Arabic grouping.
    new Intl.NumberFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', options).format(value);

  const formatDate = (value: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', options).format(d);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tPlural,
        formatNumber,
        formatDate,
        isRtl,
        dir,
      }}
    >
      <div dir={dir} className={isRtl ? 'font-sans-ar' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageToggle: React.FC<{ className?: string; compact?: boolean }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-sky-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${className}`}
      title={language === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
      aria-label={language === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
    >
      <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      <span>{language === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
};
