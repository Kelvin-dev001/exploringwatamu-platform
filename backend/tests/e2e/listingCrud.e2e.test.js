'use strict';

// Create → read → update → delete for every listing type, the way the admin
// forms send them (JSON for transfers and car hire, multipart for the rest).
// No images here: photo handling is covered by listingPhotos.e2e.test.js.

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const { loginAsAdmin } = require('./groupTripHelpers');
const buildApp = require('../../src/app');
const Vehicle = require('../../src/models/Vehicle');

let app;
let token;
let vehicleId;

const auth = (r) => r.set('Authorization', `Bearer ${token}`);
const multipart = (method, path, fields) => {
  const r = auth(request(app)[method](path));
  Object.entries(fields).forEach(([k, v]) => r.field(k, v));
  return r;
};

const TYPES = [
  {
    path: '/api/tours', key: 'name', send: multipart,
    create: () => ({ name: 'Gede Ruins walk', description: 'Ancient Swahili town', priceResidentAdult: '1500', priceResidentChild: '800', priceForeignerAdult: '3500', priceForeignerChild: '1800', highlights: '["Baobabs"]', whatToCarry: '[]', vehicles: '[]', active: 'true', vibes: '["culture"]' }),
    update: (f) => ({ ...f, name: 'Gede Ruins sunset walk' }),
    check: (body) => expect(body).toMatchObject({ priceForeignerAdult: 3500, highlights: ['Baobabs'], vibes: ['culture'] }),
  },
  {
    path: '/api/services', key: 'name', send: multipart,
    create: () => ({ name: 'Massage', description: 'Beach massage', pricingType: 'hourly', price: '4000', availableDays: '["Monday"]', availableHours: '{"start":"09:00","end":"17:00"}', active: 'true' }),
    update: (f) => ({ ...f, name: 'Sunset massage' }),
    check: (body) => expect(body).toMatchObject({ price: 4000, availableDays: ['Monday'], availableHours: { start: '09:00', end: '17:00' } }),
  },
  {
    path: '/api/properties', key: 'name', send: multipart,
    create: () => ({ type: 'land', name: 'Half-acre plot', description: 'Near the creek', location: 'Mida Creek', price: '6000000', active: 'true' }),
    update: (f) => ({ ...f, name: 'Half-acre creek plot' }),
    check: (body) => expect(body).toMatchObject({ type: 'land', price: 6000000 }),
  },
  {
    path: '/api/hotels', key: 'name', send: multipart,
    create: () => ({ name: 'Mangrove Lodge', type: 'villa', stars: '4', description: 'Quiet', pricePerNight: '12000', location: '{"address":"Watamu"}', facilities: '["Pool"]', contact: '{"whatsapp":"+254700000000"}' }),
    update: (f) => ({ ...f, name: 'Mangrove Eco Lodge' }),
    check: (body) => expect(body).toMatchObject({ stars: 4, facilities: ['Pool'], location: { address: 'Watamu' } }),
  },
  {
    path: '/api/vehicles', key: 'name', send: multipart,
    create: () => ({ name: 'Tuk-tuk', capacity: '3', description: 'Around town' }),
    update: (f) => ({ ...f, name: 'Electric tuk-tuk' }),
    check: (body) => expect(body).toMatchObject({ capacity: 3 }),
  },
  {
    path: '/api/transfers', key: 'description', send: (method, path, body) => auth(request(app)[method](path)).send(body),
    create: () => ({ route: 'Malindi-Watamu', vehicle: vehicleId, price: 4000, active: true, description: 'Airport pick-up' }),
    update: (f) => ({ ...f, description: 'Airport pick-up, meet & greet' }),
    check: (body) => expect(body).toMatchObject({ route: 'Malindi-Watamu', price: 4000 }),
  },
  {
    path: '/api/carhire', key: 'description', send: (method, path, body) => auth(request(app)[method](path)).send(body),
    create: () => ({ vehicle: vehicleId, dailyRate: 6000, active: true, description: 'Self-drive' }),
    update: (f) => ({ ...f, description: 'Self-drive, unlimited km' }),
    check: (body) => expect(body).toMatchObject({ dailyRate: 6000 }),
  },
];

beforeAll(async () => {
  await connect();
  app = buildApp();
  token = await loginAsAdmin(app);
  vehicleId = String((await Vehicle.create({ name: 'Land Cruiser', capacity: 7 }))._id);
});
afterAll(disconnect);

describe.each(TYPES)('$path', (t) => {
  it('creates, reads, updates and deletes', async () => {
    const fields = t.create();
    const created = await t.send('post', t.path, fields);
    expect(created.status).toBe(201);
    t.check(created.body);
    const id = created.body._id;

    const read = await auth(request(app).get(`${t.path}/${id}`));
    expect(read.status).toBe(200);
    expect(read.body[t.key]).toBe(created.body[t.key]);

    const updatedFields = t.update(fields);
    const updated = await t.send('put', `${t.path}/${id}`, updatedFields);
    expect(updated.status).toBe(200);
    expect(updated.body[t.key]).toBe(updatedFields[t.key]);

    expect((await auth(request(app).delete(`${t.path}/${id}`))).status).toBe(200);
    expect((await auth(request(app).get(`${t.path}/${id}`))).status).toBe(404);
  });
});

describe('listing validation', () => {
  it('refuses a tour without a name or prices, and saves nothing', async () => {
    const res = await multipart('post', '/api/tours', { description: 'No name', highlights: '[]', whatToCarry: '[]', vehicles: '[]' });
    expect(res.status).toBe(400);
    expect((await request(app).get('/api/tours')).body.total).toBe(0);
  });

  it('refuses a transfer on a route we do not run', async () => {
    const res = await auth(request(app).post('/api/transfers')).send({ route: 'Nairobi-Watamu', vehicle: vehicleId, price: 1 });
    expect(res.status).toBe(400);
  });
});
