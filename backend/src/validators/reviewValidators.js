'use strict';

const { z } = require('zod');
const { LISTING_TYPES, SUBMITTABLE_BOOKING_TYPES, REVIEW_STATUSES, TEXT_MIN, TEXT_MAX, REPLY_MAX, PAGE_MAX } = require('../constants/reviews');

const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const page = z.coerce.number().int().min(1).max(1000).default(1);
const inviteToken = z.string().trim().max(2000).optional();

/** POST /api/reviews — eligibility is checked separately, on the server. */
const submitReviewSchema = z.object({
  listingType: z.enum(LISTING_TYPES),
  listingId: objectId,
  bookingType: z.enum(SUBMITTABLE_BOOKING_TYPES),
  bookingId: objectId,
  rating: z.coerce.number().int('Pick 1 to 5 stars').min(1, 'Pick 1 to 5 stars').max(5, 'Pick 1 to 5 stars'),
  text: z
    .string()
    .trim()
    .min(TEXT_MIN, `Tell us a little more (at least ${TEXT_MIN} characters)`)
    .max(TEXT_MAX, `Keep it under ${TEXT_MAX} characters`),
  inviteToken,
});

/** GET /api/reviews?listingType=&listingId= — a listing's approved reviews. */
const listReviewsQuery = z.object({
  listingType: z.enum(LISTING_TYPES),
  listingId: objectId,
  page,
  limit: z.coerce.number().int().min(1).max(PAGE_MAX).default(5),
});

/** GET /api/reviews/eligible — all, or one booking (the review page). */
const eligibleQuery = z
  .object({
    bookingType: z.enum(SUBMITTABLE_BOOKING_TYPES).optional(),
    bookingId: objectId.optional(),
    t: inviteToken,
  })
  .refine((q) => Boolean(q.bookingType) === Boolean(q.bookingId), { message: 'bookingType and bookingId go together', path: ['bookingId'] });

/** GET /api/reviews/admin */
const adminListQuery = z.object({
  status: z.enum(REVIEW_STATUSES).optional(),
  listingType: z.enum(LISTING_TYPES).optional(),
  q: z.string().trim().max(80).optional(),
  page,
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const moderateSchema = z.object({
  status: z.enum(REVIEW_STATUSES),
  note: z.string().trim().max(500).optional(),
});

// An empty reply removes it.
const replySchema = z.object({ text: z.string().trim().max(REPLY_MAX, `Keep replies under ${REPLY_MAX} characters`) });

module.exports = { submitReviewSchema, listReviewsQuery, eligibleQuery, adminListQuery, moderateSchema, replySchema };
