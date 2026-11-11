// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initMonitoring, reportError, resetMonitoringForTests, scrubBreadcrumb, scrubEvent } from './monitoring.js';

const fakeSentry = () => ({ init: vi.fn(), captureException: vi.fn() });

afterEach(() => {
  vi.unstubAllEnvs();
  resetMonitoringForTests();
});

describe('monitoring without VITE_SENTRY_DSN', () => {
  it('never fetches the SDK and reports nothing', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const load = vi.fn();
    expect(await initMonitoring({ load, afterLoad: false })).toBe(false);
    reportError(new Error('x'));
    expect(load).not.toHaveBeenCalled();
  });
});

describe('monitoring with VITE_SENTRY_DSN', () => {
  it('starts Sentry privately: no PII, no tracing, scrubbed events', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/1');
    vi.stubEnv('VITE_RELEASE', 'abc123');
    const Sentry = fakeSentry();

    expect(await initMonitoring({ load: async () => Sentry, afterLoad: false })).toBe(true);

    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: 'https://public@o0.ingest.sentry.io/1',
      release: 'abc123',
      sendDefaultPii: false,
      tracesSampleRate: 0,
      beforeSend: scrubEvent,
      beforeBreadcrumb: scrubBreadcrumb,
    }));
  });

  it('sends errors reported before the SDK arrived, then reports directly', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/1');
    const Sentry = fakeSentry();
    let arrive;
    const starting = initMonitoring({ load: () => new Promise((r) => { arrive = () => r(Sentry); }), afterLoad: false });

    const early = new Error('crashed while loading');
    reportError(early, { componentStack: 'at Page' });
    await Promise.resolve();
    arrive();
    await starting;

    expect(Sentry.captureException).toHaveBeenCalledWith(early, { extra: { componentStack: 'at Page' } });
    const later = new Error('later');
    reportError(later);
    expect(Sentry.captureException).toHaveBeenLastCalledWith(later, undefined);
  });

  it('keeps the site working if the SDK cannot be fetched (blocked, offline)', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/1');
    expect(await initMonitoring({ load: () => Promise.reject(new Error('blocked by an ad blocker')), afterLoad: false })).toBe(false);
    expect(() => reportError(new Error('x'))).not.toThrow();
  });
});

describe('scrubbing', () => {
  it('removes request details, user data and query strings (reset tokens, searches)', () => {
    const event = scrubEvent({
      request: { url: 'https://exploringwatamu.vercel.app/reset-password?token=abc#x', headers: { Cookie: 'a' }, cookies: { a: 1 }, query_string: 'token=abc' },
      user: { ip_address: '1.2.3.4', email: 'amina@example.com' },
      breadcrumbs: [
        { category: 'navigation', data: { from: '/trip?name=Amina', to: '/reset-password?token=abc' } },
        { category: 'xhr', data: { url: 'https://api.example/api/trip-requests?q=amina', method: 'GET', status_code: 200 } },
        { category: 'console', message: 'amina@example.com' },
        { category: 'ui.click', message: 'button.primary' },
      ],
    });

    expect(event).toEqual({
      request: { url: 'https://exploringwatamu.vercel.app/reset-password' },
      breadcrumbs: [
        { category: 'navigation', data: { from: '/trip', to: '/reset-password' } },
        { category: 'xhr', data: { url: 'https://api.example/api/trip-requests', method: 'GET', status_code: 200 } },
        { category: 'ui.click', message: 'button.primary' },
      ],
    });
  });
});
