import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { ENERGY, SUITS, VIBES, appendDiscovery, discoveryFrom, emptyDiscovery } from '@/forms/VibeFields';

// The discovery vocabulary lives in three places: the API (the source of
// truth), this admin form and the website. These contract tests read the API's
// own module, so a renamed or added tag fails here instead of silently
// breaking matching on the website. (The website's copy is checked in
// client-vite/src/lib/contracts.test.js.)
const require = createRequire(import.meta.url);
const backend = require('../../../backend/src/constants/discovery.js');

const ids = (list) => list.map((x) => x.id);

describe('discovery vocabulary contract (admin ↔ API)', () => {
  it('uses exactly the API’s vibes, suits and energy levels, in the same order', () => {
    expect(ids(VIBES)).toEqual(backend.VIBES);
    expect(ids(SUITS)).toEqual(backend.SUITS);
    expect(ids(ENERGY)).toEqual(backend.ENERGY);
  });

  it('sends tags in a form the API parses back to the same values', () => {
    const form = { vibes: ['romance', 'ocean'], suits: ['couple'], energy: 'easy', durationHours: '3.5' };
    const fd = new FormData();
    appendDiscovery(fd, form);
    const body = Object.fromEntries(fd.entries());
    expect(backend.parseDiscovery(body)).toEqual({ vibes: ['ocean', 'romance'], suits: ['couple'], energy: 'easy', durationHours: 3.5 });
  });

  it('clears tags the admin removed (empty values are sent, not left out)', () => {
    const fd = new FormData();
    appendDiscovery(fd, emptyDiscovery);
    expect(backend.parseDiscovery(Object.fromEntries(fd.entries()))).toEqual({ vibes: [], suits: [], energy: null, durationHours: null });
  });

  it('loads a listing’s tags into the form', () => {
    expect(discoveryFrom({ vibes: ['slow'], energy: 'moderate', durationHours: 0 })).toEqual({ vibes: ['slow'], suits: [], energy: 'moderate', durationHours: 0 });
    expect(discoveryFrom()).toEqual(emptyDiscovery);
  });
});
