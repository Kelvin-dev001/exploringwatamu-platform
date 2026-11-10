'use strict';

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Shared rate limiters, keyed by client IP (req.ip: see TRUST_PROXY).
//
// Each limiter keeps one count per IP across every route it is attached to,
// so reads and writes get separate limiters: browsing "My trips" must never
// use up the allowance for sending a quote request.
//
// The store is in memory, per process: right for the single Render instance.
// It resets on every restart/deploy, and with several instances each would
// count separately (a client could get N x the limit). Before scaling out,
// give these a shared store (e.g. Redis) — see docs/SECURITY-REVIEW.md.

const message = { error: 'Too many requests. Please try again later.' };
const MINUTE = 60 * 1000;
const base = { windowMs: 15 * MINUTE, standardHeaders: true, legacyHeaders: false, message };

module.exports = {
  globalLimiter: rateLimit({ ...base, max: 300 }),
  // Sign-in, sign-up, Google sign-in, setting a new password, admin sign-in.
  authLimiter: rateLimit({ ...base, max: 20 }),
  // Reading your own session and lists (/auth/me runs on every page load).
  sessionLimiter: rateLimit({ ...base, max: 200 }),
  // "Forgot password" sends an email: a few per hour per IP...
  resetRequestLimiter: rateLimit({ ...base, windowMs: 60 * MINUTE, max: 5 }),
  // ...and per address, so nobody can flood one inbox from many IPs.
  resetAddressLimiter: rateLimit({
    ...base,
    windowMs: 60 * MINUTE,
    max: 3,
    keyGenerator: (req) => {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      return email ? `email:${email}` : ipKeyGenerator(req.ip);
    },
  }),
  // Public writes: quote requests, bookings, viewings.
  bookingLimiter: rateLimit({ ...base, max: 30 }),
  // Signed-in admin work (a busy session is a few hundred calls).
  adminLimiter: rateLimit({ ...base, max: 600 }),
  // Admin writes, including image uploads to Cloudinary.
  adminWriteLimiter: rateLimit({ ...base, max: 150 }),
  publicReadLimiter: rateLimit({ ...base, max: 200 }),
};
