'use strict';

const { parseDiscovery } = require('../src/constants/discovery');
const { createGroupTripSchema } = require('../src/validators/groupTripValidators');

describe('discovery tags', () => {
  it('accepts JSON arrays, comma lists and arrays, keeping only known ids', () => {
    expect(parseDiscovery({ vibes: '["ocean","nope","Romance"]' }).vibes).toEqual(['ocean', 'romance']);
    expect(parseDiscovery({ suits: 'family, couple' }).suits).toEqual(['couple', 'family']);
    expect(parseDiscovery({ vibes: ['culture', 'culture'] }).vibes).toEqual(['culture']);
  });

  it('only returns keys that were sent, so older forms never wipe tags', () => {
    expect(parseDiscovery({ name: 'x' })).toEqual({});
    expect(parseDiscovery({ vibes: undefined })).toEqual({});
  });

  it('normalises energy and duration', () => {
    expect(parseDiscovery({ energy: 'Active', durationHours: '4' })).toEqual({ energy: 'active', durationHours: 4 });
    expect(parseDiscovery({ energy: 'extreme', durationHours: '-2' })).toEqual({ energy: null, durationHours: null });
  });

  it('group-trip validation keeps tags and rejects unknown vibes', () => {
    const base = {
      title: 'Reef weekend',
      shortDescription: 'Two days on the water',
      startDate: '2027-01-10',
      endDate: '2027-01-12',
      maxParticipants: '10',
      fullPrice: '20000',
      depositAmount: '5000',
    };
    const ok = createGroupTripSchema.parse({ ...base, vibes: '["ocean","social"]', suits: 'friends', energy: 'moderate' });
    expect(ok.vibes).toEqual(['ocean', 'social']);
    expect(ok.suits).toEqual(['friends']);
    expect(() => createGroupTripSchema.parse({ ...base, vibes: '["skiing"]' })).toThrow(/Unknown vibe/);
  });
});
