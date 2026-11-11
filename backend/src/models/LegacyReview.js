'use strict';

const mongoose = require('mongoose');

/*
 * The original stay-only reviews (collection "reviews"), kept exactly as they
 * were: nothing in the API reads or writes them any more. They are copied into
 * the new Review model by scripts/migrateLegacyReviews.js, which never changes
 * or deletes them. The other legacy source is Hotel.reviews (embedded).
 */
const legacyReviewSchema = new mongoose.Schema(
  {
    accommodationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    rating: Number,
    text: String,
    createdAt: Date,
  },
  { strict: false, autoIndex: false }
);

module.exports = mongoose.model('LegacyReview', legacyReviewSchema, 'reviews');
