'use strict';

// Confirming an email address (security review S6). Anyone can type someone
// else's address at sign-up, so a password account only sees guest trip
// requests sent with its address once it has clicked the link emailed to it
// (or reset its password by email, or signed in with Google). The emails are
// mocked so the test can read the links they would carry.

jest.mock('../../src/services/notifications/authNotifications', () => ({
  sendPasswordResetEmail: jest.fn(async () => {}),
  sendVerificationEmail: jest.fn(async () => {}),
}));

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const User = require('../../src/models/User');
const { signUserToken } = require('../../src/services/tokens');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../../src/services/notifications/authNotifications');

let app;

const register = (email, extra = {}) => request(app).post('/api/auth/register').send({ name: 'Ada Lovelace', email, password: 'password-123', ...extra });
const auth = (token) => ({ Authorization: `Bearer ${token}` });
const lastLink = (mock = sendVerificationEmail) => new URL(mock.mock.calls.at(-1)[1]);
const tokenFrom = (url) => url.searchParams.get('token');
const verify = (token) => request(app).post('/api/auth/verify-email').send({ token });
const guestRequest = (email) =>
  request(app)
    .post('/api/trip-requests')
    .send({ contact: { name: 'Guest', email }, adults: 2, days: [{ label: 'Day 1', items: [{ kind: 'tour', title: 'Marine park snorkel', hours: 4 }] }] });
const mine = async (token) => (await request(app).get('/api/trip-requests/mine').set(auth(token))).body.map((r) => r.reference);

beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(disconnect);
beforeEach(() => jest.clearAllMocks());

describe('email confirmation', () => {
  it('signs up unconfirmed and emails a single-use link in the sign-up language', async () => {
    const res = await register('ada@test.com', { locale: 'it' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'ada@test.com', emailVerified: false });
    expect(res.body.delivery).toEqual({ email: false, sms: false }); // no SMTP in tests
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
    const [user, url, locale] = sendVerificationEmail.mock.calls[0];
    expect(user.email).toBe('ada@test.com');
    expect(url).toMatch(/^http:\/\/localhost:5173\/it\/verify-email\?token=[a-f0-9]{64}$/);
    expect(locale).toBe('it');

    // Only a hash is stored.
    const stored = await User.findOne({ email: 'ada@test.com' });
    expect(stored.verifyTokenHash).toBeTruthy();
    expect(stored.verifyTokenHash).not.toBe(tokenFrom(new URL(url)));
    expect(stored.emailVerifiedAt).toBeNull();
  });

  it('keeps guest requests with the address hidden until the link is clicked', async () => {
    const reg = await register('bo@test.com');
    const token = reg.body.token;
    const guest = await guestRequest('bo@test.com');
    const signedIn = await request(app)
      .post('/api/trip-requests')
      .set(auth(token))
      .send({ contact: { name: 'Bo', email: 'bo@test.com' }, adults: 1, days: [{ label: 'Day 1', items: [{ kind: 'tour', title: 'Gede ruins', hours: 3 }] }] });

    // Unconfirmed: only what they sent signed in.
    expect(await mine(token)).toEqual([signedIn.body.reference]);

    const confirmed = await verify(tokenFrom(lastLink()));
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.email).toBe('bo@test.com');
    expect((await mine(token)).sort()).toEqual([guest.body.reference, signedIn.body.reference].sort());
    expect((await request(app).get('/api/auth/me').set(auth(token))).body.emailVerified).toBe(true);
  });

  it('refuses a used, wrong or expired link', async () => {
    await register('cy@test.com');
    const link = tokenFrom(lastLink());
    expect((await verify(link)).status).toBe(200);
    const reuse = await verify(link);
    expect(reuse.status).toBe(400);
    expect(reuse.body.code).toBe('VERIFY_LINK_INVALID');
    expect((await verify('f'.repeat(64))).status).toBe(400);
    expect((await verify('short')).status).toBe(400);

    await register('dee@test.com');
    const late = tokenFrom(lastLink());
    await User.updateOne({ email: 'dee@test.com' }, { verifyTokenExpires: new Date(Date.now() - 1000) });
    expect((await verify(late)).status).toBe(400);
    expect((await User.findOne({ email: 'dee@test.com' })).emailVerifiedAt).toBeNull();
  });

  it('sends a new link on request — replacing the old one — a few times an hour at most', async () => {
    const { token } = (await register('eve@test.com')).body;
    const first = tokenFrom(lastLink());
    const again = await request(app).post('/api/auth/resend-verification').set(auth(token)).send({ locale: 'it' });
    expect(again.status).toBe(200);
    expect(again.body.alreadyVerified).toBe(false);
    expect(lastLink().pathname).toBe('/it/verify-email');
    expect((await verify(first)).status).toBe(400); // replaced
    expect((await request(app).post('/api/auth/resend-verification').set(auth(token)).send({})).status).toBe(200);
    expect((await request(app).post('/api/auth/resend-verification').set(auth(token)).send({})).status).toBe(200);
    expect((await request(app).post('/api/auth/resend-verification').set(auth(token)).send({})).status).toBe(429);
    expect((await request(app).post('/api/auth/resend-verification').send({})).status).toBe(401);
  });

  it('has nothing to send for a confirmed address', async () => {
    const { token } = (await register('fay@test.com')).body;
    await verify(tokenFrom(lastLink()));
    sendVerificationEmail.mockClear();
    const res = await request(app).post('/api/auth/resend-verification').set(auth(token)).send({});
    expect(res.body).toEqual({ alreadyVerified: true });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('counts a password reset by email as confirmation', async () => {
    const { token } = (await register('gus@test.com')).body;
    await guestRequest('gus@test.com');
    await request(app).post('/api/auth/forgot-password').send({ email: 'gus@test.com' });
    const resetToken = tokenFrom(lastLink(sendPasswordResetEmail));
    expect((await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: 'new-password-9' })).status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: 'gus@test.com', password: 'new-password-9' });
    expect(login.body.user.emailVerified).toBe(true);
    expect(await mine(login.body.token)).toHaveLength(1);
    expect(token).toBeTruthy();
  });

  it('treats Google accounts as confirmed (Google verified the address)', async () => {
    const google = await User.create({ name: 'Gail', email: 'gail@test.com', googleId: 'google-sub-gail' });
    const guest = await guestRequest('gail@test.com');
    const token = signUserToken(google);
    expect((await request(app).get('/api/auth/me').set(auth(token))).body.emailVerified).toBe(true);
    expect(await mine(token)).toEqual([guest.body.reference]);
  });

  it('tells the website on sign-in whether the address is confirmed', async () => {
    await register('hal@test.com');
    const login = await request(app).post('/api/auth/login').send({ email: 'hal@test.com', password: 'password-123' });
    expect(login.body.user).toMatchObject({ email: 'hal@test.com', emailVerified: false });
    expect(login.body.user.verifyTokenHash).toBeUndefined();
  });
});
