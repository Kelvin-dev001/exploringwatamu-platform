'use strict';

// Every email/SMS attempt is recorded in the Notification log the admin reads.
// With no SMTP or SMS configured (as in tests, and in production today) the
// attempts are recorded as "skipped" — never as "sent".

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const { loginAsAdmin } = require('./groupTripHelpers');
const buildApp = require('../../src/app');
const Notification = require('../../src/models/Notification');

let app;
let token;

// Notifications are fire-and-forget (setImmediate), so wait for them to land.
async function waitForNotifications(count, timeoutMs = 5000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if ((await Notification.countDocuments()) >= count) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`expected ${count} notifications`);
}

beforeAll(async () => {
  await connect();
  app = buildApp();
  token = await loginAsAdmin(app);
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(async () => {
  jest.restoreAllMocks();
  await disconnect();
});

describe('notification log', () => {
  it('records the trip-request email and SMS as skipped, and the admin can list them', async () => {
    const res = await request(app).post('/api/trip-requests').send({
      contact: { name: 'Amina', email: 'amina@example.com', phone: '+254700000000' },
      adults: 2,
      days: [{ items: [{ kind: 'tour', title: 'Snorkel' }] }],
    });
    expect(res.status).toBe(201);

    await waitForNotifications(2);
    const log = await Notification.find().lean();
    expect(log.map((n) => `${n.channel}:${n.event}:${n.status}`).sort()).toEqual(['email:trip_requested:skipped', 'sms:trip_requested:skipped']);
    expect(log.find((n) => n.channel === 'email')).toMatchObject({ to: 'amina@example.com', subject: expect.stringContaining(res.body.reference) });

    const list = await request(app).get('/api/notifications').query({ channel: 'email' }).set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
    expect(list.body.data[0]).toMatchObject({ channel: 'email', status: 'skipped', event: 'trip_requested' });
  });
});
