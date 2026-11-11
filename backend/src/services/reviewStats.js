'use strict';

const mongoose = require('mongoose');
const Review = require('../models/Review');
const { LISTING_TYPES } = require('../constants/reviews');
const { ALLOW_OPTION } = require('../models/plugins/reviewStats');

// Required here, not looked up by name: scripts (e.g. reviews:recompute) may
// not have loaded every model.
const MODELS = {
  tour: require('../models/Tour'),
  group: require('../models/GroupTrip'),
  stay: require('../models/Hotel'),
  transfer: require('../models/Transfer'),
  carhire: require('../models/CarHire'),
  service: require('../models/Service'),
};

/*
 * A listing's public rating: { average, count } over its APPROVED reviews.
 *
 * Stored on the listing (fast cards, no N+1) and always recomputed from the
 * reviews themselves — after a review is submitted, approved, hidden, edited or
 * imported — rather than adjusted with +1/-1. Recomputing is idempotent: running
 * it twice, or after a crash half-way, gives the same answer, so a review can't
 * be counted twice and the numbers can't drift.
 */

const listingModel = (type) => MODELS[type];

/** { average, count } from the approved reviews of one listing (average to 1 decimal). */
async function statsFor(listingType, listingId) {
  const [row] = await Review.aggregate([
    { $match: { listingType, listingId: new mongoose.Types.ObjectId(String(listingId)), status: 'approved' } },
    { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } },
  ]);
  return row ? { average: Math.round(row.average * 10) / 10, count: row.count } : { average: 0, count: 0 };
}

/** Recompute and store one listing's rating. Missing listings are ignored. */
async function recompute(listingType, listingId) {
  const stats = await statsFor(listingType, listingId);
  await listingModel(listingType).updateOne({ _id: listingId }, { $set: { reviewStats: stats } }, { [ALLOW_OPTION]: true });
  return stats;
}

/** Recompute every listing of every type (repair / after a migration). */
async function recomputeAll() {
  let listings = 0;
  for (const type of LISTING_TYPES) {
    const ids = await listingModel(type).distinct('_id');
    for (const id of ids) {
      await recompute(type, id);
      listings += 1;
    }
  }
  return { listings };
}

module.exports = { statsFor, recompute, recomputeAll, listingModel };
