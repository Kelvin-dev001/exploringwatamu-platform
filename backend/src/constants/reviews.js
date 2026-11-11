'use strict';

/*
 * Reviews: what can be reviewed, what proves the trip happened, and the
 * moderation states. Listing types match the trip planner's item kinds
 * (constants/tripItems.js) so an accepted itinerary maps straight onto them.
 */

// listingType -> the Mongoose model holding that listing, and how to name it.
const LISTINGS = {
  tour: { model: 'Tour', label: 'Experience', title: (doc) => doc.name },
  group: { model: 'GroupTrip', label: 'Group trip', title: (doc) => doc.title },
  stay: { model: 'Hotel', label: 'Stay', title: (doc) => doc.name },
  transfer: { model: 'Transfer', label: 'Transfer', title: (doc) => doc.route },
  carhire: { model: 'CarHire', label: 'Car hire', title: (doc) => doc.vehicle?.name || 'Car hire' },
  service: { model: 'Service', label: 'Service', title: (doc) => doc.name },
};
const LISTING_TYPES = Object.keys(LISTINGS);

// What a review is attached to. tripRequest: an accepted quote; groupBooking: a
// confirmed place on a group trip; legacy: imported from the old stay reviews
// (no booking behind it, so never shown as verified).
const BOOKING_TYPES = ['tripRequest', 'groupBooking', 'legacy'];
const SUBMITTABLE_BOOKING_TYPES = ['tripRequest', 'groupBooking'];

// pending: waiting for the team (never public); approved: public and counted in
// the rating; hidden: kept for the record, never public, not counted.
const REVIEW_STATUSES = ['pending', 'approved', 'hidden'];

const TEXT_MIN = 20;
const TEXT_MAX = 2000;
const REPLY_MAX = 1500;
const PHOTOS_MAX = 4;
const PAGE_MAX = 20;

// Post-trip invitations: sent a day after the trip ends, not after this long.
const INVITE_DELAY_DAYS = 1;
const INVITE_WINDOW_DAYS = 60;
const INVITE_MAX_ATTEMPTS = 3;

module.exports = {
  LISTINGS,
  LISTING_TYPES,
  BOOKING_TYPES,
  SUBMITTABLE_BOOKING_TYPES,
  REVIEW_STATUSES,
  TEXT_MIN,
  TEXT_MAX,
  REPLY_MAX,
  PHOTOS_MAX,
  PAGE_MAX,
  INVITE_DELAY_DAYS,
  INVITE_WINDOW_DAYS,
  INVITE_MAX_ATTEMPTS,
};
