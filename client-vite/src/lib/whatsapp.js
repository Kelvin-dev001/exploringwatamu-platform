import { SITE, absoluteUrl } from '@/lib/site';
import { dayLabel } from '@/lib/trip';

/*
 * WhatsApp click-to-chat (https://wa.me). Links only: the visitor opens
 * WhatsApp, sees the prefilled message, can change it, and decides whether to
 * press Send. The website never sends anything itself.
 *
 * The business number comes from VITE_WHATSAPP_NUMBER (public: it is built
 * into the site). Without a usable number every WhatsApp button hides.
 *
 * Number rules — the same as backend/src/utils/whatsappNumber.js and
 * admin-vite/src/lib/whatsapp.js (keep the three in step):
 *   +254 712 345 678 · +44 (0)20 7946 0018 · 0044 20 7946 0018   international
 *   254712345678 · 0712 345 678 · 0112 345 678                    Kenyan
 * Anything else without a country code is refused: guessing the country can
 * open a chat with a stranger.
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

/** The business number (digits), or null — then WhatsApp buttons hide. */
export const businessNumber = () => normaliseWhatsAppNumber(import.meta.env.VITE_WHATSAPP_NUMBER);

/** Is WhatsApp set up for this build? */
export const whatsappEnabled = () => Boolean(businessNumber());

/** wa.me link to the business with a prefilled message, or null. */
export const businessLink = (text) => whatsappLink(businessNumber(), text);

/*
 * Longest message we put in a link, URL-encoded. WhatsApp copes with more, but
 * long links get cut off by some in-app browsers and phone share intents, and
 * nobody reads a 3,000-character chat opener. Encoding counts: a space is
 * "%20", an emoji up to 12 characters.
 */
export const MAX_ENCODED_MESSAGE = 1800;
export const encodedLength = (text) => encodeURIComponent(String(text ?? '').trim()).length;
export const fitsInLink = (text) => encodedLength(text) <= MAX_ENCODED_MESSAGE;

const HELLO = `Hi ${SITE.name}!`;

/** Header, footer, "ask our team" boxes. `topic`: "finding a stay". */
export const generalMessage = (topic) =>
  topic ? `${HELLO} Could you help me with ${topic} in Watamu?` : `${HELLO} I’m planning a trip to Watamu and have a question.`;

const KIND_LABEL = { tour: 'experience', group: 'group trip', stay: 'stay', transfer: 'transfer', carhire: 'car', service: 'service' };

/**
 * Enquiry about one listing, so the visitor doesn't have to explain what they
 * were looking at. Only public listing facts — nothing about the visitor.
 * details: short facts ("Half day", "from KES 4,500 per adult"); path: the
 * listing's own page, when it has one.
 */
export function listingMessage({ kind, title, details = [], path }) {
  const facts = details.filter(Boolean).join(' · ');
  const lines = [`${HELLO} I’m interested in this ${KIND_LABEL[kind] || 'listing'}:`, `*${title}*${facts ? ` (${facts})` : ''}`];
  if (path) lines.push(absoluteUrl(path));
  lines.push('', 'Could you tell me more and check availability for my dates?');
  return lines.join('\n');
}

const kes = (n) => (n === null || n === undefined || n === '' || Number.isNaN(Number(n)) ? null : `KES ${Math.round(Number(n)).toLocaleString('en-KE')}`);
const priced = (amount, unit) => (kes(amount) ? `${kes(amount)}${unit ? ` ${unit}` : ''}` : null);

/** Enquiry for a stay, transfer, car or service card (they have no page of their own). */
export function listingEnquiry(kind, doc) {
  switch (kind) {
    case 'stay': {
      const where = typeof doc.location === 'string' ? doc.location : doc.location?.address;
      return listingMessage({ kind, title: doc.name, details: [doc.type, doc.stars > 0 && `${doc.stars}-star`, where, priced(doc.pricePerNight, 'per night')] });
    }
    case 'transfer':
      return listingMessage({ kind, title: doc.route || 'Transfer', details: [doc.vehicle?.name, doc.vehicle?.capacity && `${doc.vehicle.capacity} seats`, priced(doc.price, 'per vehicle')] });
    case 'carhire':
      return listingMessage({ kind, title: doc.vehicle?.name || 'Car hire', details: [doc.vehicle?.type, doc.vehicle?.capacity && `${doc.vehicle.capacity} seats`, priced(doc.dailyRate, 'per day')] });
    case 'service':
      return listingMessage({ kind, title: doc.name, details: [priced(doc.price, doc.pricingType)] });
    default:
      throw new Error(`Unknown listing kind: ${kind}`);
  }
}

/** About a request or quote the visitor already has: the reference finds it. */
export const referenceMessage = (reference, what = 'trip request') => `${HELLO} I have a question about my ${what} ${reference}.`;

/* ---------- Trip planner ---------- */

const parseDay = (d) => (d ? new Date(`${d}T00:00:00`) : null);
// "Fri 8 Jan 2027" — built from parts: ICU versions disagree on a comma after the weekday.
const longDay = (d) => {
  const x = parseDay(d);
  return `${x.toLocaleDateString('en-GB', { weekday: 'short' })} ${x.getDate()} ${x.toLocaleDateString('en-GB', { month: 'short' })} ${x.getFullYear()}`;
};
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

// How unscheduled items are grouped, and the prefix their titles already carry.
const GROUPS = [
  { kinds: ['stay'], label: 'Stay', prefix: 'Stay · ' },
  { kinds: ['transfer'], label: 'Transfers' },
  { kinds: ['carhire'], label: 'Car hire', prefix: 'Car hire · ' },
  { kinds: ['service'], label: 'Services' },
  { kinds: ['tour', 'group'], label: 'Experiences not on a day yet' },
];
const groupOf = (snap) => GROUPS.find((g) => g.kinds.includes(snap.kind)) || { label: 'Other', kinds: [] };
const shortTitle = (snap) => {
  const g = groupOf(snap);
  return g.prefix && snap.title.startsWith(g.prefix) ? snap.title.slice(g.prefix.length) : snap.title;
};

// On a day line, say what isn't obviously an activity ("Transfer · Malindi–Watamu").
// "Stay · …" / "Car hire · …" titles and the planner's airport transfers already do.
const DAY_TAGS = { transfer: 'Transfer', group: 'Group trip', stay: 'Stay', carhire: 'Car hire', service: 'Service' };
function dayTitle(snap) {
  const tag = DAY_TAGS[snap.kind];
  return !tag || snap.title.startsWith(tag) || /pick-up|drop-off/i.test(snap.title) ? snap.title : `${tag} · ${snap.title}`;
}

/** Titles joined, at most `max` of them ("A, B, C +2 more"), each clipped to `len`. */
function list(titles, { max = Infinity, len = 80 } = {}) {
  const shown = titles.slice(0, max).map((t) => clip(t, len));
  return titles.length > max ? `${shown.join(', ')} +${titles.length - max} more` : shown.join(', ');
}

/**
 * The planner as a WhatsApp message: reference, dates, travellers, the days,
 * then stays, transfers, car hire and services. The visitor reviews and can
 * edit it before anything opens. Long plans are shortened step by step (fewer
 * words per item, then a summary) so the link always stays a sensible size.
 * Notes, names and contact details are left out on purpose.
 */
export function tripMessage(trip, { reference = trip.lastRequest?.reference } = {}) {
  const snaps = (keys) => keys.map((k) => trip.items[k]).filter(Boolean);
  const dayCount = trip.days.length;
  const dates =
    trip.arrival && trip.departure
      ? `${longDay(trip.arrival)} – ${longDay(trip.departure)} (${plural(dayCount, 'day')})`
      : `${plural(dayCount, 'day')}, dates flexible`;
  const travellers = [plural(trip.adults, 'adult'), trip.children ? plural(trip.children, 'child', 'children') : null].filter(Boolean).join(', ');
  const unscheduled = snaps(trip.ideas);

  const header = [
    reference ? `${HELLO} Here’s my Watamu trip plan.` : `${HELLO} Here’s my Watamu trip plan. Could you send me a quote?`,
    '',
    ...(reference ? [`Reference: ${reference}`] : []),
    `Dates: ${dates}`,
    `Travellers: ${travellers}`,
  ];

  const grouped = (opts) =>
    GROUPS.map((g) => {
      const titles = unscheduled.filter((s) => g.kinds.includes(s.kind)).map(shortTitle);
      return titles.length ? `*${g.label}:* ${list(titles, opts)}` : null;
    }).filter(Boolean);

  const levels = [
    // 1. Everything, day by day.
    () => [
      ...header,
      '',
      '*Day by day*',
      ...trip.days.map((d, i) => `${dayLabel(trip, i)}: ${d.items.length ? list(snaps(d.items).map(dayTitle)) : 'free day'}`),
      ...(unscheduled.length ? ['', ...grouped()] : []),
    ],
    // 2. Shorter: busy days only, clipped titles, a few items per line.
    () => {
      const free = trip.days.map((d, i) => (d.items.length ? null : i + 1)).filter(Boolean);
      return [
        ...header,
        '',
        '*Day by day*',
        ...trip.days.flatMap((d, i) => (d.items.length ? [`Day ${i + 1}: ${list(snaps(d.items).map(dayTitle), { max: 3, len: 40 })}`] : [])),
        ...(free.length ? [`Free: day ${free.join(', ')}`] : []),
        ...(unscheduled.length ? ['', ...grouped({ max: 3, len: 40 })] : []),
      ];
    },
    // 3. A summary the team can match to the plan.
    () => {
      const all = Object.values(trip.items);
      const count = (kinds) => all.filter((s) => kinds.includes(s.kind)).length;
      const parts = [
        count(['tour', 'group']) && plural(count(['tour', 'group']), 'experience'),
        count(['stay']) && plural(count(['stay']), 'stay'),
        count(['transfer']) && plural(count(['transfer']), 'transfer'),
        count(['carhire']) && plural(count(['carhire']), 'car'),
        count(['service']) && plural(count(['service']), 'service'),
      ].filter(Boolean);
      return [...header, '', `My plan has ${parts.join(', ') || 'nothing in it yet'}. I’ll share the details here.`];
    },
  ];

  for (const level of levels) {
    const text = level().join('\n');
    if (fitsInLink(text)) return text;
  }
  return header.join('\n');
}
