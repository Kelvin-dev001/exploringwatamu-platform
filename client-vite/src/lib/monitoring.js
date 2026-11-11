/*
 * Error monitoring with Sentry — optional.
 *
 * Nothing is downloaded unless VITE_SENTRY_DSN is set at build time. Even then
 * the SDK is a separate chunk fetched after the page has loaded, so it never
 * slows the site down; errors from before it arrives are queued (a few).
 *
 * Privacy: no IP addresses or cookies (sendDefaultPii: false), no session
 * replay, no performance tracing, no console messages, and query strings are
 * removed from every URL (a reset link carries a token, a search can carry a
 * name). The site never depends on Sentry being reachable.
 */

const dsn = () => import.meta.env.VITE_SENTRY_DSN || '';
const MAX_QUEUED = 10;

let sentry = null;
let starting = null;
const queued = [];

export const stripQuery = (url) => (typeof url === 'string' ? url.split(/[?#]/)[0] : url);

/** Drop console breadcrumbs; strip query strings from the URLs in the rest. */
export function scrubBreadcrumb(crumb) {
  if (!crumb || crumb.category === 'console') return null;
  if (!crumb.data) return crumb;
  const data = { ...crumb.data };
  for (const key of ['url', 'from', 'to']) if (typeof data[key] === 'string') data[key] = stripQuery(data[key]);
  return { ...crumb, data };
}

/** Remove anything personal or secret from an event before it is sent. */
export function scrubEvent(event) {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
    delete event.request.data;
    event.request.url = stripQuery(event.request.url);
  }
  delete event.user;
  if (Array.isArray(event.breadcrumbs)) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb).filter(Boolean);
  return event;
}

/** Report an error (e.g. from an error boundary). A no-op while monitoring is off. */
export function reportError(error, context) {
  if (!dsn()) return;
  if (!sentry) {
    if (queued.length < MAX_QUEUED) queued.push([error, context]);
    return;
  }
  try {
    sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    /* monitoring must never break the page */
  }
}

// Until the SDK is running (it then installs its own handlers).
const early = (e) => reportError(e.reason ?? e.error ?? new Error(String(e.message)));

/**
 * Starts monitoring if a DSN is configured. `load` is how the SDK is fetched
 * (tests pass a fake). Resolves to whether monitoring is on.
 */
export function initMonitoring({ load = () => import('./sentry.js'), afterLoad = true } = {}) {
  if (!dsn()) return Promise.resolve(false);
  if (starting) return starting;

  window.addEventListener('error', early);
  window.addEventListener('unhandledrejection', early);

  const pageLoaded = () =>
    !afterLoad || document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));

  starting = pageLoaded()
    .then(load)
    .then((Sentry) => {
      Sentry.init({
        dsn: dsn(),
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
        release: import.meta.env.VITE_RELEASE || undefined,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        beforeSend: scrubEvent,
        beforeBreadcrumb: scrubBreadcrumb,
      });
      sentry = Sentry;
      queued.splice(0).forEach(([error, context]) => reportError(error, context));
      return true;
    })
    .catch(() => false)
    .finally(() => {
      window.removeEventListener('error', early);
      window.removeEventListener('unhandledrejection', early);
    });
  return starting;
}

/** Test helper: forget the SDK and the queue. */
export function resetMonitoringForTests() {
  sentry = null;
  starting = null;
  queued.length = 0;
}
