// Only what lib/monitoring.js uses, so the lazily loaded chunk leaves out the
// rest of the SDK (tracing, replay, profiling...).
export { init, captureException } from '@sentry/react';
