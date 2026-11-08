'use strict';

// Admin group-trip create/update over multipart/form-data, with Cloudinary
// configured and its storage engine mocked (no network). Covers the payload
// validation and upload-error mapping that used to surface as a bare 500.

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

// Stands in for multer-storage-cloudinary: consumes the file, then answers the
// way Cloudinary would. The uploaded file name picks the outcome.
jest.mock('multer-storage-cloudinary', () => ({
  CloudinaryStorage: class MockCloudinaryStorage {
    constructor({ params }) {
      this.params = params;
    }

    async _handleFile(req, file, cb) {
      const params = await this.params(req, file);
      file.stream.on('end', () => {
        if (file.originalname.startsWith('cloudinary-401')) {
          return cb({ message: "Invalid Signature 0f3c. String to sign - 'folder=group-trips&timestamp=1'.", http_code: 401 });
        }
        if (file.originalname.startsWith('cloudinary-400')) {
          return cb({ message: 'Image file format gif not allowed', http_code: 400 });
        }
        const format = params.format ? `?format=${params.format}` : '';
        return cb(null, {
          path: `https://res.cloudinary.test/${params.folder}/${file.originalname}${format}`,
          filename: `${params.folder}/${file.originalname}`,
        });
      });
      file.stream.resume();
    }

    _removeFile(req, file, cb) {
      cb(null);
    }
  },
}));

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const { PNG, loginAsAdmin, sendGroupTrip } = require('./groupTripHelpers');
const buildApp = require('../../src/app');
const GroupTrip = require('../../src/models/GroupTrip');
const { MAX_FILE_SIZE } = require('../../src/middleware/upload');

let app;
let token;

const createTrip = (overrides) => sendGroupTrip(app, token, 'post', '/api/group-trips', overrides);

beforeAll(async () => {
  await connect();
  app = buildApp();
  token = await loginAsAdmin(app);
});

afterAll(async () => {
  await disconnect();
});

afterEach(async () => {
  await GroupTrip.deleteMany({});
});

describe('Admin group trip create (multipart, Cloudinary configured)', () => {
  it('reports image uploads as enabled on /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.imageUploads).toBe(true);
  });

  it('creates a trip with no images', async () => {
    const res = await createTrip();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Watamu Weekend Escape',
      status: 'draft',
      maxParticipants: 12,
      fullPrice: 25000,
      depositAmount: 10000,
      slotsRemaining: 12,
      heroImage: '',
      gallery: [],
    });
  });

  it('stores uploaded image URLs and converts HEIC to JPG', async () => {
    const res = await createTrip()
      .attach('heroImage', PNG, { filename: 'hero.png', contentType: 'image/png' })
      .attach('gallery', PNG, { filename: 'beach.heic', contentType: 'image/heic' });
    expect(res.status).toBe(201);
    expect(res.body.heroImage).toBe('https://res.cloudinary.test/group-trips/hero.png');
    expect(res.body.gallery).toEqual(['https://res.cloudinary.test/group-trips/beach.heic?format=jpg']);
  });

  it('returns 400 with field-level issues when required fields are blank', async () => {
    const res = await createTrip({ title: '', maxParticipants: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.issues).toEqual(expect.arrayContaining([
      { path: 'title', message: 'Title is required' },
      { path: 'maxParticipants', message: 'Max participants is required' },
    ]));
    expect(await GroupTrip.countDocuments()).toBe(0);
  });

  it('refuses maxParticipants 0 instead of creating a trip that is born "full"', async () => {
    const res = await createTrip({ maxParticipants: '0' });
    expect(res.status).toBe(400);
    expect(res.body.issues).toContainEqual({ path: 'maxParticipants', message: 'Max participants must be at least 1' });
  });

  it('returns 502 with the Cloudinary reason when the upload fails', async () => {
    const res = await createTrip()
      .attach('heroImage', PNG, { filename: 'cloudinary-401.png', contentType: 'image/png' });
    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ code: 'UPLOAD_FAILED', field: 'heroImage' });
    expect(res.body.error).toMatch(/^Image upload failed: Invalid Signature/);
    expect(await GroupTrip.countDocuments()).toBe(0);
  });

  it('returns 400 when Cloudinary rejects the file', async () => {
    const res = await createTrip()
      .attach('gallery', PNG, { filename: 'cloudinary-400.gif', contentType: 'image/gif' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'UPLOAD_REJECTED', field: 'gallery' });
    expect(res.body.error).toMatch(/was rejected: Image file format gif not allowed/);
  });

  it('returns 400 naming the field when an image is over the size limit', async () => {
    const res = await createTrip()
      .attach('heroImage', Buffer.alloc(MAX_FILE_SIZE + 1), { filename: 'huge.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'LIMIT_FILE_SIZE', field: 'heroImage' });
    expect(res.body.error).toMatch(/8 MB/);
  });

  it('returns 400 naming the field when more than 10 gallery images are sent', async () => {
    const req = createTrip();
    for (let i = 0; i < 11; i += 1) {
      req.attach('gallery', PNG, { filename: `g${i}.png`, contentType: 'image/png' });
    }
    const res = await req;
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'LIMIT_UNEXPECTED_FILE', field: 'gallery' });
    expect(res.body.error).toMatch(/at most 10/);
  });

  it('returns 400 for a file on an unexpected field', async () => {
    const res = await createTrip()
      .attach('avatar', PNG, { filename: 'me.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'LIMIT_UNEXPECTED_FILE', field: 'avatar' });
  });
});

describe('Admin group trip update (multipart)', () => {
  it('validates the edit form, then applies it', async () => {
    const created = await createTrip();
    const url = `/api/group-trips/${created.body._id}`;

    const invalid = await sendGroupTrip(app, token, 'put', url, { depositAmount: '30000' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.issues).toContainEqual({
      path: 'depositAmount',
      message: 'Deposit amount cannot exceed the full price',
    });

    const updated = await sendGroupTrip(app, token, 'put', url, {
      title: 'Watamu Long Weekend',
      maxParticipants: '20',
      existingGallery: '[]',
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ title: 'Watamu Long Weekend', maxParticipants: 20 });
  });
});
