'use strict';

// The admin forms' photo contract on update (multipart): new photos are files,
// kept photos are a JSON list (existingGallery / existingPictures /
// existingDocuments / existingImages). A kept list that is sent replaces the
// stored photos; one that is left out must never wipe them.

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
jest.mock('multer-storage-cloudinary', () => require('./cloudinaryMock'));

const request = require('supertest');
const { connect, disconnect } = require('./dbSetup');
const { PNG, loginAsAdmin, sendGroupTrip } = require('./groupTripHelpers');
const buildApp = require('../../src/app');

let app;
let token;

const url = (folder, name) => `https://res.cloudinary.test/${folder}/${name}`;
const png = (name) => [PNG, { filename: name, contentType: 'image/png' }];

// A multipart request with the given text fields; chain .attach() for files.
function send(method, path, fields) {
  const req = request(app)[method](path).set('Authorization', `Bearer ${token}`);
  for (const [k, v] of Object.entries(fields)) req.field(k, v);
  return req;
}

const TOUR = {
  name: 'Marine park snorkel', description: 'Reef and sandbank', duration: 'Half day', recommendedTimes: '',
  priceForeignerAdult: '6500', priceForeignerChild: '3500', priceResidentAdult: '3000', priceResidentChild: '1500',
  highlights: '[]', whatToCarry: '[]', vehicles: '[]', active: 'true',
};
const SERVICE = { name: 'Private chef', description: 'Swahili dinners', pricingType: 'daily', price: '8000', availableDays: '[]', availableHours: '{"start":"","end":""}', active: 'true' };
const PROPERTY = { type: 'villa', name: 'Mida Creek villa', description: 'Four bedrooms', location: 'Mida Creek', price: '45000000', active: 'true' };
const HOTEL = { name: 'Turtle Bay', type: 'hotel', description: 'Beachfront', location: '{"address":"Watamu"}', contact: '{}' };

beforeAll(async () => {
  await connect();
  app = buildApp();
  token = await loginAsAdmin(app);
});
afterAll(disconnect);

describe('experience (tour) photos', () => {
  let id;

  it('stores uploads on create', async () => {
    const res = await send('post', '/api/tours', TOUR).attach('gallery', ...png('a.png')).attach('gallery', ...png('b.png'));
    expect(res.status).toBe(201);
    expect(res.body.gallery).toEqual([url('tours', 'a.png'), url('tours', 'b.png')]);
    id = res.body._id;
  });

  it('keeps the listed photos in their new order, then appends new uploads', async () => {
    const res = await send('put', `/api/tours/${id}`, { ...TOUR, existingGallery: JSON.stringify([url('tours', 'b.png')]) }).attach('gallery', ...png('c.png'));
    expect(res.status).toBe(200);
    expect(res.body.gallery).toEqual([url('tours', 'b.png'), url('tours', 'c.png')]);
  });

  it('leaves photos alone when the form does not send existingGallery', async () => {
    const res = await send('put', `/api/tours/${id}`, { ...TOUR, name: 'Renamed snorkel' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed snorkel');
    expect(res.body.gallery).toEqual([url('tours', 'b.png'), url('tours', 'c.png')]);

    const appended = await send('put', `/api/tours/${id}`, TOUR).attach('gallery', ...png('d.png'));
    expect(appended.body.gallery).toEqual([url('tours', 'b.png'), url('tours', 'c.png'), url('tours', 'd.png')]);
  });

  it('removes every photo when an empty list is sent on purpose', async () => {
    const res = await send('put', `/api/tours/${id}`, { ...TOUR, existingGallery: '[]' });
    expect(res.body.gallery).toEqual([]);
  });

  it('answers 404 for an unknown tour', async () => {
    expect((await send('put', '/api/tours/000000000000000000000000', TOUR)).status).toBe(404);
  });
});

describe('service photos', () => {
  it('follows the same keep / replace rule', async () => {
    const created = await send('post', '/api/services', SERVICE).attach('gallery', ...png('chef.png'));
    expect(created.status).toBe(201);
    const path = `/api/services/${created.body._id}`;

    expect((await send('put', path, SERVICE)).body.gallery).toEqual([url('services', 'chef.png')]);
    expect((await send('put', path, { ...SERVICE, existingGallery: '[]' }).attach('gallery', ...png('new.png'))).body.gallery).toEqual([url('services', 'new.png')]);
  });
});

describe('property pictures and documents', () => {
  it('keeps each list independently', async () => {
    const created = await send('post', '/api/properties', PROPERTY).attach('pictures', ...png('front.png')).attach('documents', ...png('deed.png'));
    expect(created.status).toBe(201);
    const path = `/api/properties/${created.body._id}`;

    // Only pictures are edited: documents are left out, so they stay.
    const res = await send('put', path, { ...PROPERTY, existingPictures: '[]' }).attach('pictures', ...png('pool.png'));
    expect(res.status).toBe(200);
    expect(res.body.pictures).toEqual([url('properties', 'pool.png')]);
    expect(res.body.documents).toEqual([url('properties', 'deed.png')]);
  });
});

describe('stay (hotel) images', () => {
  let path;

  it('uses existingImages as the kept list', async () => {
    const created = await send('post', '/api/hotels', HOTEL).attach('images', ...png('room.png')).attach('images', ...png('pool.png'));
    expect(created.status).toBe(201);
    path = `/api/hotels/${created.body._id}`;

    const res = await send('put', path, { ...HOTEL, existingImages: JSON.stringify([url('hotels', 'pool.png')]) }).attach('images', ...png('beach.png'));
    expect(res.status).toBe(200);
    expect(res.body.images).toEqual([url('hotels', 'pool.png'), url('hotels', 'beach.png')]);
  });

  it('still accepts kept photos as repeated `images` text values from older forms', async () => {
    const res = await send('put', path, { ...HOTEL, images: url('hotels', 'beach.png') });
    expect(res.body.images).toEqual([url('hotels', 'beach.png')]);
  });

  it('keeps photos when no kept list is sent at all', async () => {
    const res = await send('put', path, { ...HOTEL, name: 'Turtle Bay Beach Club' });
    expect(res.body.name).toBe('Turtle Bay Beach Club');
    expect(res.body.images).toEqual([url('hotels', 'beach.png')]);
  });

  it('answers 400 (once) for a field that is not valid JSON', async () => {
    const res = await send('put', path, { ...HOTEL, roomTypes: '[not json' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/roomTypes/);
  });
});

describe('group trip gallery', () => {
  it('keeps the gallery when existingGallery is left out', async () => {
    const created = await sendGroupTrip(app, token, 'post', '/api/group-trips').attach('gallery', ...png('dhow.png'));
    expect(created.status).toBe(201);
    const path = `/api/group-trips/${created.body._id}`;

    expect((await sendGroupTrip(app, token, 'put', path, { title: 'Dhow weekend' })).body.gallery).toEqual([url('group-trips', 'dhow.png')]);
    expect((await sendGroupTrip(app, token, 'put', path, { existingGallery: '[]' })).body.gallery).toEqual([]);
  });
});
