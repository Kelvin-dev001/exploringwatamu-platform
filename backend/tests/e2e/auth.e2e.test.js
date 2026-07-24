'use strict';

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');

let app;

beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(async () => {
  await disconnect();
});

describe('Auth E2E', () => {
  it('registers, logs in, and rejects a wrong password', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada Lovelace', email: 'ada@test.com', password: 'password123' });
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeTruthy();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@test.com', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@test.com', password: 'wrongpass' });
    expect(bad.status).toBe(401);
  });

  it('handles forgot/reset password safely', async () => {
    // Unknown email still returns 200 (never reveals whether an account exists).
    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@test.com' });
    expect(forgot.status).toBe(200);

    // An invalid/expired reset token is rejected.
    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-but-long-enough-token', password: 'newpassword123' });
    expect(reset.status).toBe(400);
  });
});
