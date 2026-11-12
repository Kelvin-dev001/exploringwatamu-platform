import { DEFAULT_LOCALE, getLocale, translate } from '@/i18n';
import messages from '@/locales/reviews';

// Kept apart from lib/reviews.js so the review-writing messages load with the
// pages that send reviews, not with every rating on the homepage.

/**
 * The message to show for a failed review request. The English site shows the
 * API's own words; other languages say the refusal codes we know in their
 * words, else a general message.
 */
export function reviewError(err, fallback, locale = getLocale()) {
  const data = err?.response?.data;
  const general = fallback || translate(null, locale, 'genericError');
  if (err?.response?.status === 429) return translate(messages, locale, 'rateLimited');
  if (!err?.response) return translate(null, locale, 'networkError');
  if (locale === DEFAULT_LOCALE) {
    if (data?.issues?.length) return data.issues.map((i) => i.message).join(' · ');
    return data?.error || general;
  }
  const known = data?.code && translate(messages, locale, `err.${data.code}`);
  return known && known !== `err.${data.code}` ? known : general;
}
