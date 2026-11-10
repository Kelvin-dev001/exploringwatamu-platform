import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { COMPANIONS, VIBES } from '@/lib/vibes';
import { emptyTrip, addItem, toRequestPayload } from '@/lib/trip';

// Contracts with the API, read from the API's own modules (plain CommonJS with
// no dependencies), so a change on one side fails here instead of breaking
// matching or quote requests in production. The admin form's copy is checked
// in admin-vite/src/forms/discovery.contract.test.js.
const require = createRequire(import.meta.url);
const discovery = require('../../../backend/src/constants/discovery.js');
const { TRIP_ITEM_KINDS } = require('../../../backend/src/constants/tripItems.js');

describe('website ↔ API contracts', () => {
  it('personalisation offers exactly the API’s vibes and companion types', () => {
    expect(VIBES.map((v) => v.id)).toEqual(discovery.VIBES);
    expect(COMPANIONS.map((c) => c.id)).toEqual(discovery.SUITS);
  });

  it('every planner item kind the API knows is sent as itself', () => {
    for (const kind of TRIP_ITEM_KINDS.filter((k) => k !== 'other')) {
      const trip = addItem(emptyTrip(), { key: `${kind}:1`, kind, id: '1', title: `A ${kind}`, price: {} }, 'ideas');
      expect(toRequestPayload(trip, { contact: {} }).ideas[0].kind).toBe(kind);
    }
  });

  it('an unknown kind becomes "other", which the API accepts', () => {
    const trip = addItem(emptyTrip(), { key: 'boat:1', kind: 'boat', id: '1', title: 'A boat', price: {} }, 'ideas');
    expect(TRIP_ITEM_KINDS).toContain(toRequestPayload(trip, { contact: {} }).ideas[0].kind);
  });
});
