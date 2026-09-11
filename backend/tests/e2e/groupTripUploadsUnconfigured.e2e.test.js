'use strict';

// A server without Cloudinary credentials: the production state that turned
// "Add Group Trip" with an image into a bare 500. Trips without images must
// still work; attaching an image must answer an explicit 503.

// Empty rather than deleted, so a local .env cannot fill them back in.
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const { PNG, loginAsAdmin, sendGroupTrip } = require('./groupTripHelpers');
const buildApp = require('../../src/app');
const GroupTrip = require('../../src/models/GroupTrip');

let app;
let token;

beforeAll(async () => {
  await connect();
  app = buildApp();
  token = await loginAsAdmin(app);
});

afterAll(async () => {
  await disconnect();
});

describe('Group trip uploads without Cloudinary configured', () => {
  it('reports image uploads as disabled on /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.imageUploads).toBe(false);
  });

  it('still creates a trip with no images', async () => {
    const res = await sendGroupTrip(app, token, 'post', '/api/group-trips');
    expect(res.status).toBe(201);
  });

  it('answers 503 with an explicit message when an image is attached', async () => {
    const res = await sendGroupTrip(app, token, 'post', '/api/group-trips', { title: 'With a hero image' })
      .attach('heroImage', PNG, { filename: 'hero.png', contentType: 'image/png' });
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ code: 'UPLOAD_NOT_CONFIGURED', field: 'heroImage' });
    expect(res.body.error).toMatch(/^Image hosting is not configured/);
    expect(await GroupTrip.countDocuments({ title: 'With a hero image' })).toBe(0);
  });
});
