'use strict';

const Review = require('../models/Review');
const LegacyReview = require('../models/LegacyReview');
const Hotel = require('../models/Hotel');
const reviewStats = require('./reviewStats');
const { TEXT_MAX } = require('../constants/reviews');

/*
 * Copies the old stay-only reviews into the generic Review model
 * (scripts/migrateLegacyReviews.js). Sources:
 *   - the "reviews" collection (LegacyReview: accommodationId, userId, userName…)
 *   - reviews embedded in Hotel documents (Hotel.reviews: user, rating, text, date)
 *
 * Never changes or deletes the originals. Each copy remembers where it came
 * from (legacy.source + legacy.id, unique), so running it again copies nothing
 * twice. Copies keep their stay, author and date, are marked unverified (no
 * booking behind them), and arrive as "pending": the old reviews were never
 * moderated and the website never showed them, so the team decides in the
 * moderation queue. Reviews of stays that no longer exist arrive "hidden".
 */

const clampRating = (n) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) && v >= 1 && v <= 5 ? v : null;
};

function toReview({ source, id, hotelId, hotel, userId, name, rating, text, date }) {
  const r = clampRating(rating);
  const body = String(text ?? '').trim();
  if (!r) return { skip: `rating "${rating}" is not 1–5` };
  if (!body) return { skip: 'empty text' };
  const when = date ? new Date(date) : new Date();
  return {
    doc: {
      listingType: 'stay',
      listingId: hotelId,
      listingTitle: hotel ? hotel.name : '(stay no longer listed)',
      booking: { type: 'legacy', id: null },
      verified: false,
      user: userId || null,
      displayName: String(name || '').trim().slice(0, 60) || 'Guest',
      rating: r,
      text: body.slice(0, TEXT_MAX),
      status: hotel ? 'pending' : 'hidden',
      moderation: hotel ? undefined : { by: 'migration', at: new Date(), note: 'Imported: the stay no longer exists' },
      legacy: { source, id },
      createdAt: Number.isNaN(when.getTime()) ? new Date() : when,
      updatedAt: new Date(),
    },
  };
}

/**
 * Returns { imported, alreadyImported, invalid: [{ source, id, reason }], stays }.
 * dryRun: report only.
 */
async function migrateLegacyReviews({ dryRun = false, log = () => {} } = {}) {
  const result = { imported: 0, alreadyImported: 0, invalid: [], stays: 0 };
  const hotels = new Map((await Hotel.find({}).select('name reviews').lean()).map((h) => [String(h._id), h]));

  const candidates = [];
  for (const old of await LegacyReview.find({}).lean()) {
    const hotel = old.accommodationId ? hotels.get(String(old.accommodationId)) : null;
    if (!old.accommodationId) {
      result.invalid.push({ source: 'reviews', id: String(old._id), reason: 'no accommodationId' });
      continue;
    }
    candidates.push({ source: 'reviews', id: old._id, hotelId: old.accommodationId, hotel, userId: old.userId, name: old.userName, rating: old.rating, text: old.text, date: old.createdAt });
  }
  for (const hotel of hotels.values()) {
    for (const sub of hotel.reviews || []) {
      candidates.push({ source: 'hotel.reviews', id: sub._id, hotelId: hotel._id, hotel, userId: null, name: sub.user, rating: sub.rating, text: sub.text, date: sub.date });
    }
  }

  const touched = new Set();
  for (const c of candidates) {
    if (await Review.exists({ 'legacy.source': c.source, 'legacy.id': c.id })) {
      result.alreadyImported += 1;
      continue;
    }
    const { doc, skip } = toReview(c);
    if (skip) {
      result.invalid.push({ source: c.source, id: String(c.id), reason: skip });
      log(`skipped ${c.source} ${c.id}: ${skip}`);
      continue;
    }
    if (!dryRun) {
      try {
        await new Review(doc).save({ timestamps: false }); // keep the original date
      } catch (err) {
        if (err?.code === 11000) {
          result.alreadyImported += 1; // imported by a concurrent run
          continue;
        }
        throw err;
      }
    }
    result.imported += 1;
    touched.add(String(c.hotelId));
    log(`${dryRun ? 'would import' : 'imported'} ${c.source} ${c.id} → ${doc.listingTitle} (${doc.status})`);
  }

  if (!dryRun) for (const id of touched) await reviewStats.recompute('stay', id);
  result.stays = touched.size;
  return result;
}

module.exports = { migrateLegacyReviews, toReview };
