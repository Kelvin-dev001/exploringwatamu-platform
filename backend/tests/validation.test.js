'use strict';

const request = require('supertest');
const buildApp = require('../src/app');

const app = buildApp();

describe('Auth register validation (runs before DB access)', () => {
  it('rejects a too-short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation failed/);
  });

  it('rejects an invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'not-an-email', password: 'longenough1' });
    expect(res.status).toBe(400);
  });
});
