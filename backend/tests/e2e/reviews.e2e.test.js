'use strict';

// Verified reviews end to end: who may review what (checked on the server),
// duplicates, photos, moderation, what the public sees and the ratings.
// Cloudinary is configured and its storage mocked (no network); email is off.

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

// The uploaded file name picks the outcome: "cloudinary-401…" fails like a bad signature.
jest.mock('multer-storage-cloudinary', () => ({
  CloudinaryStorage: class MockCloudinaryStorage {
    constructor({ params }) {
      this.params = params;
    }

    async _handleFile(req, file, cb) {
      const params = await this.params(req, file);
      file.stream.on('end', () => {
        if (file.originalname.startsWith('cloudinary-401')) return cb({ message: 'Invalid Signature', http_code: 401 });
        return cb(null, { path: `https://res.cloudinary.test/${params.folder}/${file.originalname}`, filename: file.originalname });
      });
      file.stream.resume();
    }

    _removeFile(req, file, cb) {
      cb(null);
    }
  },
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { connect, disconnect } = require('./dbSetup');
const { PNG, loginAsAdmin } = require('./groupTripHelpers');
const buildApp = require('../../src/app');
const config = require('../../src/config/env');
const { signUserToken, signReviewInvite } = require('../../src/services/tokens');
const Review = require('../../src/models/Review');
const LegacyReview = require('../../src/models/LegacyReview');
const User = require('../../src/models/User');
const Tour = require('../../src/models/Tour');
const Hotel = require('../../src/models/Hotel');
const Vehicle = require('../../src/models/Vehicle');
const Transfer = require('../../src/models/Transfer');
const CarHire = require('../../src/models/CarHire');
const Service = require('../../src/models/Service');
const GroupTrip = require('../../src/models/GroupTrip');
const GroupBooking = require('../../src/models/GroupBooking');
const TripRequest = require('../../src/models/TripRequest');

const DAY = 86400000;
const utcDay = (offset) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + offset * DAY);
};

let app;
let adminToken;
const users = {};
const tokens = {};
const L = {}; // listings
const B = {}; // bookings

const as = (who) => ({ Authorization: `Bearer ${tokens[who]}` });
const review = (who, body) => request(app).post('/api/reviews').set(as(who)).send({ rating: 5, text: 'Wonderful day, the guides were brilliant and kind.', ...body });
const forTrip = (key, listingType, listing, extra = {}) => ({ bookingType: 'tripRequest', bookingId: String(B[key]._id), listingType, listingId: String(listing._id), ...extra });
const moderate = (id, status) => request(app).put(`/api/reviews/admin/${id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status });

function tripRequest(overrides) {
  return TripRequest.create({
    contact: { name: 'Ada Lovelace', email: 'ada@test.com' },
    adults: 2,
    status: 'accepted',
    arrival: utcDay(-6),
    departure: utcDay(-3),
    days: [
      { label: 'Day 1', date: utcDay(-6), items: [{ kind: 'transfer', refId: 'airport-in', title: 'Airport pick-up' }, { kind: 'tour', refId: String(L.tour._id), title: 'Marine park snorkel' }] },
      { label: 'Day 2', date: utcDay(-5), items: [{ kind: 'transfer', refId: String(L.transfer._id), title: 'Malindi-Watamu' }] },
    ],
    ideas: [
      { kind: 'stay', refId: String(L.stay._id), title: 'Stay · Turtle Bay (listed KES 18,000 / night)' },
      { kind: 'carhire', refId: String(L.car._id), title: 'Car hire · Prado' },
      { kind: 'service', refId: String(L.service._id), title: 'Private chef' },
      { kind: 'group', refId: String(L.groupPast._id), title: 'Reef weekend' },
      { kind: 'tour', refId: 'not-an-id', title: 'Something typed' },
    ],
    ...overrides,
  });
}

beforeAll(async () => {
  await connect();
  await Review.init(); // unique indexes in place before the duplicate tests
  app = buildApp();
  adminToken = await loginAsAdmin(app);

  for (const [key, name, email, extra] of [
    ['ada', 'Ada Lovelace', 'ada@test.com', {}],
    ['bo', 'Bo Diddley', 'bo@test.com', {}],
    ['gail', 'Gail Google', 'gail@test.com', { googleId: 'google-sub-gail' }],
    ['pat', 'Pat Password', 'gail.guest@test.com', {}],
    ['mallory', 'Mallory', 'mallory@test.com', {}],
    ['spammer', 'Sam Spam', 'spam@test.com', {}],
  ]) {
    users[key] = await User.create({ name, email, ...extra });
    tokens[key] = signUserToken(users[key]);
  }

  const vehicle = await Vehicle.create({ name: 'Prado' });
  L.tour = await Tour.create({ name: 'Marine park snorkel', description: 'Reef', priceResidentAdult: 1, priceResidentChild: 1, priceForeignerAdult: 1, priceForeignerChild: 1 });
  L.otherTour = await Tour.create({ name: 'Not in any booking', description: 'x', priceResidentAdult: 1, priceResidentChild: 1, priceForeignerAdult: 1, priceForeignerChild: 1 });
  L.stay = await Hotel.create({ name: 'Turtle Bay', type: 'hotel' });
  L.transfer = await Transfer.create({ route: 'Malindi-Watamu', vehicle: vehicle._id, price: 4500 });
  L.car = await CarHire.create({ vehicle: vehicle._id, dailyRate: 9000 });
  L.service = await Service.create({ name: 'Private chef', description: 'Dinner', pricingType: 'daily', price: 6000 });
  const trip = (title, start, end) => ({ title, slug: title.toLowerCase().replace(/\W+/g, '-'), shortDescription: 's', startDate: start, endDate: end, maxParticipants: 10, fullPrice: 10000, depositAmount: 3000, status: 'published' });
  L.groupPast = await GroupTrip.create(trip('Reef weekend', utcDay(-10), utcDay(-8)));
  L.groupFuture = await GroupTrip.create(trip('Future escape', utcDay(10), utcDay(12)));

  B.adaAccepted = await tripRequest({ user: users.ada._id });
  B.adaFuture = await tripRequest({ user: users.ada._id, arrival: utcDay(5), departure: utcDay(8), days: [{ label: 'Day 1', date: utcDay(5), items: [{ kind: 'tour', refId: String(L.tour._id), title: 'Snorkel' }] }], ideas: [] });
  B.adaQuoted = await tripRequest({ user: users.ada._id, status: 'quoted' });
  B.adaNoDates = await tripRequest({ user: users.ada._id, arrival: null, departure: null, days: [{ label: 'Day 1', items: [{ kind: 'tour', refId: String(L.tour._id), title: 'Snorkel' }] }], ideas: [] });
  B.guest = await tripRequest({ user: null, contact: { name: 'Gail', email: 'gail@test.com' } });
  B.guestPat = await tripRequest({ user: null, contact: { name: 'Pat', email: 'gail.guest@test.com' } });

  const booking = (user, tripDoc, status) => GroupBooking.create({ trip: tripDoc._id, user: user._id, fullName: user.name, email: user.email, phone: '0700000000', paymentType: 'deposit', amountPaid: 3000, status });
  B.boConfirmed = await booking(users.bo, L.groupPast, 'confirmed');
  B.boPending = await booking(users.bo, L.groupPast, 'pending');
  B.boFuture = await booking(users.bo, L.groupFuture, 'confirmed');
});
afterAll(disconnect);

describe('eligibility (checked on the server)', () => {
  it('lists every listing in an accepted, finished trip — once each, skipping non-listings', async () => {
    const res = await request(app).get('/api/reviews/eligible').query({ bookingType: 'tripRequest', bookingId: String(B.adaAccepted._id) }).set(as('ada'));
    expect(res.status).toBe(200);
    const byType = Object.fromEntries(res.body.data.map((i) => [i.listingType, i]));
    expect(Object.keys(byType).sort()).toEqual(['carhire', 'group', 'service', 'stay', 'tour', 'transfer']);
    expect(byType.carhire.listingTitle).toBe('Prado');
    expect(byType.stay.listingTitle).toBe('Turtle Bay');
    expect(res.body.data.every((i) => i.canReview)).toBe(true);
    expect(byType.stay.booking).toEqual({ type: 'tripRequest', id: String(B.adaAccepted._id), reference: B.adaAccepted.reference });
  });

  it('accepts a review for each of the six listing types', async () => {
    for (const [type, listing] of [['tour', L.tour], ['stay', L.stay], ['transfer', L.transfer], ['carhire', L.car], ['service', L.service], ['group', L.groupPast]]) {
      const res = await review('ada', forTrip('adaAccepted', type, listing, { rating: 4 }));
      expect([type, res.status]).toEqual([type, 201]);
      expect(res.body.review).toMatchObject({ status: 'pending', listingType: type, displayName: 'Ada L.', verified: true });
    }
  });

  it('refuses a second review of the same listing for the same booking (also at the database)', async () => {
    const again = await review('ada', forTrip('adaAccepted', 'tour', L.tour));
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('ALREADY_REVIEWED');
    await expect(Review.create({ listingType: 'tour', listingId: L.tour._id, booking: { type: 'tripRequest', id: B.adaAccepted._id }, displayName: 'x', rating: 5, text: 'Direct insert bypassing the API checks' })).rejects.toMatchObject({ code: 11000 });
    const twice = await Promise.all([1, 2].map(() => review('bo', { bookingType: 'groupBooking', bookingId: String(B.boConfirmed._id), listingType: 'group', listingId: String(L.groupPast._id) })));
    expect(twice.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('refuses listings that are not in the booking, whatever ids are sent', async () => {
    const res = await review('ada', forTrip('adaAccepted', 'tour', L.otherTour));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('NOT_IN_BOOKING');
    // The right id under the wrong type is not in the booking either.
    expect((await review('ada', forTrip('adaAccepted', 'service', L.tour))).status).toBe(403);
  });

  it('refuses someone else’s booking as if it did not exist', async () => {
    const res = await review('mallory', forTrip('adaAccepted', 'tour', L.tour));
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BOOKING_NOT_FOUND');
    const theirs = await request(app).get('/api/reviews/eligible').query({ bookingType: 'tripRequest', bookingId: String(B.adaAccepted._id) }).set(as('mallory'));
    expect(theirs.status).toBe(404);
    expect((await review('ada', { bookingType: 'groupBooking', bookingId: String(B.boConfirmed._id), listingType: 'group', listingId: String(L.groupPast._id) })).status).toBe(404);
  });

  it('waits until the trip is accepted / confirmed and has taken place', async () => {
    expect((await review('ada', forTrip('adaQuoted', 'tour', L.tour))).body.code).toBe('NOT_ACCEPTED');
    const future = await review('ada', forTrip('adaFuture', 'tour', L.tour));
    expect(future.status).toBe(403);
    expect(future.body.code).toBe('NOT_ENDED');
    expect((await review('ada', forTrip('adaNoDates', 'tour', L.tour))).body.code).toBe('NO_DATES');
    expect((await review('bo', { bookingType: 'groupBooking', bookingId: String(B.boPending._id), listingType: 'group', listingId: String(L.groupPast._id) })).body.code).toBe('NOT_CONFIRMED');
    expect((await review('bo', { bookingType: 'groupBooking', bookingId: String(B.boFuture._id), listingType: 'group', listingId: String(L.groupFuture._id) })).body.code).toBe('NOT_ENDED');
  });

  it('says why a listing is not reviewable yet', async () => {
    const res = await request(app).get('/api/reviews/eligible').set(as('ada'));
    const reasons = new Set(res.body.data.map((i) => i.reason));
    expect(reasons).toEqual(new Set(['reviewed', 'not-ended', 'no-dates']));
    expect(res.body.data.some((i) => i.booking.id === String(B.adaQuoted._id))).toBe(false); // not accepted: not listed
  });

  it('lets a guest request be reviewed by a Google account with that email, not by a password account', async () => {
    expect((await review('gail', forTrip('guest', 'stay', L.stay))).status).toBe(201);
    // Pat registered gail.guest@test.com with a password: that doesn't prove the address.
    expect((await review('pat', forTrip('guestPat', 'stay', L.stay))).status).toBe(404);
  });

  it('lets a guest request be reviewed with the invitation sent to its email', async () => {
    const t = signReviewInvite({ bookingType: 'tripRequest', bookingId: B.guestPat._id, email: 'gail.guest@test.com' });
    expect((await review('pat', forTrip('guestPat', 'stay', L.stay, { inviteToken: t }))).status).toBe(201);
    // An invitation for another booking, another address, or a forged one opens nothing.
    const other = signReviewInvite({ bookingType: 'tripRequest', bookingId: B.guest._id, email: 'gail.guest@test.com' });
    expect((await review('pat', forTrip('guestPat', 'tour', L.tour, { inviteToken: other }))).status).toBe(404);
    const forged = jwt.sign({ bt: 'tripRequest', bid: String(B.guestPat._id), em: 'gail.guest@test.com' }, 'not-the-secret', { audience: 'review-invite' });
    expect((await review('mallory', forTrip('guestPat', 'tour', L.tour, { inviteToken: forged }))).status).toBe(404);
    // An invitation is never a sign-in token.
    expect((await request(app).get('/api/reviews/mine').set('Authorization', `Bearer ${t}`)).status).toBe(401);
  });

  it('validates the review itself', async () => {
    const base = forTrip('adaAccepted', 'tour', L.otherTour);
    const bad = async (body) => (await request(app).post('/api/reviews').set(as('ada')).send({ ...base, rating: 5, text: 'A long enough review text here.', ...body })).status;
    expect(await bad({ rating: 0 })).toBe(400);
    expect(await bad({ rating: 6 })).toBe(400);
    expect(await bad({ rating: 4.5 })).toBe(400);
    expect(await bad({ text: 'Too short' })).toBe(400);
    expect(await bad({ text: 'x'.repeat(2001) })).toBe(400);
    expect(await bad({ listingType: 'property' })).toBe(400);
    expect(await bad({ bookingType: 'legacy' })).toBe(400);
    expect(await bad({ listingId: { $ne: null } })).toBe(400);
    expect(await bad({ status: 'approved', verified: false })).toBe(403); // extra fields are ignored; still not in the booking
  });

  it('limits how many review writes one account can make in an hour', async () => {
    const statuses = [];
    for (let i = 0; i < 31; i += 1) statuses.push((await request(app).post('/api/reviews').set(as('spammer')).send({})).status);
    expect(statuses.slice(0, 30).every((s) => s === 400)).toBe(true);
    expect(statuses[30]).toBe(429);
    // Someone else is not affected.
    expect((await request(app).post('/api/reviews').set(as('mallory')).send({})).status).toBe(400);
  });

  it('needs a traveller account (admins and anonymous callers are refused)', async () => {
    expect((await request(app).post('/api/reviews').send({})).status).toBe(401);
    expect((await request(app).post('/api/reviews').set('Authorization', `Bearer ${adminToken}`).send({})).status).toBe(403);
    expect((await request(app).get('/api/reviews/eligible')).status).toBe(401);
  });
});

describe('photos', () => {
  let id;
  beforeAll(async () => {
    id = (await Review.findOne({ user: users.ada._id, listingType: 'service' }))._id;
  });
  const png = (name) => [PNG, { filename: name, contentType: 'image/png' }];

  it('adds up to four photos to your own pending review', async () => {
    const res = await request(app).post(`/api/reviews/${id}/photos`).set(as('ada')).attach('photos', ...png('one.png')).attach('photos', ...png('two.png'));
    expect(res.status).toBe(200);
    expect(res.body.review.photos).toEqual(['https://res.cloudinary.test/reviews/one.png', 'https://res.cloudinary.test/reviews/two.png']);
    const tooMany = await request(app).post(`/api/reviews/${id}/photos`).set(as('ada')).attach('photos', ...png('3.png')).attach('photos', ...png('4.png')).attach('photos', ...png('5.png'));
    expect(tooMany.status).toBe(400);
    expect((await Review.findById(id)).photos).toHaveLength(2);
  });

  it('refuses other people’s reviews before taking any file', async () => {
    const res = await request(app).post(`/api/reviews/${id}/photos`).set(as('mallory')).attach('photos', ...png('x.png'));
    expect(res.status).toBe(404);
  });

  it('refuses non-images', async () => {
    const res = await request(app).post(`/api/reviews/${id}/photos`).set(as('ada')).attach('photos', Buffer.from('%PDF-1.4'), { filename: 'menu.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
  });

  it('leaves the review as it was when Cloudinary fails', async () => {
    const before = (await Review.findById(id)).toObject();
    const res = await request(app).post(`/api/reviews/${id}/photos`).set(as('ada')).attach('photos', ...png('cloudinary-401.png'));
    expect(res.status).toBe(502);
    const after = (await Review.findById(id)).toObject();
    expect(after.photos).toEqual(before.photos);
    expect(after.status).toBe('pending');
  });
});

describe('moderation, public reviews and ratings', () => {
  const pub = (type, listing, q = {}) => request(app).get('/api/reviews').query({ listingType: type, listingId: String(listing._id), ...q });

  it('shows nothing public until a review is approved', async () => {
    const res = await pub('stay', L.stay);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ data: [], total: 0, summary: { average: 0, count: 0 } });
    expect((await Hotel.findById(L.stay._id)).reviewStats.toObject()).toEqual({ average: 0, count: 0 });
  });

  it('approving publishes the review and updates the rating; hiding takes it out again', async () => {
    const stays = await Review.find({ listingType: 'stay', listingId: L.stay._id }).sort({ createdAt: 1 }); // Ada 4★, Gail 5★, Pat 5★
    expect(stays).toHaveLength(3);
    for (const r of stays) expect((await moderate(r._id, 'approved')).status).toBe(200);

    let res = await pub('stay', L.stay);
    expect(res.body.total).toBe(3);
    expect(res.body.summary).toEqual({ average: 4.7, count: 3 });
    expect((await Hotel.findById(L.stay._id)).reviewStats.toObject()).toEqual({ average: 4.7, count: 3 });

    // Approving again changes nothing (no double counting).
    await moderate(stays[0]._id, 'approved');
    expect((await Hotel.findById(L.stay._id)).reviewStats.toObject()).toEqual({ average: 4.7, count: 3 });

    const hidden = await moderate(stays[1]._id, 'hidden');
    expect(hidden.body.listingStats).toEqual({ average: 4.5, count: 2 });
    res = await pub('stay', L.stay);
    expect(res.body.data.map((r) => r._id)).not.toContain(String(stays[1]._id));
    expect((await Hotel.findById(L.stay._id)).reviewStats.toObject()).toEqual({ average: 4.5, count: 2 });

    await moderate(stays[2]._id, 'pending');
    expect((await Hotel.findById(L.stay._id)).reviewStats.toObject()).toEqual({ average: 4, count: 1 });
  });

  it('only ever shows public fields', async () => {
    const [r] = (await pub('stay', L.stay)).body.data;
    expect(Object.keys(r).sort()).toEqual(['_id', 'createdAt', 'displayName', 'listingId', 'listingType', 'photos', 'rating', 'reply', 'text', 'verified']);
  });

  it('pages a listing’s reviews and caps the page size', async () => {
    await Promise.all(
      Array.from({ length: 23 }, (_, i) =>
        Review.create({ listingType: 'tour', listingId: L.otherTour._id, booking: { type: 'legacy' }, displayName: `T${i}`, rating: 3, text: 'Imported review text', status: 'approved' })
      )
    );
    const first = await pub('tour', L.otherTour, { limit: 50 });
    expect(first.status).toBe(400); // more than 20 per page is refused
    const page = await pub('tour', L.otherTour, { limit: 20, page: 2 });
    expect(page.body).toMatchObject({ page: 2, totalPages: 2, total: 23 });
    expect(page.body.data).toHaveLength(3);
  });

  it('writes, edits and removes the team’s reply', async () => {
    const r = await Review.findOne({ listingType: 'stay', status: 'approved' });
    const put = (text) => request(app).put(`/api/reviews/admin/${r._id}/reply`).set('Authorization', `Bearer ${adminToken}`).send({ text });
    const first = await put('Asante sana, Ada!');
    expect(first.status).toBe(200);
    expect(first.body.review.reply).toMatchObject({ text: 'Asante sana, Ada!', by: 'admin@test.com' });
    const edited = await put('Asante sana, Ada — karibu tena!');
    expect(edited.body.review.reply.text).toBe('Asante sana, Ada — karibu tena!');
    expect(edited.body.review.reply.at).toBe(first.body.review.reply.at);
    expect(new Date(edited.body.review.reply.updatedAt) >= new Date(first.body.review.reply.updatedAt)).toBe(true);
    const shown = (await pub('stay', L.stay)).body.data.find((x) => x._id === String(r._id));
    expect(shown.reply.text).toBe('Asante sana, Ada — karibu tena!');
    expect((await put('')).body.review.reply).toBeUndefined();
    expect((await put('x'.repeat(1501))).status).toBe(400);
  });

  it('records who moderated and validates the action', async () => {
    const r = await Review.findOne({ status: 'pending' });
    const res = await request(app).put(`/api/reviews/admin/${r._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'hidden', note: 'Off topic' });
    expect(res.body.review.moderation).toMatchObject({ by: 'admin@test.com', note: 'Off topic' });
    expect((await request(app).put(`/api/reviews/admin/${r._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'deleted' })).status).toBe(400);
    expect((await request(app).put('/api/reviews/admin/64b000000000000000000001/status').set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' })).status).toBe(404);
  });

  it('gives the team a queue by status with counts, and the booking behind each review', async () => {
    const list = await request(app).get('/api/reviews/admin').query({ status: 'pending' }).set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.every((r) => r.status === 'pending')).toBe(true);
    expect(list.body.counts).toEqual({ pending: expect.any(Number), approved: expect.any(Number), hidden: expect.any(Number) });
    const one = list.body.data.find((r) => r.booking.type === 'tripRequest');
    const detail = await request(app).get(`/api/reviews/admin/${one._id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(detail.body.bookingDetails).toMatchObject({ type: 'tripRequest', reference: expect.stringMatching(/^EW-/), status: 'accepted' });
    expect(detail.body.user).toMatchObject({ email: expect.stringContaining('@test.com') });
  });

  it('keeps moderation for admins only', async () => {
    const r = await Review.findOne({});
    for (const [method, path] of [['get', '/api/reviews/admin'], ['get', `/api/reviews/admin/${r._id}`], ['put', `/api/reviews/admin/${r._id}/status`], ['put', `/api/reviews/admin/${r._id}/reply`]]) {
      expect((await request(app)[method](path).send({ status: 'approved', text: 'x' })).status).toBe(401);
      expect((await request(app)[method](path).set(as('ada')).send({ status: 'approved', text: 'x' })).status).toBe(403);
    }
    expect((await Review.findById(r._id)).status).toBe(r.status);
  });

  it('shows travellers their own reviews with their status', async () => {
    const res = await request(app).get('/api/reviews/mine').set(as('ada'));
    expect(res.body.data).toHaveLength(6);
    expect(res.body.data.every((r) => ['pending', 'approved', 'hidden'].includes(r.status))).toBe(true);
    expect((await request(app).get('/api/reviews/mine').set(as('mallory'))).body.data).toEqual([]);
  });
});

describe('ratings stored on listings', () => {
  it('ignore reviewStats sent with a listing create or update', async () => {
    const created = await Service.create({ name: 'Massage', description: 'x', pricingType: 'hourly', price: 1, reviewStats: { average: 5, count: 999 } });
    expect(created.reviewStats.toObject()).toEqual({ average: 0, count: 0 });
    await Hotel.findByIdAndUpdate(L.stay._id, { name: 'Turtle Bay', reviewStats: { average: 1, count: 1 } });
    await Hotel.updateOne({ _id: L.stay._id }, { $set: { 'reviewStats.count': 50 } });
    const stay = await Hotel.findById(L.stay._id);
    expect(stay.reviewStats.toObject()).toEqual({ average: 4, count: 1 });

    const res = await request(app).put(`/api/hotels/${L.stay._id}`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Turtle Bay', type: 'hotel', reviewStats: { average: 5, count: 100 } });
    expect(res.status).toBe(200);
    expect((await Hotel.findById(L.stay._id)).reviewStats.toObject()).toEqual({ average: 4, count: 1 });
  });

  it('are returned with the public listings (no extra request per card)', async () => {
    const res = await request(app).get('/api/hotels');
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    expect(list.find((h) => h._id === String(L.stay._id)).reviewStats).toEqual({ average: 4, count: 1 });
  });
});

describe('legacy reviews', () => {
  it('are untouched by the new API (the old routes are gone)', async () => {
    await LegacyReview.collection.insertOne({ accommodationId: L.stay._id, userName: 'Old', rating: 5, text: 'Legacy', createdAt: new Date() });
    const old = await request(app).get(`/api/reviews/${L.stay._id}`);
    expect([400, 404]).toContain(old.status);
    expect(await LegacyReview.countDocuments()).toBe(1);
    expect(config.cloudinary.enabled).toBe(true);
  });

  it('never send the old embedded stay reviews (unmoderated) in public responses', async () => {
    await Hotel.collection.updateOne({ _id: L.stay._id }, { $set: { reviews: [{ user: 'Old', rating: 1, text: 'Never moderated' }] } });
    const one = await request(app).get(`/api/hotels/${L.stay._id}`);
    expect(one.status).toBe(200);
    expect(one.body.reviews).toBeUndefined();
    const list = await request(app).get('/api/hotels');
    expect(JSON.stringify(list.body)).not.toContain('Never moderated');
    expect((await Hotel.collection.findOne({ _id: L.stay._id })).reviews).toHaveLength(1); // kept in the database
  });
});
