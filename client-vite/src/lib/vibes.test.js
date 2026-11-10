import { describe, expect, it } from 'vitest';
import { MAX_VIBES, normalizeProfile, readProfileRecord } from '@/lib/vibes';

describe('normalizeProfile', () => {
  it('keeps known ids and drops retired or misspelt ones', () => {
    expect(normalizeProfile({ vibes: ['ocean', 'Party Starter', 'culture', 'ocean'], companions: 'couple', stay: 'week' })).toEqual({
      vibes: ['ocean', 'culture'],
      companions: 'couple',
      stay: 'week',
    });
    expect(normalizeProfile({ vibes: ['slow'], companions: 'dog', stay: 'forever' })).toEqual({ vibes: ['slow'], companions: null, stay: null });
  });

  it(`never returns more than ${MAX_VIBES} vibes (the onboarding could not untick extras)`, () => {
    expect(normalizeProfile({ vibes: ['ocean', 'slow', 'adventure', 'culture', 'romance'] }).vibes).toHaveLength(MAX_VIBES);
  });

  it('gives null when nothing usable is left', () => {
    expect(normalizeProfile(null)).toBeNull();
    expect(normalizeProfile({ vibes: 'ocean' })).toBeNull();
    expect(normalizeProfile({ vibes: ['party'] })).toBeNull();
  });
});

describe('readProfileRecord (the stored personalisation record)', () => {
  it('cleans a saved profile', () => {
    const r = readProfileRecord({ version: 1, status: 'set', profile: { vibes: ['romance', 'nope'], companions: 'couple', stay: 'short' }, updatedAt: 't' });
    expect(r).toEqual({ version: 1, status: 'set', profile: { vibes: ['romance'], companions: 'couple', stay: 'short' }, updatedAt: 't' });
  });

  it('remembers "just let me browse"', () => {
    expect(readProfileRecord({ version: 1, status: 'skipped', profile: { vibes: ['x'] } })).toMatchObject({ status: 'skipped', profile: null });
  });

  it('treats unreadable or unusable records as a first visit (we ask again)', () => {
    expect(readProfileRecord(null)).toBeNull();
    expect(readProfileRecord({ version: 2, status: 'set', profile: { vibes: ['ocean'] } })).toBeNull();
    expect(readProfileRecord({ version: 1, status: 'set', profile: { vibes: ['retired-vibe'] } })).toBeNull();
  });
});
