'use strict';

const config = require('../config/env');

// 404 handler for unmatched routes.
function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Centralized error handler. Never leaks internal error details for 5xx in
// production; client (4xx) messages are passed through.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error('[error]', err.message, config.isProd ? '' : err.stack);
  }

  const body = { error: isServerError ? 'Internal server error' : err.message || 'Request failed' };
  if (err.issues) body.issues = err.issues;
  if (!config.isProd && isServerError) body.details = err.message;

  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
