'use strict';

const request = require('supertest');
const Admin = require('../../src/models/Admin');

// A valid 1x1 PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

async function loginAsAdmin(app) {
  const admin = new Admin({ email: 'admin@test.com' });
  await admin.setPassword('adminpass123');
  await admin.save();
  const res = await request(app)
    .post('/api/admin/login')
    .send({ email: 'admin@test.com', password: 'adminpass123' });
  return res.body.token;
}

// The fields NewGroupTrip.jsx / EditGroupTrip.jsx append, as strings, the way a
// browser FormData sends them.
function groupTripFields(overrides = {}) {
  return {
    title: 'Watamu Weekend Escape',
    shortDescription: 'Two nights by the ocean',
    fullDescription: '',
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    meetingPoint: '',
    accommodationDetails: '',
    maxParticipants: '12',
    fullPrice: '25000',
    depositAmount: '10000',
    itinerary: '[]',
    includes: '[]',
    excludes: '[]',
    status: 'draft',
    ...overrides,
  };
}

// A multipart group-trip request; chain .attach() to add files.
function sendGroupTrip(app, token, method, url, overrides) {
  const req = request(app)[method](url).set('Authorization', `Bearer ${token}`);
  for (const [name, value] of Object.entries(groupTripFields(overrides))) req.field(name, value);
  return req;
}

module.exports = { PNG, loginAsAdmin, groupTripFields, sendGroupTrip };
