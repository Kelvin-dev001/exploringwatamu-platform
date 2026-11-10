import { describe, expect, it } from 'vitest';
import { COMPANIONS, MAX_VIBES, STAYS, VIBES, normalizeProfile, personalHeadline, profileSummary, readProfileRecord } from '@/lib/vibes';

describe('the vocabulary', () => {
  it('has unique ids and a label and icon for every vibe', () => {
    for (const list of [VIBES, COMPANIONS, STAYS]) expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
    for (const v of VIBES) expect(v.label && v.icon && v.phrase).toBeTruthy();
  });
});

describe('personal copy', () => {
  it('writes the hero headline from the profile', () => {
    expect(personalHeadline({ vibes: ['ocean', 'romance'], companions: 'couple', stay: 'short' })).toBe('A few days of turquoise reefs and sunsets, for two.');
    expect(personalHeadline({ vibes: ['ocean', 'slow', 'culture'] })).toBe('Days of turquoise reefs, slow mornings and old stories.');
    expect(personalHeadline({ vibes: [] })).toBeNull();
  });

  it('summarises the profile for the header pill', () => {
    expect(profileSummary({ vibes: ['ocean', 'romance'], companions: 'couple', stay: 'short' })).toBe('Ocean +1 · Two of us · 3–4 days');
    expect(profileSummary({ vibes: ['adventure'] })).toBe('Adventure');
    expect(profileSummary(null)).toBeNull();
  });
});

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
