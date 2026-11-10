'use strict';

// Seat accounting under the conditions phones create: double taps on Confirm
// or Cancel, and editing a trip that already has confirmed travellers.

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const { loginAsAdmin, sendGroupTrip } = require('./groupTripHelpers');
const buildApp = require('../../src/app');
const GroupTrip = require('../../src/models/GroupTrip');
const GroupBooking = require('../../src/models/GroupBooking');
const User = require('../../src/models/User');

let app;
let token;
let user;

const auth = (r) => r.set('Authorization', `Bearer ${token}`);

async function trip(overrides = {}) {
  return GroupTrip.create({
    title: 'Reef & Rhythm',
    shortDescription: 'A weekend by the reef',
    startDate: new Date(Date.now() + 10 * 86400000),
    endDate: new Date(Date.now() + 12 * 86400000),
    maxParticipants: 4,
    fullPrice: 20000,
    depositAmount: 5000,
    status: 'published',
    ...overrides,
  });
}

const pending = (t, n = 1) =>
  Promise.all(
    Array.from({ length: n }, (_, i) =>
      GroupBooking.create({ trip: t._id, user: user._id, fullName: `Traveller ${i}`, email: `t${i}@test.com`, phone: '0700000000', paymentType: 'deposit', amountPaid: 5000, amountDue: 15000 })
    )
  );

const confirm = (bookingId) => auth(request(app).post('/api/group-bookings/confirm')).send({ bookingId });
const cancel = (bookingId) => auth(request(app).put(`/api/group-bookings/admin/${bookingId}/cancel`));

beforeAll(async () => {
  await connect();
  app = buildApp();
  token = await loginAsAdmin(app);
  user = await User.create({ name: 'Traveller', email: 'traveller@test.com' });
});
afterAll(disconnect);

describe('group booking seats', () => {
  it('a double-tapped Confirm takes exactly one seat', async () => {
    const t = await trip();
    const [b] = await pending(t);

    const results = await Promise.all([confirm(b._id), confirm(b._id), confirm(b._id)]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 400, 400]);
    expect((await GroupTrip.findById(t._id)).confirmedParticipants).toBe(1);
    expect((await GroupBooking.findById(b._id)).status).toBe('confirmed');
  });

  it('a double-tapped Cancel releases the seat once', async () => {
    const t = await trip();
    const [a, b] = await pending(t, 2);
    await confirm(a._id);
    await confirm(b._id);

    const results = await Promise.all([cancel(a._id), cancel(a._id)]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
    expect((await GroupTrip.findById(t._id)).confirmedParticipants).toBe(1);
  });

  it('never oversells: the last seat goes to one booking and the next is refused', async () => {
    const t = await trip({ maxParticipants: 2 });
    const bookings = await pending(t, 4);

    const results = await Promise.all(bookings.map((b) => confirm(b._id)));

    expect(results.filter((r) => r.status === 200)).toHaveLength(2);
    const after = await GroupTrip.findById(t._id);
    expect(after.confirmedParticipants).toBe(2);
    expect(after.status).toBe('full');
    // Refused confirmations go back to pending, so they can be confirmed if a seat frees up.
    expect(await GroupBooking.countDocuments({ trip: t._id, status: 'pending' })).toBe(2);
  });

  it('cancelling a confirmed booking on a full trip reopens it', async () => {
    const t = await trip({ maxParticipants: 1 });
    const [b] = await pending(t);
    await confirm(b._id);
    expect((await GroupTrip.findById(t._id)).status).toBe('full');

    const res = await cancel(b._id);

    expect(res.status).toBe(200);
    expect(res.body.delivery).toEqual({ email: false, sms: false });
    const after = await GroupTrip.findById(t._id);
    expect(after).toMatchObject({ confirmedParticipants: 0, status: 'published' });
  });

  it('the full edit form cannot cut seats below the travellers already confirmed', async () => {
    const t = await trip();
    const [a, b] = await pending(t, 2);
    await confirm(a._id);
    await confirm(b._id);

    const res = await sendGroupTrip(app, token, 'put', `/api/group-trips/${t._id}`, { maxParticipants: '1', status: 'published' });

    expect(res.status).toBe(400);
    expect(res.body.issues).toContainEqual({ path: 'maxParticipants', message: 'There are already 2 confirmed travellers.' });
    expect((await GroupTrip.findById(t._id)).maxParticipants).toBe(4);
  });

  it('confirming an unknown or malformed booking id is a clean 4xx', async () => {
    expect((await confirm('000000000000000000000000')).status).toBe(404);
    expect((await confirm('nope')).status).toBe(400);
  });
});
