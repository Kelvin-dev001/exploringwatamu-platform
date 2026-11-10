import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
const axios = (await import('axios')).default;
const { formatKES, hoursFor, lengthBucket, loadCatalog, normaliseGroupTrip, normaliseTour, priceFor } = await import('@/lib/catalog');

describe('lengths', () => {
  it('prefers the number of hours the admin set, then reads the free text', () => {
    expect(hoursFor(3, 'Full day')).toBe(3);
    expect(hoursFor(null, 'Half day')).toBe(4);
    expect(hoursFor('', 'A whole day out')).toBe(8);
    expect(hoursFor(undefined, '2.5 hours')).toBe(2.5);
    expect(hoursFor(0, '2 nights')).toBe(48);
    expect(hoursFor(null, 'Flexible')).toBeNull();
  });

  it('buckets lengths for the filters', () => {
    expect([lengthBucket(null), lengthBucket(4), lengthBucket(8), lengthBucket(30)]).toEqual([null, 'half', 'full', 'multi']);
  });
});

describe('normalising listings', () => {
  it('maps a tour to the store shape', () => {
    const e = normaliseTour({ _id: 't1', name: 'Snorkel', description: 'Reef', duration: 'Half day', gallery: ['a.jpg'], priceForeignerAdult: 6500, priceResidentAdult: '3000', vibes: ['ocean'], createdAt: '2026-01-01' });
    expect(e).toMatchObject({
      id: 't1', kind: 'tour', title: 'Snorkel', image: 'a.jpg', hours: 4, lengthBucket: 'half', lengthLabel: 'Half day',
      price: { resident: 3000, nonResident: 6500, unit: 'per adult' }, href: '/experiences/t1', vibes: ['ocean'], suits: [], energy: null,
    });
  });

  it('works out seats, length and fullness for a group trip', () => {
    const g = normaliseGroupTrip({ _id: 'g1', title: 'Reef weekend', slug: 'reef-weekend', startDate: '2027-02-01', endDate: '2027-02-03', fullPrice: 25000, maxParticipants: 8, confirmedParticipants: 6, heroImage: 'h.jpg', gallery: ['g.jpg'] });
    expect(g).toMatchObject({ kind: 'group', href: '/group-trips/reef-weekend', lengthLabel: '3 days', hours: 72, seatsLeft: 2, full: false, vibes: ['social'], gallery: ['h.jpg', 'g.jpg'] });
    expect(normaliseGroupTrip({ _id: 'g2', title: 'x', slug: 'x', status: 'full', slotsRemaining: 3 }).full).toBe(true);
    expect(normaliseGroupTrip({ _id: 'g3', title: 'x', slug: 'x', maxParticipants: 4, confirmedParticipants: 4 }).full).toBe(true);
  });
});

describe('prices', () => {
  it('shows the price for the visitor’s residency, falling back to the other', () => {
    expect(priceFor({ price: { resident: 3000, nonResident: 6500 } }, 'resident')).toBe(3000);
    expect(priceFor({ price: { resident: 3000, nonResident: 6500 } })).toBe(6500);
    expect(priceFor({ price: { resident: 3000, nonResident: null } })).toBe(3000);
    expect(formatKES(18000.4)).toBe('KES 18,000');
    expect(formatKES(null)).toBeNull();
  });
});

describe('loadCatalog', () => {
  afterEach(() => axios.get.mockReset());
  const respond = ({ tours, trips }) =>
    axios.get.mockImplementation((url) => {
      const r = url.endsWith('/tours') ? tours : trips;
      return r instanceof Error ? Promise.reject(r) : Promise.resolve({ data: r });
    });

  it('merges live tours and group trips into one list', async () => {
    respond({ tours: { data: [{ _id: 't1', name: 'A', active: true }, { _id: 't2', name: 'Hidden', active: false }] }, trips: [{ _id: 'g1', title: 'G', slug: 'g' }] });
    const items = await loadCatalog({ force: true });
    expect(items.map((x) => `${x.kind}:${x.id}`)).toEqual(['tour:t1', 'group:g1']);
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/tours$/), { params: { active: true, limit: 200 } });
  });

  it('reuses a complete catalogue but refetches after a partial one', async () => {
    respond({ tours: new Error('cold start'), trips: [{ _id: 'g1', title: 'G', slug: 'g' }] });
    expect(await loadCatalog({ force: true })).toHaveLength(1);
    respond({ tours: { data: [{ _id: 't1', name: 'A' }] }, trips: [] });
    expect(await loadCatalog()).toHaveLength(1); // fetched again: now the tour
    expect(axios.get).toHaveBeenCalledTimes(4);
    await loadCatalog();
    expect(axios.get).toHaveBeenCalledTimes(4); // complete: cached
  });

  it('fails only when both requests fail, and tries again next time', async () => {
    respond({ tours: new Error('down'), trips: new Error('down') });
    await expect(loadCatalog({ force: true })).rejects.toThrow('Could not load experiences');
    respond({ tours: { data: [] }, trips: [] });
    await expect(loadCatalog()).resolves.toEqual([]);
  });
});
