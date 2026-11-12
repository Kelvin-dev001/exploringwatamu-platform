'use strict';

const TripRequest = require('../models/TripRequest');
const GroupBooking = require('../models/GroupBooking');
const GroupTrip = require('../models/GroupTrip');
const Review = require('../models/Review');
const User = require('../models/User');
const { LISTINGS, LISTING_TYPES } = require('../constants/reviews');
const { listingModel } = require('./reviewStats');
const { verifyReviewInvite } = require('./tokens');
const { ownsEmail } = require('./emailVerification');

/*
 * Who may review what. Checked on the server for every review, whatever the
 * website shows.
 *
 * A review needs a booking that proves the trip happened:
 *   tripRequest   status "accepted" (the traveller said yes to our quote); every
 *                 listing in the accepted itinerary can be reviewed once
 *   groupBooking  status "confirmed"; the group trip itself can be reviewed
 * The older direct bookings (tour/service/car hire/viewing bookings) store
 * only a typed name and contact, not an account, so they can't prove who went
 * and are not used.
 *
 * Whose booking it is:
 *   - the account that made it (TripRequest.user / GroupBooking.user);
 *   - for a request sent as a guest (no account): a Google account with the
 *     same email (Google has verified it), or anyone holding the review
 *     invitation emailed to that address (it proves they read that inbox).
 *     A password account with the same email is NOT enough — sign-up doesn't
 *     prove the address (SECURITY-REVIEW.md S6).
 *
 * When it has taken place (a calendar day is over at the following midnight):
 *   group trip    the group trip's end date
 *   stay          the trip's departure (check-out)
 *   anything else the day it was planned on, else the trip's departure
 * No usable date means we can't tell the trip has ended: not reviewable.
 */

const DAY = 86400000;
const isObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v ?? ''));
const dayOver = (date) => (date ? new Date(new Date(date).getTime() + DAY) : null);

class EligibilityError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'EligibilityError';
    this.status = status;
    this.code = code;
  }
}

const NOT_FOUND = () => new EligibilityError(404, 'We couldn’t find that booking on your account.', 'BOOKING_NOT_FOUND');

/* ---------- Listings in a booking ---------- */

// Fields needed to name a listing (and to date a group trip).
const SELECT = { tour: 'name', group: 'title endDate', stay: 'name', transfer: 'route', carhire: 'vehicle', service: 'name' };

/** Map "type:id" -> listing document, for the listings that still exist. */
async function loadListings(wanted) {
  const found = new Map();
  for (const type of LISTING_TYPES) {
    const ids = [...new Set(wanted.filter((w) => w.listingType === type).map((w) => String(w.listingId)))];
    if (!ids.length) continue;
    let query = listingModel(type).find({ _id: { $in: ids } }).select(SELECT[type]);
    if (type === 'carhire') query = query.populate('vehicle', 'name');
    for (const doc of await query.lean()) found.set(`${type}:${doc._id}`, doc);
  }
  return found;
}

function itemEnd(listingType, dayDate, request, listing) {
  if (listingType === 'group') return listing.endDate || null;
  if (listingType === 'stay') return request.departure || request.arrival || null;
  return dayDate || request.departure || request.arrival || null;
}

/** Every reviewable listing in an accepted trip request, once each. */
async function tripRequestItems(request) {
  const placed = [
    ...(request.days || []).flatMap((d) => (d.items || []).map((it) => ({ it, dayDate: d.date || null }))),
    ...(request.ideas || []).map((it) => ({ it, dayDate: null })),
  ];
  const seen = new Set();
  const wanted = [];
  for (const { it, dayDate } of placed) {
    if (!LISTING_TYPES.includes(it.kind) || !isObjectId(it.refId)) continue; // airport pick-ups, "other"
    const key = `${it.kind}:${it.refId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    wanted.push({ listingType: it.kind, listingId: String(it.refId), plannedTitle: it.title, dayDate });
  }
  const listings = await loadListings(wanted);
  return wanted
    .filter((w) => listings.has(`${w.listingType}:${w.listingId}`))
    .map((w) => {
      const listing = listings.get(`${w.listingType}:${w.listingId}`);
      return {
        listingType: w.listingType,
        listingId: w.listingId,
        listingTitle: LISTINGS[w.listingType].title(listing) || w.plannedTitle,
        endsAt: dayOver(itemEnd(w.listingType, w.dayDate, request, listing)),
      };
    });
}

async function groupBookingItems(booking) {
  const trip = await GroupTrip.findById(booking.trip).select('title endDate').lean();
  return trip ? [{ listingType: 'group', listingId: String(trip._id), listingTitle: trip.title, endsAt: dayOver(trip.endDate) }] : [];
}

/* ---------- Ownership ---------- */

async function accountOf(user) {
  return User.findById(user._id).select('email googleId emailVerifiedAt').lean();
}

function ownsTripRequest(account, request, invite) {
  if (request.user) return String(request.user) === String(account._id);
  const email = String(request.contact?.email || '').toLowerCase();
  // A guest request is theirs when the account has shown it owns the address (S6).
  if (ownsEmail(account) && String(account.email).toLowerCase() === email) return true;
  return Boolean(invite && invite.bookingType === 'tripRequest' && invite.bookingId === String(request._id) && invite.email === email);
}

/** The booking, if it is this traveller's and in a reviewable state; throws otherwise. */
async function loadBooking(user, bookingType, bookingId, inviteToken) {
  if (!isObjectId(bookingId)) throw NOT_FOUND();
  if (bookingType === 'tripRequest') {
    const request = await TripRequest.findById(bookingId).lean();
    if (!request) throw NOT_FOUND();
    const account = await accountOf(user);
    if (!account || !ownsTripRequest(account, request, verifyReviewInvite(inviteToken))) throw NOT_FOUND();
    if (request.status !== 'accepted') {
      throw new EligibilityError(403, 'Reviews open once you’ve accepted your quote and the trip has taken place.', 'NOT_ACCEPTED');
    }
    return { bookingType, bookingId: String(request._id), reference: request.reference, items: await tripRequestItems(request) };
  }
  if (bookingType === 'groupBooking') {
    const booking = await GroupBooking.findById(bookingId).lean();
    if (!booking || String(booking.user) !== String(user._id)) throw NOT_FOUND();
    if (booking.status !== 'confirmed') throw new EligibilityError(403, 'Reviews open once your place is confirmed and the trip has taken place.', 'NOT_CONFIRMED');
    return { bookingType, bookingId: String(booking._id), reference: null, items: await groupBookingItems(booking) };
  }
  throw new EligibilityError(400, 'Reviews need an accepted trip request or a confirmed group-trip booking.', 'BOOKING_TYPE');
}

/* ---------- What the traveller can review ---------- */

function describe(booking, item, review, now) {
  const base = {
    listingType: item.listingType,
    listingId: item.listingId,
    listingTitle: item.listingTitle,
    booking: { type: booking.bookingType, id: booking.bookingId, reference: booking.reference },
    availableFrom: item.endsAt,
    review: review ? { _id: review._id, status: review.status, rating: review.rating } : null,
  };
  if (review) return { ...base, canReview: false, reason: 'reviewed' };
  if (!item.endsAt) return { ...base, canReview: false, reason: 'no-dates' };
  if (item.endsAt > now) return { ...base, canReview: false, reason: 'not-ended' };
  return { ...base, canReview: true, reason: null };
}

async function describeAll(bookings, now) {
  const keys = bookings.map((b) => ({ 'booking.type': b.bookingType, 'booking.id': b.bookingId }));
  const reviews = keys.length ? await Review.find({ $or: keys }).select('booking listingType listingId status rating').lean() : [];
  const byKey = new Map(reviews.map((r) => [`${r.booking.type}:${r.booking.id}:${r.listingType}:${r.listingId}`, r]));
  return bookings.flatMap((b) => b.items.map((item) => describe(b, item, byKey.get(`${b.bookingType}:${b.bookingId}:${item.listingType}:${item.listingId}`), now)));
}

/**
 * Reviewable listings: one booking's (the review page, maybe opened from an
 * invitation), or all the traveller's accepted trips and confirmed group trips.
 */
async function listEligible(user, { bookingType, bookingId, inviteToken } = {}, now = new Date()) {
  if (bookingType || bookingId) return describeAll([await loadBooking(user, bookingType, bookingId, inviteToken)], now);

  const account = await accountOf(user);
  if (!account) throw NOT_FOUND();
  const guestByEmail = ownsEmail(account) ? [{ user: null, 'contact.email': String(account.email).toLowerCase() }] : [];
  const [requests, groupBookings] = await Promise.all([
    TripRequest.find({ status: 'accepted', $or: [{ user: account._id }, ...guestByEmail] }).sort({ createdAt: -1 }).limit(50).lean(),
    GroupBooking.find({ user: account._id, status: 'confirmed' }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  const bookings = [
    ...(await Promise.all(requests.map(async (r) => ({ bookingType: 'tripRequest', bookingId: String(r._id), reference: r.reference, items: await tripRequestItems(r) })))),
    ...(await Promise.all(groupBookings.map(async (b) => ({ bookingType: 'groupBooking', bookingId: String(b._id), reference: null, items: await groupBookingItems(b) })))),
  ];
  return describeAll(bookings, now);
}

/** The booking item a new review is for — or an EligibilityError saying why not. */
async function checkEligibility(user, { listingType, listingId, bookingType, bookingId, inviteToken }, now = new Date()) {
  const booking = await loadBooking(user, bookingType, bookingId, inviteToken);
  const item = booking.items.find((i) => i.listingType === listingType && i.listingId === String(listingId));
  if (!item) throw new EligibilityError(403, 'That isn’t part of this booking.', 'NOT_IN_BOOKING');
  const [described] = await describeAll([{ ...booking, items: [item] }], now);
  if (described.reason === 'reviewed') throw new EligibilityError(409, 'You’ve already reviewed this for this trip.', 'ALREADY_REVIEWED');
  if (described.reason === 'no-dates') throw new EligibilityError(403, 'This trip has no dates, so we can’t tell it has ended yet. Ask our team.', 'NO_DATES');
  if (described.reason === 'not-ended') {
    throw new EligibilityError(403, `You can review this once it has taken place (from ${item.endsAt.toISOString().slice(0, 10)}).`, 'NOT_ENDED');
  }
  return { booking, item };
}

module.exports = { listEligible, checkEligibility, tripRequestItems, groupBookingItems, EligibilityError, dayOver };
