import { STAYS, byId, normalizeProfile } from '@/lib/vibes';
import { lengthLabel } from '@/lib/catalog';
import { DEFAULT_LOCALE, formatKES, getLocale, localeTag, translate } from '@/i18n';
import catalogText from '@/locales/catalog';
import tripText from '@/locales/trip';

const tc = (locale, key, vars) => translate(catalogText, locale, key, vars);
const tt = (locale, key, vars) => translate(tripText, locale, key, vars);

/*
 * The visitor's trip ("cart"), as pure functions so it is easy to test and to
 * send to the quote API in Phase 4.
 *
 * Trip = {
 *   version: 1,
 *   arrival: 'YYYY-MM-DD' | '', departure: 'YYYY-MM-DD' | '',
 *   adults, children,
 *   days: [{ items: [key] }],   // one entry per day of the stay
 *   ideas: [key],               // added but not scheduled yet
 *   items: { [key]: Snapshot },
 *   notes: '',
 * }
 *
 * Snapshot = what we need to show and price an item even if the listing
 * changes later: { key, kind, id, title, titleIt?, hours, vibe, href, image,
 *   lengthLabel, rateLabel?, rate?, startDate,
 *   price: { resident, nonResident, childResident, childNonResident, unit } }
 *
 * Snapshots are data: title, lengthLabel and rateLabel are English (they are
 * saved on the device and sent to our team, who work in English). Show them
 * with snapTitle / snapLength / snapRate, which put them in the website's
 * language; titleIt is the team's Italian title, when the listing has one.
 */

export const BUSY_HOURS = 10; // more than this in one day gets a gentle warning
const PLAN_HOURS = 9.5; // the auto-planner fills each day up to this, transfers included
const MAX_PER_DAY = 2;
const DAY_MS = 86400000;

export const keyFor = (kind, id) => `${kind}:${id}`;

export function emptyTrip(profile) {
  const days = byId(STAYS, profile?.stay)?.days ?? 3;
  return {
    version: 1,
    arrival: '',
    departure: '',
    adults: profile?.companions === 'solo' ? 1 : 2,
    children: profile?.companions === 'family' ? 1 : 0,
    days: Array.from({ length: Math.min(days, 14) }, () => ({ items: [] })),
    ideas: [],
    items: {},
    notes: '',
  };
}

const MAX_DAYS = 30;
const NOTES_MAX = 2000; // the quote API's limit
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A trip read back from localStorage or a share link, repaired so the planner
 * can't crash on it and the quote API won't refuse it. Another version or a
 * shape we can't use gives null (the caller starts a fresh trip). Otherwise
 * keys without a snapshot and duplicate placements are dropped, numbers and
 * dates are clamped, and snapshots placed nowhere are kept in Ideas.
 */
export function normalizeTrip(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== 1 || !Array.isArray(raw.days)) return null;
  if (!raw.items || typeof raw.items !== 'object' || Array.isArray(raw.items)) return null;

  const items = {};
  for (const [key, snap] of Object.entries(raw.items)) {
    if (snap && typeof snap === 'object' && typeof snap.title === 'string' && snap.title.trim()) {
      items[key] = { ...snap, key, price: snap.price && typeof snap.price === 'object' ? snap.price : {} };
    }
  }

  const placed = new Set();
  const lane = (list) => {
    const keys = [];
    for (const k of Array.isArray(list) ? list : []) {
      if (typeof k === 'string' && items[k] && !placed.has(k)) {
        placed.add(k);
        keys.push(k);
      }
    }
    return keys;
  };
  const days = raw.days.slice(0, MAX_DAYS).map((d) => ({ items: lane(d?.items) }));
  if (!days.length) days.push({ items: [] });
  const ideas = lane(raw.ideas);
  Object.keys(items).forEach((k) => !placed.has(k) && ideas.push(k));

  const day = (d) => (typeof d === 'string' && ISO_DAY.test(d) ? d : '');
  let arrival = day(raw.arrival);
  let departure = day(raw.departure);
  if (arrival && departure && departure < arrival) arrival = departure = '';
  const count = (n, min, max, fallback) => (Number.isInteger(n) ? Math.max(min, Math.min(max, n)) : fallback);

  const trip = {
    version: 1,
    arrival,
    departure,
    adults: count(raw.adults, 1, 30, 2),
    children: count(raw.children, 0, 30, 0),
    days,
    ideas,
    items,
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, NOTES_MAX) : '',
  };
  if (typeof raw.lastRequest?.reference === 'string') trip.lastRequest = { reference: raw.lastRequest.reference, at: raw.lastRequest.at };
  return trip;
}

/** Shape an experience from the catalogue (lib/catalog.js) into a trip snapshot. */
export function toSnapshot(exp) {
  const raw = exp.raw || {};
  const childRes = raw.priceResidentChild ?? null;
  const childNon = raw.priceForeignerChild ?? null;
  const titleIt = typeof raw.titleIt === 'string' && raw.titleIt.trim() ? raw.titleIt.trim() : undefined;
  return {
    key: keyFor(exp.kind, exp.id),
    kind: exp.kind,
    id: exp.id,
    title: exp.titleEn ?? exp.title,
    ...(titleIt ? { titleIt } : {}),
    hours: exp.hours ?? null,
    vibe: exp.vibes?.[0] ?? null,
    href: exp.href,
    image: exp.image ?? null,
    lengthLabel: (exp.lengthEn !== undefined ? exp.lengthEn : exp.lengthLabel) ?? null,
    startDate: exp.startDate ?? null,
    price: {
      resident: exp.price?.resident ?? null,
      nonResident: exp.price?.nonResident ?? null,
      childResident: exp.kind === 'group' ? exp.price?.resident ?? null : childRes,
      childNonResident: exp.kind === 'group' ? exp.price?.nonResident ?? null : childNon,
      unit: exp.price?.unit ?? 'per person',
    },
  };
}

export const TRANSFERS = {
  in: { key: 'transfer:airport-in', kind: 'transfer', id: 'airport-in', title: 'Airport pick-up', hours: 1.5, lengthLabel: 'About 1½ hours', price: {} },
  out: { key: 'transfer:airport-out', kind: 'transfer', id: 'airport-out', title: 'Airport drop-off', hours: 1.5, lengthLabel: 'About 1½ hours', price: {} },
};

/*
 * Stays, transfers, car hire and local services join the trip too, so the
 * quote covers everything. They're priced by our team (not in the estimate);
 * `rateLabel` shows the listed rate in the planner and to the admin.
 */
// English on purpose: rateLabel goes to the team with the request.
const kes = (n) => (n === null || n === undefined || n === '' ? null : formatKES(n, DEFAULT_LOCALE));
const rateOf = (amount, per) => (amount != null && amount !== '' ? { rate: { amount: Number(amount), per: per || null } } : {});

export function snapshotFor(kind, doc) {
  const id = doc._id || doc.id;
  switch (kind) {
    case 'stay':
      return { key: keyFor('stay', id), kind: 'stay', id, title: `Stay · ${doc.name}`, hours: null, vibe: 'slow', href: '/hotels', image: doc.images?.[0] || null, rateLabel: doc.pricePerNight != null ? `${kes(doc.pricePerNight)} / night` : null, ...rateOf(doc.pricePerNight, 'night'), price: {} };
    case 'transfer':
      return { key: keyFor('transfer', id), kind: 'transfer', id, title: doc.route || 'Transfer', hours: 1.5, href: '/transfers', image: doc.vehicle?.image || null, rateLabel: doc.price != null ? `${kes(doc.price)} per trip` : null, ...rateOf(doc.price, 'trip'), lengthLabel: doc.vehicle?.name || null, price: {} };
    case 'carhire':
      return { key: keyFor('carhire', id), kind: 'carhire', id, title: `Car hire · ${doc.vehicle?.name || 'Vehicle'}`, hours: null, href: '/carhire', image: doc.vehicle?.image || null, rateLabel: doc.dailyRate != null ? `${kes(doc.dailyRate)} / day` : null, ...rateOf(doc.dailyRate, 'day'), price: {} };
    case 'service': {
      const titleIt = typeof doc.titleIt === 'string' && doc.titleIt.trim() ? doc.titleIt.trim() : undefined;
      return { key: keyFor('service', id), kind: 'service', id, title: doc.name, ...(titleIt ? { titleIt } : {}), hours: null, vibe: 'slow', href: '/services', image: doc.gallery?.[0] || null, rateLabel: doc.price != null ? `${kes(doc.price)}${doc.pricingType ? ` ${doc.pricingType}` : ''}` : null, ...rateOf(doc.price, doc.pricingType), price: {} };
    }
    default:
      throw new Error(`Unknown trip item kind: ${kind}`);
  }
}

/* ---------- Showing a snapshot in the website's language ---------- */

const AIRPORT = { 'airport-in': 'airportIn', 'airport-out': 'airportOut' };
const PREFIXED = { stay: ['Stay · ', 'prefixStay'], carhire: ['Car hire · ', 'prefixCarHire'] };
const RATE = { night: 'rateNight', day: 'rateDay', trip: 'rateTrip', hourly: 'rateHourly', daily: 'rateDaily' };

/** An item's title in a language: the team's Italian title, our own words translated, or the listing's English name. */
export function snapTitle(snap, locale = getLocale()) {
  if (locale === DEFAULT_LOCALE || !snap) return snap?.title ?? '';
  if (snap.titleIt) return snap.titleIt;
  if (snap.kind === 'transfer' && AIRPORT[snap.id]) return tc(locale, AIRPORT[snap.id]);
  const prefixed = PREFIXED[snap.kind];
  if (prefixed && snap.title.startsWith(prefixed[0])) return tc(locale, prefixed[1], { name: snap.title.slice(prefixed[0].length) });
  return snap.title;
}

/** The language snapTitle is in: 'en' for an experience or service shown under its English name. */
export function snapTitleLang(snap, locale = getLocale()) {
  if (locale === DEFAULT_LOCALE || snap?.titleIt) return locale;
  return ['tour', 'group', 'service'].includes(snap?.kind) ? DEFAULT_LOCALE : locale;
}

/** How long it takes ("Half day" → "Mezza giornata"); transfers show their vehicle. */
export function snapLength(snap, locale = getLocale()) {
  if (!snap) return null;
  if (snap.kind === 'transfer' && AIRPORT[snap.id]) return locale === DEFAULT_LOCALE ? snap.lengthLabel : tc(locale, 'aboutHourHalf');
  if (snap.kind === 'tour' || snap.kind === 'group') return lengthLabel(snap.hours, snap.lengthLabel, locale);
  return snap.lengthLabel ?? null;
}

/** The listed rate ("KES 18,000 / night" → "18.000 KES / notte"). Older saved items keep their English label. */
export function snapRate(snap, locale = getLocale()) {
  if (!snap) return null;
  if (locale === DEFAULT_LOCALE || !snap.rate) return snap.rateLabel ?? null;
  const price = formatKES(snap.rate.amount, locale);
  return RATE[snap.rate.per] ? tc(locale, RATE[snap.rate.per], { price }) : price;
}

/** Where a newly added item should go: dated activities onto days, everything else waits. */
export const defaultLane = (snap) => (snap.kind === 'tour' || snap.kind === 'group' || snap.kind === 'transfer' ? 'auto' : 'ideas');

/* ---------- Dates ---------- */

const parse = (d) => (d ? new Date(`${d}T00:00:00`) : null);

export function dayCountFromDates(arrival, departure) {
  const a = parse(arrival);
  const b = parse(departure);
  if (!a || !b || b < a) return null;
  return Math.min(MAX_DAYS, Math.round((b - a) / DAY_MS) + 1);
}

/** Date of a given day, or null when no dates are set. */
export function dateOfDay(trip, index) {
  const a = parse(trip.arrival);
  return a ? new Date(a.getTime() + index * DAY_MS) : null;
}

/** "Day 2 · Sat 16 Jan" ("Giorno 2 · sab 16 gen"). */
export function dayLabel(trip, index, locale = getLocale()) {
  const d = dateOfDay(trip, index);
  const base = tc(locale, 'dayN', { n: index + 1 });
  return d ? `${base} · ${d.toLocaleDateString(localeTag(locale), { weekday: 'short', day: 'numeric', month: 'short' })}` : base;
}

/** Resize the stay; items on removed days go back to Ideas (never lost). */
export function setDayCount(trip, count) {
  const n = Math.max(1, Math.min(MAX_DAYS, count));
  if (n === trip.days.length) return trip;
  if (n > trip.days.length) {
    return { ...trip, days: [...trip.days, ...Array.from({ length: n - trip.days.length }, () => ({ items: [] }))] };
  }
  const spill = trip.days.slice(n).flatMap((d) => d.items);
  return { ...trip, days: trip.days.slice(0, n), ideas: [...trip.ideas, ...spill] };
}

export function setDates(trip, arrival, departure) {
  const next = { ...trip, arrival, departure };
  const n = dayCountFromDates(arrival, departure);
  return n ? setDayCount(next, n) : next;
}

/* ---------- Items ---------- */

export const hasItem = (trip, key) => Boolean(trip.items[key]);
export const itemCount = (trip) => Object.keys(trip.items).length;

/** Activities on a day, not counting airport transfers. */
export function activityCount(trip, index) {
  return (trip.days[index]?.items || []).filter((k) => trip.items[k]?.kind !== 'transfer').length;
}

export function dayHours(trip, index) {
  return (trip.days[index]?.items || []).reduce((sum, k) => sum + (trip.items[k]?.hours || 0), 0);
}

/** Which day a group trip should land on, if the stay covers its start date. */
function dayForStartDate(trip, startDate) {
  const a = parse(trip.arrival);
  if (!a || !startDate) return null;
  // The start date is a calendar day stored as UTC midnight: read its UTC parts,
  // or a visitor west of Greenwich would get the trip placed a day early.
  const s = new Date(startDate);
  const idx = Math.round((new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()) - a) / DAY_MS);
  return idx >= 0 && idx < trip.days.length ? idx : null;
}

/**
 * Add a snapshot. `to`: 'ideas' | 'auto' | day index.
 * 'auto' = the dated day for a group trip, else the first day with room, else Ideas.
 */
export function addItem(trip, snap, to = 'auto') {
  if (hasItem(trip, snap.key)) return trip;
  let lane = to;
  if (to === 'auto') {
    const dated = snap.kind === 'group' ? dayForStartDate(trip, snap.startDate) : null;
    if (dated !== null) lane = dated;
    else {
      const fits = trip.days.findIndex(
        (d, i) => activityCount(trip, i) < MAX_PER_DAY && dayHours(trip, i) + (snap.hours || 4) <= PLAN_HOURS
      );
      lane = fits === -1 || (snap.hours || 0) > 24 ? 'ideas' : fits;
    }
  }
  const items = { ...trip.items, [snap.key]: snap };
  if (lane === 'ideas') return { ...trip, items, ideas: [...trip.ideas, snap.key] };
  const days = trip.days.map((d, i) => (i === lane ? { items: [...d.items, snap.key] } : d));
  return { ...trip, items, days };
}

export function removeItem(trip, key) {
  const { [key]: _gone, ...items } = trip.items;
  return {
    ...trip,
    items,
    ideas: trip.ideas.filter((k) => k !== key),
    days: trip.days.map((d) => ({ items: d.items.filter((k) => k !== key) })),
  };
}

/** Lane ids used by the board: 'ideas' or 'day-N'. */
export const laneId = (i) => (i === 'ideas' ? 'ideas' : `day-${i}`);
export const laneIndex = (id) => (id === 'ideas' ? 'ideas' : Number(String(id).replace('day-', '')));

export function laneOf(trip, key) {
  if (trip.ideas.includes(key)) return 'ideas';
  const i = trip.days.findIndex((d) => d.items.includes(key));
  return i === -1 ? null : laneId(i);
}

export function laneItems(trip, lane) {
  const idx = laneIndex(lane);
  return idx === 'ideas' ? trip.ideas : trip.days[idx]?.items || [];
}

/** Move an item to a lane at a position (end when index is omitted). */
export function moveItem(trip, key, toLane, toIndex) {
  if (!hasItem(trip, key)) return trip;
  const stripped = {
    ...trip,
    ideas: trip.ideas.filter((k) => k !== key),
    days: trip.days.map((d) => ({ items: d.items.filter((k) => k !== key) })),
  };
  const insert = (list) => {
    const at = toIndex === undefined || toIndex < 0 || toIndex > list.length ? list.length : toIndex;
    return [...list.slice(0, at), key, ...list.slice(at)];
  };
  const idx = laneIndex(toLane);
  if (idx === 'ideas') return { ...stripped, ideas: insert(stripped.ideas) };
  if (!stripped.days[idx]) return trip;
  return { ...stripped, days: stripped.days.map((d, i) => (i === idx ? { items: insert(d.items) } : d)) };
}

/* ---------- Estimate ---------- */

/**
 * Indicative total. Transfers and items without a price are counted as
 * "priced in your quote". Group trips are per person, children included.
 */
export function estimate(trip, residency = 'nonResident') {
  let total = 0;
  let unpriced = 0;
  const res = residency === 'resident';
  for (const snap of Object.values(trip.items)) {
    const p = snap.price || {};
    const adult = res ? p.resident ?? p.nonResident : p.nonResident ?? p.resident;
    const child = res ? p.childResident ?? p.childNonResident ?? adult : p.childNonResident ?? p.childResident ?? adult;
    if (adult == null) {
      unpriced += 1;
      continue;
    }
    total += adult * trip.adults + (child ?? 0) * trip.children;
  }
  return { total, unpriced };
}

/* ---------- Auto-plan ---------- */

/**
 * "Start me off": fill empty days with the best-ranked experiences.
 * `ranked` = rankExperiences(catalogue, profile) output. Keeps anything the
 * visitor already added, adds airport transfers on the first and last day.
 */
export function autoPlan(trip, ranked, { transfers = true } = {}) {
  let next = transfers ? addTransfers(trip) : trip;
  const candidates = ranked
    .map((r) => r.item)
    .filter((x) => !(x.kind === 'group' && (x.full || (x.hours || 0) > next.days.length * 24)));

  const last = next.days.length - 1;
  for (let i = 0; i < next.days.length; i += 1) {
    // Arrival and departure days stay light: one activity at most.
    const cap = last > 0 && (i === 0 || i === last) ? 1 : MAX_PER_DAY;
    for (const exp of candidates) {
      if (activityCount(next, i) >= cap) break;
      const snap = toSnapshot(exp);
      if (hasItem(next, snap.key)) continue;
      if ((snap.hours || 4) > 24) continue; // multi-day trips stay a manual choice
      if (dayHours(next, i) + (snap.hours || 4) > PLAN_HOURS) continue;
      next = addItem(next, snap, i);
    }
  }
  return next;
}

export function addTransfers(trip) {
  let next = trip;
  if (!hasItem(next, TRANSFERS.in.key)) {
    next = addItem(next, TRANSFERS.in, 0);
    next = moveItem(next, TRANSFERS.in.key, laneId(0), 0);
  }
  if (!hasItem(next, TRANSFERS.out.key) && next.days.length > 1) {
    next = addItem(next, TRANSFERS.out, next.days.length - 1);
  }
  return next;
}

/* ---------- Share links ---------- */

const toB64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

/** Compact, image-free copy of the trip for a shareable URL. */
export function encodeTrip(trip) {
  const items = Object.fromEntries(
    Object.entries(trip.items).map(([k, s]) => [k, { ...s, image: undefined }])
  );
  return toB64(JSON.stringify({ ...trip, items }));
}

export function decodeTrip(code) {
  try {
    return normalizeTrip(JSON.parse(fromB64(code)));
  } catch {
    return null;
  }
}

/* ---------- Plain-text summary (email / quote notes) ---------- */

/** "2 adults, 1 child" in a language. */
export const travellersText = (trip, locale = getLocale()) =>
  [tc(locale, 'adults', { count: trip.adults }), trip.children ? tc(locale, 'children', { count: trip.children }) : null].filter(Boolean).join(', ');

/** The plan as text, in the visitor's language (they send it themselves). */
export function tripSummary(trip, { headline, locale = getLocale() } = {}) {
  const lines = [];
  if (headline) lines.push(headline, '');
  lines.push(
    trip.arrival && trip.departure
      ? tt(locale, 'summaryDates', { from: trip.arrival, to: trip.departure })
      : tt(locale, 'summaryFlexible', { days: tc(locale, 'days', { count: trip.days.length }) }),
    tt(locale, 'summaryTravellers', { who: travellersText(trip, locale) }),
    ''
  );
  trip.days.forEach((d, i) => {
    lines.push(`${dayLabel(trip, i, locale)}:`);
    if (!d.items.length) lines.push(tt(locale, 'summaryFreeDay'));
    d.items.forEach((k) => lines.push(`  - ${snapTitle(trip.items[k], locale)}`));
  });
  if (trip.ideas.length) {
    lines.push('', tt(locale, 'summaryIdeas'));
    trip.ideas.forEach((k) => lines.push(`  - ${snapTitle(trip.items[k], locale)}`));
  }
  if (trip.notes) lines.push('', tt(locale, 'summaryNotes', { notes: trip.notes }));
  return lines.join('\n');
}

/* ---------- Quote request payload (POST /api/trip-requests) ---------- */

// Matches TRIP_ITEM_KINDS in backend/src/constants/tripItems.js.
const KINDS = ['tour', 'group', 'transfer', 'stay', 'carhire', 'service'];

function requestItem(snap, residency) {
  const p = snap.price || {};
  const listed = residency === 'resident' ? p.resident ?? p.nonResident : p.nonResident ?? p.resident;
  return {
    kind: KINDS.includes(snap.kind) ? snap.kind : 'other',
    refId: snap.id ? String(snap.id) : undefined,
    title: snap.rateLabel ? `${snap.title} (listed ${snap.rateLabel})`.slice(0, 200) : snap.title,
    hours: snap.hours ?? null,
    listedPrice: listed ?? null,
  };
}

/**
 * Shape the trip for the API. Dates are sent as YYYY-MM-DD strings. Titles
 * and day labels are English for the team; `locale` is the language the
 * traveller used, so their emails and quote come back in it.
 */
export function toRequestPayload(trip, { contact, profile, residency = 'nonResident', website = '', locale = getLocale() }) {
  const iso = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : undefined);
  return {
    contact,
    profile: normalizeProfile(profile) || undefined,
    arrival: trip.arrival || undefined,
    departure: trip.departure || undefined,
    adults: trip.adults,
    children: trip.children,
    residency,
    locale,
    days: trip.days.map((d, i) => ({
      label: dayLabel(trip, i, DEFAULT_LOCALE),
      date: iso(dateOfDay(trip, i)),
      items: d.items.map((k) => trip.items[k]).filter(Boolean).map((s) => requestItem(s, residency)),
    })),
    ideas: trip.ideas.map((k) => trip.items[k]).filter(Boolean).map((s) => requestItem(s, residency)),
    notes: trip.notes || undefined,
    estimate: estimate(trip, residency),
    website,
  };
}
