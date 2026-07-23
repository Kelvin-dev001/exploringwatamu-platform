'use strict';

const rateLimit = require('express-rate-limit');

// Shared rate limiters. NOTE: the default store is in-memory and therefore
// per-instance. Before running multiple instances / serverless, swap in a
// shared store (e.g. rate-limit-redis) so limits hold across processes.

const message = { error: 'Too many requests. Please try again later.' };
const base = { windowMs: 15 * 60 * 1000, standardHeaders: true, legacyHeaders: false, message };

module.exports = {
  globalLimiter: rateLimit({ ...base, max: 300 }),
  authLimiter: rateLimit({ ...base, max: 20 }),
  bookingLimiter: rateLimit({ ...base, max: 30 }),
  adminLimiter: rateLimit({ ...base, max: 100 }),
  publicReadLimiter: rateLimit({ ...base, max: 200 }),
};
