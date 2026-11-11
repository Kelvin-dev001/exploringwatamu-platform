'use strict';

/*
 * Demo listings for staging and testing (run by scripts/seedDemo.js, never on
 * startup). They make the traveller journey testable on a fresh database
 * without pretending to be real partner inventory:
 *
 *   - every name/title starts with "Demo · " and every description with
 *     DEMO_NOTE, so they are obvious on the website and in the admin;
 *   - no photos (the website shows its illustrated stand-ins);
 *   - nothing is ever updated or deleted: a record is only created when its
 *     demo key is missing, so running the seed again adds nothing, and admin
 *     edits to demo records are kept.
 *
 * Records go through the normal models (validation, hooks, defaults).
 */
const Vehicle = require('../models/Vehicle');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');
const Transfer = require('../models/Transfer');
const Service = require('../models/Service');
const CarHire = require('../models/CarHire');
const PropertyForSale = require('../models/PropertyForSale');
const GroupTrip = require('../models/GroupTrip');

const PREFIX = 'Demo · ';
const DEMO_NOTE = 'Demo listing for testing — not a real offer.';
const describe = (text) => `${DEMO_NOTE} ${text}`;
const price = (residentAdult, foreignerAdult) => ({
  priceResidentAdult: residentAdult,
  priceResidentChild: Math.round(residentAdult / 2),
  priceForeignerAdult: foreignerAdult,
  priceForeignerChild: Math.round(foreignerAdult / 2),
});
// Group trips a few months ahead of the seed date, so they stay bookable.
const inDays = (n, from = new Date()) => new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + n));

function plan(now = new Date()) {
  return [
    { model: Vehicle, key: { name: `${PREFIX}Safari van (7 seats)` }, doc: { capacity: 7, description: describe('Air-conditioned van for transfers and day trips.') } },
    { model: Vehicle, key: { name: `${PREFIX}Saloon car (3 seats)` }, doc: { capacity: 3, description: describe('Saloon for couples and small families.') } },

    { model: Tour, key: { name: `${PREFIX}Marine park snorkel` }, doc: { description: describe('Half a day on the reef: turtles, coral gardens and a sandbank stop.'), duration: 'Half day', durationHours: 4, highlights: ['Reef snorkelling', 'Sandbank'], whatToCarry: ['Swimwear', 'Sunscreen'], vibes: ['ocean', 'adventure'], suits: ['couple', 'friends', 'family'], energy: 'moderate', ...price(3000, 6500) } },
    { model: Tour, key: { name: `${PREFIX}Gede ruins & Swahili lunch` }, doc: { description: describe('A guided walk through the ruins, then lunch with a local family.'), duration: 'Half day', durationHours: 5, highlights: ['Gede ruins', 'Swahili lunch'], vibes: ['culture', 'slow'], suits: ['solo', 'couple', 'family'], energy: 'easy', ...price(2500, 5000) } },
    { model: Tour, key: { name: `${PREFIX}Mida Creek sunset dhow` }, doc: { description: describe('Sail the creek at sunset with snacks on board.'), duration: '3 hours', durationHours: 3, highlights: ['Dhow sailing', 'Sunset'], vibes: ['romance', 'slow', 'ocean'], suits: ['couple', 'friends'], energy: 'easy', ...price(3500, 7000) } },
    { model: Tour, key: { name: `${PREFIX}Kitesurf taster` }, doc: { description: describe('Two hours with an instructor on the flat-water lagoon.'), duration: '2 hours', durationHours: 2, vibes: ['adventure', 'social'], suits: ['solo', 'friends'], energy: 'active', ...price(6000, 9000) } },

    { model: Hotel, key: { name: `${PREFIX}Beach house` }, doc: { type: 'villa', description: describe('Three bedrooms a short walk from the beach.'), location: { address: 'Watamu (demo)' }, pricePerNight: 18000, facilities: ['Pool', 'Wi-Fi'] } },
    { model: Hotel, key: { name: `${PREFIX}Garden guesthouse` }, doc: { type: 'hotel', stars: 3, description: describe('Simple rooms around a shady garden.'), location: { address: 'Watamu (demo)' }, pricePerNight: 6500, facilities: ['Breakfast', 'Wi-Fi'] } },

    { model: Service, key: { name: `${PREFIX}Private chef` }, doc: { description: describe('Swahili dinners cooked where you stay.'), pricingType: 'daily', price: 8000, availableDays: ['Friday', 'Saturday'] } },

    { model: PropertyForSale, key: { name: `${PREFIX}Creek-side plot` }, doc: { type: 'land', description: describe('Half an acre near Mida Creek.'), location: 'Mida Creek (demo)', price: 4500000 } },

    // Listings without a name are keyed by their demo description.
    { model: Transfer, key: { route: 'Malindi-Watamu', description: describe('Airport pick-up in the demo van.') }, ref: { vehicle: `${PREFIX}Safari van (7 seats)` }, doc: { price: 3500 } },
    { model: CarHire, key: { description: describe('Self-drive saloon for exploring the coast.') }, ref: { vehicle: `${PREFIX}Saloon car (3 seats)` }, doc: { dailyRate: 5500 } },

    { model: GroupTrip, key: { title: `${PREFIX}Watamu weekend escape` }, doc: { shortDescription: describe('Two nights, a reef day and a sunset dhow.'), startDate: inDays(60, now), endDate: inDays(62, now), maxParticipants: 12, fullPrice: 25000, depositAmount: 10000, status: 'published', meetingPoint: 'Watamu (demo)', itinerary: [{ day: 1, title: 'Arrive and settle in', activities: ['Welcome dinner'] }, { day: 2, title: 'Reef day', activities: ['Snorkelling'] }], includes: ['Two nights', 'Reef trip'], vibes: ['ocean', 'social'], suits: ['solo', 'friends'], energy: 'moderate', durationHours: 48 } },
  ];
}

/**
 * Creates the missing demo records. Returns { created: [labels], existing: n }.
 * dryRun: report what would be created without writing anything.
 */
async function seedDemo({ dryRun = false, now = new Date(), log = () => {} } = {}) {
  const created = [];
  let existing = 0;
  for (const item of plan(now)) {
    const label = `${item.model.modelName}: ${item.key.name || item.key.title || item.key.description}`;
    // eslint-disable-next-line no-await-in-loop
    if (await item.model.exists(item.key)) {
      existing += 1;
      continue;
    }
    const doc = { ...item.key, ...item.doc };
    for (const [field, vehicleName] of Object.entries(item.ref || {})) {
      // eslint-disable-next-line no-await-in-loop
      const vehicle = await Vehicle.findOne({ name: vehicleName }).select('_id');
      if (!vehicle && !dryRun) throw new Error(`Demo vehicle missing: ${vehicleName}`);
      doc[field] = vehicle?._id;
    }
    if (!dryRun) {
      // eslint-disable-next-line no-await-in-loop
      await item.model.create(doc);
    }
    created.push(label);
    log(`${dryRun ? 'would create' : 'created'} ${label}`);
  }
  return { created, existing };
}

module.exports = { seedDemo, plan, PREFIX, DEMO_NOTE };
