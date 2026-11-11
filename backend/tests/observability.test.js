'use strict';

const request = require('supertest');

// Loads the logger (and optionally the app) with the given env, so the level
// and format — read once at load — can be tested; console output is captured.
function load(env, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    process.env[k] = v;
  }
  try {
    let out;
    jest.isolateModules(() => {
      out = fn();
    });
    return out;
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

function captureConsole() {
  const lines = [];
  const grab = (...args) => lines.push(args.join(' '));
  jest.spyOn(console, 'log').mockImplementation(grab);
  jest.spyOn(console, 'error').mockImplementation(grab);
  return lines;
}

const jsonLines = (lines) => lines.filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));

afterEach(() => jest.restoreAllMocks());

describe('logger', () => {
  const logger = require('../src/services/logger');

  it('redacts secret-looking fields at any depth but keeps ordinary ones', () => {
    const out = logger.scrub({
      password: 'hunter2',
      newPassword: 'x',
      resetToken: 'abc',
      authorization: 'Bearer eyJ…',
      jwt: 'eyJ…',
      nested: { apiKey: 'k', api_key: 'k', clientSecret: 's', passkey: 'p', ok: 1 },
      passengers: 3,
      passport: 'DE',
    });
    expect(out).toEqual({
      password: '[redacted]',
      newPassword: '[redacted]',
      resetToken: '[redacted]',
      authorization: '[redacted]',
      jwt: '[redacted]',
      nested: { apiKey: '[redacted]', api_key: '[redacted]', clientSecret: '[redacted]', passkey: '[redacted]', ok: 1 },
      passengers: 3,
      passport: 'DE',
    });
  });

  it('cuts very long strings and deep or long structures', () => {
    expect(logger.scrub('x'.repeat(5000))).toHaveLength(2001);
    expect(logger.scrub({ a: { b: { c: { d: { e: { f: 1 } } } } } })).toEqual({ a: { b: { c: { d: { e: '[…]' } } } } });
    expect(logger.scrub(Array.from({ length: 50 }, (_, i) => i))).toHaveLength(20);
  });

  it('masks emails and phone numbers', () => {
    expect(logger.maskEmail('amina@example.com')).toBe('a***@example.com');
    expect(logger.maskEmail('')).toBe('***');
    expect(logger.maskEmail(undefined)).toBe('***');
    expect(logger.maskPhone('+254712345678')).toBe('+2547******78');
    expect(logger.maskPhone('123')).toBe('***');
  });

  it('describes errors safely: the stack only on request', () => {
    const err = Object.assign(new TypeError('boom'), { code: 'E_X' });
    expect(logger.errorFields(err)).toEqual({ errName: 'TypeError', errMessage: 'boom', errCode: 'E_X' });
    expect(logger.errorFields(err, { stack: true }).stack).toContain('TypeError: boom');
    expect(logger.errorFields('Must supply api_key')).toEqual({ errMessage: 'Must supply api_key' });
    expect(logger.errorFields(null)).toEqual({});
  });

  it('writes one JSON object per line with time, level and message in production format', () => {
    const lines = captureConsole();
    const log = load({ LOG_FORMAT: 'json', LOG_LEVEL: 'info' }, () => require('../src/services/logger'));

    log.debug('hidden');
    log.info('email NOT sent', { event: 'x', password: 'p' });
    log.error('boom', { requestId: 'r1' });

    const [info, error] = jsonLines(lines);
    expect(lines).toHaveLength(2);
    expect(info).toEqual({ time: expect.any(String), level: 'info', msg: 'email NOT sent', event: 'x', password: '[redacted]' });
    expect(new Date(info.time).toISOString()).toBe(info.time);
    expect(error).toMatchObject({ level: 'error', msg: 'boom', requestId: 'r1' });
  });

  it('only writes errors under tests by default', () => {
    const lines = captureConsole();
    const log = load({ LOG_LEVEL: '', LOG_FORMAT: '' }, () => require('../src/services/logger'));
    log.info('quiet');
    log.warn('quiet');
    log.error('loud');
    expect(lines).toEqual(['[error] loud']);
  });
});

describe('request logging and request ids', () => {
  // A fresh app whose logger writes JSON at debug level.
  const appWithLogs = () =>
    load({ LOG_FORMAT: 'json', LOG_LEVEL: 'debug' }, () => require('../src/app')());

  it('gives every response an X-Request-Id', async () => {
    const app = require('../src/app')();
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("keeps a caller's well-formed request id and replaces a malformed one", async () => {
    const app = require('../src/app')();
    const kept = await request(app).get('/api/health').set('X-Request-Id', 'render-abc12345');
    expect(kept.headers['x-request-id']).toBe('render-abc12345');

    const replaced = await request(app).get('/api/health').set('X-Request-Id', 'bad id\twith spaces');
    expect(replaced.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('logs method, route, status and duration — never the query string', async () => {
    const lines = captureConsole();
    const app = appWithLogs();

    const res = await request(app).get('/api/nowhere?email=amina@example.com&token=abc');

    const entry = jsonLines(lines).find((l) => l.msg === 'request');
    expect(entry).toEqual({
      time: expect.any(String),
      level: 'info',
      msg: 'request',
      requestId: res.headers['x-request-id'],
      method: 'GET',
      route: '/api/nowhere',
      status: 404,
      durationMs: expect.any(Number),
      ipHash: expect.stringMatching(/^[0-9a-f]{12}$/),
    });
    expect(lines.join('\n')).not.toMatch(/amina|token=abc|127\.0\.0\.1|::1/);
  });

  it('logs the matched route pattern, not the concrete id', async () => {
    const lines = captureConsole();
    const app = appWithLogs();

    // Not a real id (answered without the database), but the route is matched.
    const res = await request(app).get('/api/tours/not-an-id');

    const entry = jsonLines(lines).find((l) => l.msg === 'request');
    expect(entry.route).toBe('/api/tours/:id');
    expect(entry.status).toBe(res.status);
  });

  it('logs health probes at debug so they do not drown real traffic', async () => {
    const lines = captureConsole();
    const app = appWithLogs();
    await request(app).get('/api/health');
    expect(jsonLines(lines).find((l) => l.msg === 'request')).toMatchObject({ level: 'debug', route: '/api/health' });
  });
});

describe('health checks', () => {
  const app = require('../src/app')();

  it('liveness answers without the database and exposes no secrets or infrastructure', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['env', 'imageUploads', 'status', 'uptime']);
    expect(res.body.status).toBe('ok');
    expect(JSON.stringify(res.body)).not.toMatch(/mongodb|secret|JWT|@/i);
  });

  it('readiness answers 503 while the database is unreachable, listing optional services as flags only', async () => {
    captureConsole(); // a 503 is logged at error level
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      status: 'unavailable',
      database: 'down',
      services: { email: false, sms: false, imageUploads: expect.any(Boolean), googleSignIn: expect.any(Boolean), errorMonitoring: false },
    });
  });
});

describe('caching headers', () => {
  const app = require('../src/app')();

  it('marks signed-in responses private and unstorable', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers.vary).toMatch(/Authorization/);
  });

  it('lets public responses be cached only with revalidation', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['cache-control']).toBe('no-cache');
    expect(res.headers.vary).toMatch(/Authorization/);
  });
});

describe('CORS allow-list', () => {
  it('answers an unknown origin normally but without CORS headers (not a 500)', async () => {
    const app = require('../src/app')();
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows the production sites with credentials', async () => {
    const app = require('../src/app')();
    const res = await request(app).get('/api/health').set('Origin', 'https://exploringwatamu-platform.vercel.app');
    expect(res.headers['access-control-allow-origin']).toBe('https://exploringwatamu-platform.vercel.app');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    const admin = await request(app).get('/api/health').set('Origin', 'https://exploringwatamuadmin.vercel.app');
    expect(admin.headers['access-control-allow-origin']).toBe('https://exploringwatamuadmin.vercel.app');
  });

  it('no longer trusts the retired exploringwatamu.vercel.app (no deployment: anyone could claim the name)', async () => {
    const app = require('../src/app')();
    const res = await request(app).get('/api/health').set('Origin', 'https://exploringwatamu.vercel.app');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows localhost in development but not in production', async () => {
    const dev = require('../src/app')();
    const devRes = await request(dev).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(devRes.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    captureConsole(); // production logs every request as JSON
    const prod = load({ NODE_ENV: 'production', FRONTEND_URLS: '' }, () => require('../src/app')());
    const prodRes = await request(prod).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(prodRes.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('request size limit', () => {
  it('refuses JSON bodies over 256 KB with 413', async () => {
    const app = require('../src/app')();
    const res = await request(app)
      .post('/api/trip-requests')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ notes: 'x'.repeat(300 * 1024) }));
    expect(res.status).toBe(413);
    expect(res.body.error).toBeDefined();
    expect(JSON.stringify(res.body)).not.toMatch(/at \w+ \(|node_modules/);
  });
});

describe('TRUST_PROXY', () => {
  const read = (value) => load({ TRUST_PROXY: value }, () => require('../src/config/env').trustProxy);

  it('defaults to one proxy hop (Render)', () => expect(read('')).toBe(1));
  it('accepts a hop count or true/false', () => {
    expect(read('2')).toBe(2);
    expect(read('false')).toBe(false);
    expect(read('true')).toBe(true);
  });
  it('refuses anything else at boot', () => expect(() => read('loopback, 10.0.0.1')).toThrow(/TRUST_PROXY/));
});
