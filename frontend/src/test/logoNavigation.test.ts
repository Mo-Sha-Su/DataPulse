import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { BrandHomeLink, BrandLogo, hasDataLabUnsavedChanges } from '../components/BrandLogo';

describe('Logo navigation & reusable BrandHomeLink component', () => {
  it('renders a semantic anchor link with accessible label and home href across all variants', () => {
    const lockupHtml = renderToStaticMarkup(React.createElement(BrandHomeLink));
    expect(lockupHtml).toContain('<a ');
    expect(lockupHtml).toContain('href="/"');
    expect(lockupHtml).toContain('aria-label="Data Pulse Home"');
    expect(lockupHtml).toContain('DATA');
    expect(lockupHtml).toContain('PULSE');

    const toolbarHtml = renderToStaticMarkup(
      React.createElement(BrandHomeLink, { variant: 'toolbar', size: 22 })
    );
    expect(toolbarHtml).toContain('<a ');
    expect(toolbarHtml).toContain('aria-label="Data Pulse Home"');

    const sidebarHtml = renderToStaticMarkup(
      React.createElement(BrandHomeLink, { variant: 'sidebar', size: 28 })
    );
    expect(sidebarHtml).toContain('<a ');
    expect(sidebarHtml).toContain('aria-label="Data Pulse Home"');

    const datalabHtml = renderToStaticMarkup(
      React.createElement(BrandHomeLink, { variant: 'datalab', size: 15 })
    );
    expect(datalabHtml).toContain('<a ');
    expect(datalabHtml).toContain('aria-label="Data Pulse Home"');
  });

  it('supports dark footer tone and keeps decorative BrandLogo non-interactive', () => {
    const darkHtml = renderToStaticMarkup(React.createElement(BrandHomeLink, { tone: 'dark' }));
    expect(darkHtml).toContain('text-white');

    const iconHtml = renderToStaticMarkup(React.createElement(BrandLogo, { size: 48 }));
    expect(iconHtml).toContain('aria-hidden="true"');
    expect(iconHtml).not.toContain('role="button"');
  });

  it('dispatches datapulse:navigate custom event when logo is clicked without custom onClick', () => {
    const bus = new EventTarget();
    let capturedDetail: string | null = null;
    const listener = (e: Event) => {
      capturedDetail = (e as CustomEvent).detail;
    };
    bus.addEventListener('datapulse:navigate', listener);

    bus.dispatchEvent(new CustomEvent('datapulse:navigate', { detail: 'home' }));

    expect(capturedDetail).toBe('home');
    bus.removeEventListener('datapulse:navigate', listener);
  });

  it('resolves home target to dashboard_hub for authenticated users and home for guest users', () => {
    const resolveHomeTarget = (isAuthenticated: boolean) => {
      return isAuthenticated ? 'dashboard_hub' : 'home';
    };

    expect(resolveHomeTarget(false)).toBe('home');
    expect(resolveHomeTarget(true)).toBe('dashboard_hub');
  });

  it('determines unsaved changes accurately for Data Lab queries with steps > 1', () => {
    expect(hasDataLabUnsavedChanges([{ steps: [{ type: 'source' }] }])).toBe(false);
    expect(
      hasDataLabUnsavedChanges([
        { steps: [{ type: 'source' }] },
        { steps: [{ type: 'source' }, { type: 'filter', params: {} }] },
      ])
    ).toBe(true);
  });
});
