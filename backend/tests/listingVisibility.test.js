'use strict';

const { activeFilter, canSee } = require('../src/services/listingVisibility');

const admin = { id: 'a1', email: 'ops@test.com' };

describe('listing visibility', () => {
  it('the public only ever gets live listings, whatever ?active says', () => {
    expect(activeFilter({ query: {} })).toEqual({ active: { $ne: false } });
    expect(activeFilter({ query: { active: 'false' } })).toEqual({ active: { $ne: false } });
  });

  it('admins see everything, or narrow with ?active', () => {
    expect(activeFilter({ admin, query: {} })).toEqual({});
    expect(activeFilter({ admin, query: { active: 'true' } })).toEqual({ active: { $ne: false } });
    expect(activeFilter({ admin, query: { active: 'false' } })).toEqual({ active: false });
  });

  it('a hidden listing is only visible to admins', () => {
    expect(canSee({}, { active: false })).toBe(false);
    expect(canSee({}, { active: true })).toBe(true);
    expect(canSee({}, {})).toBe(true); // older records without the flag count as live
    expect(canSee({ admin }, { active: false })).toBe(true);
  });
});
