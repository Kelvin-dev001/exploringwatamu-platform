/*
 * WhatsApp click-to-chat for replying to travellers. Links only: WhatsApp
 * opens with the message filled in and nothing is sent until the admin presses
 * Send there.
 *
 * Number rules — the same as backend/src/utils/whatsappNumber.js and
 * client-vite/src/lib/whatsapp.js (keep the three in step):
 *   +254 712 345 678 · +44 (0)20 7946 0018 · 0044 20 7946 0018   international
 *   254712345678 · 0712 345 678 · 0112 345 678                    Kenyan
 * Any other number without a country code is refused (null): 0772 123 456
 * could be Ugandan, 2025550123 American, and a wrong guess sends a
 * traveller's trip details to a stranger. `local: true` says a Kenyan local
 * number was assumed, so the screen can say so.
 */

export function parseWhatsAppNumber(raw) {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim().replace(/\(0\)/g, '');
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

  if (/^2540\d{9}$/.test(digits)) digits = `254${digits.slice(4)}`;
  if (digits.startsWith('254') && digits.length !== 12) return null;
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return { digits, local };
}

export const normaliseWhatsAppNumber = (raw) => parseWhatsAppNumber(raw)?.digits ?? null;

export function formatWhatsAppNumber(digits) {
  if (!digits) return '';
  const ke = /^254(\d{3})(\d{3})(\d{3})$/.exec(digits);
  return ke ? `+254 ${ke[1]} ${ke[2]} ${ke[3]}` : `+${digits}`;
}

export function whatsappLink(digits, text) {
  if (!digits) return null;
  const message = typeof text === 'string' ? text.trim() : '';
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
