import { date, dateRange, kes } from '@/lib/utils';

/* ---------- Replies to a trip request ---------- */

const BRAND = 'Exploring Watamu';

export const REPLY_TEMPLATES = [
  { id: 'received', label: 'Request received' },
  { id: 'question', label: 'Ask a question' },
  { id: 'quote', label: 'About the quote' },
  { id: 'confirmed', label: 'Trip confirmed' },
  { id: 'followUp', label: 'Follow up' },
];

/** The template that fits where the request stands. */
export function defaultReplyTemplate(r) {
  if (r.status === 'quoted' && r.quote?.total) return 'quote';
  if (r.status === 'accepted') return 'confirmed';
  if (r.status === 'declined' || r.status === 'cancelled') return 'followUp';
  return 'received';
}

/**
 * A first message to the traveller about their trip request. It names the
 * reference so both sides know which trip this is; the admin edits it before
 * WhatsApp opens. Only what the traveller sent us, and their quote.
 */
export function tripReplyMessage(r, template = defaultReplyTemplate(r)) {
  const first = String(r.contact?.name || '').trim().split(/\s+/)[0];
  const hi = first ? `Hi ${first}, this is ${BRAND}` : `Hi, this is ${BRAND}`;
  const ref = r.reference;
  const who = `${r.adults} adult${r.adults === 1 ? '' : 's'}${r.children ? `, ${r.children} child${r.children === 1 ? '' : 'ren'}` : ''}`;
  const when = r.arrival ? dateRange(r.arrival, r.departure) : 'flexible dates';
  const q = r.quote || {};

  switch (template) {
    case 'question':
      return `${hi} about your trip request ${ref} (${when}, ${who}). We have a quick question before we send your quote: `;
    case 'quote':
      if (q.total) {
        const valid = q.validUntil ? `, valid until ${date(q.validUntil, { day: 'numeric', month: 'long' })}` : '';
        return `${hi} about your trip request ${ref}. Your quote is ready: ${kes(q.total)} for the whole trip${valid}. Do you have any questions, or would you like us to change anything?`;
      }
      return tripReplyMessage(r, 'received');
    case 'confirmed':
      return `${hi}. Thank you for confirming your Watamu trip (${ref})! We’ll be in touch shortly about payment and the final details. Karibu Watamu!`;
    case 'followUp':
      return `${hi}, following up on your trip request ${ref}. Would you like us to put together a different plan, or look at other dates?`;
    case 'received':
    default:
      return `${hi} about your trip request ${ref} (${when}, ${who}). Thank you for planning your Watamu trip with us! We’re checking availability now and will send your quote soon. Is there anything you’d like to add or ask?`;
  }
}
