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

/** Languages a reply can be written in; a request's own `locale` is the language the traveller used. */
export const REPLY_LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'it', label: 'Italiano' },
];
export const replyLanguageOf = (r) => (r?.locale === 'it' ? 'it' : 'en');

/** The template that fits where the request stands. */
export function defaultReplyTemplate(r) {
  if (r.status === 'quoted' && r.quote?.total) return 'quote';
  if (r.status === 'accepted') return 'confirmed';
  if (r.status === 'declined' || r.status === 'cancelled') return 'followUp';
  return 'received';
}

// Italian dates and amounts for the Italian replies ("10 gen – 12 gen 2027", "145.000 KES").
const itDay = (d, opts) => new Date(d).toLocaleDateString('it-IT', { timeZone: 'UTC', ...opts });
const itRange = (a, b) => (b ? `${itDay(a, { day: 'numeric', month: 'short' })} – ${itDay(b, { day: 'numeric', month: 'short', year: 'numeric' })}` : itDay(a, { day: 'numeric', month: 'short', year: 'numeric' }));
const itKes = (n) => `${Math.round(Number(n) || 0).toLocaleString('it-IT')} KES`;

function italianReply(r, template) {
  const first = String(r.contact?.name || '').trim().split(/\s+/)[0];
  const hi = first ? `Ciao ${first}, siamo ${BRAND}` : `Ciao, siamo ${BRAND}`;
  const ref = r.reference;
  const who = [`${r.adults} ${r.adults === 1 ? 'adulto' : 'adulti'}`, r.children ? `${r.children} ${r.children === 1 ? 'bambino' : 'bambini'}` : null].filter(Boolean).join(', ');
  const when = r.arrival ? itRange(r.arrival, r.departure) : 'date flessibili';
  const q = r.quote || {};

  switch (template) {
    case 'question':
      return `${hi}, ti scriviamo per la tua richiesta di viaggio ${ref} (${when}, ${who}). Prima di inviarti il preventivo abbiamo una domanda: `;
    case 'quote':
      if (q.total) {
        const valid = q.validUntil ? `, valido fino al ${itDay(q.validUntil, { day: 'numeric', month: 'long' })}` : '';
        return `${hi}, ti scriviamo per la tua richiesta di viaggio ${ref}. Il tuo preventivo è pronto: ${itKes(q.total)} per l’intero viaggio${valid}. Hai domande o vuoi che cambiamo qualcosa?`;
      }
      return italianReply(r, 'received');
    case 'confirmed':
      return `${hi}. Grazie per aver confermato il tuo viaggio a Watamu (${ref})! Ti contatteremo a breve per il pagamento e gli ultimi dettagli. Karibu Watamu!`;
    case 'followUp':
      return `${hi}, ti ricontattiamo per la tua richiesta di viaggio ${ref}. Vuoi che ti prepariamo un programma diverso, o che guardiamo altre date?`;
    case 'received':
    default:
      return `${hi}, ti scriviamo per la tua richiesta di viaggio ${ref} (${when}, ${who}). Grazie per aver organizzato con noi il tuo viaggio a Watamu! Stiamo verificando la disponibilità e ti invieremo presto il preventivo. Vuoi aggiungere o chiedere qualcosa?`;
  }
}

/**
 * A first message to the traveller about their trip request. It names the
 * reference so both sides know which trip this is; the admin edits it before
 * WhatsApp opens. Only what the traveller sent us, and their quote. Written
 * in the traveller's language (the one they used on the website) unless
 * `language` says otherwise.
 */
export function tripReplyMessage(r, template = defaultReplyTemplate(r), language = replyLanguageOf(r)) {
  if (language === 'it') return italianReply(r, template);
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
