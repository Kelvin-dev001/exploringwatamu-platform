'use strict';

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const Admin = require('../../src/models/Admin');

let app;
let adminToken;

const trip = (overrides = {}) => ({
  contact: { name: 'Amina Traveller', email: 'Amina@Example.com', phone: '+254700000000', country: 'Germany' },
  profile: { vibes: ['ocean', 'romance'], companions: 'couple', stay: 'short' },
  arrival: '2027-01-10',
  departure: '2027-01-13',
  adults: 2,
  children: 0,
  residency: 'nonResident',
  days: [
    { label: 'Day 1', items: [{ kind: 'transfer', title: 'Airport pick-up', hours: 1.5 }, { kind: 'tour', refId: 't1', title: 'Marine park snorkel', hours: 4, listedPrice: 6500 }] },
    { label: 'Day 2', items: [] },
  ],
  ideas: [{ kind: 'tour', refId: 't2', title: 'Sunset dhow', hours: 3 }],
  notes: 'Honeymoon <3',
  estimate: { total: 13000, unpriced: 1 },
  ...overrides,
});

beforeAll(async () => {
  await connect();
  app = buildApp();
  const admin = new Admin({ email: 'admin@test.com' });
  await admin.setPassword('adminpass123');
  await admin.save();
  const res = await request(app).post('/api/admin/login').send({ email: 'admin@test.com', password: 'adminpass123' });
  adminToken = res.body.token;
});
afterAll(async () => {
  await disconnect();
});

describe('Trip request (quote) flow E2E', () => {
  it('guest submits a trip -> admin lists, quotes, accepts -> unified bookings shows it', async () => {
    const created = await request(app).post('/api/trip-requests').send(trip());
    expect(created.status).toBe(201);
    expect(created.body.reference).toMatch(/^EW-[A-Z2-9]{6}$/);
    expect(created.body.status).toBe('new');
    expect(created.body.itemCount).toBe(3);
    expect(created.body.quote).toBeNull();
    expect(created.body.adminNotes).toBeUndefined();

    const list = await request(app).get('/api/trip-requests?status=new').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
    expect(list.body.counts.new).toBe(1);
    const id = list.body.data[0]._id;
    expect(list.body.data[0].contact.email).toBe('amina@example.com');

    const found = await request(app).get('/api/trip-requests?q=amina').set('Authorization', `Bearer ${adminToken}`);
    expect(found.body.total).toBe(1);

    const quoted = await request(app)
      .put(`/api/trip-requests/${id}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lines: [{ label: 'Marine park snorkel x2', amount: 13000 }, { label: 'Airport transfers', amount: '6000' }], message: 'Karibu!', validUntil: '2026-12-31' });
    expect(quoted.status).toBe(200);
    expect(quoted.body.status).toBe('quoted');
    expect(quoted.body.quote.total).toBe(19000);

    const accepted = await request(app)
      .put(`/api/trip-requests/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'accepted', notify: false });
    expect(accepted.status).toBe(200);
    expect(accepted.body.history.map((h) => h.status)).toEqual(['new', 'quoted', 'accepted']);

    const unified = await request(app).get('/api/bookings?type=triprequest').set('Authorization', `Bearer ${adminToken}`);
    expect(unified.status).toBe(200);
    expect(unified.body.data[0].amount).toBe(19000);
    expect(unified.body.data[0].customerName).toBe('Amina Traveller');
  });

  it('signed-in traveller sees their own requests only', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: 'Signed In', email: 'me@test.com', password: 'password123' });
    const token = reg.body.token;
    const mine = await request(app)
      .post('/api/trip-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(trip({ contact: { name: 'Signed In', email: 'me@test.com' } }));
    expect(mine.status).toBe(201);

    const list = await request(app).get('/api/trip-requests/mine').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].reference).toBe(mine.body.reference);
  });

  it('rejects empty trips, bad emails, bots and non-admins', async () => {
    const empty = await request(app).post('/api/trip-requests').send(trip({ days: [{ items: [] }], ideas: [] }));
    expect(empty.status).toBe(400);
    expect(empty.body.issues.map((i) => i.message)).toContain('Add at least one experience to your trip');

    const badEmail = await request(app).post('/api/trip-requests').send(trip({ contact: { name: 'X Y', email: 'nope' } }));
    expect(badEmail.status).toBe(400);

    const bot = await request(app).post('/api/trip-requests').send(trip({ website: 'http://spam' }));
    expect(bot.status).toBe(400);

    const noAuth = await request(app).get('/api/trip-requests');
    expect(noAuth.status).toBe(401);

    const quoteBeforeExists = await request(app)
      .put('/api/trip-requests/000000000000000000000000/quote')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lines: [{ label: 'x', amount: 1 }] });
    expect(quoteBeforeExists.status).toBe(404);
  });
});
