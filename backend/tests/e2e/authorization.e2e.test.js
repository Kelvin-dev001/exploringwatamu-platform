'use strict';

// Who may call what. Every admin-only endpoint refuses anonymous callers (401)
// and traveller tokens (403); traveller endpoints refuse admin tokens and only
// ever return the caller's own bookings and requests.

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const Admin = require('../../src/models/Admin');
const GroupTrip = require('../../src/models/GroupTrip');

let app;
let adminToken;
let ada;
let bo;

const ID = '64b000000000000000000001'; // well-formed, matches nothing

const ADMIN_ONLY = [
  ['get', '/api/admin/overview'],
  ['get', '/api/admin/stats'],
  ['get', '/api/admin/recent-bookings'],
  ['get', '/api/admin/profile'],
  ['get', '/api/admin/team'],
  ['post', '/api/admin/team'],
  ['delete', `/api/admin/team/${ID}`],
  ['patch', `/api/admin/quick/tours/${ID}`],
  ['get', '/api/trip-requests'],
  ['get', `/api/trip-requests/${ID}`],
  ['put', `/api/trip-requests/${ID}/quote`],
  ['put', `/api/trip-requests/${ID}/status`],
  ['put', `/api/trip-requests/${ID}/notes`],
  ['get', '/api/bookings'],
  ['get', '/api/bookings/summary'],
  ['put', `/api/bookings/tour/${ID}/cancel`],
  ['get', '/api/notifications'],
  ['post', '/api/group-bookings/confirm'],
  ['put', `/api/group-bookings/admin/${ID}/cancel`],
  ['get', '/api/group-bookings/admin/all'],
  ['get', `/api/group-bookings/admin/trip/${ID}`],
  ['get', '/api/group-trips/admin/all'],
  ['get', `/api/group-trips/admin/${ID}`],
  ['post', '/api/group-trips'],
  ['put', `/api/group-trips/${ID}`],
  ['put', `/api/group-trips/${ID}/publish`],
  ['delete', `/api/group-trips/${ID}`],
  ...['tours', 'hotels', 'services', 'properties', 'transfers', 'carhire', 'vehicles'].flatMap((r) => [
    ['post', `/api/${r}`],
    ['put', `/api/${r}/${ID}`],
    ['delete', `/api/${r}/${ID}`],
  ]),
  ['get', '/api/reviews/admin'],
  ['get', `/api/reviews/admin/${ID}`],
  ['put', `/api/reviews/admin/${ID}/status`],
  ['put', `/api/reviews/admin/${ID}/reply`],
  ['get', '/api/tourbookings'],
  ['get', '/api/carhirebookings'],
  ['get', '/api/servicebookings'],
  ['get', '/api/propertyviewings'],
];

async function traveller(name, email) {
  const res = await request(app).post('/api/auth/register').send({ name, email, password: 'password123' });
  return res.body.token;
}

beforeAll(async () => {
  await connect();
  app = buildApp();
  const admin = new Admin({ email: 'admin@test.com' });
  await admin.setPassword('adminpass123');
  await admin.save();
  adminToken = (await request(app).post('/api/admin/login').send({ email: 'admin@test.com', password: 'adminpass123' })).body.token;
  ada = await traveller('Ada', 'ada@test.com');
  bo = await traveller('Bo', 'bo@test.com');
});
afterAll(disconnect);

describe('admin-only endpoints', () => {
  it.each(ADMIN_ONLY)('%s %s refuses the public (401) and travellers (403)', async (method, path) => {
    expect((await request(app)[method](path)).status).toBe(401);
    expect((await request(app)[method](path).set('Authorization', `Bearer ${ada}`)).status).toBe(403);
  });

  it('refuses a token signed with another secret', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ id: ID, admin: true }, 'not-the-server-secret-at-all');
    expect((await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${forged}`)).status).toBe(401);
  });
});

describe('traveller endpoints', () => {
  it.each([
    ['get', '/api/auth/me'],
    ['post', '/api/auth/resend-verification'],
    ['get', '/api/trip-requests/mine'],
    ['get', '/api/group-bookings/my-bookings'],
    ['post', '/api/group-bookings/join'],
    ['get', '/api/reviews/eligible'],
    ['get', '/api/reviews/mine'],
    ['post', '/api/reviews'],
    ['post', `/api/reviews/${ID}/photos`],
  ])('%s %s needs a traveller token and refuses admin tokens', async (method, path) => {
    expect((await request(app)[method](path)).status).toBe(401);
    expect((await request(app)[method](path).set('Authorization', `Bearer ${adminToken}`)).status).toBe(403);
  });

  it("only returns the caller's own bookings and quote requests", async () => {
    const trip = await GroupTrip.create({
      title: 'Reef weekend', shortDescription: 'Two nights', startDate: new Date(Date.now() + 864e6), endDate: new Date(Date.now() + 1037e6),
      maxParticipants: 5, fullPrice: 10000, depositAmount: 3000, status: 'published',
    });
    const join = await request(app).post('/api/group-bookings/join').set('Authorization', `Bearer ${ada}`).send({
      tripId: String(trip._id), paymentType: 'deposit', fullName: 'Ada', email: 'ada@test.com', phone: '0700000000', travelPersonalities: ['Beach Bum'], travelGroup: 'Solo But Social',
    });
    expect(join.status).toBe(201);
    await request(app).post('/api/trip-requests').set('Authorization', `Bearer ${ada}`).send({
      contact: { name: 'Ada', email: 'ada@test.com' }, adults: 1, days: [{ items: [{ kind: 'tour', title: 'Snorkel' }] }],
    });

    const adaBookings = await request(app).get('/api/group-bookings/my-bookings').set('Authorization', `Bearer ${ada}`);
    expect(adaBookings.body).toHaveLength(1);
    expect((await request(app).get('/api/group-bookings/my-bookings').set('Authorization', `Bearer ${bo}`)).body).toHaveLength(0);
    expect((await request(app).get('/api/trip-requests/mine').set('Authorization', `Bearer ${ada}`)).body).toHaveLength(1);
    expect((await request(app).get('/api/trip-requests/mine').set('Authorization', `Bearer ${bo}`)).body).toHaveLength(0);

    // The traveller view of a quote request never includes admin notes or contact details.
    const mine = (await request(app).get('/api/trip-requests/mine').set('Authorization', `Bearer ${ada}`)).body[0];
    expect(mine).not.toHaveProperty('adminNotes');
    expect(mine).not.toHaveProperty('contact');
  });

  it('a traveller cannot confirm their own booking', async () => {
    const res = await request(app).post('/api/group-bookings/confirm').set('Authorization', `Bearer ${ada}`).send({ bookingId: ID });
    expect(res.status).toBe(403);
  });
});
