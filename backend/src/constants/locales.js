'use strict';

// The languages travellers can use (the website's English and Italian).
// English is the default and the fallback for anything missing.
const LOCALES = ['en', 'it'];
const DEFAULT_LOCALE = 'en';

/** A stored or sent language, or English for anything unknown. */
const normaliseLocale = (value) => (LOCALES.includes(value) ? value : DEFAULT_LOCALE);

module.exports = { LOCALES, DEFAULT_LOCALE, normaliseLocale };
