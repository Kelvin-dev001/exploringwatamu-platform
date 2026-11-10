import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addItem, decodeTrip, emptyTrip, encodeTrip, normalizeTrip, snapshotFor, toRequestPayload } from '@/lib/trip';

const snap = (key, extra = {}) => ({ key, kind: 'tour', id: key.split(':')[1], title: `Title ${key}`, hours: 3, price: { nonResident: 1000 }, ...extra });

function tripWith(overrides = {}) {
  return {
    version: 1,
    arrival: '',
    departure: '',
    adults: 2,
    children: 0,
    days: [{ items: ['tour:a'] }, { items: [] }],
    ideas: ['tour:b'],
    items: { 'tour:a': snap('tour:a'), 'tour:b': snap('tour:b') },
    notes: '',
    ...overrides,
  };
}

describe('normalizeTrip (stored trips and share links)', () => {
  it('keeps a healthy trip as it is', () => {
    const t = tripWith({ arrival: '2027-01-10', departure: '2027-01-11', lastRequest: { reference: 'EW-ABC234', at: 'x' } });
    expect(normalizeTrip(t)).toEqual(t);
  });

  it('gives null for shapes it cannot use, so the planner starts fresh instead of crashing', () => {
    expect(normalizeTrip(null)).toBeNull();
    expect(normalizeTrip('trip')).toBeNull();
    expect(normalizeTrip(tripWith({ version: 2 }))).toBeNull();
    expect(normalizeTrip(tripWith({ days: 'monday' }))).toBeNull();
    expect(normalizeTrip(tripWith({ items: [] }))).toBeNull();
  });

  it('drops keys without a snapshot and duplicate placements', () => {
    const t = normalizeTrip(tripWith({ days: [{ items: ['tour:a', 'tour:ghost', 'tour:a'] }, { items: ['tour:a'] }], ideas: ['tour:b', 'tour:b', 42] }));
    expect(t.days).toEqual([{ items: ['tour:a'] }, { items: [] }]);
    expect(t.ideas).toEqual(['tour:b']);
  });

  it('repairs broken lanes and snapshots, and keeps unplaced items in Ideas', () => {
    const t = normalizeTrip(tripWith({
      days: [{ items: 'tour:a' }, null],
      ideas: undefined,
      items: { 'tour:a': snap('tour:a', { price: null }), 'tour:b': snap('tour:b'), 'tour:bad': { title: '' }, 'tour:worse': 7 },
    }));
    expect(t.days).toEqual([{ items: [] }, { items: [] }]);
    expect(t.ideas).toEqual(['tour:a', 'tour:b']);
    expect(Object.keys(t.items)).toEqual(['tour:a', 'tour:b']);
    expect(t.items['tour:a'].price).toEqual({});
  });

  it('clamps numbers, clears impossible dates and trims notes to the API limit', () => {
    const t = normalizeTrip(tripWith({ adults: 0, children: 99, arrival: '2027-02-10', departure: '2027-02-01', notes: 'x'.repeat(2500), days: [] }));
    expect(t.adults).toBe(1);
    expect(t.children).toBe(30);
    expect([t.arrival, t.departure]).toEqual(['', '']);
    expect(t.notes).toHaveLength(2000);
    expect(t.days).toEqual([{ items: [] }]);
    expect(normalizeTrip(tripWith({ adults: '2', arrival: 'soon' }))).toMatchObject({ adults: 2, arrival: '' });
  });
});

describe('share links', () => {
  it('round-trips a trip without its images', () => {
    const t = tripWith({ items: { 'tour:a': snap('tour:a', { image: 'https://img/a.jpg' }), 'tour:b': snap('tour:b') } });
    const back = decodeTrip(encodeTrip(t));
    expect(back.days).toEqual(t.days);
    expect(back.items['tour:a'].image).toBeUndefined();
  });

  it('refuses garbage and repairs a tampered plan', () => {
    expect(decodeTrip('%%%not-base64')).toBeNull();
    const tampered = btoa(JSON.stringify(tripWith({ days: [{ items: ['tour:a', 'tour:missing'] }] })));
    expect(decodeTrip(tampered).days).toEqual([{ items: ['tour:a'] }]);
  });
});

describe('quote request payload', () => {
  it('keeps the kind of stays, car hire and services (they used to be sent as "other")', () => {
    let t = emptyTrip();
    t = addItem(t, snapshotFor('stay', { _id: 'h1', name: 'Turtle Bay', pricePerNight: 18000 }), 'ideas');
    t = addItem(t, snapshotFor('carhire', { _id: 'c1', vehicle: { name: 'RAV4' }, dailyRate: 6000 }), 'ideas');
    t = addItem(t, snapshotFor('service', { _id: 's1', name: 'Private chef', price: 8000 }), 'ideas');
    t = addItem(t, snapshotFor('transfer', { _id: 't1', route: 'Malindi-Watamu', price: 4000 }), 0);

    const p = toRequestPayload(t, { contact: { name: 'Amina', email: 'a@b.co' } });

    expect(p.ideas.map((i) => i.kind)).toEqual(['stay', 'carhire', 'service']);
    expect(p.ideas[0]).toMatchObject({ refId: 'h1', title: 'Stay · Turtle Bay (listed KES 18,000 / night)' });
    expect(p.days[0].items[0].kind).toBe('transfer');
  });

  it('sends only vibes the API knows, so an old saved profile cannot block the request', () => {
    const p = toRequestPayload(tripWith(), { contact: {}, profile: { vibes: ['party', 'ocean'], companions: 'pets', stay: 'short' } });
    expect(p.profile).toEqual({ vibes: ['ocean'], companions: null, stay: 'short' });
    expect(toRequestPayload(tripWith(), { contact: {}, profile: { vibes: ['party'] } }).profile).toBeUndefined();
  });
});

describe('group trips land on their start day in every time zone', () => {
  const tz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/Los_Angeles'; // west of Greenwich: local time is the previous day at UTC midnight
  });
  afterAll(() => {
    process.env.TZ = tz;
  });

  it('places a trip starting 12 Jan on the day dated 12 Jan', () => {
    const t = { ...emptyTrip(), arrival: '2027-01-10', departure: '2027-01-14', days: Array.from({ length: 5 }, () => ({ items: [] })) };
    const group = { key: 'group:g1', kind: 'group', id: 'g1', title: 'Reef weekend', hours: 48, startDate: '2027-01-12T00:00:00.000Z', price: {} };
    const placed = addItem(t, group, 'auto');
    expect(placed.days[2].items).toEqual(['group:g1']);
  });
});
