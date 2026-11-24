import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Language, LanguageContext, translateWithLanguage, translations } from '../i18n/LanguageContext';
import { PricingPage } from '../pages/PricingPage';

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

describe('PricingPage plans & offer', () => {
  it('renders exactly the Basic ($0) and Upgrade ($25 offer instead of $30) plans', () => {
    const html = renderWithLanguage('en', <PricingPage currentUser={null} onNavigate={vi.fn()} />);

    expect(html).toContain('Basic');
    expect(html).toContain('$0');
    expect(html).toContain('Upgrade');
    expect(html).toContain('$25');
    expect(html).toContain('$30');
    expect(html).toContain('Save $5 · Instead of $30');
    expect(html).not.toContain('Enterprise');
    expect(html).not.toContain('$99');
  });

  it('localizes the two plans and offer cleanly in Arabic', () => {
    const html = renderWithLanguage('ar', <PricingPage currentUser={null} onNavigate={vi.fn()} />);

    expect(html).toContain(translations.ar.pricingPlanFreeName);
    expect(html).toContain(translations.ar.pricingPlanProName);
    expect(html).toContain(translations.ar.pricingPlanProOffer);
    expect(html).toContain('$0');
    expect(html).toContain('$25');
    expect(html).toContain('$30');
    expect(html).not.toContain(translations.ar.pricingPlanEntName);
  });
});
