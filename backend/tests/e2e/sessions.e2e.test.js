'use strict';

// Sessions end when a password changes; tokens are checked with one pinned
// algorithm; the last admin can't be removed even by two removals at once;
// rate limits protect sign-in and reset emails without locking out a
// traveller who just reloads the site.

jest.mock('../../src/services/notifications/authNotifications', () => ({ sendPasswordResetEmail: jest.fn(async () => {}) }));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const config = require('../../src/config/env');
const User = require('../../src/models/User');
const Admin = require('../../src/models/Admin');
const { signUserToken, signAdminToken } = require('../../src/services/tokens');
const { sendPasswordResetEmail } = require('../../src/services/notifications/authNotifications');

let app;

const me = (token) => request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
const asAdmin = (token) => ({
  get: (path) => request(app).get(path).set('Authorization', `Bearer ${token}`),
  put: (path, body) => request(app).put(path).set('Authorization', `Bearer ${token}`).send(body),
  del: (path) => request(app).delete(path).set('Authorization', `Bearer ${token}`),
});

async function makeUser(email, password = 'old-password-1') {
  const user = new User({ name: 'Traveller', email });
  await user.setPassword(password);
  await user.save();
  return user;
}

async function makeAdmin(email) {
  const admin = new Admin({ email });
  await admin.setPassword('admin-pass-123');
  await admin.save();
  return admin;
}

beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(disconnect);
afterEach(() => jest.restoreAllMocks());

describe('a password reset ends existing sessions', () => {
  it('the old token stops working, a new sign-in works', async () => {
    const user = await makeUser('reset-me@test.com');
    const stolen = signUserToken(user);
    expect((await me(stolen)).status).toBe(200);

    await request(app).post('/api/auth/forgot-password').send({ email: 'reset-me@test.com' });
    const token = new URL(sendPasswordResetEmail.mock.calls.at(-1)[1]).searchParams.get('token');
    expect((await request(app).post('/api/auth/reset-password').send({ token, password: 'new-password-2' })).status).toBe(200);

    const after = await me(stolen);
    expect(after.status).toBe(401);
    expect(after.body.error).toMatch(/password was changed/);

    const login = await request(app).post('/api/auth/login').send({ email: 'reset-me@test.com', password: 'new-password-2' });
    expect((await me(login.body.token)).status).toBe(200);
  });

  it("a stale token is refused on the traveller's own lists too", async () => {
    const user = await makeUser('optional@test.com');
    const stale = signUserToken(user);
    await user.setPassword('another-password-3');
    await user.save();

    const res = await request(app).get('/api/trip-requests/mine').set('Authorization', `Bearer ${stale}`);
    expect(res.status).toBe(401);
  });

  it('keeps sessions from before this change working (no tv claim, no tokenVersion)', async () => {
    const { insertedId } = await User.collection.insertOne({ name: 'Early Bird', email: 'early@test.com', passwordHash: 'x' });
    const legacy = jwt.sign({ id: insertedId }, config.jwtSecret, { expiresIn: '7d' });
    expect((await me(legacy)).status).toBe(200);
  });
});

describe('admin password changes', () => {
  let owner;
  let ownerToken;
  let colleague;

  beforeAll(async () => {
    owner = await makeAdmin('owner@test.com');
    ownerToken = signAdminToken(owner);
    colleague = await makeAdmin('colleague@test.com');
  });

  it("setting a colleague's password signs them out everywhere", async () => {
    const theirs = signAdminToken(colleague);
    expect((await asAdmin(theirs).get('/api/admin/profile')).status).toBe(200);

    const res = await asAdmin(ownerToken).put(`/api/admin/team/${colleague._id}/password`, { password: 'fresh-password-99' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();

    const after = await asAdmin(theirs).get('/api/admin/profile');
    expect(after.status).toBe(401);
    expect(after.body.error).toMatch(/password was changed/);
  });

  it('changing your own password returns a fresh token for this session', async () => {
    const res = await asAdmin(ownerToken).put(`/api/admin/team/${owner._id}/password`, { password: 'my-new-password-1' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');

    expect((await asAdmin(ownerToken).get('/api/admin/profile')).status).toBe(401);
    expect((await asAdmin(res.body.token).get('/api/admin/profile')).status).toBe(200);
    ownerToken = res.body.token;
  });
});

describe('JWT algorithm', () => {
  it('refuses a token signed with the right secret but another algorithm', async () => {
    const user = await makeUser('alg@test.com');
    const hs512 = jwt.sign({ id: user._id, tv: user.tokenVersion }, config.jwtSecret, { algorithm: 'HS512' });
    expect((await me(hs512)).status).toBe(401);
    expect((await me(signUserToken(user))).status).toBe(200);
  });
});

describe('the last admin', () => {
  it('is put back when a removal at the same moment took the other one', async () => {
    await Admin.deleteMany({});
    const a = await makeAdmin('a@test.com');
    const token = signAdminToken(a);
    // Two admins removing each other: the colleague's removal has just gone
    // through, but this request's check still counted both of them.
    jest.spyOn(Admin, 'countDocuments').mockResolvedValueOnce(2);

    const res = await asAdmin(token).del(`/api/admin/team/${a._id}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/last admin/);
    expect(await Admin.countDocuments()).toBe(1);
    expect((await asAdmin(token).get('/api/admin/profile')).status).toBe(200);
    const login = await request(app).post('/api/admin/login').send({ email: 'a@test.com', password: 'admin-pass-123' });
    expect(login.status).toBe(200);
  });

  it('still refuses to remove the only admin outright', async () => {
    const [only] = await Admin.find();
    const res = await asAdmin(signAdminToken(only)).del(`/api/admin/team/${only._id}`);
    expect(res.status).toBe(409);
  });
});

describe('rate limits', () => {
  it('lets a signed-in traveller reload the site more often than they can try passwords', async () => {
    const user = await makeUser('reloader@test.com');
    const token = signUserToken(user);
    const statuses = [];
    for (let i = 0; i < 30; i += 1) statuses.push((await me(token)).status);
    expect(statuses.every((s) => s === 200)).toBe(true);

    // ...and the reloads did not use up the sign-in attempts.
    const login = await request(app).post('/api/auth/login').send({ email: 'reloader@test.com', password: 'old-password-1' });
    expect(login.status).toBe(200);
  });

  it('limits reset emails per address, then per IP, with the usual answer until then', async () => {
    sendPasswordResetEmail.mockClear();
    await makeUser('target@test.com');
    const forgot = (email) => request(app).post('/api/auth/forgot-password').send({ email });

    // Earlier tests in this file already asked once; this IP may ask 5 times an hour.
    const forTarget = [await forgot('target@test.com'), await forgot('target@test.com'), await forgot('target@test.com')];
    expect(forTarget.map((r) => r.status)).toEqual([200, 200, 200]);
    expect((await forgot('target@test.com')).status).toBe(429); // 4th for this address
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(3);

    expect((await forgot('someone-else@test.com')).status).toBe(429); // 6th from this IP
  });
});
