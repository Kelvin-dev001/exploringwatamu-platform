'use strict';

// The demo seed: safe to run twice, never touches real records, clearly
// labelled, uses the normal models, and refuses production.

const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect } = require('./dbSetup');
const buildApp = require('../../src/app');
const { seedDemo, plan, PREFIX, DEMO_NOTE } = require('../../src/services/demoContent');
const { refusal, argValue, main } = require('../../scripts/seedDemo');
const Tour = require('../../src/models/Tour');
const GroupTrip = require('../../src/models/GroupTrip');
const Transfer = require('../../src/models/Transfer');

const MODELS = [...new Set(plan().map((p) => p.model))];
const countAll = async () => Object.fromEntries(await Promise.all(MODELS.map(async (M) => [M.modelName, await M.countDocuments()])));

beforeAll(connect);
afterAll(disconnect);
afterEach(() => jest.restoreAllMocks());

describe('safeguards', () => {
  it('refuses production outright', () => {
    expect(refusal({ nodeEnv: 'production', confirmDb: 'ew', dbName: 'ew' })).toMatch(/production/);
  });

  it('needs the connected database named exactly', () => {
    expect(refusal({ nodeEnv: 'development', confirmDb: undefined, dbName: 'ew_staging' })).toMatch(/--confirm-db=ew_staging/);
    expect(refusal({ nodeEnv: 'development', confirmDb: 'ew_staging', dbName: 'exploringwatamu' })).toMatch(/does not match/);
    expect(refusal({ nodeEnv: 'development', confirmDb: 'ew_staging', dbName: 'ew_staging' })).toBeNull();
  });

  it('reads its flags', () => {
    expect(argValue(['--confirm-db=ew_staging', '--dry-run'], '--confirm-db')).toBe('ew_staging');
    expect(argValue(['--dry-run'], '--dry-run')).toBe('');
    expect(argValue([], '--dry-run')).toBeUndefined();
  });

  it('the script writes nothing when the database name is not confirmed', async () => {
    const before = await countAll();
    const saved = process.env.MONGODB_URI;
    process.env.MONGODB_URI = mongoose.connection.client.s.url;
    // main() opens its own connection; keep the test's connection open.
    jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    jest.spyOn(mongoose, 'disconnect').mockResolvedValue();
    try {
      await expect(main([])).rejects.toThrow(/--confirm-db=/);
      await expect(main(['--confirm-db=someone-elses-db'])).rejects.toThrow(/does not match/);
    } finally {
      process.env.MONGODB_URI = saved;
    }
    expect(await countAll()).toEqual(before);
  });

  it('is not wired into server startup', () => {
    const fs = require('fs');
    const path = require('path');
    const server = fs.readFileSync(path.join(__dirname, '../../src/server.js'), 'utf8');
    const app = fs.readFileSync(path.join(__dirname, '../../src/app.js'), 'utf8');
    expect(`${server}\n${app}`).not.toMatch(/demoContent|seedDemo/);
  });
});

describe('seeding', () => {
  let real;

  beforeAll(async () => {
    real = await Tour.create({ name: 'Real partner tour', description: 'A genuine listing', priceResidentAdult: 1, priceResidentChild: 1, priceForeignerAdult: 1, priceForeignerChild: 1 });
  });

  it('a dry run reports the plan and writes nothing', async () => {
    const before = await countAll();
    const { created } = await seedDemo({ dryRun: true });
    expect(created).toHaveLength(plan().length);
    expect(await countAll()).toEqual(before);
  });

  it('creates every demo record once; a second run adds nothing', async () => {
    const first = await seedDemo();
    expect(first.created).toHaveLength(plan().length);
    const afterFirst = await countAll();

    const second = await seedDemo();
    expect(second.created).toEqual([]);
    expect(second.existing).toBe(plan().length);
    expect(await countAll()).toEqual(afterFirst);
  });

  it('labels every demo record and leaves real ones alone', async () => {
    for (const M of MODELS) {
      // eslint-disable-next-line no-await-in-loop
      const docs = await M.find({ _id: { $ne: real._id } }).lean();
      for (const d of docs) {
        const label = d.name || d.title || '';
        const text = d.description || d.shortDescription || '';
        expect(label.startsWith(PREFIX) || text.startsWith(DEMO_NOTE)).toBe(true);
      }
    }
    expect(await Tour.findById(real._id).lean()).toMatchObject({ name: 'Real partner tour', description: 'A genuine listing' });
  });

  it('keeps admin edits to demo records', async () => {
    await Tour.updateOne({ name: `${PREFIX}Kitesurf taster` }, { active: false, priceForeignerAdult: 9999 });
    await seedDemo();
    expect(await Tour.findOne({ name: `${PREFIX}Kitesurf taster` }).lean()).toMatchObject({ active: false, priceForeignerAdult: 9999 });
  });

  it('makes the journey testable: listings, a bookable group trip, linked vehicles', async () => {
    const app = buildApp();
    const tours = await request(app).get('/api/tours').query({ name: 'Demo' });
    expect(tours.body.total).toBe(3); // the hidden one isn't public
    const trips = await request(app).get('/api/group-trips');
    const trip = trips.body.find((t) => t.title.startsWith(PREFIX));
    expect(trip).toMatchObject({ status: 'published' });
    expect(new Date(trip.startDate) > new Date()).toBe(true);
    expect((await request(app).get(`/api/group-trips/${trip.slug}`)).status).toBe(200);
    const transfer = await Transfer.findOne({ description: { $regex: /^Demo listing/ } }).populate('vehicle');
    expect(transfer.vehicle.name).toBe(`${PREFIX}Safari van (7 seats)`);
    expect(await GroupTrip.countDocuments({ title: { $regex: /^Demo · / } })).toBe(1);
  });
});
