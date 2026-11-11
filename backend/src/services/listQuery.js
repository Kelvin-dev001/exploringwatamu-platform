'use strict';

/*
 * Query-string helpers for list endpoints.
 *
 * contains(): a search box value becomes a literal, case-insensitive
 * "contains" match. The text is escaped, so "a.b" means a dot and a pattern
 * like (a+)+$ can't make MongoDB do catastrophic regex work. Non-strings
 * (?name=a&name=b arrives as an array) are ignored.
 *
 * pageParams(): ?page= / ?limit= become bounded integers. The cap fits the
 * largest page a client asks for today (the admin catalogue: 1000).
 */
const MAX_LIMIT = 1000;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function contains(value, maxLength = 80) {
  if (typeof value !== 'string') return undefined;
  const text = value.trim().slice(0, maxLength);
  return text ? new RegExp(escapeRegex(text), 'i') : undefined;
}

function pageParams({ page, limit } = {}, { defaultLimit = 10, maxLimit = MAX_LIMIT } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || defaultLimit));
  return { page: p, limit: l, skip: (p - 1) * l };
}

/** The listing endpoints' envelope (unchanged: totalPages is 0 for an empty list). */
const pageOf = (data, total, { page, limit }) => ({ data, page, totalPages: Math.ceil(total / limit), total });

module.exports = { contains, escapeRegex, pageParams, pageOf, MAX_LIMIT };
