import { createElement, Fragment, useMemo, useSyncExternalStore } from 'react';
import common from '@/locales/common';
import { DEFAULT_LOCALE, LOCALE_META, isLocale, localeFromPath, localisePath } from './locales';

export * from './locales';

/*
 * The website's language.
 *
 * One current language for the whole app (like i18next's singleton), so plain
 * library code — WhatsApp messages, trip labels, date formatting — follows it
 * without every caller passing it along. React components read it through
 * useI18n(), which re-renders them when it changes.
 *
 * Messages live in src/locales/<area>.js as { en: {...}, it: {...} } with flat
 * keys. A key missing in Italian falls back to English; a key missing
 * everywhere shows the key itself (and a warning in development), never a
 * blank. Plurals use "<key>_one" / "<key>_other" (and "_many" where a
 * language has it) chosen by Intl.PluralRules from a numeric `count`.
 */

const PREF_KEY = 'ew.locale';
let current = DEFAULT_LOCALE;
const listeners = new Set();

export const getLocale = () => current;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The language this device last used, or null (nothing stored, storage blocked, or junk). */
export function readPreference() {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    const value = raw ? JSON.parse(raw) : null;
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

function writePreference(locale) {
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(locale));
  } catch {
    /* storage unavailable — the URL still carries the language */
  }
}

/**
 * Render everything in this language (anything unknown means English). The
 * choice is remembered on this device and set as the page's lang attribute.
 */
export function setLocale(locale, { persist = true } = {}) {
  const next = isLocale(locale) ? locale : DEFAULT_LOCALE;
  if (persist) writePreference(next);
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

/**
 * Pick the language before the app first renders. The URL decides (/it/… is
 * Italian), except that someone whose last language was Italian and who opens
 * an English address — an old bookmark, a link in an email — gets the same
 * page in Italian. Crawlers store nothing, so they always see the URL's own
 * language.
 */
export function bootLocale(win = window) {
  const { pathname, search, hash } = win.location;
  let locale = localeFromPath(pathname);
  const preferred = readPreference();
  if (locale === DEFAULT_LOCALE && preferred && preferred !== DEFAULT_LOCALE) {
    locale = preferred;
    win.history.replaceState(win.history.state, '', localisePath(pathname, locale) + search + hash);
  }
  setLocale(locale);
  return locale;
}

/** The language switcher: the same page in the other language, as a new history entry. */
export function switchLocale(locale, win = window) {
  if (!isLocale(locale)) return;
  if (locale === current) {
    writePreference(locale);
    return;
  }
  const { pathname, search, hash } = win.location;
  win.history.pushState(null, '', localisePath(pathname, locale) + search + hash);
  setLocale(locale);
}

/** Back/forward between languages: follow the address. */
export const followAddress = (win = window) => setLocale(localeFromPath(win.location.pathname));

// ---------------------------------------------------------------------------
// Formatting

const cache = { plural: {}, number: {} };
const tagOf = (locale) => (LOCALE_META[locale] || LOCALE_META[DEFAULT_LOCALE]).tag;
const pluralOf = (locale, n) => (cache.plural[locale] ||= new Intl.PluralRules(tagOf(locale))).select(n);

/** 12000 → "12,000" in English, "12.000" in Italian. */
export const formatNumber = (n, locale = current) => (cache.number[locale] ||= new Intl.NumberFormat(tagOf(locale))).format(n);

/**
 * Kenyan shillings, rounded: "KES 12,000" in English, "12.000 KES" in Italian
 * (where the code follows the amount). Display only — prices never change.
 */
export function formatKES(n, locale = current) {
  const amount = formatNumber(Math.round(Number(n) || 0), locale);
  return locale === 'it' ? `${amount} KES` : `KES ${amount}`;
}

/** The BCP 47 tag for Intl/toLocale* calls ("en-GB", "it-IT"). */
export const localeTag = (locale = current) => tagOf(locale);

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
/** An English weekday name from listing data ("Monday", "mon") in a language ("lunedì"); anything else as given. */
export function weekdayName(name, locale = current) {
  const key = String(name ?? '').trim().toLowerCase();
  const i = key.length >= 3 ? WEEKDAYS.findIndex((d) => d.startsWith(key.slice(0, 3))) : -1;
  if (i === -1 || locale === DEFAULT_LOCALE) return name;
  // 1 January 2023 was a Sunday.
  return new Date(Date.UTC(2023, 0, 1 + i)).toLocaleDateString(tagOf(locale), { weekday: 'long', timeZone: 'UTC' });
}

// ---------------------------------------------------------------------------
// Messages

const warned = new Set();

function lookup(messages, locale, key, count) {
  const table = messages?.[locale];
  if (!table) return undefined;
  if (count !== undefined) {
    const form = table[`${key}_${pluralOf(locale, count)}`] ?? table[`${key}_other`];
    if (form !== undefined) return form;
  }
  return table[key];
}

function interpolate(text, vars, locale) {
  return text.replace(/\{(\w+)\}/g, (match, name) => {
    const value = vars[name];
    if (value === undefined || value === null) return match;
    // Counts are numbers people read ("1.250 recensioni"); other values (a
    // year, a reference) are shown exactly as given.
    return name === 'count' && typeof value === 'number' ? formatNumber(value, locale) : String(value);
  });
}

/** One message, in a language, with {placeholders} filled in. */
export function translate(messages, locale, key, vars) {
  const count = typeof vars?.count === 'number' ? vars.count : undefined;
  let text = lookup(messages, locale, key, count) ?? lookup(common, locale, key, count);
  if (text === undefined && locale !== DEFAULT_LOCALE) {
    text = lookup(messages, DEFAULT_LOCALE, key, count) ?? lookup(common, DEFAULT_LOCALE, key, count);
  }
  if (text === undefined) {
    if (import.meta.env?.DEV && !warned.has(key)) {
      warned.add(key);
      console.warn(`[i18n] missing message "${key}"`);
    }
    return key;
  }
  return vars ? interpolate(text, vars, locale) : text;
}

/**
 * A message with simple markup turned into elements:
 * rich("Already a member? <link>Sign in</link>", { link: (text) => <Link …>{text}</Link> }).
 * Unknown tags render their text only. No nesting, no HTML.
 */
export function richText(text, components = {}) {
  const parts = [];
  const pattern = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const render = components[match[1]];
    parts.push(render ? render(match[2]) : match[2]);
    last = pattern.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  if (parts.length === 1 && typeof parts[0] === 'string') return parts[0];
  return createElement(Fragment, null, ...parts);
}

/** Everything a component needs for one language. */
export function makeI18n(messages, locale = current) {
  const t = (key, vars) => translate(messages, locale, key, vars);
  return {
    locale,
    t,
    rich: (key, components, vars) => richText(t(key, vars), components),
    /** A path in this language: lp('/trip') → '/it/trip'. Router links don't need it (the router adds it). */
    lp: (path) => localisePath(path, locale),
    tag: tagOf(locale),
    formatNumber: (n) => formatNumber(n, locale),
    formatKES: (n) => formatKES(n, locale),
    /** lang attribute for content in another language (English listing text on an Italian page), else undefined. */
    langOf: (contentLang) => (contentLang && contentLang !== locale ? contentLang : undefined),
  };
}

/** The current language, re-rendering when it changes. */
export const useLocale = () => useSyncExternalStore(subscribe, getLocale, getLocale);

/** Messages for a component: const { t } = useI18n(messages). */
export function useI18n(messages) {
  const locale = useLocale();
  return useMemo(() => makeI18n(messages, locale), [messages, locale]);
}

/** For plain library code: const t = translator(messages); t('key') in the current language. */
export const translator = (messages) => (key, vars) => translate(messages, current, key, vars);
