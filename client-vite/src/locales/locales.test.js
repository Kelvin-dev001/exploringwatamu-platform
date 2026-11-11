import { describe, expect, it } from 'vitest';
import { STATIC_ROUTES, SITE_TEXT } from '../../seo/routes.js';

// Every message file has the same messages in English and Italian, with the
// same {placeholders} and <markup>, and nothing left empty — so a page can't
// end up half-translated or show a raw placeholder.

const files = import.meta.glob('./*.js', { eager: true, import: 'default' });
const PLURAL = /_(zero|one|two|few|many|other)$/;
const base = (key) => key.replace(PLURAL, '');
const vars = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const tags = (text) => [...String(text).matchAll(/<(\w+)>/g)].map((m) => m[1]).sort();

describe.each(Object.entries(files).filter(([name]) => !name.includes('.test.')))('%s', (name, messages) => {
  const { en, it: italian } = messages;

  it('has the same messages in both languages', () => {
    const keys = (table) => [...new Set(Object.keys(table).map(base))].sort();
    expect(keys(italian)).toEqual(keys(en));
  });

  it('keeps the same placeholders and markup, and nothing is blank', () => {
    for (const [key, text] of Object.entries(italian)) {
      const english = en[key] ?? en[`${base(key)}_other`] ?? en[base(key)];
      // A singular form may say the number in words ("Ultimo posto" — the last seat).
      const want = key.endsWith('_one') ? vars(english).filter((v) => v !== 'count' || vars(text).includes('count')) : vars(english);
      expect({ key, vars: vars(text), tags: tags(text) }).toEqual({ key, vars: want, tags: tags(english) });
    }
    for (const [lang, table] of Object.entries({ en, it: italian })) {
      for (const [key, text] of Object.entries(table)) {
        expect(typeof text, `${lang}.${key}`).toBe('string');
        if (text === '') throw new Error(`${name} ${lang}.${key} is empty`);
      }
    }
  });

  it('has both plural forms wherever one language uses them', () => {
    for (const table of [en, italian]) {
      for (const key of Object.keys(table).filter((k) => PLURAL.test(k))) expect(table[`${base(key)}_other`], key).toBeDefined();
    }
  });
});

describe('search and share text (seo/routes.js)', () => {
  it('has an Italian title and description for every static page, short enough for results pages (Seo keeps 160 characters)', () => {
    for (const r of STATIC_ROUTES) {
      expect(r.it, r.path).toBeDefined();
      expect(typeof r.it.title).toBe('string');
      expect(r.it.description.length, r.path).toBeLessThanOrEqual(160);
      expect(r.it.description).not.toBe(r.en.description === SITE_TEXT.en.description ? SITE_TEXT.en.description : r.en.description);
    }
    expect(SITE_TEXT.it.tagline).toBeTruthy();
  });
});
