import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/api.js';
import { safeStorage } from '@/lib/utils';

/*
 * The store's catalogue: tours and published group trips normalised into one
 * "experience" shape so the store, the homepage and (Phase 3) the itinerary
 * canvas can treat them the same way.
 *
 * Experience = {
 *   id, kind: 'tour' | 'group', title, summary, image, gallery,
 *   vibes, suits, energy, hours, lengthBucket: 'half' | 'full' | 'multi' | null,
 *   lengthLabel, price: { resident, nonResident, unit }, href, raw,
 *   startDate?, seatsLeft?, createdAt
 * }
 */

const HOURS_FROM_TEXT = [
  [/half[\s-]*day/i, 4],
  [/full[\s-]*day|whole day/i, 8],
  [/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)/i, (m) => Number(m[1])],
  [/(\d+)\s*(?:days?|nights?)/i, (m) => Number(m[1]) * 24],
];

/** Best guess at length in hours: admin-set number first, then the free-text duration. */
export function hoursFor(durationHours, durationText) {
  if (Number(durationHours) > 0) return Number(durationHours);
  if (!durationText) return null;
  for (const [re, val] of HOURS_FROM_TEXT) {
    const m = String(durationText).match(re);
    if (m) return typeof val === 'function' ? val(m) : val;
  }
  return null;
}

export function lengthBucket(hours) {
  if (!hours) return null;
  if (hours <= 5) return 'half';
  if (hours <= 12) return 'full';
  return 'multi';
}

export const LENGTHS = [
  { id: 'half', label: 'Half day', blurb: 'Up to 5 hours' },
  { id: 'full', label: 'Full day', blurb: '6–12 hours' },
  { id: 'multi', label: 'Multi-day', blurb: 'Overnight or longer' },
];

function lengthLabel(hours, text) {
  if (text) return text;
  if (!hours) return null;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
// Approved reviews only (the API's reviewStats); null until there are some.
const ratingFrom = (s) => (num(s?.count) > 0 ? { average: num(s.average), count: num(s.count) } : null);

export function normaliseTour(t) {
  const hours = hoursFor(t.durationHours, t.duration);
  return {
    id: t._id,
    kind: 'tour',
    title: t.name,
    summary: t.description,
    image: t.gallery?.[0] || null,
    gallery: t.gallery || [],
    vibes: t.vibes || [],
    suits: t.suits || [],
    energy: t.energy || null,
    hours,
    lengthBucket: lengthBucket(hours),
    lengthLabel: lengthLabel(hours, t.duration),
    price: { resident: num(t.priceResidentAdult), nonResident: num(t.priceForeignerAdult), unit: 'per adult' },
    href: `/experiences/${t._id}`,
    rating: ratingFrom(t.reviewStats),
    createdAt: t.createdAt,
    raw: t,
  };
}

export function normaliseGroupTrip(g) {
  const start = g.startDate ? new Date(g.startDate) : null;
  const end = g.endDate ? new Date(g.endDate) : null;
  const days = start && end ? Math.max(1, Math.round((end - start) / 86400000) + 1) : null;
  const hours = hoursFor(g.durationHours, null) ?? (days ? days * 24 : null);
  const seatsLeft = num(g.slotsRemaining) ?? (num(g.maxParticipants) ?? 0) - (num(g.confirmedParticipants) ?? 0);
  return {
    id: g._id,
    kind: 'group',
    title: g.title,
    summary: g.shortDescription,
    image: g.heroImage || g.gallery?.[0] || null,
    gallery: [g.heroImage, ...(g.gallery || [])].filter(Boolean),
    vibes: g.vibes?.length ? g.vibes : ['social'],
    suits: g.suits || [],
    energy: g.energy || null,
    hours,
    lengthBucket: lengthBucket(hours),
    lengthLabel: days ? `${days} day${days === 1 ? '' : 's'}` : null,
    price: { resident: num(g.fullPrice), nonResident: num(g.fullPrice), unit: 'per person' },
    href: `/group-trips/${g.slug}`,
    startDate: g.startDate,
    seatsLeft,
    full: g.status === 'full' || seatsLeft <= 0,
    rating: ratingFrom(g.reviewStats),
    createdAt: g.createdAt,
    raw: g,
  };
}

// One in-flight request shared by every component on the page.
let cache = null;

export function loadCatalog({ force = false } = {}) {
  if (cache && !force) return cache;
  cache = Promise.allSettled([
    axios.get(`${API_URL}/tours`, { params: { active: true, limit: 200 } }),
    axios.get(`${API_URL}/group-trips`),
  ]).then(([tours, trips]) => {
    if (tours.status === 'rejected' && trips.status === 'rejected') {
      cache = null;
      throw new Error('Could not load experiences');
    }
    // Show what arrived, but don't keep a half catalogue for the whole visit.
    if (tours.status === 'rejected' || trips.status === 'rejected') cache = null;
    const tourList = tours.status === 'fulfilled' ? tours.value.data?.data ?? tours.value.data ?? [] : [];
    const tripList = trips.status === 'fulfilled' ? trips.value.data ?? [] : [];
    return [
      ...(Array.isArray(tourList) ? tourList : []).filter((t) => t.active !== false).map(normaliseTour),
      ...(Array.isArray(tripList) ? tripList : []).map(normaliseGroupTrip),
    ];
  });
  return cache;
}

/** React hook: { items, loading, error, retry } */
export function useCatalog() {
  const [state, setState] = useState({ items: [], loading: true, error: null });
  const run = (force) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    loadCatalog({ force })
      .then((items) => setState({ items, loading: false, error: null }))
      .catch((error) => setState({ items: [], loading: false, error }));
  };
  useEffect(() => run(false), []);
  return { ...state, retry: () => run(true) };
}

/** Find one experience in the catalogue, or fetch a tour directly (deep links). */
export async function loadExperience(id) {
  try {
    const items = await loadCatalog();
    const hit = items.find((x) => String(x.id) === String(id));
    if (hit) return hit;
  } catch {
    /* fall through to a direct fetch */
  }
  const res = await axios.get(`${API_URL}/tours/${id}`);
  return normaliseTour(res.data);
}

/* ---------- Pricing ---------- */

const RESIDENCY_KEY = 'ew.residency.v1';
/**
 * International-first: show non-resident prices unless the visitor says otherwise.
 * Anything else in storage counts as non-resident — the quote API only accepts these two.
 */
export function getResidency() {
  return safeStorage.get(RESIDENCY_KEY) === 'resident' ? 'resident' : 'nonResident';
}
export function setResidency(value) {
  safeStorage.set(RESIDENCY_KEY, value);
}

export function priceFor(item, residency = 'nonResident') {
  const p = item.price || {};
  return residency === 'resident' ? p.resident ?? p.nonResident : p.nonResident ?? p.resident;
}

export function formatKES(n) {
  if (n === null || n === undefined) return null;
  return `KES ${Math.round(n).toLocaleString('en-KE')}`;
}
