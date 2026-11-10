import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge class names, letting later Tailwind classes win (shadcn convention). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a calendar date — an arrival, a group trip's start — that the API
 * stores as UTC midnight. Formatting in UTC keeps the same day for every
 * visitor; in local time someone in the Americas would see the day before.
 */
export function formatDay(value, options = { day: 'numeric', month: 'short', year: 'numeric' }, locale = 'en-GB') {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(locale, { ...options, timeZone: 'UTC' });
}

/** Read/write JSON in localStorage without ever throwing (private mode, quota, SSR). */
export const safeStorage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — personalisation simply won't persist */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
