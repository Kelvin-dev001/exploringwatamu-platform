/*
 * Optional Italian text on listings (titleIt, shortDescriptionIt,
 * descriptionIt). Real listing text is never machine-translated: when the
 * team hasn't written an Italian version, the English text shows (marked
 * lang="en") inside the Italian interface.
 *
 * No imports, so the SEO build plugin and the bot-preview middleware share
 * the same rule as the app.
 */

const filled = (value) => typeof value === 'string' && value.trim() !== '';

/** The Italian field name for an English one: "title" → "titleIt". */
export const italianField = (field) => `${field}It`;

/**
 * A listing's text in a language: { text, lang }. `field` is the Italian
 * field's base name (title, shortDescription, description); `fallback` is the
 * English value to use when there is no Italian one (Tours call their title
 * "name", for example).
 */
export function pickText(doc, field, locale, fallback = doc?.[field]) {
  if (locale === 'it' && filled(doc?.[italianField(field)])) return { text: doc[italianField(field)].trim(), lang: 'it' };
  return { text: fallback ?? '', lang: 'en' };
}

/**
 * Whether a listing's main text exists in Italian. Only then is its Italian
 * page a real language version (hreflang pair, Italian sitemap entry, its own
 * canonical); otherwise the Italian page points search engines at the
 * English one rather than claiming to be a translation.
 */
export const hasItalianContent = (doc) => filled(doc?.descriptionIt) || filled(doc?.shortDescriptionIt);
