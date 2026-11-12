/*
 * The website's languages and their URLs.
 *
 * English is the default and keeps every existing URL. Italian lives under
 * /it with the same paths after it (/experiences → /it/experiences), so each
 * language version has its own address for search engines and link sharing.
 *
 * Plain functions with no imports: the build-time SEO plugin (seo/plugin.js)
 * and the bot-preview middleware use the same rules as the app.
 */

export const LOCALES = ['en', 'it'];
export const DEFAULT_LOCALE = 'en';

export const LOCALE_META = {
  en: { label: 'English', short: 'EN', tag: 'en-GB', og: 'en_GB', prefix: '' },
  it: { label: 'Italiano', short: 'IT', tag: 'it-IT', og: 'it_IT', prefix: '/it' },
};

export const isLocale = (value) => typeof value === 'string' && LOCALES.includes(value);

// "/it", "/it/…", "/it?…" or "/it#…" — never "/italy".
const PREFIX = /^\/it(?=[/?#]|$)/;

/** The language a path is in. */
export const localeFromPath = (path = '/') => (PREFIX.test(path) ? 'it' : DEFAULT_LOCALE);

/** A path without its language prefix: "/it/experiences" → "/experiences". */
export function stripLocale(path = '/') {
  const rest = String(path).replace(PREFIX, '');
  return rest.startsWith('/') ? rest : `/${rest}`;
}

/** The same page in another language: ("/experiences", "it") → "/it/experiences". */
export function localisePath(path = '/', locale = DEFAULT_LOCALE) {
  const bare = stripLocale(path);
  const prefix = LOCALE_META[locale]?.prefix || '';
  if (!prefix) return bare;
  return bare === '/' || /^\/[?#]/.test(bare) ? prefix + bare.slice(1) : prefix + bare;
}
