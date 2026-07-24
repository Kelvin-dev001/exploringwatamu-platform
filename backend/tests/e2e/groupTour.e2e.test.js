'use strict';

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const Admin = require('../../src/models/Admin');

let app;

async function seedAdminAndLogin() {
  const admin = new Admin({ email: 'admin@test.com' });
  await admin.setPassword('adminpass123');
  await admin.save();
  const res = await request(app)
    .post('/api/admin/login')
    .send({ email: 'admin@test.com', password: 'adminpass123' });
  return res.body.token;
}

async function registerUser() {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email: 'user@test.com', password: 'password123' });
  return res.body.token;
}

beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(async () => {
  await disconnect();
});

describe('Group tour lifecycle E2E', () => {
  it('create -> publish -> join -> confirm -> participants -> unified bookings -> cancel', async () => {
    const adminToken = await seedAdminAndLogin();
    expect(adminToken).toBeTruthy();
    const userToken = await registerUser();
    expect(userToken).toBeTruthy();

    // Admin creates a trip (multipart, no files).
    const create = await request(app)
      .post('/api/group-trips')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Watamu Weekend Escape')
      .field('shortDescription', 'Two nights by the ocean')
      .field('startDate', new Date(Date.now() + 7 * 86400000).toISOString())
      .field('endDate', new Date(Date.now() + 9 * 86400000).toISOString())
      .field('maxParticipants', '5')
      .field('fullPrice', '10000')
      .field('depositAmount', '3000')
      .field('status', 'draft');
    expect(create.status).toBe(201);
    const tripId = create.body._id;
    expect(tripId).toBeTruthy();

    // Publish it.
    const publish = await request(app)
      .put(`/api/group-trips/${tripId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(publish.status).toBe(200);
    expect(publish.body.status).toBe('published');

    // User requests to join (pending, no payment).
    const join = await request(app)
      .post('/api/group-bookings/join')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        tripId,
        paymentType: 'deposit',
        fullName: 'Test User',
        email: 'user@test.com',
        phone: '0700000000',
        travelPersonalities: ['Beach Bum'],
        travelGroup: 'Solo But Social',
      });
    expect(join.status).toBe(201);
    const bookingId = join.body.booking._id;
    expect(join.body.booking.status).toBe('pending');

    // Admin confirms -> claims a seat.
    const confirm = await request(app)
      .post('/api/group-bookings/confirm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bookingId });
    expect(confirm.status).toBe(200);
    expect(confirm.body.booking.status).toBe('confirmed');

    // Public participants feed shows the confirmed traveller.
    const participants = await request(app).get(`/api/group-bookings/trip/${tripId}/participants`);
    expect(participants.status).toBe(200);
    expect(participants.body.length).toBe(1);

    // Unified bookings endpoint sees it.
    const unified = await request(app)
      .get('/api/bookings?type=grouptour')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unified.status).toBe(200);
    expect(unified.body.data.length).toBeGreaterThanOrEqual(1);
    expect(unified.body.data[0].type).toBe('grouptour');

    // Admin cancels -> releases the seat.
    const cancel = await request(app)
      .put(`/api/group-bookings/admin/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.booking.status).toBe('cancelled');
  });
});
