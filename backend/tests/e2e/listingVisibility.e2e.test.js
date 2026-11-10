'use strict';

// Hidden listings (active: false) must never reach the public website, and the
// admin catalogue must still see them so they can be shown again. Before the
// fix, hidden services/properties were listed publicly and hidden transfers /
// car hire vanished from the admin.

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const Admin = require('../../src/models/Admin');
const Tour = require('../../src/models/Tour');
const Service = require('../../src/models/Service');
const PropertyForSale = require('../../src/models/PropertyForSale');
const Transfer = require('../../src/models/Transfer');
const CarHire = require('../../src/models/CarHire');
const Vehicle = require('../../src/models/Vehicle');

let app;
let token;
let vehicle;

const listOf = (res) => (Array.isArray(res.body) ? res.body : res.body.data);
const names = (res, key) => listOf(res).map((x) => x[key]).sort();

const RESOURCES = [
  {
    path: '/api/tours', key: 'name',
    make: (name, active) => Tour.create({ name, description: 'd', priceResidentAdult: 1, priceResidentChild: 1, priceForeignerAdult: 1, priceForeignerChild: 1, active }),
  },
  {
    path: '/api/services', key: 'name',
    make: (name, active) => Service.create({ name, description: 'd', pricingType: 'daily', price: 1, active }),
  },
  {
    path: '/api/properties', key: 'name',
    make: (name, active) => PropertyForSale.create({ type: 'villa', name, description: 'd', location: 'Watamu', price: 1, active }),
  },
  {
    path: '/api/transfers', key: 'description',
    make: (name, active) => Transfer.create({ route: 'Malindi-Watamu', vehicle: vehicle._id, price: 1, description: name, active }),
  },
  {
    path: '/api/carhire', key: 'description',
    make: (name, active) => CarHire.create({ vehicle: vehicle._id, dailyRate: 1, description: name, active }),
  },
];

beforeAll(async () => {
  await connect();
  app = buildApp();
  const admin = new Admin({ email: 'ops@test.com' });
  await admin.setPassword('adminpass123');
  await admin.save();
  token = (await request(app).post('/api/admin/login').send({ email: 'ops@test.com', password: 'adminpass123' })).body.token;
  vehicle = await Vehicle.create({ name: 'Land Cruiser', capacity: 7 });
  for (const r of RESOURCES) {
    r.live = await r.make('Live one', true);
    r.hidden = await r.make('Hidden one', false);
  }
});
afterAll(disconnect);

describe.each(RESOURCES)('$path visibility', (r) => {
  const asAdmin = (req) => req.set('Authorization', `Bearer ${token}`);

  it('the public list shows live listings only, even when ?active=false is asked', async () => {
    const res = await request(app).get(r.path).query({ limit: 100 });
    expect(res.status).toBe(200);
    expect(names(res, r.key)).toEqual(['Live one']);
    const sneaky = await request(app).get(r.path).query({ active: 'false', limit: 100 });
    expect(names(sneaky, r.key)).toEqual(['Live one']);
  });

  it('admins see hidden listings too, and can narrow with ?active', async () => {
    expect(names(await asAdmin(request(app).get(r.path).query({ limit: 100 })), r.key)).toEqual(['Hidden one', 'Live one']);
    expect(names(await asAdmin(request(app).get(r.path).query({ active: 'false', limit: 100 })), r.key)).toEqual(['Hidden one']);
    expect(names(await asAdmin(request(app).get(r.path).query({ active: 'true', limit: 100 })), r.key)).toEqual(['Live one']);
  });

  it('a hidden listing by id is 404 for the public and loads for admins (edit form)', async () => {
    expect((await request(app).get(`${r.path}/${r.hidden._id}`)).status).toBe(404);
    expect((await request(app).get(`${r.path}/${r.live._id}`)).status).toBe(200);
    expect((await asAdmin(request(app).get(`${r.path}/${r.hidden._id}`))).status).toBe(200);
  });

  it('a malformed id is a 404, not a 500', async () => {
    expect((await request(app).get(`${r.path}/not-an-id`)).status).toBe(404);
  });
});

describe('admin tokens on public reads', () => {
  it('an invalid token is simply treated as the public', async () => {
    const res = await request(app).get('/api/services').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(200);
    expect(names(res, 'name')).toEqual(['Live one']);
  });
});
