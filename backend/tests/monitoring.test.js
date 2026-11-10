'use strict';

// Error monitoring is optional: without SENTRY_DSN the SDK must not even load;
// with it, reports must leave personal data and secrets behind.

function sentryMock() {
  const scope = { setTag: jest.fn() };
  return {
    scope,
    init: jest.fn(),
    captureException: jest.fn(),
    withScope: jest.fn((fn) => fn(scope)),
    flush: jest.fn(() => Promise.resolve(true)),
  };
}

// Loads services/monitoring with SENTRY_DSN set (or not) and a fresh mocked
// SDK. (A module reset rather than isolateModules: the SDK is required lazily
// inside init(), after an isolated registry would be gone.)
function loadMonitoring({ dsn = '', release = '' } = {}) {
  const saved = { SENTRY_DSN: process.env.SENTRY_DSN, SENTRY_RELEASE: process.env.SENTRY_RELEASE };
  process.env.SENTRY_DSN = dsn;
  process.env.SENTRY_RELEASE = release;
  const Sentry = sentryMock();
  let monitoring;
  try {
    jest.resetModules();
    jest.doMock('@sentry/node', () => Sentry);
    monitoring = require('../src/services/monitoring');
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
  return { monitoring, Sentry };
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.dontMock('@sentry/node');
});

describe('monitoring without SENTRY_DSN', () => {
  it('does nothing and never loads the SDK', async () => {
    const { monitoring, Sentry } = loadMonitoring();

    expect(monitoring.init()).toBe(false);
    expect(monitoring.enabled()).toBe(false);
    monitoring.captureException(new Error('x'), { requestId: 'r' });
    await monitoring.flush();

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.flush).not.toHaveBeenCalled();
  });
});

describe('monitoring with SENTRY_DSN', () => {
  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}));

  it('starts Sentry without default PII, tracing or its own process handlers', () => {
    const { monitoring, Sentry } = loadMonitoring({ dsn: 'https://public@o0.ingest.sentry.io/0', release: 'abc123' });

    expect(monitoring.init()).toBe(true);
    expect(monitoring.enabled()).toBe(true);
    expect(monitoring.init()).toBe(true); // idempotent
    expect(Sentry.init).toHaveBeenCalledTimes(1);

    const opts = Sentry.init.mock.calls[0][0];
    expect(opts).toMatchObject({ dsn: 'https://public@o0.ingest.sentry.io/0', environment: 'test', release: 'abc123', sendDefaultPii: false, tracesSampleRate: 0 });
    expect(opts.beforeSend).toBe(monitoring.scrubEvent);

    const defaults = [{ name: 'Http' }, { name: 'OnUncaughtException' }, { name: 'OnUnhandledRejection' }, { name: 'Express' }];
    expect(opts.integrations(defaults).map((i) => i.name)).toEqual(['Http', 'Express']);
    expect(opts.beforeBreadcrumb({ data: { url: '/api/auth/reset-password?token=abc' } })).toEqual({ data: { url: '/api/auth/reset-password' } });
  });

  it('tags reports with the request context', () => {
    const { monitoring, Sentry } = loadMonitoring({ dsn: 'https://public@o0.ingest.sentry.io/0' });
    monitoring.init();
    const err = new Error('boom');

    monitoring.captureException(err, { requestId: 'req-1', route: '/api/tours/:id', missing: undefined });

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    expect(Sentry.scope.setTag.mock.calls).toEqual([['requestId', 'req-1'], ['route', '/api/tours/:id']]);
  });

  it('never lets a monitoring failure reach the caller', async () => {
    const { monitoring, Sentry } = loadMonitoring({ dsn: 'https://public@o0.ingest.sentry.io/0' });
    monitoring.init();
    Sentry.withScope.mockImplementation(() => {
      throw new Error('sdk broke');
    });
    Sentry.flush.mockImplementation(() => Promise.reject(new Error('offline')));

    expect(() => monitoring.captureException(new Error('x'))).not.toThrow();
    await expect(monitoring.flush()).resolves.toBeUndefined();
  });

  it('stays off (and the API keeps running) if the SDK fails to start', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { monitoring, Sentry } = loadMonitoring({ dsn: 'not a dsn' });
    Sentry.init.mockImplementation(() => {
      throw new Error('Invalid DSN');
    });
    expect(monitoring.init()).toBe(false);
    expect(monitoring.enabled()).toBe(false);
  });
});

describe('scrubEvent', () => {
  const { scrubEvent } = require('../src/services/monitoring');

  it('strips request bodies, headers, cookies, query strings and user details', () => {
    const event = scrubEvent({
      message: 'boom',
      request: {
        method: 'POST',
        url: 'https://api.example/api/auth/reset-password?token=abc',
        data: { password: 'hunter2' },
        headers: { authorization: 'Bearer eyJ' },
        cookies: { sid: '1' },
        query_string: 'token=abc',
      },
      user: { email: 'amina@example.com', ip_address: '1.2.3.4' },
      breadcrumbs: [{ category: 'http', data: { url: '/x?email=a@b.c' } }, { message: 'no data' }],
      tags: { requestId: 'r1' },
    });

    expect(event).toEqual({
      message: 'boom',
      request: { method: 'POST', url: 'https://api.example/api/auth/reset-password' },
      breadcrumbs: [{ category: 'http', data: { url: '/x' } }, { message: 'no data' }],
      tags: { requestId: 'r1' },
    });
  });
});
