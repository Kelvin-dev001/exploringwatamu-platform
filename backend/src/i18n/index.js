'use strict';

const { DEFAULT_LOCALE, LOCALES, normaliseLocale } = require('../constants/locales');

/*
 * Traveller-facing text (emails, SMS, PDFs) in the traveller's language.
 * The language comes from the request or booking (sent by the website) and
 * falls back to English — for older records, and for any message missing in
 * a language. Admin-only notifications aren't translated.
 *
 *   const { t, money, date } = i18n.forLocale(request.locale);
 *   t('quoteSubject', { reference })
 *
 * English output is exactly what the emails said before languages existed
 * (dates via toDateString(), "KES 12,000").
 */
const MESSAGES = { en: require('./en'), it: require('./it') };
const TAGS = { en: 'en-GB', it: 'it-IT' };

const plurals = {};
const pluralOf = (locale, n) => (plurals[locale] ||= new Intl.PluralRules(TAGS[locale])).select(n);

function lookup(locale, key, count) {
  const table = MESSAGES[locale];
  if (count !== undefined) {
    const form = table[`${key}_${pluralOf(locale, count)}`] ?? table[`${key}_other`];
    if (form !== undefined) return form;
  }
  return table[key];
}

/** One message with {placeholders} filled in; numeric `count` picks the plural form. */
function translate(locale, key, vars = {}) {
  const lang = normaliseLocale(locale);
  const count = typeof vars.count === 'number' ? vars.count : undefined;
  const text = lookup(lang, key, count) ?? lookup(DEFAULT_LOCALE, key, count);
  if (text === undefined) return key;
  return text.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined || vars[name] === null ? m : String(vars[name])));
}

/** "KES 12,000" (English) / "12.000 KES" (Italian). Display only. */
function money(n, locale) {
  const amount = Number(n || 0);
  return normaliseLocale(locale) === 'it' ? `${Math.round(amount).toLocaleString('it-IT')} KES` : 'KES ' + amount.toLocaleString('en-KE');
}

/**
 * A calendar date (stored as UTC midnight). English keeps toDateString()
 * ("Sun Jan 10 2027"); Italian reads "dom 10 gen 2027". `empty` when missing.
 */
function date(d, locale, empty = null) {
  if (!d) return empty;
  const value = new Date(d);
  if (Number.isNaN(value.getTime())) return empty;
  if (normaliseLocale(locale) !== 'it') return value.toDateString();
  return value.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** A website path in a language: ("/my-trips", "it") → "/it/my-trips". */
const sitePath = (path, locale) => (normaliseLocale(locale) === 'it' ? `/it${path === '/' ? '' : path}` : path);

/**
 * An item title the website sent in English ("Stay · Turtle Bay (listed KES
 * 18,000 / night)"), with our own words in the traveller's language. Listing
 * names stay as they are.
 */
function itemTitle(title, locale) {
  const lang = normaliseLocale(locale);
  if (lang === DEFAULT_LOCALE || typeof title !== 'string') return title;
  let rest = title;
  let rate = null;
  const listed = /^(.*) \(listed (.+)\)$/.exec(rest);
  if (listed) [, rest, rate] = listed;
  if (rest === 'Airport pick-up') rest = translate(lang, 'itemAirportIn');
  else if (rest === 'Airport drop-off') rest = translate(lang, 'itemAirportOut');
  else if (rest.startsWith('Stay · ')) rest = translate(lang, 'itemStay', { name: rest.slice(7) });
  else if (rest.startsWith('Car hire · ')) rest = translate(lang, 'itemCarHire', { name: rest.slice(11) });
  return rate ? translate(lang, 'itemListed', { title: rest, rate }) : rest;
}

/** Everything a template needs for one language. */
function forLocale(locale) {
  const lang = normaliseLocale(locale);
  return {
    locale: lang,
    t: (key, vars) => translate(lang, key, vars),
    money: (n) => money(n, lang),
    date: (d, empty) => date(d, lang, empty),
    path: (p) => sitePath(p, lang),
    item: (title) => itemTitle(title, lang),
  };
}

module.exports = { LOCALES, MESSAGES, translate, money, date, sitePath, itemTitle, forLocale };
