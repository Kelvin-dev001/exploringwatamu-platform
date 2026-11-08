'use strict';

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const Admin = require('../../src/models/Admin');

let app;
let token;

beforeAll(async () => {
  await connect();
  app = buildApp();
  const admin = new Admin({ email: 'owner@test.com' });
  await admin.setPassword('ownerpass123');
  await admin.save();
  const res = await request(app).post('/api/admin/login').send({ email: 'owner@test.com', password: 'ownerpass123' });
  token = res.body.token;
});
afterAll(disconnect);

const auth = (r) => r.set('Authorization', `Bearer ${token}`);

describe('Admin overview', () => {
  it('returns the dashboard shape, counting a new trip request', async () => {
    await request(app).post('/api/trip-requests').send({
      contact: { name: 'Amina T', email: 'amina@example.com', phone: '+254700000000' },
      adults: 2,
      days: [{ label: 'Day 1', items: [{ kind: 'tour', title: 'Snorkel', hours: 4 }] }],
    });
    const res = await auth(request(app).get('/api/admin/overview'));
    expect(res.status).toBe(200);
    expect(res.body.todo.tripRequests.count).toBe(1);
    expect(res.body.todo.tripRequests.items[0]).toMatchObject({ name: 'Amina T', phone: '+254700000000', items: 1 });
    expect(res.body.money).toHaveProperty('openPipeline');
    expect(res.body.content).toHaveProperty('nearlyFull');
    expect(Array.isArray(res.body.activity.recent)).toBe(true);
  });

  it('requires an admin token', async () => {
    expect((await request(app).get('/api/admin/overview')).status).toBe(401);
  });
});

describe('Admin team', () => {
  it('adds, renames, resets and removes a colleague; never the last admin', async () => {
    const created = await auth(request(app).post('/api/admin/team')).send({ email: 'Ops@Test.com', name: 'Ops', password: 'colleague-pass-1' });
    expect(created.status).toBe(201);
    expect(created.body.email).toBe('ops@test.com');

    const dupe = await auth(request(app).post('/api/admin/team')).send({ email: 'ops@test.com', password: 'colleague-pass-1' });
    expect(dupe.status).toBe(409);

    const weak = await auth(request(app).post('/api/admin/team')).send({ email: 'x@test.com', password: 'short' });
    expect(weak.status).toBe(400);

    const login = await request(app).post('/api/admin/login').send({ email: 'ops@test.com', password: 'colleague-pass-1' });
    expect(login.status).toBe(200);
    expect(login.body.admin.name).toBe('Ops');

    const list = await auth(request(app).get('/api/admin/team'));
    expect(list.body).toHaveLength(2);
    expect(list.body.find((a) => a.isYou).email).toBe('owner@test.com');
    expect(list.body.find((a) => a.email === 'ops@test.com').lastLoginAt).toBeTruthy();

    const id = created.body.id;
    expect((await auth(request(app).put(`/api/admin/team/${id}/password`)).send({ password: 'another-pass-22' })).status).toBe(200);
    expect((await auth(request(app).put(`/api/admin/team/${id}/name`)).send({ name: 'Operations' })).body.name).toBe('Operations');
    expect((await auth(request(app).delete(`/api/admin/team/${id}`))).status).toBe(200);

    const me = (await auth(request(app).get('/api/admin/team'))).body[0];
    const last = await auth(request(app).delete(`/api/admin/team/${me.id}`));
    expect(last.status).toBe(409);
  });
});
