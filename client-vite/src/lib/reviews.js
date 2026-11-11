import axios from 'axios';
import { API_URL } from '@/api.js';

/*
 * Reviews on the website. Everything public comes from approved reviews only
 * (the API never returns others); writing one needs a finished, accepted trip,
 * which the API checks — the website only shows the way.
 */

export const LISTING_LABEL = { tour: 'experience', group: 'group trip', stay: 'stay', transfer: 'transfer', carhire: 'car hire', service: 'service' };
export const TEXT_MIN = 20;
export const TEXT_MAX = 2000;
export const PHOTOS_MAX = 4;

/** A listing's stored rating, or null when it has no approved reviews yet. */
export function ratingOf(stats) {
  const count = Number(stats?.count) || 0;
  const average = Number(stats?.average) || 0;
  return count > 0 && average > 0 ? { average, count } : null;
}

/** How much of star n (1–5) to fill for a rating, to the nearest half star: 0, 0.5 or 1. */
export const starFill = (value, n) => Math.min(1, Math.max(0, Math.round((Number(value) || 0) * 2) / 2 - (n - 1)));

export const formatAverage = (n) => (Math.round(Number(n) * 10) / 10).toFixed(1);
export const reviewsLabel = (count) => `${count} review${count === 1 ? '' : 's'}`;

/**
 * schema.org AggregateRating for a page's JSON-LD — only with real, approved
 * reviews (never invented, never zero), else undefined so nothing is added.
 */
export function aggregateRatingLd(stats) {
  const r = ratingOf(stats);
  if (!r) return undefined;
  return { '@type': 'AggregateRating', ratingValue: Number(formatAverage(r.average)), reviewCount: r.count, bestRating: 5, worstRating: 1 };
}

/**
 * JSON-LD types for a listing page. TouristTrip has no aggregateRating
 * property in schema.org, so a page with reviews is also typed as a Product
 * (which does), keeping the markup valid.
 */
export const withRatingType = (type, stats) => (ratingOf(stats) ? [type, 'Product'] : type);

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export async function fetchListingReviews({ listingType, listingId, page = 1, limit = 5 }) {
  const res = await axios.get(`${API_URL}/reviews`, { params: { listingType, listingId, page, limit } });
  return res.data;
}

export async function fetchEligible(token, { bookingType, bookingId, inviteToken } = {}) {
  const params = bookingType ? { bookingType, bookingId, ...(inviteToken ? { t: inviteToken } : {}) } : {};
  return (await axios.get(`${API_URL}/reviews/eligible`, { ...auth(token), params })).data.data;
}

export async function fetchMyReviews(token) {
  return (await axios.get(`${API_URL}/reviews/mine`, auth(token))).data.data;
}

export async function submitReview(token, body) {
  return (await axios.post(`${API_URL}/reviews`, body, auth(token))).data.review;
}

export async function uploadReviewPhotos(token, reviewId, files) {
  const form = new FormData();
  files.forEach((f) => form.append('photos', f));
  return (await axios.post(`${API_URL}/reviews/${reviewId}/photos`, form, auth(token))).data.review;
}

/** The message to show for a failed review request. */
export function reviewError(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (data?.issues?.length) return data.issues.map((i) => i.message).join(' · ');
  if (err?.response?.status === 429) return 'You’ve sent a lot of reviews in a short time — please try again in a little while.';
  return data?.error || (err?.response ? fallback : 'We couldn’t reach our server. Check your connection and try again.');
}

/** Where a review of this booking is written. */
export const reviewPath = (booking) => `/review/${booking.type}/${booking.id}`;
