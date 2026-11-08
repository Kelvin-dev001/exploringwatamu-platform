'use strict';

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const Admin = require('../../src/models/Admin');
const Tour = require('../../src/models/Tour');
const GroupTrip = require('../../src/models/GroupTrip');
const TourBooking = require('../../src/models/TourBooking');

let app;
let token;
const auth = (r) => r.set('Authorization', `Bearer ${token}`);

beforeAll(async () => {
  await connect();
  app = buildApp();
  const admin = new Admin({ email: 'ops@test.com' });
  await admin.setPassword('opspass12345');
  await admin.save();
  token = (await request(app).post('/api/admin/login').send({ email: 'ops@test.com', password: 'opspass12345' })).body.token;
});
afterAll(disconnect);

describe('Quick edits', () => {
  it('hides a tour and changes its price without touching other fields', async () => {
    const tour = await Tour.create({ name: 'Snorkel', description: 'Reef', priceResidentAdult: 3000, priceResidentChild: 1500, priceForeignerAdult: 6000, priceForeignerChild: 3000, highlights: ['Fish'], active: true });
    const res = await auth(request(app).patch(`/api/admin/quick/tours/${tour._id}`)).send({ active: false, priceForeignerAdult: '6500' });
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
    expect(res.body.priceForeignerAdult).toBe(6500);
    expect(res.body.highlights).toEqual(['Fish']);
    expect(res.body.description).toBe('Reef');
  });

  it('rejects fields that are not quick-editable and unknown resources', async () => {
    const tour = await Tour.findOne();
    expect((await auth(request(app).patch(`/api/admin/quick/tours/${tour._id}`)).send({ name: 'Hacked' })).status).toBe(400);
    expect((await auth(request(app).patch(`/api/admin/quick/users/${tour._id}`)).send({ active: true })).status).toBe(404);
    expect((await request(app).patch(`/api/admin/quick/tours/${tour._id}`).send({ active: true })).status).toBe(401);
  });

  it('marks a group trip full and guards deposit and capacity', async () => {
    const trip = await GroupTrip.create({ title: 'Reef weekend', shortDescription: 'x', startDate: new Date(Date.now() + 9e8), endDate: new Date(Date.now() + 1e9), maxParticipants: 10, confirmedParticipants: 4, fullPrice: 20000, depositAmount: 5000, status: 'published' });
    const full = await auth(request(app).patch(`/api/admin/quick/grouptrips/${trip._id}`)).send({ status: 'full' });
    expect(full.body.status).toBe('full');
    expect((await auth(request(app).patch(`/api/admin/quick/grouptrips/${trip._id}`)).send({ depositAmount: 25000 })).status).toBe(400);
    expect((await auth(request(app).patch(`/api/admin/quick/grouptrips/${trip._id}`)).send({ maxParticipants: 3 })).status).toBe(400);
  });
});

describe('Unified booking cancel', () => {
  it('cancels a simple booking and refuses own-flow types', async () => {
    const tour = await Tour.findOne();
    const b = await TourBooking.create({ tour: tour._id, date: new Date(), adults: 2, children: 0, isResident: false, userName: 'Amina', userContact: '+254700000000' });
    const res = await auth(request(app).put(`/api/bookings/tour/${b._id}/cancel`));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
    expect((await auth(request(app).put(`/api/bookings/grouptour/${b._id}/cancel`))).status).toBe(400);
    expect((await auth(request(app).put(`/api/bookings/nope/${b._id}/cancel`))).status).toBe(400);
  });
});
