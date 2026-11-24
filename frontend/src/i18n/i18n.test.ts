import { describe, expect, it } from 'vitest';
import { translations, getPluralCategory } from './LanguageContext';

describe('i18n dictionary completeness & pluralization', () => {
  it('has identical keys in English and Arabic dictionaries (completeness)', () => {
    const enKeys = Object.keys(translations.en).sort();
    const arKeys = Object.keys(translations.ar).sort();

    const missingInAr = enKeys.filter((k) => !(k in translations.ar));
    const missingInEn = arKeys.filter((k) => !(k in translations.en));

    expect(missingInAr).toEqual([]);
    expect(missingInEn).toEqual([]);
    expect(enKeys.length).toBe(arKeys.length);
  });

  it('contains non-empty translation strings for all keys', () => {
    for (const [key, val] of Object.entries(translations.en)) {
      expect(typeof val).toBe('string');
      expect((val as string).trim().length).toBeGreaterThan(0);
    }
    for (const [key, val] of Object.entries(translations.ar)) {
      expect(typeof val).toBe('string');
      expect((val as string).trim().length).toBeGreaterThan(0);
    }
  });

  it('correctly maps all 6 Arabic plural categories via Intl.PluralRules', () => {
    // Arabic plural forms:
    // 0 -> zero
    expect(getPluralCategory(0, 'ar')).toBe('zero');
    // 1 -> one
    expect(getPluralCategory(1, 'ar')).toBe('one');
    // 2 -> two
    expect(getPluralCategory(2, 'ar')).toBe('two');
    // 3, 5, 10 -> few
    expect(getPluralCategory(3, 'ar')).toBe('few');
    expect(getPluralCategory(5, 'ar')).toBe('few');
    expect(getPluralCategory(10, 'ar')).toBe('few');
    // 11, 25, 99 -> many
    expect(getPluralCategory(11, 'ar')).toBe('many');
    expect(getPluralCategory(25, 'ar')).toBe('many');
    expect(getPluralCategory(99, 'ar')).toBe('many');
    // 100, 101, 102 -> other
    expect(getPluralCategory(100, 'ar')).toBe('other');
    expect(getPluralCategory(102, 'ar')).toBe('other');
  });

  it('maps English plural categories (one vs other)', () => {
    expect(getPluralCategory(1, 'en')).toBe('one');
    expect(getPluralCategory(0, 'en')).toBe('other');
    expect(getPluralCategory(2, 'en')).toBe('other');
    expect(getPluralCategory(5, 'en')).toBe('other');
  });

  it('all 6 plural forms exist for rows, columns, datasets, steps, and selected in Arabic', () => {
    const prefixes = ['rows', 'columns', 'datasets', 'steps', 'selected'];
    const categories = ['zero', 'one', 'two', 'few', 'many', 'other'];

    for (const prefix of prefixes) {
      for (const cat of categories) {
        const key = `${prefix}_${cat}` as keyof typeof translations.ar;
        expect(translations.ar[key]).toBeDefined();
        expect(translations.ar[key].length).toBeGreaterThan(0);
      }
    }
  });
});
