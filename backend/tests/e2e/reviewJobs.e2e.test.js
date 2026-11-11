'use strict';

// The two review jobs: copying legacy stay reviews into the new model, and the
// post-trip invitation run. The mailer is mocked: no email leaves the machine.

jest.mock('../../src/services/mailer', () => ({ sendMail: jest.fn(async () => ({})) }));

const mongoose = require('mongoose');
const { connect, disconnect } = require('./dbSetup');
const config = require('../../src/config/env');
const { sendMail } = require('../../src/services/mailer');
const { migrateLegacyReviews } = require('../../src/services/legacyReviewMigration');
const { runReviewInvites } = require('../../src/services/reviewInvites');
const { recompute, recomputeAll } = require('../../src/services/reviewStats');
const { verifyReviewInvite } = require('../../src/services/tokens');
const { listEligible } = require('../../src/services/reviewEligibility');
const migrateScript = require('../../scripts/migrateLegacyReviews');
const inviteScript = require('../../scripts/sendReviewInvites');
const Review = require('../../src/models/Review');
const LegacyReview = require('../../src/models/LegacyReview');
const ReviewInvite = require('../../src/models/ReviewInvite');
const Hotel = require('../../src/models/Hotel');
const Tour = require('../../src/models/Tour');
const User = require('../../src/models/User');
const TripRequest = require('../../src/models/TripRequest');
const GroupTrip = require('../../src/models/GroupTrip');
const GroupBooking = require('../../src/models/GroupBooking');

const DAY = 86400000;
const NOW = new Date('2027-03-01T08:00:00Z');
const day = (offset) => new Date(Date.UTC(2027, 2, 1 + offset));

beforeAll(async () => {
  await connect();
  await Promise.all([Review.init(), ReviewInvite.init()]);
});
afterAll(disconnect);

describe('legacy review migration', () => {
  let stay;
  let gone;
  let originals;

  beforeAll(async () => {
    stay = await Hotel.create({
      name: 'Turtle Bay',
      type: 'hotel',
      reviews: [
        { user: 'Wanjiru', rating: 5, text: 'Lovely staff and a quiet beach.', date: new Date('2024-05-02') },
        { user: '', rating: 4, text: 'Good value.', date: new Date('2024-06-10') },
        { user: 'Bad', rating: 9, text: 'Out of range rating' },
      ],
    });
    gone = new mongoose.Types.ObjectId(); // a stay that was deleted
    await LegacyReview.collection.insertMany([
      { accommodationId: stay._id, userId: new mongoose.Types.ObjectId(), userName: 'Jonas', rating: 3, text: 'Fine, a bit noisy.', createdAt: new Date('2025-01-15') },
      { accommodationId: gone, userName: 'Orphan', rating: 4, text: 'The place was nice.', createdAt: new Date('2025-02-01') },
      { accommodationId: stay._id, userName: 'Empty', rating: 5, text: '   ' },
      { userName: 'Nowhere', rating: 5, text: 'No stay recorded' },
    ]);
    originals = {
      legacy: await LegacyReview.collection.find({}).sort({ _id: 1 }).toArray(),
      embedded: (await Hotel.collection.findOne({ _id: stay._id })).reviews,
    };
  });

  it('reports what it would copy without writing anything (dry run)', async () => {
    const r = await migrateLegacyReviews({ dryRun: true });
    expect(r).toMatchObject({ imported: 4, alreadyImported: 0, stays: 2 });
    expect(r.invalid.map((i) => i.reason).sort()).toEqual(['empty text', 'no accommodationId', 'rating "9" is not 1–5']);
    expect(await Review.countDocuments()).toBe(0);
  });

  it('copies every usable review to the right stay, keeping author and date', async () => {
    const r = await migrateLegacyReviews();
    expect(r.imported).toBe(4);
    const copies = await Review.find({}).sort({ createdAt: 1 }).lean();
    expect(copies.map((c) => [c.displayName, c.rating, c.status, String(c.listingId) === String(stay._id)])).toEqual([
      ['Wanjiru', 5, 'pending', true],
      ['Guest', 4, 'pending', true],
      ['Jonas', 3, 'pending', true],
      ['Orphan', 4, 'hidden', false],
    ]);
    expect(copies[0].createdAt.toISOString()).toBe('2024-05-02T00:00:00.000Z');
    expect(copies.every((c) => c.listingType === 'stay' && c.verified === false && c.booking.type === 'legacy')).toBe(true);
    expect(copies[3]).toMatchObject({ listingTitle: '(stay no longer listed)', moderation: { by: 'migration' } });
  });

  it('never changes or deletes the originals', async () => {
    expect(await LegacyReview.collection.find({}).sort({ _id: 1 }).toArray()).toEqual(originals.legacy);
    expect((await Hotel.collection.findOne({ _id: stay._id })).reviews).toEqual(originals.embedded);
  });

  it('copies nothing twice when run again', async () => {
    const r = await migrateLegacyReviews();
    expect(r).toMatchObject({ imported: 0, alreadyImported: 4 });
    expect(await Review.countDocuments()).toBe(4);
  });

  it('counts copies in the rating only once approved', async () => {
    expect((await Hotel.findById(stay._id)).reviewStats.toObject()).toEqual({ average: 0, count: 0 });
    await Review.updateMany({ listingId: stay._id, status: 'pending' }, { $set: { status: 'approved' } });
    expect(await recompute('stay', stay._id)).toEqual({ average: 4, count: 3 });
    await recomputeAll();
    await recomputeAll();
    expect((await Hotel.findById(stay._id)).reviewStats.toObject()).toEqual({ average: 4, count: 3 });
  });

  it('refuses to write unless the database is named', () => {
    expect(migrateScript.refusal({ dryRun: false, confirmDb: undefined, dbName: 'prod' })).toMatch(/--confirm-db=prod/);
    expect(migrateScript.refusal({ dryRun: false, confirmDb: 'staging', dbName: 'prod' })).toMatch(/does not match/);
    expect(migrateScript.refusal({ dryRun: true, confirmDb: undefined, dbName: 'prod' })).toBeNull();
    expect(migrateScript.refusal({ dryRun: false, confirmDb: 'prod', dbName: 'prod' })).toBeNull();
  });
});

describe('post-trip review invitations', () => {
  const B = {};
  let tour;
  let ada;
  const mailOn = () => Object.assign(config.mail, { enabled: true });
  const mailOff = () => Object.assign(config.mail, { enabled: false });
  const invitesSent = () => sendMail.mock.calls.filter(([m]) => m.event === 'review_invite').map(([m]) => m);

  beforeAll(async () => {
    tour = await Tour.create({ name: 'Marine park snorkel', description: 'Reef', priceResidentAdult: 1, priceResidentChild: 1, priceForeignerAdult: 1, priceForeignerChild: 1 });
    ada = await User.create({ name: 'Ada Lovelace', email: 'ada@test.com' });
    const request = (overrides) =>
      TripRequest.create({
        contact: { name: 'Ada Lovelace', email: 'ada@test.com' },
        adults: 2,
        status: 'accepted',
        arrival: day(-6),
        departure: day(-3),
        days: [{ label: 'Day 1', date: day(-6), items: [{ kind: 'tour', refId: String(tour._id), title: 'Snorkel' }] }],
        ...overrides,
      });
    B.due = await request({ user: ada._id });
    B.guest = await request({ user: null, contact: { name: 'Gail Guest', email: 'gail@test.com' } });
    B.yesterday = await request({ arrival: day(-3), departure: day(0) }); // ended less than a day ago
    B.old = await request({ arrival: day(-90), departure: day(-80), days: [] });
    B.notAccepted = await request({ status: 'quoted' });
    B.nothingToReview = await request({ days: [{ label: 'Day 1', items: [{ kind: 'transfer', refId: 'airport-in', title: 'Airport pick-up' }] }] });
    B.reviewed = await request({ user: ada._id, contact: { name: 'Ada', email: 'ada+2@test.com' } });
    await Review.create({ listingType: 'tour', listingId: tour._id, booking: { type: 'tripRequest', id: B.reviewed._id }, user: ada._id, displayName: 'Ada L.', rating: 5, text: 'Already wrote this one, thanks.' });

    const trip = await GroupTrip.create({ title: 'Reef weekend', slug: 'reef-weekend', shortDescription: 's', startDate: day(-12), endDate: day(-10), maxParticipants: 9, fullPrice: 1, depositAmount: 1, status: 'closed' });
    B.group = await GroupBooking.create({ trip: trip._id, user: ada._id, fullName: 'Ada Lovelace', email: 'ada@test.com', phone: '1', paymentType: 'full', amountPaid: 1, status: 'confirmed' });
    B.groupPending = await GroupBooking.create({ trip: trip._id, user: ada._id, fullName: 'Ada', email: 'ada@test.com', phone: '1', paymentType: 'full', amountPaid: 1, status: 'pending' });
  });
  beforeEach(() => sendMail.mockClear());
  afterEach(mailOff);

  it('finds the finished trips in the window that still have something to review (dry run writes nothing)', async () => {
    const lines = [];
    const s = await runReviewInvites({ now: NOW, log: (l) => lines.push(l) });
    expect(s).toMatchObject({ dryRun: true, due: 3, sent: 0 });
    expect(s.skipped.map((k) => k.reason).sort()).toEqual(['no reviewable listings', 'nothing left to review']);
    expect(lines.join('\n')).not.toMatch(/ada@test\.com/); // emails are masked in the output
    expect(await ReviewInvite.countDocuments()).toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends and records nothing while email is off', async () => {
    const s = await runReviewInvites({ send: true, now: NOW });
    expect(s).toMatchObject({ mailEnabled: false, sent: 0 });
    expect(await ReviewInvite.countDocuments()).toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('invites each finished booking once, with a link to its review page', async () => {
    mailOn();
    const before = await TripRequest.findById(B.due._id).lean();
    const s = await runReviewInvites({ send: true, now: NOW });
    expect(s).toMatchObject({ sent: 3, failed: 0 });
    const mails = invitesSent();
    expect(mails.map((m) => m.to).sort()).toEqual(['ada@test.com', 'ada@test.com', 'gail@test.com']);
    expect(mails[0].subject).toBe('How was your Watamu trip?');

    const guestMail = mails.find((m) => m.to === 'gail@test.com');
    const href = guestMail.html.match(/href="([^"]+)"/)[1].replace(/&amp;/g, '&');
    const url = new URL(href);
    expect(url.pathname).toBe(`/review/tripRequest/${B.guest._id}`);
    expect(verifyReviewInvite(url.searchParams.get('t'))).toEqual({ bookingType: 'tripRequest', bookingId: String(B.guest._id), email: 'gail@test.com' });
    // The invitation opens the guest's request for whichever account they sign in with.
    const someone = await User.create({ name: 'Gail', email: 'gail.other@test.com' });
    const items = await listEligible(someone, { bookingType: 'tripRequest', bookingId: String(B.guest._id), inviteToken: url.searchParams.get('t') }, NOW);
    expect(items).toEqual([expect.objectContaining({ listingType: 'tour', canReview: true })]);

    // Bookings and trip requests are only read.
    expect(await TripRequest.findById(B.due._id).lean()).toEqual(before);
    expect(await ReviewInvite.countDocuments({ status: 'sent' })).toBe(3);
  });

  it('never invites the same booking twice', async () => {
    mailOn();
    const s = await runReviewInvites({ send: true, now: NOW });
    expect(s.sent).toBe(0);
    expect(s.skipped.filter((k) => k.reason === 'already invited')).toHaveLength(3);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('records a failed email, retries it on the next runs, then gives up', async () => {
    mailOn();
    const late = await TripRequest.create({ contact: { name: 'Lee', email: 'lee@test.com' }, adults: 1, status: 'accepted', arrival: day(-4), departure: day(-2), days: [{ label: 'Day 1', date: day(-4), items: [{ kind: 'tour', refId: String(tour._id), title: 'Snorkel' }] }] });
    sendMail.mockRejectedValue(new Error('SMTP 451 try later'));
    for (let run = 1; run <= 3; run += 1) {
      const s = await runReviewInvites({ send: true, now: NOW });
      expect([run, s.failed]).toEqual([run, 1]);
    }
    expect(await ReviewInvite.findOne({ bookingId: late._id }).lean()).toMatchObject({ status: 'failed', attempts: 3, lastError: 'SMTP 451 try later' });
    const fourth = await runReviewInvites({ send: true, now: NOW });
    expect(fourth.failed).toBe(0);
    expect(fourth.skipped.find((k) => k.label === late.reference).reason).toMatch(/gave up after 3/);
    expect(await TripRequest.findById(late._id).lean()).toMatchObject({ status: 'accepted' });
    sendMail.mockReset();
    sendMail.mockImplementation(async () => ({}));
  });

  it('sends one invitation per booking even when two runs overlap', async () => {
    mailOn();
    const fresh = await TripRequest.create({ contact: { name: 'Max', email: 'max@test.com' }, adults: 1, status: 'accepted', arrival: day(-5), departure: day(-2), days: [{ label: 'Day 1', date: day(-5), items: [{ kind: 'tour', refId: String(tour._id), title: 'Snorkel' }] }] });
    const [a, b] = await Promise.all([runReviewInvites({ send: true, now: NOW }), runReviewInvites({ send: true, now: NOW })]);
    expect(a.sent + b.sent).toBe(1);
    expect(invitesSent().filter((m) => m.to === 'max@test.com')).toHaveLength(1);
    expect(await ReviewInvite.countDocuments({ bookingId: fresh._id })).toBe(1);
  });

  it('refuses to send outside production (the script)', () => {
    expect(inviteScript.refusal({ send: true, nodeEnv: 'development' })).toMatch(/Refusing to --send/);
    expect(inviteScript.refusal({ send: true, nodeEnv: 'production', now: '2027-01-01' })).toMatch(/dry runs only/);
    expect(inviteScript.refusal({ send: false, nodeEnv: 'development' })).toBeNull();
    expect(inviteScript.refusal({ send: true, nodeEnv: 'production' })).toBeNull();
  });

  it('keeps to its window: nothing is due long after the trip', async () => {
    const later = new Date(NOW.getTime() + 120 * DAY);
    const s = await runReviewInvites({ now: later });
    expect(s.due).toBe(0);
  });
});
