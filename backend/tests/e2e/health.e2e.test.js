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

describe('readiness with a database', () => {
  it('answers 200 with the database up', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('stays ready when optional services (email, SMS, uploads, monitoring) are off', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.body.services).toMatchObject({ email: false, sms: false, errorMonitoring: false });
    expect(res.status).toBe(200);
  });
});
