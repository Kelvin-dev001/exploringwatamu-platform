'use strict';

// The indexes in src/models match the queries the API actually runs. For each
// query: MongoDB picks an index (no collection scan), and it reads far fewer
// documents than a full scan of the same data would. Also: no two indexes on
// a collection share the same keys.

const mongoose = require('mongoose');
const { connect, disconnect } = require('./dbSetup');
const TripRequest = require('../../src/models/TripRequest');
const GroupBooking = require('../../src/models/GroupBooking');
const GroupTrip = require('../../src/models/GroupTrip');
const Notification = require('../../src/models/Notification');
const User = require('../../src/models/User');
const PropertyViewingBooking = require('../../src/models/PropertyViewingBooking');
const ServiceBooking = require('../../src/models/ServiceBooking');
const CarHireBooking = require('../../src/models/CarHireBooking');
const Review = require('../../src/models/Review');
const ReviewInvite = require('../../src/models/ReviewInvite');

const N = 400;
const ids = Array.from({ length: 8 }, () => new mongoose.Types.ObjectId());
const day = (n) => new Date(Date.UTC(2027, 0, 1 + (n % 60)));
const pick = (list, i) => list[i % list.length];

// Every stage name in a plan tree (classic and SBE explain formats).
function stages(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => stages(n, out));
  else if (node && typeof node === 'object') {
    if (typeof node.stage === 'string') out.push(node.stage);
    Object.values(node).forEach((v) => stages(v, out));
  }
  return out;
}

async function plan(query) {
  const e = await query.explain('executionStats');
  const ex = Array.isArray(e) ? e[0] : e;
  return { stages: stages(ex.queryPlanner.winningPlan), examined: ex.executionStats.totalDocsExamined, returned: ex.executionStats.nReturned };
}

// Same query, forced to scan the whole collection: the "no index" baseline.
async function baseline(query) {
  return plan(query.clone().hint({ $natural: 1 }));
}

beforeAll(async () => {
  await connect();
  await Promise.all([TripRequest, GroupBooking, GroupTrip, Notification, User, PropertyViewingBooking, ServiceBooking, CarHireBooking, Review, ReviewInvite].map((M) => M.syncIndexes()));

  const statuses = ['new', 'quoted', 'accepted', 'declined', 'cancelled'];
  await TripRequest.insertMany(Array.from({ length: N }, (_, i) => ({
    reference: `EW-IDX${String(i).padStart(4, '0')}`,
    user: i % 10 === 0 ? ids[0] : null,
    contact: { name: `Traveller ${i}`, email: `t${i % 50}@example.com` },
    status: pick(statuses, i),
    days: [],
    createdAt: day(i),
  })));
  await GroupBooking.insertMany(Array.from({ length: N }, (_, i) => ({
    trip: pick(ids, i), user: pick(ids, i * 3), fullName: 'X', email: 'x@example.com', phone: '1', paymentType: 'deposit', amountPaid: 0,
    status: pick(['pending', 'confirmed', 'cancelled'], i), createdAt: day(i),
  })));
  await Notification.insertMany(Array.from({ length: N }, (_, i) => ({
    channel: 'email', to: 'x@example.com', event: 'trip_quote', status: i % 40 === 0 ? 'failed' : 'sent', createdAt: day(i),
  })));
  await User.insertMany(Array.from({ length: N }, (_, i) => ({ name: `U${i}`, email: `u${i}@example.com`, ...(i === 7 ? { resetTokenHash: 'abc', resetTokenExpires: day(59) } : {}), ...(i === 9 ? { verifyTokenHash: 'def', verifyTokenExpires: day(59) } : {}) })));
  await PropertyViewingBooking.insertMany(Array.from({ length: N }, (_, i) => ({ property: pick(ids, i), date: day(i), time: pick(['10:00', '14:00'], i), status: 'booked' })));
  await ServiceBooking.insertMany(Array.from({ length: N }, (_, i) => ({ service: pick(ids, i), date: day(i), time: '18:00', status: 'booked' })));
  await CarHireBooking.insertMany(Array.from({ length: N }, (_, i) => ({ carHire: pick(ids, i), startDate: day(i), endDate: day(i + 2), status: 'booked' })));
  await Review.insertMany(Array.from({ length: N }, (_, i) => ({
    listingType: pick(['tour', 'stay', 'group', 'service'], i), listingId: pick(ids, i), user: pick(ids, i * 7),
    booking: { type: 'tripRequest', id: new mongoose.Types.ObjectId() }, displayName: 'X', rating: 1 + (i % 5), text: 'Review text',
    status: pick(['approved', 'approved', 'pending', 'hidden'], i), createdAt: day(i),
  })));
  await ReviewInvite.insertMany(Array.from({ length: N }, (_, i) => ({ bookingType: 'tripRequest', bookingId: i === 5 ? ids[5] : new mongoose.Types.ObjectId(), status: 'sent' })));
  await GroupTrip.insertMany(Array.from({ length: 60 }, (_, i) => ({
    title: `Trip ${i}`, slug: `trip-${i}`, shortDescription: 's', startDate: day(i), endDate: day(i + 2), maxParticipants: 10, fullPrice: 1, depositAmount: 1,
    status: pick(['draft', 'published', 'full', 'closed'], i),
  })));
});
afterAll(disconnect);

// [label, () => query] — each mirrors a controller's query.
const QUERIES = [
  ['trip requests by status (admin inbox)', () => TripRequest.find({ status: 'new' }).sort({ createdAt: -1 }).limit(20)],
  ['trip requests, newest first (admin inbox, all)', () => TripRequest.find({}).sort({ createdAt: -1 }).limit(20)],
  ["a traveller's trip requests (My trips)", () => TripRequest.find({ $or: [{ user: ids[0] }, { user: null, 'contact.email': 't3@example.com' }] }).sort({ createdAt: -1 })],
  ["a traveller's group bookings", () => GroupBooking.find({ user: ids[3] }).sort({ createdAt: -1 })],
  ["a trip's confirmed participants", () => GroupBooking.find({ trip: ids[1], status: 'confirmed' }).sort({ createdAt: -1 })],
  ['pending bookings to approve (dashboard)', () => GroupBooking.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(6)],
  ['recent failed notifications (dashboard)', () => Notification.find({ status: 'failed', createdAt: { $gte: day(30) } }).sort({ createdAt: -1 }).limit(5)],
  ['delivery log, newest first', () => Notification.find({}).sort({ createdAt: -1 }).limit(20)],
  ['password reset token lookup', () => User.findOne({ resetTokenHash: 'abc', resetTokenExpires: { $gt: day(0) } })],
  ['email confirmation token lookup', () => User.findOne({ verifyTokenHash: 'def', verifyTokenExpires: { $gt: day(0) } })],
  ['viewing slot check', () => PropertyViewingBooking.find({ property: ids[2], date: day(2), time: '10:00', status: 'booked' })],
  ['service slot check', () => ServiceBooking.find({ service: ids[2], date: day(2), status: 'booked', time: '18:00' })],
  // The car is free on these dates: the check finds nothing, so without an
  // index it would read every booking.
  ['car hire overlap check (car free)', () => CarHireBooking.findOne({ carHire: ids[2], status: 'booked', $or: [{ startDate: { $lte: new Date('2030-01-03') }, endDate: { $gte: new Date('2030-01-01') } }] })],
  ['published trips by date (website)', () => GroupTrip.find({ status: { $in: ['published', 'full'] } }).sort({ startDate: 1 })],
  ["a listing's approved reviews, newest first (website)", () => Review.find({ listingType: 'tour', listingId: ids[0], status: 'approved' }).sort({ createdAt: -1 }).limit(5)],
  ['reviews waiting for moderation', () => Review.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(20)],
  ["a traveller's reviews", () => Review.find({ user: ids[2] }).sort({ createdAt: -1 })],
  ["a booking's reviews (eligibility, invitations)", () => Review.find({ 'booking.type': 'tripRequest', 'booking.id': ids[3] })],
  ["a booking's review invitation", () => ReviewInvite.findOne({ bookingType: 'tripRequest', bookingId: ids[5] })],
];

describe('indexed queries', () => {
  it.each(QUERIES)('%s uses an index and reads fewer documents than a scan', async (label, build) => {
    const withIndex = await plan(build());
    const scan = await baseline(build());

    expect(withIndex.stages).not.toContain('COLLSCAN');
    expect(withIndex.stages).toEqual(expect.arrayContaining([expect.stringMatching(/IXSCAN|EXPRESS_IXSCAN|IDHACK/)]));
    expect(withIndex.returned).toBe(scan.returned);
    expect(withIndex.examined).toBeLessThan(scan.examined);
    // Close to what it returns, or a small share of the collection.
    expect(withIndex.examined).toBeLessThanOrEqual(Math.max(2 * withIndex.returned, scan.examined / 4));
  });
});

describe('index hygiene', () => {
  const models = [TripRequest, GroupBooking, GroupTrip, Notification, User, PropertyViewingBooking, ServiceBooking, CarHireBooking, Review, ReviewInvite];

  it.each(models.map((M) => [M.modelName, M]))('%s declares no two indexes with the same keys', (name, M) => {
    const keys = M.schema.indexes().map(([fields]) => JSON.stringify(fields));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps the unique keys unique (one index each)', async () => {
    const tripIndexes = await TripRequest.collection.indexes();
    expect(tripIndexes.filter((i) => i.key.reference)).toEqual([expect.objectContaining({ unique: true })]);
    const userIndexes = await User.collection.indexes();
    expect(userIndexes.filter((i) => i.key.email)).toEqual([expect.objectContaining({ unique: true })]);
  });
});
