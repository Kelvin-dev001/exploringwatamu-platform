'use strict';

// The whole reset journey: request a link, use it once, sign in with the new
// password. The email is mocked so the test can read the link it would carry.

jest.mock('../../src/services/notifications/authNotifications', () => ({ sendPasswordResetEmail: jest.fn(async () => {}) }));

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const User = require('../../src/models/User');
const { sendPasswordResetEmail } = require('../../src/services/notifications/authNotifications');

let app;

const tokenFromLastEmail = () => new URL(sendPasswordResetEmail.mock.calls.at(-1)[1]).searchParams.get('token');
const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

beforeAll(async () => {
  await connect();
  app = buildApp();
  await request(app).post('/api/auth/register').send({ name: 'Ada Lovelace', email: 'ada@test.com', password: 'old-password-1' });
});
afterAll(disconnect);
beforeEach(() => sendPasswordResetEmail.mockClear());

describe('password reset', () => {
  it('resets with the emailed link, once, and the new password works', async () => {
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: 'ADA@test.com' });
    expect(forgot.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetEmail.mock.calls[0][1]).toMatch(/^http:\/\/localhost:5173\/reset-password\?token=[a-f0-9]{64}$/);
    const token = tokenFromLastEmail();

    // Only a hash of the token is stored.
    const stored = await User.findOne({ email: 'ada@test.com' });
    expect(stored.resetTokenHash).toBeTruthy();
    expect(stored.resetTokenHash).not.toBe(token);

    const reset = await request(app).post('/api/auth/reset-password').send({ token, password: 'new-password-2' });
    expect(reset.status).toBe(200);

    expect((await login('ada@test.com', 'new-password-2')).status).toBe(200);
    expect((await login('ada@test.com', 'old-password-1')).status).toBe(401);

    const reuse = await request(app).post('/api/auth/reset-password').send({ token, password: 'third-password-3' });
    expect(reuse.status).toBe(400);
  });

  it('refuses an expired link', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: 'ada@test.com' });
    const token = tokenFromLastEmail();
    await User.updateOne({ email: 'ada@test.com' }, { resetTokenExpires: new Date(Date.now() - 1000) });

    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'too-late-pass-4' });
    expect(res.status).toBe(400);
    expect((await login('ada@test.com', 'new-password-2')).status).toBe(200);
  });

  it('answers the same for unknown emails and Google-only accounts, and sends nothing', async () => {
    await User.create({ name: 'Google Only', email: 'g@test.com', googleId: 'g-1' });
    for (const email of ['nobody@test.com', 'g@test.com']) {
      const res = await request(app).post('/api/auth/forgot-password').send({ email });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/If that email exists/);
    }
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('validates the new password and the email format', async () => {
    expect((await request(app).post('/api/auth/reset-password').send({ token: 'x'.repeat(64), password: 'short' })).status).toBe(400);
    expect((await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' })).status).toBe(400);
  });
});
