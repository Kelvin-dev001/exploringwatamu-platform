'use strict';

// Languages through the real API: the website's language is stored on trip
// requests and group bookings (and anything else is refused), the reset link
// opens in it, and listings take optional Italian text that the public sees,
// that can be cleared, and that never becomes required.

jest.mock('../../src/services/notifications/authNotifications', () => ({ sendPasswordResetEmail: jest.fn(async () => {}) }));

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const { loginAsAdmin, groupTripFields } = require('./groupTripHelpers');
const buildApp = require('../../src/app');
const GroupTrip = require('../../src/models/GroupTrip');
const TripRequest = require('../../src/models/TripRequest');
const Vehicle = require('../../src/models/Vehicle');
const { sendPasswordResetEmail } = require('../../src/services/notifications/authNotifications');

let app;
let adminToken;

const tripBody = (overrides = {}) => ({
  contact: { name: 'Giulia Rossi', email: 'giulia@example.com' },
  adults: 2,
  days: [{ label: 'Day 1', items: [{ kind: 'tour', title: 'Marine park snorkel', hours: 4 }] }],
  ...overrides,
});
const admin = (r) => r.set('Authorization', `Bearer ${adminToken}`);
const multipart = (method, path, fields) => {
  const r = admin(request(app)[method](path));
  Object.entries(fields).forEach(([k, v]) => r.field(k, v));
  return r;
};

beforeAll(async () => {
  await connect();
  app = buildApp();
  adminToken = await loginAsAdmin(app);
});
afterAll(disconnect);

describe('the traveller’s language', () => {
  it('is stored on a trip request and shown to the team', async () => {
    const res = await request(app).post('/api/trip-requests').send(tripBody({ locale: 'it' }));
    expect(res.status).toBe(201);
    const stored = await TripRequest.findOne({ reference: res.body.reference });
    expect(stored.locale).toBe('it');
    const list = await admin(request(app).get('/api/trip-requests'));
    expect(list.body.data.find((r) => r.reference === res.body.reference).locale).toBe('it');
  });

  it('defaults to English, and refuses a language the site doesn’t have', async () => {
    const plain = await request(app).post('/api/trip-requests').send(tripBody());
    expect((await TripRequest.findOne({ reference: plain.body.reference })).locale).toBe('en');
    const french = await request(app).post('/api/trip-requests').send(tripBody({ locale: 'fr' }));
    expect(french.status).toBe(400);
  });

  it('is stored on a group booking', async () => {
    const trip = await GroupTrip.create({ title: 'Reef weekend', shortDescription: 'Two nights', startDate: '2027-03-01', endDate: '2027-03-03', maxParticipants: 8, fullPrice: 20000, depositAmount: 5000, status: 'published' });
    const reg = await request(app).post('/api/auth/register').send({ name: 'Marco Bianchi', email: 'marco@example.com', password: 'password-123' });
    const join = await request(app)
      .post('/api/group-bookings/join')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ tripId: String(trip._id), paymentType: 'deposit', fullName: 'Marco Bianchi', email: 'marco@example.com', phone: '+393331234567', travelPersonalities: ['Beach Bum'], travelGroup: 'Solo But Social', locale: 'it' });
    expect(join.status).toBe(201);
    expect(join.body.booking.locale).toBe('it');
  });

  it('opens the password reset link in the language the request came from', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Ada', email: 'ada@example.com', password: 'password-123' });
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ada@example.com', locale: 'it' });
    expect(res.status).toBe(200);
    const [, url, locale] = sendPasswordResetEmail.mock.calls.at(-1);
    expect(url).toMatch(/^http:\/\/localhost:5173\/it\/reset-password\?token=[a-f0-9]{64}$/);
    expect(locale).toBe('it');

    await request(app).post('/api/auth/forgot-password').send({ email: 'ada@example.com' });
    expect(sendPasswordResetEmail.mock.calls.at(-1)[1]).toMatch(/^http:\/\/localhost:5173\/reset-password\?token=/);
  });
});

describe('optional Italian listing text', () => {
  it('is saved, shown publicly, cleared with a blank and never required (tours)', async () => {
    const base = { name: 'Marine park snorkel', description: 'Reef and turtles', priceResidentAdult: '3000', priceResidentChild: '1500', priceForeignerAdult: '6500', priceForeignerChild: '3000', highlights: '[]', whatToCarry: '[]', vehicles: '[]', active: 'true' };
    const plain = await multipart('post', '/api/tours', base);
    expect(plain.status).toBe(201);
    expect(plain.body.titleIt).toBeUndefined();

    const created = await multipart('post', '/api/tours', { ...base, titleIt: '  Snorkeling nel parco marino ', descriptionIt: 'Barriera e tartarughe' });
    expect(created.status).toBe(201);
    const pub = await request(app).get(`/api/tours/${created.body._id}`);
    expect(pub.body).toMatchObject({ name: 'Marine park snorkel', titleIt: 'Snorkeling nel parco marino', descriptionIt: 'Barriera e tartarughe' });

    const cleared = await multipart('put', `/api/tours/${created.body._id}`, { ...base, descriptionIt: '' });
    expect(cleared.status).toBe(200);
    expect(cleared.body.descriptionIt).toBe('');
    expect(cleared.body.titleIt).toBe('Snorkeling nel parco marino'); // not sent: kept

    const tooLong = await multipart('post', '/api/tours', { ...base, titleIt: 'x'.repeat(201) });
    expect(tooLong.status).toBe(400);
  });

  it('works for group trips through the admin form validation', async () => {
    const created = await multipart('post', '/api/group-trips', groupTripFields({ titleIt: 'Fuga nel weekend', shortDescriptionIt: 'Due notti sull’oceano', descriptionIt: '' }));
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ titleIt: 'Fuga nel weekend', shortDescriptionIt: 'Due notti sull’oceano' });
    const updated = await multipart('put', `/api/group-trips/${created.body._id}`, groupTripFields({ shortDescriptionIt: '' }));
    expect(updated.status).toBe(200);
    expect(updated.body.shortDescriptionIt).toBe('');
    expect(updated.body.titleIt).toBe('Fuga nel weekend');
    const tooLong = await multipart('post', '/api/group-trips', groupTripFields({ shortDescriptionIt: 'x'.repeat(1001) }));
    expect(tooLong.status).toBe(400);
  });

  it('is saved for stays, transfers, car hire, services and property', async () => {
    const vehicle = await Vehicle.create({ name: 'Land Cruiser', capacity: 7 });
    const cases = [
      ['/api/hotels', multipart, { name: 'Mangrove Lodge', type: 'villa', description: 'Quiet', descriptionIt: 'Tranquillo' }, { descriptionIt: 'Tranquillo' }],
      ['/api/services', multipart, { name: 'Massage', description: 'Beach massage', pricingType: 'hourly', price: '4000', availableDays: '[]', active: 'true', titleIt: 'Massaggio', descriptionIt: 'Massaggio in spiaggia' }, { titleIt: 'Massaggio', descriptionIt: 'Massaggio in spiaggia' }],
      ['/api/properties', multipart, { type: 'land', name: 'Plot', description: 'Near the creek', location: 'Mida Creek', price: '6000000', active: 'true', titleIt: 'Terreno', descriptionIt: 'Vicino al creek' }, { titleIt: 'Terreno', descriptionIt: 'Vicino al creek' }],
      ['/api/transfers', (m, p, b) => admin(request(app)[m](p)).send(b), { route: 'Malindi-Watamu', vehicle: String(vehicle._id), price: 4000, active: true, description: 'Pick-up', descriptionIt: 'Transfer' }, { descriptionIt: 'Transfer' }],
      ['/api/carhire', (m, p, b) => admin(request(app)[m](p)).send(b), { vehicle: String(vehicle._id), dailyRate: 6000, active: true, description: 'Self-drive', descriptionIt: 'Guidi tu' }, { descriptionIt: 'Guidi tu' }],
    ];
    for (const [path, send, body, expected] of cases) {
      const res = await send('post', path, body);
      expect({ path, status: res.status }).toEqual({ path, status: 201 });
      expect(res.body).toMatchObject(expected);
    }
  });
});
