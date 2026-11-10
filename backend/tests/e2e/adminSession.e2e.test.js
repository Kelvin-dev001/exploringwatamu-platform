'use strict';

// Removing a teammate must end their access immediately, not when their
// 2-day admin JWT expires.

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const Admin = require('../../src/models/Admin');
const Service = require('../../src/models/Service');

let app;

async function adminToken(email) {
  const admin = new Admin({ email });
  await admin.setPassword('adminpass123');
  await admin.save();
  return (await request(app).post('/api/admin/login').send({ email, password: 'adminpass123' })).body.token;
}

beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(disconnect);

describe('admin sessions', () => {
  it("a removed admin's token stops working at once", async () => {
    const owner = await adminToken('owner@test.com');
    const leaver = await adminToken('leaver@test.com');
    expect((await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${leaver}`)).status).toBe(200);

    const team = await request(app).get('/api/admin/team').set('Authorization', `Bearer ${owner}`);
    const id = team.body.find((a) => a.email === 'leaver@test.com').id;
    expect((await request(app).delete(`/api/admin/team/${id}`).set('Authorization', `Bearer ${owner}`)).status).toBe(200);

    const after = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${leaver}`);
    expect(after.status).toBe(401);
    expect(after.body.error).toMatch(/no longer exists/);

    // ...and it no longer unlocks admin-only views of public data either.
    await Service.create({ name: 'Hidden chef', description: 'd', pricingType: 'daily', price: 1, active: false });
    const list = await request(app).get('/api/services').set('Authorization', `Bearer ${leaver}`);
    expect(list.body.data).toHaveLength(0);
  });

  it('rejects user tokens on admin routes', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: 'Traveller', email: 't@test.com', password: 'password123' });
    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(403);
  });
});
