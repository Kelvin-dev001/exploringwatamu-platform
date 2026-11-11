import { SITE, absoluteUrl } from '@/lib/site';
import { dayLabel, snapTitle, travellersText } from '@/lib/trip';
import { unitLabel } from '@/lib/catalog';
import { formatKES, getLocale, localeTag, localisePath, translator } from '@/i18n';
import { pickText } from '@/i18n/listingContent';
import messages from '@/locales/whatsapp';
import catalogText from '@/locales/catalog';

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

// Prefilled messages are in the website's language: the visitor sends them.
const t = translator(messages);
const hello = () => t('hello', { brand: SITE.name });

const TOPICS = { stay: 'topicStay', car: 'topicCar', service: 'topicService', transfer: 'topicTransfer', unlisted: 'topicUnlisted' };

/**
 * Header, footer, "ask our team" boxes. `topic`: one of stay, car, service,
 * transfer, unlisted (said in the current language) — or your own words.
 */
export function generalMessage(topic) {
  if (!topic) return t('general', { hello: hello() });
  return t('generalTopic', { hello: hello(), topic: TOPICS[topic] ? t(TOPICS[topic]) : topic });
}

const INTEREST = { tour: 'interestTour', group: 'interestGroup', stay: 'interestStay', transfer: 'interestTransfer', carhire: 'interestCarhire', service: 'interestService' };

/**
 * Enquiry about one listing, so the visitor doesn't have to explain what they
 * were looking at. Only public listing facts — nothing about the visitor.
 * details: short facts ("Half day", "from KES 4,500 per adult"); path: the
 * listing's own page, when it has one (in the visitor's language).
 */
export function listingMessage({ kind, title, details = [], path }) {
  const facts = details.filter(Boolean).join(' · ');
  const lines = [t(INTEREST[kind] || 'interestOther', { hello: hello() }), `*${title}*${facts ? ` (${facts})` : ''}`];
  if (path) lines.push(absoluteUrl(localisePath(path, getLocale())));
  lines.push('', t('askAvailability'));
  return lines.join('\n');
}

const kes = (n) => (n === null || n === undefined || n === '' || Number.isNaN(Number(n)) ? null : formatKES(n));
const priced = (amount, unit) => (kes(amount) ? `${kes(amount)}${unit ? ` ${unitLabel(unit)}` : ''}` : null);
const STAY_TYPES = { hotel: 'stayHotel', villa: 'stayVilla', airbnb: 'stayAirbnb' };
const tc = translator(catalogText);
const stayType = (type) => (getLocale() !== 'en' && STAY_TYPES[type] ? tc(STAY_TYPES[type]) : type);
const seats = (n) => (n ? tc('seats', { count: Number(n) }) : null);

/** Enquiry for a stay, transfer, car or service card (they have no page of their own). */
export function listingEnquiry(kind, doc) {
  switch (kind) {
    case 'stay': {
      const where = typeof doc.location === 'string' ? doc.location : doc.location?.address;
      return listingMessage({ kind, title: doc.name, details: [stayType(doc.type), doc.stars > 0 && tc('stars', { n: doc.stars }), where, priced(doc.pricePerNight, 'per night')] });
    }
    case 'transfer':
      return listingMessage({ kind, title: doc.route || tc('kindTransfer'), details: [doc.vehicle?.name, seats(doc.vehicle?.capacity), priced(doc.price, 'per vehicle')] });
    case 'carhire':
      return listingMessage({ kind, title: doc.vehicle?.name || tc('kindCarHire'), details: [doc.vehicle?.type, seats(doc.vehicle?.capacity), priced(doc.dailyRate, 'per day')] });
    case 'service':
      return listingMessage({ kind, title: pickText(doc, 'title', getLocale(), doc.name).text, details: [priced(doc.price, doc.pricingType)] });
    default:
      throw new Error(`Unknown listing kind: ${kind}`);
  }
}

const REFERENCES = { 'trip request': 'refTripRequest', quote: 'refQuote' };
/** About a request or quote the visitor already has: the reference finds it. */
export const referenceMessage = (reference, what = 'trip request') =>
  REFERENCES[what] ? t(REFERENCES[what], { hello: hello(), reference }) : t('refOther', { hello: hello(), what, reference });

/* ---------- Trip planner ---------- */

const parseDay = (d) => (d ? new Date(`${d}T00:00:00`) : null);
// "Fri 8 Jan 2027" / "ven 8 gen 2027" — built from parts: ICU versions disagree on a comma after the weekday.
const longDay = (d) => {
  const x = parseDay(d);
  const tag = localeTag();
  return `${x.toLocaleDateString(tag, { weekday: 'short' })} ${x.getDate()} ${x.toLocaleDateString(tag, { month: 'short' })} ${x.getFullYear()}`;
};
const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

// How unscheduled items are grouped, and the prefix their (English) titles carry.
const GROUPS = [
  { kinds: ['stay'], label: 'groupStay', prefix: 'Stay · ' },
  { kinds: ['transfer'], label: 'groupTransfers' },
  { kinds: ['carhire'], label: 'groupCarHire', prefix: 'Car hire · ' },
  { kinds: ['service'], label: 'groupServices' },
  { kinds: ['tour', 'group'], label: 'groupUnscheduled' },
];
const groupOf = (snap) => GROUPS.find((g) => g.kinds.includes(snap.kind)) || { label: 'groupOther', kinds: [] };
const shortTitle = (snap) => {
  const g = groupOf(snap);
  return g.prefix && snap.title.startsWith(g.prefix) ? snap.title.slice(g.prefix.length) : snapTitle(snap);
};

// On a day line, say what isn't obviously an activity ("Transfer · Malindi–Watamu").
// Stays and car hire already say so, and so do the planner's airport transfers.
const DAY_TAGS = { transfer: 'tagTransfer', group: 'tagGroup', stay: 'tagStay', carhire: 'tagCarHire', service: 'tagService' };
const SAYS_WHAT = /^(Stay|Car hire) · /;
function dayTitle(snap) {
  const tag = DAY_TAGS[snap.kind];
  const title = snapTitle(snap);
  const airport = snap.kind === 'transfer' && /^airport-(in|out)$/.test(snap.id);
  if (!tag || airport || SAYS_WHAT.test(snap.title) || /pick-up|drop-off/i.test(snap.title) || snap.title.startsWith(t(tag))) return title;
  return `${t(tag)} · ${title}`;
}

/** Titles joined, at most `max` of them ("A, B, C +2 more"), each clipped to `len`. */
function list(titles, { max = Infinity, len = 80 } = {}) {
  const shown = titles.slice(0, max).map((x) => clip(x, len));
  return titles.length > max ? `${shown.join(', ')} ${t('planMore', { count: titles.length - max })}` : shown.join(', ');
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
  const days = tc('days', { count: dayCount });
  const dates =
    trip.arrival && trip.departure
      ? t('planDateRange', { from: longDay(trip.arrival), to: longDay(trip.departure), days })
      : t('planFlexible', { days });
  const unscheduled = snaps(trip.ideas);

  const header = [
    t(reference ? 'planIntro' : 'planIntroQuote', { hello: hello() }),
    '',
    ...(reference ? [t('planReference', { reference })] : []),
    t('planDates', { dates }),
    t('planTravellers', { who: travellersText(trip) }),
  ];

  const grouped = (opts) =>
    GROUPS.map((g) => {
      const titles = unscheduled.filter((s) => g.kinds.includes(s.kind)).map(shortTitle);
      return titles.length ? `*${t(g.label)}:* ${list(titles, opts)}` : null;
    }).filter(Boolean);

  const levels = [
    // 1. Everything, day by day.
    () => [
      ...header,
      '',
      t('planDayByDay'),
      ...trip.days.map((d, i) => `${dayLabel(trip, i)}: ${d.items.length ? list(snaps(d.items).map(dayTitle)) : t('planFreeDay')}`),
      ...(unscheduled.length ? ['', ...grouped()] : []),
    ],
    // 2. Shorter: busy days only, clipped titles, a few items per line.
    () => {
      const free = trip.days.map((d, i) => (d.items.length ? null : i + 1)).filter(Boolean);
      return [
        ...header,
        '',
        t('planDayByDay'),
        ...trip.days.flatMap((d, i) => (d.items.length ? [`${tc('dayN', { n: i + 1 })}: ${list(snaps(d.items).map(dayTitle), { max: 3, len: 40 })}`] : [])),
        ...(free.length ? [t('planFreeDays', { days: free.join(', ') })] : []),
        ...(unscheduled.length ? ['', ...grouped({ max: 3, len: 40 })] : []),
      ];
    },
    // 3. A summary the team can match to the plan.
    () => {
      const all = Object.values(trip.items);
      const count = (kinds) => all.filter((s) => kinds.includes(s.kind)).length;
      const parts = [
        ['countExperiences', ['tour', 'group']],
        ['countStays', ['stay']],
        ['countTransfers', ['transfer']],
        ['countCars', ['carhire']],
        ['countServices', ['service']],
      ]
        .map(([key, kinds]) => count(kinds) && t(key, { count: count(kinds) }))
        .filter(Boolean);
      return [...header, '', t('planSummary', { parts: parts.join(', ') || t('planEmpty') })];
    },
  ];

  for (const level of levels) {
    const text = level().join('\n');
    if (fitsInLink(text)) return text;
  }
  return header.join('\n');
}
