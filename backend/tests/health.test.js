'use strict';

const request = require('supertest');
const buildApp = require('../src/app');

const app = buildApp();

describe('Health & routing', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('unknown route returns 404 JSON', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Route not found/);
  });

  it('M-Pesa routes are gated off by default', async () => {
    const res = await request(app).post('/api/mpesa/stkpush').send({});
    expect(res.status).toBe(404);
  });
});
