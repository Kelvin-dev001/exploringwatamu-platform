import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { formatDay } from '@/lib/utils';
import { getResidency } from '@/lib/catalog';

describe('formatDay', () => {
  const tz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/New_York';
  });
  afterAll(() => {
    process.env.TZ = tz;
  });

  it('shows a stored calendar date as the same day for a visitor west of Greenwich', () => {
    expect(formatDay('2027-01-10T00:00:00.000Z')).toBe('10 Jan 2027');
    expect(formatDay('2027-01-10')).toBe('10 Jan 2027');
    expect(formatDay('2026-10-01T00:00:00.000Z', { day: 'numeric', month: 'long', year: 'numeric' }, 'en-KE')).toMatch(/1 October 2026|October 1, 2026/);
  });

  it('is empty for missing or invalid dates', () => {
    expect(formatDay(null)).toBe('');
    expect(formatDay('not a date')).toBe('');
  });
});

describe('getResidency', () => {
  const store = new Map();
  beforeAll(() => {
    globalThis.window = { localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) } };
  });
  afterEach(() => store.clear());
  afterAll(() => {
    delete globalThis.window;
  });

  it('returns only values the quote API accepts', () => {
    expect(getResidency()).toBe('nonResident');
    store.set('ew.residency.v1', JSON.stringify('resident'));
    expect(getResidency()).toBe('resident');
    store.set('ew.residency.v1', JSON.stringify('Resident'));
    expect(getResidency()).toBe('nonResident');
    store.set('ew.residency.v1', '{broken');
    expect(getResidency()).toBe('nonResident');
  });
});
