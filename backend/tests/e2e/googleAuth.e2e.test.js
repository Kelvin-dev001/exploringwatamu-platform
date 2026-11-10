'use strict';

// Google sign-in links to (or creates) an account by email, so it must only
// trust emails Google has verified. Google's tokeninfo endpoint is mocked.

process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

jest.mock('axios');
const axios = require('axios');
const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const User = require('../../src/models/User');

let app;

const tokeninfo = (overrides = {}) => ({
  data: {
    aud: process.env.GOOGLE_CLIENT_ID,
    sub: 'google-sub-1',
    email: 'Victim@Example.com',
    email_verified: 'true',
    name: 'Victim',
    picture: 'https://img/avatar.png',
    ...overrides,
  },
});

beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(disconnect);
afterEach(() => axios.get.mockReset());

describe('Google sign-in', () => {
  it('refuses an unverified Google email and does not link it to an existing account', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Victim', email: 'victim@example.com', password: 'password123' });
    axios.get.mockResolvedValue(tokeninfo({ sub: 'attacker-sub', email_verified: 'false' }));

    const res = await request(app).post('/api/auth/google').send({ credential: 'id-token' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
    const victim = await User.findOne({ email: 'victim@example.com' });
    expect(victim.googleId).toBeUndefined();
  });

  it('links a verified Google email to the existing account', async () => {
    axios.get.mockResolvedValue(tokeninfo());

    const res = await request(app).post('/api/auth/google').send({ credential: 'id-token' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('victim@example.com');
    expect((await User.findOne({ email: 'victim@example.com' })).googleId).toBe('google-sub-1');
    expect(axios.get).toHaveBeenCalledWith('https://oauth2.googleapis.com/tokeninfo', expect.objectContaining({ params: { id_token: 'id-token' } }));
  });

  it('rejects a token issued for another app', async () => {
    axios.get.mockResolvedValue(tokeninfo({ aud: 'someone-else' }));
    expect((await request(app).post('/api/auth/google').send({ credential: 'id-token' })).status).toBe(401);
  });

  it('answers 401 when Google rejects the token', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockRejectedValue(Object.assign(new Error('Request failed with status code 400'), { response: { data: { error: 'invalid_token' } } }));
    expect((await request(app).post('/api/auth/google').send({ credential: 'bad' })).status).toBe(401);
  });
});
