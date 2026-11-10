'use strict';

const crypto = require('crypto');
const logger = require('../services/logger');

// A caller's X-Request-Id is kept if it looks like an id; otherwise we make one.
const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

// IP addresses are personal data: log a short hash instead, salted per process
// so it can't be reversed. Enough to tell clients apart in one incident (and
// to check that the proxy setup gives each visitor their own rate limit).
const SALT = crypto.randomBytes(16);
const ipHash = (ip) => (ip ? crypto.createHash('sha256').update(SALT).update(ip).digest('hex').slice(0, 12) : undefined);

/**
 * Gives every request an id (req.id, X-Request-Id response header) and logs one
 * line when it finishes: method, route pattern, status and duration. No query
 * strings or bodies (they can hold names and emails).
 */
module.exports = function requestLogger(req, res, next) {
  const incoming = req.get('x-request-id');
  req.id = incoming && SAFE_ID.test(incoming) ? incoming : crypto.randomUUID();
  res.set('X-Request-Id', req.id);
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - started) / 1e5) / 10;
    // The matched pattern (/api/tours/:id) keeps logs groupable; unmatched -> path only.
    const route = req.route ? `${req.baseUrl}${req.route.path}` : req.originalUrl.split('?')[0];
    const fields = { requestId: req.id, method: req.method, route, status: res.statusCode, durationMs, ipHash: ipHash(req.ip) };
    if (res.statusCode >= 500) logger.error('request', fields);
    else if (route === '/api/health' || route === '/api/health/ready') logger.debug('request', fields);
    else logger.info('request', fields);
  });
  next();
};

module.exports.ipHash = ipHash;
