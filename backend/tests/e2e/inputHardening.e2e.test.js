'use strict';

// Public input is checked before it reaches a query: the original MVP booking
// forms, list search boxes and paging, admin notes and quotes. Errors that
// used to be swallowed into a bare 500 now go through the central handler.

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const Admin = require('../../src/models/Admin');
const User = require('../../src/models/User');
const Tour = require('../../src/models/Tour');
const Vehicle = require('../../src/models/Vehicle');
const CarHire = require('../../src/models/CarHire');
const CarHireBooking = require('../../src/models/CarHireBooking');
const PropertyForSale = require('../../src/models/PropertyForSale');
const PropertyViewingBooking = require('../../src/models/PropertyViewingBooking');
const Service = require('../../src/models/Service');
const TripRequest = require('../../src/models/TripRequest');
const { signAdminToken, signUserToken } = require('../../src/services/tokens');

let app;
let adminToken;

const PRICE = { priceResidentAdult: 3000, priceResidentChild: 1500, priceForeignerAdult: 6500, priceForeignerChild: 3500 };
const admin = (method, path) => request(app)[method](path).set('Authorization', `Bearer ${adminToken}`);

beforeAll(async () => {
  await connect();
  app = buildApp();
  const a = new Admin({ email: 'admin@test.com' });
  await a.setPassword('adminpass123');
  await a.save();
  adminToken = signAdminToken(a);
});
afterAll(disconnect);

describe('property viewings (website form)', () => {
  let property;
  beforeAll(async () => {
    property = await PropertyForSale.create({ type: 'villa', name: 'Mida Creek villa', description: 'Four bedrooms', location: 'Mida Creek', price: 45000000 });
  });

  it("still books with exactly what the website sends", async () => {
    const res = await request(app).post('/api/propertyviewings/book').send({ propertyId: String(property._id), date: '2027-02-01', time: '10:00', userName: 'Amina', userContact: '+254700000000' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ time: '10:00', userName: 'Amina', status: 'booked' });
  });

  it('refuses query operators and objects where text is expected', async () => {
    const before = await PropertyViewingBooking.countDocuments();
    const attempts = [
      { propertyId: String(property._id), date: '2027-02-02', time: { $ne: null }, userName: 'Amina', userContact: '+254700000000' },
      { propertyId: { $gt: '' }, date: '2027-02-02', time: '10:00', userName: 'Amina', userContact: '+254700000000' },
      { propertyId: String(property._id), date: '2027-02-02', time: '10:00', userName: { $ne: '' }, userContact: '+254700000000' },
    ];
    for (const body of attempts) {
      const res = await request(app).post('/api/propertyviewings/book').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    }
    const check = await request(app).post('/api/propertyviewings/check').send({ propertyId: String(property._id), date: '2027-02-01', time: { $ne: 'x' } });
    expect(check.status).toBe(400);
    expect(await PropertyViewingBooking.countDocuments()).toBe(before);
  });

  it('names the missing fields', async () => {
    const res = await request(app).post('/api/propertyviewings/book').send({ propertyId: String(property._id) });
    expect(res.status).toBe(400);
    expect(res.body.issues.map((i) => i.path).sort()).toEqual(['date', 'time', 'userContact', 'userName']);
  });
});

describe('car hire bookings', () => {
  let live;
  let hidden;
  const book = (carHireId, extra = {}) =>
    request(app).post('/api/carhire/book').send({ carHireId: String(carHireId), startDate: '2027-03-01', endDate: '2027-03-03', userName: 'Juma', userContact: 'juma@example.com', ...extra });

  beforeAll(async () => {
    const vehicle = await Vehicle.create({ name: 'Safari van', capacity: 7 });
    live = await CarHire.create({ vehicle: vehicle._id, dailyRate: 8000 });
    hidden = await CarHire.create({ vehicle: vehicle._id, dailyRate: 9000, active: false });
  });

  it('books a live car', async () => {
    expect((await book(live._id)).status).toBe(201);
  });

  it('refuses hidden and unknown cars (the public cannot see them)', async () => {
    expect((await book(hidden._id)).status).toBe(404);
    expect((await book('5f0000000000000000000000')).status).toBe(404);
    expect(await CarHireBooking.countDocuments({ carHire: hidden._id })).toBe(0);
  });

  it('refuses a return before the pick-up, without echoing database errors', async () => {
    const res = await book(live._id, { startDate: '2027-04-05', endDate: '2027-04-01' });
    expect(res.status).toBe(400);
    expect(res.body.issues).toEqual([{ path: 'endDate', message: expect.stringMatching(/cannot be before/) }]);

    const junk = await book('not-an-id');
    expect(junk.status).toBe(400);
    expect(JSON.stringify(junk.body)).not.toMatch(/Cast to ObjectId|CarHireBooking/);
  });
});

describe('service bookings', () => {
  it('validates the body before looking anything up', async () => {
    const service = await Service.create({ name: 'Private chef', description: 'Swahili dinners', pricingType: 'daily', price: 8000 });
    const ok = await request(app).post('/api/servicebookings/book').send({ serviceId: String(service._id), date: '2027-05-01', time: '18:00', duration: 3, userName: 'Wanjiru', userContact: '+254711111111' });
    expect(ok.status).toBe(201);

    const bad = await request(app).post('/api/servicebookings/check').send({ serviceId: String(service._id), date: 'soon', time: '18:00', duration: -1 });
    expect(bad.status).toBe(400);
    expect(bad.body.issues.map((i) => i.path).sort()).toEqual(['date', 'duration']);
  });
});

describe('list search and paging', () => {
  beforeAll(async () => {
    await Tour.create([
      { name: 'Reef walk', description: 'Low tide', ...PRICE },
      { name: 'Reef snorkel', description: 'Marine park', ...PRICE },
      { name: 'Sunset dhow (3+ hours)', description: 'Creek', ...PRICE },
    ]);
  });

  it('treats search text literally', async () => {
    expect((await request(app).get('/api/tours').query({ name: 'reef' })).body.total).toBe(2);
    // As a pattern, "R..f" would match "Reef"; as text it matches nothing.
    expect((await request(app).get('/api/tours').query({ name: 'R..f' })).body.total).toBe(0);
    // Pattern syntax is just characters.
    const res = await request(app).get('/api/tours').query({ name: '(3+ hours)' });
    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => t.name)).toEqual(['Sunset dhow (3+ hours)']);
    expect((await request(app).get('/api/tours').query({ name: '(a+)+$' })).status).toBe(200);
  });

  it('ignores a repeated search parameter instead of failing', async () => {
    const res = await request(app).get('/api/tours?name=reef&name=dhow');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
  });

  it('answers nonsense paging with sensible defaults (it used to be a 500)', async () => {
    for (const query of [{ limit: 'abc' }, { page: '0' }, { page: '-3', limit: '-1' }]) {
      const res = await request(app).get('/api/tours').query(query);
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
    }
  });

  it('keeps the existing page envelope and honours limit', async () => {
    const res = await request(app).get('/api/tours').query({ limit: 2, page: 2 });
    expect(res.body).toEqual({ data: [expect.any(Object)], page: 2, totalPages: 2, total: 3 });
  });

  it('serves the large pages the admin catalogue asks for (limit=1000)', async () => {
    const res = await admin('get', '/api/tours').query({ limit: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.totalPages).toBe(1);
  });

  it('escapes the search in transfers and properties too', async () => {
    expect((await request(app).get('/api/transfers').query({ search: '.*' })).body.total).toBe(0);
    expect((await request(app).get('/api/properties').query({ location: '.*' })).body.total).toBe(0);
    expect((await request(app).get('/api/properties').query({ location: 'mida' })).body.total).toBe(1);
  });
});

describe('admin notes and quotes', () => {
  let id;
  beforeAll(async () => {
    const r = await TripRequest.create({ reference: 'EW-HARD01', contact: { name: 'Amina', email: 'amina@example.com' }, days: [], adminNotes: 'Called on Monday' });
    id = String(r._id);
  });

  it('refuses notes that are not text, instead of wiping the stored ones', async () => {
    const res = await admin('put', `/api/trip-requests/${id}/notes`).send({ adminNotes: 123 });
    expect(res.status).toBe(400);
    expect((await TripRequest.findById(id)).adminNotes).toBe('Called on Monday');

    const ok = await admin('put', `/api/trip-requests/${id}/notes`).send({ adminNotes: 'Prefers WhatsApp' });
    expect(ok.status).toBe(200);
    expect(ok.body.adminNotes).toBe('Prefers WhatsApp');
  });

  it('caps the number of quote lines', async () => {
    const lines = Array.from({ length: 101 }, (_, i) => ({ label: `Line ${i}`, amount: 100 }));
    const res = await admin('put', `/api/trip-requests/${id}/quote`).send({ lines });
    expect(res.status).toBe(400);
    expect(res.body.issues[0].message).toMatch(/at most 100 lines/);
  });
});

describe('errors that used to be swallowed', () => {
  it('a listing that fails validation is a 400 with field issues, not a 500 with the raw message', async () => {
    // Passes the controller's own checks; the schema refuses the type.
    const res = await admin('post', '/api/hotels').send({ name: 'Castle stay', type: 'castle' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'Validation failed', issues: [expect.objectContaining({ path: 'type' })] });
    expect(res.body.details).toBeUndefined();
  });
});

describe('Safari Points', () => {
  it('two redemptions at the same moment cannot spend the same points', async () => {
    const user = await User.create({ name: 'Points Holder', email: 'points@test.com', safariPoints: 10 });
    const token = signUserToken(user);
    const redeem = () => request(app).post('/api/referrals/redeem-points').set('Authorization', `Bearer ${token}`).send({ points: 10 });

    const results = await Promise.all([redeem(), redeem(), redeem()]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 400, 400]);
    expect((await User.findById(user._id)).safariPoints).toBe(0);
  });

  it('refuses amounts that are not whole multiples of 10', async () => {
    const user = await User.create({ name: 'Points Two', email: 'points2@test.com', safariPoints: 100 });
    const token = signUserToken(user);
    for (const points of [5, -10, '10; drop', { $gt: 0 }, 10.5]) {
      const res = await request(app).post('/api/referrals/redeem-points').set('Authorization', `Bearer ${token}`).send({ points });
      expect(res.status).toBe(400);
    }
    expect((await User.findById(user._id)).safariPoints).toBe(100);
  });
});
