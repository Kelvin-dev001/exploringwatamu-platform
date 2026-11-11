'use strict';

const mongoose = require('mongoose');
const Review = require('../models/Review');
const TripRequest = require('../models/TripRequest');
const GroupBooking = require('../models/GroupBooking');
const { checkEligibility, listEligible, EligibilityError } = require('../services/reviewEligibility');
const reviewStats = require('../services/reviewStats');
const { notifyReviewSubmitted } = require('../services/reviewNotifications');
const { contains, pageParams, pageOf } = require('../services/listQuery');
const { PHOTOS_MAX, REVIEW_STATUSES } = require('../constants/reviews');
const logger = require('../services/logger');

// Eligibility refusals carry their own status and message.
function handle(err, res, next) {
  if (err instanceof EligibilityError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err && err.code === 11000) return res.status(409).json({ error: 'You’ve already reviewed this for this trip.', code: 'ALREADY_REVIEWED' });
  return next(err);
}

// "Amina Hassan" -> "Amina H." — enough to be real, not enough to find them.
function displayNameOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Traveller';
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

function sendAsync(promiseFactory, label) {
  Promise.resolve()
    .then(promiseFactory)
    .catch((err) => logger.error('review notification failed', { step: label, ...logger.errorFields(err) }));
}

// Recompute after any change that can move a listing's public rating.
const refreshStats = (review) => reviewStats.recompute(review.listingType, review.listingId);

/* ---------- Public ---------- */

// GET /api/reviews?listingType=&listingId=&page=&limit=  — approved only.
exports.listForListing = async (req, res, next) => {
  try {
    const { listingType, listingId } = req.query;
    const paging = pageParams(req.query, { defaultLimit: 5, maxLimit: 20 });
    const filter = { listingType, listingId, status: 'approved' };
    const [data, total, summary] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean(),
      Review.countDocuments(filter),
      reviewStats.statsFor(listingType, listingId),
    ]);
    res.json({ ...pageOf(data.map(Review.publicView), total, paging), summary });
  } catch (err) {
    next(err);
  }
};

/* ---------- Traveller ---------- */

// GET /api/reviews/eligible[?bookingType=&bookingId=&t=]
exports.eligible = async (req, res, next) => {
  try {
    const { bookingType, bookingId, t } = req.query;
    res.json({ data: await listEligible(req.user, { bookingType, bookingId, inviteToken: t }) });
  } catch (err) {
    handle(err, res, next);
  }
};

// GET /api/reviews/mine
exports.mine = async (req, res, next) => {
  try {
    const list = await Review.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ data: list.map((r) => ({ ...Review.publicView(r), listingTitle: r.listingTitle, status: r.status, booking: { type: r.booking.type, reference: r.booking.reference } })) });
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews — always starts "pending": nothing is public until approved.
exports.submit = async (req, res, next) => {
  try {
    const { listingType, listingId, bookingType, bookingId, rating, text, inviteToken } = req.body;
    const { booking, item } = await checkEligibility(req.user, { listingType, listingId, bookingType, bookingId, inviteToken });
    const review = await Review.create({
      listingType,
      listingId,
      listingTitle: item.listingTitle,
      booking: { type: bookingType, id: booking.bookingId, reference: booking.reference || undefined },
      verified: true,
      user: req.user._id,
      displayName: displayNameOf(req.user.name),
      rating,
      text,
      status: 'pending',
    });
    sendAsync(() => notifyReviewSubmitted(review), 'review-submitted');
    res.status(201).json({ review: { ...Review.publicView(review), status: review.status, listingTitle: review.listingTitle } });
  } catch (err) {
    handle(err, res, next);
  }
};

// Loads the caller's own pending review before any file is accepted, so an
// upload can never be attached to someone else's (or a published) review.
exports.loadOwnPendingReview = async (req, res, next) => {
  try {
    const review = mongoose.isValidObjectId(req.params.id) ? await Review.findById(req.params.id) : null;
    if (!review || String(review.user) !== String(req.user._id)) return res.status(404).json({ error: 'Review not found.' });
    if (review.status !== 'pending') return res.status(409).json({ error: 'Photos can only be added while your review is waiting to be checked.' });
    if (review.photos.length >= PHOTOS_MAX) return res.status(400).json({ error: `A review can have at most ${PHOTOS_MAX} photos.` });
    req.review = review;
    next();
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews/:id/photos (multipart "photos"). The review is already
// complete without photos: a failed upload (answered by middleware/upload)
// leaves it exactly as it was.
exports.addPhotos = async (req, res, next) => {
  try {
    const urls = (req.files || []).map((f) => f.path).filter(Boolean);
    if (!urls.length) return res.status(400).json({ error: 'Choose at least one photo.' });
    if (req.review.photos.length + urls.length > PHOTOS_MAX) {
      return res.status(400).json({ error: `A review can have at most ${PHOTOS_MAX} photos (it has ${req.review.photos.length}).` });
    }
    const updated = await Review.findOneAndUpdate(
      { _id: req.review._id, status: 'pending', [`photos.${PHOTOS_MAX - urls.length}`]: { $exists: false } },
      { $push: { photos: { $each: urls } } },
      { new: true }
    );
    if (!updated) return res.status(409).json({ error: 'This review changed while uploading. Please try again.' });
    res.json({ review: { ...Review.publicView(updated), status: updated.status } });
  } catch (err) {
    next(err);
  }
};

/* ---------- Admin moderation ---------- */

// GET /api/reviews/admin?status=&listingType=&q=&page=&limit=
exports.adminList = async (req, res, next) => {
  try {
    const { status, listingType, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (listingType) filter.listingType = listingType;
    const match = contains(q);
    if (match) filter.$or = [{ listingTitle: match }, { displayName: match }, { text: match }, { 'booking.reference': match }];
    const paging = pageParams(req.query, { defaultLimit: 20, maxLimit: 100 });
    const [data, total, counts] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).populate('user', 'name email').lean(),
      Review.countDocuments(filter),
      Review.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    ]);
    res.json({ ...pageOf(data, total, paging), counts: Object.fromEntries(REVIEW_STATUSES.map((s) => [s, counts.find((c) => c._id === s)?.n || 0])) });
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/admin/:id — with the booking it came from.
exports.adminGet = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate('user', 'name email').lean();
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    let booking = null;
    if (review.booking.type === 'tripRequest' && review.booking.id) {
      const r = await TripRequest.findById(review.booking.id).select('reference status arrival departure contact.name contact.email').lean();
      if (r) booking = { type: 'tripRequest', id: r._id, reference: r.reference, status: r.status, arrival: r.arrival, departure: r.departure, contact: r.contact };
    } else if (review.booking.type === 'groupBooking' && review.booking.id) {
      const b = await GroupBooking.findById(review.booking.id).select('status fullName email trip').populate('trip', 'title startDate endDate').lean();
      if (b) booking = { type: 'groupBooking', id: b._id, status: b.status, contact: { name: b.fullName, email: b.email }, trip: b.trip };
    }
    res.json({ ...review, bookingDetails: booking });
  } catch (err) {
    next(err);
  }
};

// PUT /api/reviews/admin/:id/status { status, note }
exports.moderate = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    review.status = req.body.status;
    review.moderation = { by: req.admin.email, at: new Date(), note: req.body.note || undefined };
    await review.save();
    const stats = await refreshStats(review);
    res.json({ review: review.toObject(), listingStats: stats });
  } catch (err) {
    next(err);
  }
};

// PUT /api/reviews/admin/:id/reply { text } — empty text removes the reply.
exports.reply = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    const text = req.body.text;
    if (!text) {
      review.reply = undefined;
    } else {
      const now = new Date();
      review.reply = { text, by: req.admin.email, at: review.reply?.at || now, updatedAt: now };
    }
    await review.save();
    res.json({ review: review.toObject() });
  } catch (err) {
    next(err);
  }
};

exports.displayNameOf = displayNameOf;
