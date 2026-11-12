import { DEFAULT_LOCALE, getLocale, translate } from '@/i18n';
import account from '@/locales/account';

/*
 * What to say when an API call fails. The API answers in English: on the
 * English site its own words are shown as before; on other languages the
 * messages we know are said in our words, and anything else falls back to the
 * page's general message (never an English sentence in the middle of an
 * Italian page).
 */

// The API's own English messages we know how to say in other languages.
const KNOWN = {
  'An account with this email already exists.': 'errEmailTaken',
  'Invalid credentials.': 'errInvalidCredentials',
  'This account uses Google Sign-In. Please sign in with Google.': 'errUseGoogle',
  'Your Google email address isn’t verified yet. Verify it with Google, or sign in with email and password.': 'errGoogleUnverified',
  'Google Sign-In is not configured.': 'errGoogleOff',
  'Invalid or expired reset token.': 'errResetExpired',
  'Name must be at least 2 characters': 'errNameShort',
  'Password must be at least 8 characters': 'errPasswordShort',
};

/** One API message in the current language, or null when there's nothing usable. */
export function apiText(message, locale = getLocale()) {
  if (!message) return null;
  if (locale === DEFAULT_LOCALE) return message;
  return KNOWN[message] ? translate(account, locale, KNOWN[message]) : null;
}

/**
 * The message for a failed request. English: the API's message (validation
 * issues joined) or `fallback`, as the site always showed. Other languages:
 * our words for messages we know, rate-limit and connection messages, else
 * `fallback` (already in the page's language).
 */
export function apiError(err, fallback, locale = getLocale()) {
  const data = err?.response?.data;
  const issues = data?.error === 'Validation failed' && data.issues?.length ? data.issues.map((i) => i.message) : null;
  if (locale === DEFAULT_LOCALE) return issues ? issues.join(' · ') : data?.error || fallback;
  if (err?.response?.status === 429) return translate(null, locale, 'rateLimited');
  if (!err?.response) return translate(null, locale, 'networkError');
  if (issues) {
    const parts = issues.map((m) => apiText(m, locale));
    return parts.every(Boolean) ? parts.join(' · ') : fallback;
  }
  return apiText(data?.error, locale) || fallback;
}
