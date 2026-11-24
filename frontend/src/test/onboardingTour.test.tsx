import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  OnboardingTourModal,
  TOUR_STEPS_META,
  findVisibleTourTargetRect,
} from '../components/Modals/OnboardingTourModal';
import {
  LanguageContext,
  translations,
  translateWithLanguage,
  Language,
} from '../i18n/LanguageContext';

const noop = () => {};

function renderWithLanguage(lang: Language, element: React.ReactElement): string {
  const isRtl = lang === 'ar';
  return renderToStaticMarkup(
    <LanguageContext.Provider
      value={{
        language: lang,
        setLanguage: noop,
        t: (key, params) => translateWithLanguage(lang, key, params),
        tPlural: (prefix, count) => `${count} ${prefix}`,
        formatNumber: (v) => String(v),
        formatDate: (v) => String(v),
        isRtl,
        dir: isRtl ? 'rtl' : 'ltr',
      }}
    >
      {element}
    </LanguageContext.Provider>
  );
}

describe('Interactive Visual Welcome Tour (OnboardingTourModal)', () => {
  it('defines all 8 guided product tour steps in plain business workflow order', () => {
    expect(TOUR_STEPS_META.map((s) => s.id)).toEqual([
      'welcome',
      'data-hub',
      'data-lab',
      'data-model',
      'dashboard-builder',
      'forecast-studio',
      'reports',
      'getting-started',
    ]);
  });

  it('uses "Show Welcome Tour" in the English account menu and Arabic equivalent', () => {
    expect(translations.en.quickTour).toBe('Show Welcome Tour');
    expect(translations.ar.quickTour).toBe('عرض الجولة الترحيبية');
  });

  it('renders nothing when closed', () => {
    const html = renderWithLanguage('en', <OnboardingTourModal isOpen={false} onClose={noop} />);
    expect(html).toBe('');
  });

  it('renders accessible dialog, 8 step tabs, beginner-friendly workflow visual, and controls in English (LTR)', () => {
    const html = renderWithLanguage(
      'en',
      <OnboardingTourModal isOpen={true} onClose={noop} isAuthenticated={true} />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Step 1 of 8');
    expect(html).toContain('Welcome to Data Pulse');
    expect(html).toContain('1. Upload Files');
    expect(html).toContain('2. Clean Up');
    expect(html).toContain('3. Dashboards &amp; PDFs');
    expect(html).toContain('4. Forecast Future');
    expect(html).toContain('Good to know');
    expect(html).toContain('Skip Tour');
    expect(html).toContain('Back');
    expect(html).toContain('Next');

    // All 8 step tabs rendered for navigation
    for (let step = 1; step <= 8; step += 1) {
      expect(html).toContain(`Go to step ${step}`);
    }
  });

  it('uses non-technical language free of SQL/engineering jargon in English and Arabic', () => {
    const technicalJargon = ['PostgreSQL', 'UTF-8', 'Windows-1256', '1:N', '[PK]', '[FK]', 'star schema'];
    const tourKeys = [
      'tourS1Title', 'tourS1Desc', 'tourS1Tip',
      'tourS2Title', 'tourS2Desc', 'tourS2Tip',
      'tourS3Title', 'tourS3Desc', 'tourS3Tip',
      'tourS4Title', 'tourS4Desc', 'tourS4Tip',
      'tourS5Title', 'tourS5Desc', 'tourS5Tip',
      'tourFcTitle', 'tourFcDesc', 'tourFcTip',
      'tourS6Title', 'tourS6Desc', 'tourS6Tip',
      'tourS7Title', 'tourS7Desc', 'tourS7Tip',
    ] as const;

    for (const k of tourKeys) {
      expect(translations.en[k].trim().length).toBeGreaterThan(5);
      expect(translations.ar[k].trim().length).toBeGreaterThan(5);
      for (const term of technicalJargon) {
        expect(translations.en[k]).not.toContain(term);
        expect(translations.ar[k]).not.toContain(term);
      }
    }
  });

  it('renders fully localized Arabic (RTL) copy for the 8-step tour modal', () => {
    const html = renderWithLanguage(
      'ar',
      <OnboardingTourModal isOpen={true} onClose={noop} isAuthenticated={true} />
    );

    expect(html).toContain('الخطوة 1 من 8');
    expect(html).toContain('مرحباً بك في داتا بلس');
    expect(html).toContain('معلومة مفيدة');
    expect(html).toContain('تخطي الجولة');
    expect(html).toContain('السابق');
    expect(html).toContain('التالي');
  });

  it('handles spotlight target lookup safely when DOM is absent or targets are empty', () => {
    expect(findVisibleTourTargetRect([])).toBeNull();
    expect(findVisibleTourTargetRect(['upload-dataset'])).toBeNull();
  });
});
