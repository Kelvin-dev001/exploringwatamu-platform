'use strict';

const mongoose = require('mongoose');
const { LISTING_TYPES, BOOKING_TYPES, REVIEW_STATUSES, TEXT_MAX, REPLY_MAX, PHOTOS_MAX } = require('../constants/reviews');

/*
 * A traveller's review of one listing, tied to the booking that proves they
 * went. Every listing type uses this one model (see constants/reviews.js).
 *
 * Visibility: only `approved` reviews are ever public or counted in a
 * listing's rating; `pending` waits for the team, `hidden` is kept but never
 * shown. Public responses go through Review.publicView, which leaves out the
 * user, booking and moderation fields.
 *
 * Collection "listingreviews": the old stay-only reviews stay untouched in
 * "reviews" (models/LegacyReview.js).
 */
const objectId = mongoose.Schema.Types.ObjectId;

const reviewSchema = new mongoose.Schema(
  {
    listingType: { type: String, enum: LISTING_TYPES, required: true },
    listingId: { type: objectId, required: true },
    // The listing's name when the review was written (the admin sees it even if
    // the listing is later renamed or removed).
    listingTitle: { type: String, trim: true, maxlength: 200 },

    booking: {
      type: { type: String, enum: BOOKING_TYPES, required: true },
      id: { type: objectId, default: null }, // TripRequest / GroupBooking _id
      reference: { type: String, trim: true, maxlength: 40 }, // "EW-ABC234" for trip requests
    },
    // Tied to a booking we checked (false for imported legacy reviews).
    verified: { type: Boolean, default: false },

    user: { type: objectId, ref: 'User', default: null },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: 'Rating must be a whole number from 1 to 5' },
    },
    text: { type: String, required: true, trim: true, maxlength: TEXT_MAX },
    photos: {
      type: [String],
      default: [],
      validate: { validator: (list) => list.length <= PHOTOS_MAX, message: `At most ${PHOTOS_MAX} photos` },
    },

    status: { type: String, enum: REVIEW_STATUSES, default: 'pending' },
    moderation: {
      by: { type: String, trim: true }, // admin email
      at: { type: Date },
      note: { type: String, trim: true, maxlength: 500 },
    },
    reply: {
      text: { type: String, trim: true, maxlength: REPLY_MAX },
      by: { type: String, trim: true },
      at: { type: Date }, // first written
      updatedAt: { type: Date },
    },

    // Where an imported review came from, so the migration never copies it twice.
    legacy: {
      source: { type: String, enum: ['reviews', 'hotel.reviews'] },
      id: { type: objectId },
    },
  },
  { timestamps: true, collection: 'listingreviews' }
);

// A listing's public reviews, newest first (and its rating, recomputed from these).
reviewSchema.index({ listingType: 1, listingId: 1, status: 1, createdAt: -1 });
// A traveller's own reviews.
reviewSchema.index({ user: 1, createdAt: -1 });
// The moderation queue by status, newest (or oldest) first.
reviewSchema.index({ status: 1, createdAt: -1 });
// A booking's reviews (eligibility, invitations). Separate from the unique
// index below: MongoDB won't use a partial index for these lookups.
reviewSchema.index({ 'booking.type': 1, 'booking.id': 1 });
// One review per listing per booking — enforced by the database, so two quick
// submissions can't both get in. Legacy reviews have no booking id.
reviewSchema.index(
  { 'booking.type': 1, 'booking.id': 1, listingType: 1, listingId: 1 },
  { unique: true, partialFilterExpression: { 'booking.id': { $type: 'objectId' } } }
);
// Each legacy review is imported at most once.
reviewSchema.index({ 'legacy.source': 1, 'legacy.id': 1 }, { unique: true, partialFilterExpression: { 'legacy.id': { $type: 'objectId' } } });

/** What the public may see: no user, booking or moderation details. */
reviewSchema.statics.publicView = function publicView(doc) {
  const r = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    _id: r._id,
    listingType: r.listingType,
    listingId: r.listingId,
    displayName: r.displayName,
    rating: r.rating,
    text: r.text,
    photos: r.photos || [],
    verified: Boolean(r.verified),
    reply: r.reply?.text ? { text: r.reply.text, at: r.reply.updatedAt || r.reply.at } : null,
    createdAt: r.createdAt,
  };
};

module.exports = mongoose.model('Review', reviewSchema);
