import { describe, expect, it } from 'vitest';
import {
  BUSY_HOURS, TRANSFERS, addItem, addTransfers, autoPlan, dayHours, dayLabel, defaultLane, emptyTrip, estimate, itemCount,
  laneOf, moveItem, removeItem, setDates, setDayCount, snapshotFor, toRequestPayload, toSnapshot, tripSummary,
} from '@/lib/trip';
import { normaliseGroupTrip, normaliseTour } from '@/lib/catalog';

const tour = (id, extra = {}) => normaliseTour({ _id: id, name: `Tour ${id}`, description: 'd', durationHours: 4, priceForeignerAdult: 6000, priceResidentAdult: 3000, priceForeignerChild: 3000, priceResidentChild: 1500, vibes: ['ocean'], ...extra });
const snap = (id, extra) => toSnapshot(tour(id, extra));
const titles = (trip, lane) => (lane === 'ideas' ? trip.ideas : trip.days[lane].items).map((k) => trip.items[k].title);

describe('emptyTrip', () => {
  it('sizes the trip from the profile', () => {
    expect(emptyTrip().days).toHaveLength(3);
    expect(emptyTrip({ stay: 'weekend' }).days).toHaveLength(2);
    expect(emptyTrip({ stay: 'long' }).days).toHaveLength(10);
    expect(emptyTrip({ companions: 'solo' })).toMatchObject({ adults: 1, children: 0 });
    expect(emptyTrip({ companions: 'family' })).toMatchObject({ adults: 2, children: 1 });
  });
});

describe('adding and removing', () => {
  it('fills days two activities at a time, then spills to Ideas', () => {
    let t = emptyTrip({ stay: 'weekend' });
    ['a', 'b', 'c', 'd', 'e'].forEach((id) => { t = addItem(t, snap(id)); });
    expect(titles(t, 0)).toEqual(['Tour a', 'Tour b']);
    expect(titles(t, 1)).toEqual(['Tour c', 'Tour d']);
    expect(titles(t, 'ideas')).toEqual(['Tour e']);
    expect(itemCount(t)).toBe(5);
  });

  it('ignores an item that is already in the trip', () => {
    const t = addItem(emptyTrip(), snap('a'));
    expect(addItem(t, snap('a'))).toBe(t);
  });

  it('keeps long items for Ideas and puts a group trip on its start day', () => {
    let t = setDates(emptyTrip(), '2027-01-10', '2027-01-13');
    t = addItem(t, snap('long', { durationHours: 30 }));
    expect(titles(t, 'ideas')).toEqual(['Tour long']);
    const group = toSnapshot(normaliseGroupTrip({ _id: 'g', title: 'Reef weekend', slug: 'reef', startDate: '2027-01-12T00:00:00Z', endDate: '2027-01-13T00:00:00Z', fullPrice: 20000, maxParticipants: 8, confirmedParticipants: 0 }));
    t = addItem(t, group);
    expect(laneOf(t, group.key)).toBe('day-2');
  });

  it('sends stays, car hire and services to Ideas by default', () => {
    expect(defaultLane(snapshotFor('stay', { _id: 'h', name: 'Villa' }))).toBe('ideas');
    expect(defaultLane(snap('a'))).toBe('auto');
    expect(() => snapshotFor('boat', {})).toThrow(/Unknown trip item kind/);
  });

  it('removes an item from wherever it is', () => {
    let t = addItem(addItem(emptyTrip(), snap('a')), snap('b'), 'ideas');
    t = removeItem(removeItem(t, 'tour:a'), 'tour:b');
    expect(itemCount(t)).toBe(0);
    expect(t.days.every((d) => d.items.length === 0) && t.ideas.length === 0).toBe(true);
  });
});

describe('moving (drag-and-drop and the "Move to…" select)', () => {
  const base = () => ['a', 'b', 'c'].reduce((t, id) => addItem(t, snap(id), 'ideas'), emptyTrip());

  it('moves to a day, and reorders within a lane', () => {
    let t = moveItem(base(), 'tour:b', 'day-1');
    expect(titles(t, 1)).toEqual(['Tour b']);
    expect(titles(t, 'ideas')).toEqual(['Tour a', 'Tour c']);
    t = moveItem(t, 'tour:c', 'ideas', 0);
    expect(titles(t, 'ideas')).toEqual(['Tour c', 'Tour a']);
  });

  it('ignores unknown items and days that do not exist', () => {
    const t = base();
    expect(moveItem(t, 'tour:zzz', 'day-0')).toBe(t);
    expect(moveItem(t, 'tour:a', 'day-9')).toBe(t);
  });
});

describe('days and dates', () => {
  it('shrinking the stay moves items from removed days to Ideas, never losing them', () => {
    let t = emptyTrip({ stay: 'week' });
    t = addItem(t, snap('a'), 6);
    t = setDayCount(t, 3);
    expect(t.days).toHaveLength(3);
    expect(titles(t, 'ideas')).toEqual(['Tour a']);
    expect(setDayCount(t, 0).days).toHaveLength(1);
    expect(setDayCount(t, 99).days).toHaveLength(30);
  });

  it('dates set the number of days and label each day', () => {
    const t = setDates(emptyTrip(), '2027-01-10', '2027-01-14');
    expect(t.days).toHaveLength(5);
    expect(dayLabel(t, 0)).toBe('Day 1 · Sun 10 Jan');
    expect(dayLabel(emptyTrip(), 1)).toBe('Day 2');
  });

  it('flags a busy day', () => {
    let t = emptyTrip();
    t = addItem(t, snap('a', { durationHours: 6 }), 0);
    t = addItem(t, snap('b', { durationHours: 6 }), 0);
    expect(dayHours(t, 0)).toBeGreaterThan(BUSY_HOURS);
  });
});

describe('estimate', () => {
  it('prices adults and children by residency and counts unpriced items', () => {
    let t = { ...emptyTrip(), adults: 2, children: 1 };
    t = addItem(t, snap('a'));
    t = addItem(t, snapshotFor('stay', { _id: 'h', name: 'Villa', pricePerNight: 9000 }));
    expect(estimate(t, 'nonResident')).toEqual({ total: 6000 * 2 + 3000, unpriced: 1 });
    expect(estimate(t, 'resident')).toEqual({ total: 3000 * 2 + 1500, unpriced: 1 });
  });

  it('charges children the full price on group trips', () => {
    const g = toSnapshot(normaliseGroupTrip({ _id: 'g', title: 'G', slug: 'g', fullPrice: 20000, maxParticipants: 5 }));
    const t = addItem({ ...emptyTrip(), adults: 1, children: 1 }, g, 'ideas');
    expect(estimate(t).total).toBe(40000);
  });
});

describe('"Start me off" and transfers', () => {
  const ranked = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ item: tour(id) }));

  it('adds airport transfers and keeps arrival and departure days light', () => {
    const t = autoPlan(emptyTrip({ stay: 'short' }), ranked);
    expect(titles(t, 0)[0]).toBe('Airport pick-up');
    expect(titles(t, 3)).toContain('Airport drop-off');
    const activities = (i) => t.days[i].items.filter((k) => t.items[k].kind !== 'transfer').length;
    expect(activities(0)).toBe(1);
    expect(activities(3)).toBe(1);
    expect(activities(1)).toBe(2);
  });

  it('keeps what the visitor already chose and skips full or multi-day group trips', () => {
    let t = addItem(emptyTrip({ stay: 'weekend' }), snap('mine'), 'ideas');
    const full = { item: normaliseGroupTrip({ _id: 'g', title: 'Full trip', slug: 'g', status: 'full', maxParticipants: 2, confirmedParticipants: 2 }) };
    t = autoPlan(t, [full, ...ranked]);
    expect(t.items['tour:mine']).toBeTruthy();
    expect(t.items['group:g']).toBeUndefined();
  });

  it('adds the drop-off only when the stay is longer than a day', () => {
    const one = addTransfers(setDayCount(emptyTrip(), 1));
    expect(one.items[TRANSFERS.in.key]).toBeTruthy();
    expect(one.items[TRANSFERS.out.key]).toBeUndefined();
  });
});

describe('plain-text summary and API payload', () => {
  it('summarises the trip for email', () => {
    let t = setDates(emptyTrip(), '2027-01-10', '2027-01-11');
    t = addItem(t, snap('a'), 0);
    const chef = snapshotFor('service', { _id: 's', name: 'Chef', price: 8000, pricingType: 'daily' });
    t = addItem(t, chef, defaultLane(chef)); // as TripContext.add does
    t = { ...t, notes: 'Anniversary', children: 1 };
    const text = tripSummary(t, { headline: 'A few days of reefs.' });
    expect(text).toContain('A few days of reefs.');
    expect(text).toContain('Dates: 2027-01-10 to 2027-01-11');
    expect(text).toContain('Travellers: 2 adults, 1 child');
    expect(text).toContain('  - Tour a');
    expect(text).toContain('(free day)');
    expect(text).toContain('Stays, extras & unscheduled:');
    expect(text).toContain('Notes: Anniversary');
  });

  it('sends dated days, the price seen for the chosen residency and the estimate', () => {
    let t = setDates(emptyTrip(), '2027-01-10', '2027-01-11');
    t = addItem(t, snap('a'), 1);
    const p = toRequestPayload(t, { contact: { name: 'A', email: 'a@b.co' }, residency: 'resident', website: '' });
    expect(p.days.map((d) => d.date)).toEqual(['2027-01-10', '2027-01-11']);
    expect(p.days[1].items[0]).toMatchObject({ kind: 'tour', refId: 'a', title: 'Tour a', hours: 4, listedPrice: 3000 });
    expect(p).toMatchObject({ arrival: '2027-01-10', departure: '2027-01-11', residency: 'resident', estimate: { total: 6000, unpriced: 0 }, website: '' });
  });
});
