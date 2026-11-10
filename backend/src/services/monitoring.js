'use strict';

/*
 * Error monitoring with Sentry — optional. While SENTRY_DSN is unset the SDK
 * is never loaded and every function here does nothing, so the API never
 * depends on the monitoring service (a failing or slow Sentry can't break a
 * request either: sends are queued in the background).
 *
 * Privacy: reports carry the error, the route and the request id. Request
 * bodies, headers, cookies, query strings, IP addresses and user details are
 * stripped before anything leaves the server.
 */
const config = require('../config/env');
const logger = require('./logger');

let Sentry = null;

const stripQuery = (url) => (typeof url === 'string' ? url.split('?')[0] : url);

/** Remove anything personal or secret from an event before it is sent. */
function scrubEvent(event) {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
    event.request.url = stripQuery(event.request.url);
  }
  delete event.user;
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((b) => (b.data && b.data.url ? { ...b, data: { ...b.data, url: stripQuery(b.data.url) } } : b));
  }
  return event;
}

function init() {
  if (Sentry || !config.monitoring.dsn) return Boolean(Sentry);
  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn: config.monitoring.dsn,
      environment: config.monitoring.environment,
      release: config.release || undefined,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      // server.js handles uncaught errors itself (log, report, exit), so the
      // SDK's own process handlers would only report them twice.
      integrations: (defaults) => defaults.filter((i) => !['OnUncaughtException', 'OnUnhandledRejection'].includes(i.name)),
      beforeSend: scrubEvent,
      beforeBreadcrumb: (b) => (b.data && b.data.url ? { ...b, data: { ...b.data, url: stripQuery(b.data.url) } } : b),
    });
    logger.info('error monitoring on', { environment: config.monitoring.environment });
  } catch (err) {
    Sentry = null;
    logger.warn('error monitoring off: Sentry failed to start', logger.errorFields(err));
  }
  return Boolean(Sentry);
}

/** Report an unexpected error. `context`: { requestId, method, route } and similar. */
function captureException(err, context = {}) {
  if (!Sentry) return;
  try {
    Sentry.withScope((scope) => {
      for (const [k, v] of Object.entries(context)) if (v !== undefined) scope.setTag(k, String(v));
      Sentry.captureException(err);
    });
  } catch {
    /* monitoring must never break the caller */
  }
}

/** Wait (briefly) for queued reports to go out, e.g. before the process exits. */
async function flush(timeoutMs = 2000) {
  if (!Sentry) return;
  await Sentry.flush(timeoutMs).catch(() => {});
}

module.exports = { init, captureException, flush, scrubEvent, enabled: () => Boolean(Sentry) };
