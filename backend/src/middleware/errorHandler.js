'use strict';

const util = require('util');
const config = require('../config/env');
const logger = require('../services/logger');
const monitoring = require('../services/monitoring');

// 404 handler for unmatched routes.
function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Some libraries throw non-Errors (cloudinary@1 throws bare strings such as
// "Must supply api_key"); without this the log line read "[error] undefined".
function describeError(err) {
  if (typeof err === 'string') return err;
  if (err && typeof err.message === 'string') return err.message;
  return util.inspect(err);
}

// Mongoose errors carry no HTTP status. These are caused by the request (a
// malformed id, a value the schema refuses, a duplicate), so they are 4xx with
// a safe message rather than a 500.
function clientError(err) {
  if (!err || typeof err !== 'object') return null;
  if (err.name === 'CastError') return { status: 400, body: { error: `Invalid ${err.path === '_id' ? 'id' : err.path}` } };
  if (err.name === 'ValidationError' && err.errors) {
    const issues = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return { status: 400, body: { error: 'Validation failed', issues } };
  }
  if (err.code === 11000) return { status: 409, body: { error: 'That record already exists.' } };
  return null;
}

// Centralized error handler. Never leaks internal error details for 5xx in
// production; client (4xx) messages are passed through. The server log (and
// error monitoring, when configured) gets the real message and stack, tagged
// with the request id that the 5xx response also carries for support.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const explicit = err && (err.status || err.statusCode);
  const mapped = explicit ? null : clientError(err);
  if (mapped) return res.status(mapped.status).json(mapped.body);

  const status = explicit || 500;
  const isServerError = status >= 500;
  const message = describeError(err);

  if (isServerError) {
    const route = req.route ? `${req.baseUrl}${req.route.path}` : (req.originalUrl || '').split('?')[0];
    const context = { requestId: req.id, method: req.method, route };
    logger.error('unhandled error', { ...context, status, ...logger.errorFields(err, { stack: true }), errMessage: message });
    monitoring.captureException(typeof err === 'string' ? new Error(err) : err, context);
  }

  const body = { error: isServerError ? 'Internal server error' : err.message || 'Request failed' };
  if (err.issues) body.issues = err.issues;
  if (isServerError && req.id) body.requestId = req.id;
  if (!config.isProd && isServerError) body.details = message;

  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
