'use strict';

// Admin reads that used to download whole collections: one group trip by id
// (the trip form fetched every trip to find it), and the group booking lists,
// which page on request but answer exactly as before without ?page/?limit.

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const Admin = require('../../src/models/Admin');
const GroupTrip = require('../../src/models/GroupTrip');
const GroupBooking = require('../../src/models/GroupBooking');
const { signAdminToken } = require('../../src/services/tokens');

let app;
let token;
let trip;
let other;

const get = (path) => request(app).get(path).set('Authorization', `Bearer ${token}`);
const tripData = (n, status) => ({
  title: `Trip ${n}`, slug: `trip-${n}`, shortDescription: 's', startDate: new Date('2027-03-01'), endDate: new Date('2027-03-03'),
  maxParticipants: 20, fullPrice: 25000, depositAmount: 10000, status,
});

beforeAll(async () => {
  await connect();
  app = buildApp();
  const admin = new Admin({ email: 'admin@test.com' });
  await admin.setPassword('adminpass123');
  await admin.save();
  token = signAdminToken(admin);
  trip = await GroupTrip.create(tripData(1, 'draft'));
  other = await GroupTrip.create(tripData(2, 'published'));
  const user = new mongoose.Types.ObjectId();
  const booking = (t, i) => ({ trip: t._id, user, fullName: `Guest ${i}`, email: `g${i}@example.com`, phone: '1', paymentType: 'deposit', amountPaid: 0, createdAt: new Date(Date.UTC(2027, 0, 1, 0, i)) });
  await GroupBooking.insertMany([...Array.from({ length: 7 }, (_, i) => booking(trip, i)), ...Array.from({ length: 3 }, (_, i) => booking(other, 10 + i))]);
});
afterAll(disconnect);

describe('GET /api/group-trips/admin/:id', () => {
  it('returns one trip, drafts included', async () => {
    const res = await get(`/api/group-trips/admin/${trip._id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: String(trip._id), title: 'Trip 1', status: 'draft' });
  });

  it('answers 404 for an unknown or malformed id', async () => {
    expect((await get('/api/group-trips/admin/5f0000000000000000000000')).status).toBe(404);
    expect((await get('/api/group-trips/admin/not-an-id')).status).toBe(404);
  });

  it('is admin-only, and the public slug route still works', async () => {
    expect((await request(app).get(`/api/group-trips/admin/${trip._id}`)).status).toBe(401);
    expect((await request(app).get(`/api/group-trips/${other.slug}`)).status).toBe(200);
  });
});

describe('group booking admin lists', () => {
  it('answer the full array, newest first, when no paging is asked for (unchanged)', async () => {
    const all = await get('/api/group-bookings/admin/all');
    expect(Array.isArray(all.body)).toBe(true);
    expect(all.body).toHaveLength(10);
    expect(all.body[0].fullName).toBe('Guest 12');

    const byTrip = await get(`/api/group-bookings/admin/trip/${trip._id}`);
    expect(byTrip.body).toHaveLength(7);
    expect(byTrip.body[0].trip).toMatchObject({ title: 'Trip 1' });
  });

  it('page on request', async () => {
    const page2 = await get(`/api/group-bookings/admin/trip/${trip._id}?page=2&limit=3`);
    expect(page2.body).toMatchObject({ page: 2, totalPages: 3, total: 7 });
    expect(page2.body.data.map((b) => b.fullName)).toEqual(['Guest 3', 'Guest 2', 'Guest 1']);

    const firstPage = await get('/api/group-bookings/admin/all?limit=4');
    expect(firstPage.body).toMatchObject({ page: 1, totalPages: 3, total: 10 });
    expect(firstPage.body.data).toHaveLength(4);
  });

  it('caps a page at 200', async () => {
    const res = await get('/api/group-bookings/admin/all?limit=100000');
    expect(res.body.totalPages).toBe(1);
    expect(res.body.data).toHaveLength(10);
  });
});
