'use strict';

/*
 * Phone numbers for WhatsApp click-to-chat links. wa.me wants the full
 * international number as digits only (254712345678). The same rules live in
 * client-vite/src/lib/whatsapp.js and admin-vite/src/lib/whatsapp.js — keep
 * the three in step (each has the same tests).
 *
 * Accepted:
 *   +254 712 345 678 · +44 (0)20 7946 0018 · 0044 20 7946 0018   international
 *   254712345678                                                 Kenyan, no "+"
 *   0712 345 678 · 0112 345 678                                  Kenyan mobile, local format
 * Refused (null): any other number without a country code — 0412 345 678 could
 * be Australian, 2025550123 American; a wrong guess opens a chat with a
 * stranger — and letters, several numbers, too few or too many digits.
 */

function parseWhatsAppNumber(raw) {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim().replace(/\(0\)/g, ''); // +44 (0)20 … : the (0) is dropped when dialling from abroad
  if (!text || text.length > 32 || !/^\+?[\d\s().-]+$/.test(text)) return null;

  let digits = text.replace(/\D/g, '');
  let local = false;
  if (text.startsWith('+')) {
    // already international
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (/^0[17]\d{8}$/.test(digits)) {
    digits = `254${digits.slice(1)}`;
    local = true;
  } else if (!/^254\d{9,10}$/.test(digits)) {
    return null;
  }

  // +254 0712 … : the local 0 doesn't belong after the country code.
  if (/^2540\d{9}$/.test(digits)) digits = `254${digits.slice(4)}`;
  if (digits.startsWith('254') && digits.length !== 12) return null;
  // E.164: a country code never starts with 0, and 15 digits at most.
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return { digits, local };
}

/** Digits for wa.me, or null when the number can't be used. */
const normaliseWhatsAppNumber = (raw) => parseWhatsAppNumber(raw)?.digits ?? null;

/** "+254 712 345 678" for Kenyan numbers, "+447700900123" otherwise. */
function formatWhatsAppNumber(digits) {
  if (!digits) return '';
  const ke = /^254(\d{3})(\d{3})(\d{3})$/.exec(digits);
  return ke ? `+254 ${ke[1]} ${ke[2]} ${ke[3]}` : `+${digits}`;
}

/** https://wa.me/<digits>?text=<encoded message>, or null without a number. */
function whatsappLink(digits, text) {
  if (!digits) return null;
  const message = typeof text === 'string' ? text.trim() : '';
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

module.exports = { parseWhatsAppNumber, normaliseWhatsAppNumber, formatWhatsAppNumber, whatsappLink };
