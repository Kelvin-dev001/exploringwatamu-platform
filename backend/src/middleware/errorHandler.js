'use strict';

const util = require('util');
const config = require('../config/env');

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

// Centralized error handler. Never leaks internal error details for 5xx in
// production; client (4xx) messages are passed through. The server log always
// gets the real message and stack.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isServerError = status >= 500;
  const message = describeError(err);

  if (isServerError) {
    console.error('[error]', req.method, req.originalUrl, err.stack || message);
  }

  const body = { error: isServerError ? 'Internal server error' : err.message || 'Request failed' };
  if (err.issues) body.issues = err.issues;
  if (!config.isProd && isServerError) body.details = message;

  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
