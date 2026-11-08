import { STAYS, byId } from '@/lib/vibes';

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
 * changes later: { key, kind, id, title, hours, vibe, href, image,
 *   lengthLabel, startDate, price: { resident, nonResident, childResident, childNonResident, unit } }
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

/** Shape an experience from the catalogue (lib/catalog.js) into a trip snapshot. */
export function toSnapshot(exp) {
  const raw = exp.raw || {};
  const childRes = raw.priceResidentChild ?? null;
  const childNon = raw.priceForeignerChild ?? null;
  return {
    key: keyFor(exp.kind, exp.id),
    kind: exp.kind,
    id: exp.id,
    title: exp.title,
    hours: exp.hours ?? null,
    vibe: exp.vibes?.[0] ?? null,
    href: exp.href,
    image: exp.image ?? null,
    lengthLabel: exp.lengthLabel ?? null,
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

/* ---------- Dates ---------- */

const parse = (d) => (d ? new Date(`${d}T00:00:00`) : null);

export function dayCountFromDates(arrival, departure) {
  const a = parse(arrival);
  const b = parse(departure);
  if (!a || !b || b < a) return null;
  return Math.min(30, Math.round((b - a) / DAY_MS) + 1);
}

/** Date of a given day, or null when no dates are set. */
export function dateOfDay(trip, index) {
  const a = parse(trip.arrival);
  return a ? new Date(a.getTime() + index * DAY_MS) : null;
}

export function dayLabel(trip, index) {
  const d = dateOfDay(trip, index);
  const base = `Day ${index + 1}`;
  return d ? `${base} · ${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}` : base;
}

/** Resize the stay; items on removed days go back to Ideas (never lost). */
export function setDayCount(trip, count) {
  const n = Math.max(1, Math.min(30, count));
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
  const s = new Date(startDate);
  const idx = Math.round((new Date(s.getFullYear(), s.getMonth(), s.getDate()) - a) / DAY_MS);
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
    const t = JSON.parse(fromB64(code));
    if (!t || t.version !== 1 || !Array.isArray(t.days) || typeof t.items !== 'object') return null;
    return t;
  } catch {
    return null;
  }
}

/* ---------- Plain-text summary (email / quote notes) ---------- */

export function tripSummary(trip, { headline } = {}) {
  const lines = [];
  if (headline) lines.push(headline, '');
  lines.push(
    `Dates: ${trip.arrival && trip.departure ? `${trip.arrival} to ${trip.departure}` : `${trip.days.length} days, dates flexible`}`,
    `Travellers: ${trip.adults} adult${trip.adults === 1 ? '' : 's'}${trip.children ? `, ${trip.children} child${trip.children === 1 ? '' : 'ren'}` : ''}`,
    ''
  );
  trip.days.forEach((d, i) => {
    lines.push(`${dayLabel(trip, i)}:`);
    if (!d.items.length) lines.push('  (free day)');
    d.items.forEach((k) => lines.push(`  - ${trip.items[k]?.title}`));
  });
  if (trip.ideas.length) {
    lines.push('', 'Also interested in:');
    trip.ideas.forEach((k) => lines.push(`  - ${trip.items[k]?.title}`));
  }
  if (trip.notes) lines.push('', `Notes: ${trip.notes}`);
  return lines.join('\n');
}
