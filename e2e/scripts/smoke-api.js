'use strict';

/*
 * The real backend on a throwaway in-memory MongoDB, for the browser smoke
 * tests. Test-only credentials; SMTP, SMS and Cloudinary are left unset, so
 * nothing ever leaves this machine. Seeds a few listings (one hidden).
 *
 * Uses the backend's own dependencies, so run `npm ci` in backend/ first.
 */
const path = require('path');
const { createRequire } = require('module');

const backendDir = path.resolve(__dirname, '../../backend');
const req = createRequire(path.join(backendDir, 'package.json'));
const { MongoMemoryServer } = req('mongodb-memory-server');

const PORT = process.env.SMOKE_API_PORT || '5055';

(async () => {
  const mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT,
    MONGODB_URI: mongod.getUri('ew_smoke'),
    JWT_SECRET: 'smoke-test-only-secret-0123456789',
    BOOTSTRAP_ADMIN_EMAIL: 'smoke-admin@example.test',
    BOOTSTRAP_ADMIN_PASSWORD: 'smoke-admin-pass-123',
    FRONTEND_URLS: 'http://localhost:4173,http://localhost:4174',
    FRONTEND_URL: 'http://localhost:4173',
    PAYMENTS_ENABLED: 'false',
    WHATSAPP_NUMBER: '+254700000000', // placeholder: only used in (unsent) email links
    SMTP_HOST: '', SMTP_USER: '', AT_USERNAME: '', AT_API_KEY: '',
    CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '',
  });
  process.chdir(backendDir);

  const mongoose = req('mongoose');
  const connected = new Promise((resolve) => mongoose.connection.once('open', resolve));
  req('./src/server.js');
  await connected;

  const Tour = req('./src/models/Tour');
  const Hotel = req('./src/models/Hotel');
  const price = { priceResidentAdult: 3000, priceResidentChild: 1500, priceForeignerAdult: 6500, priceForeignerChild: 3500 };
  await Tour.create([
    // Italian text as the team would write it (localisation.spec.js); the stay below has none.
    { name: 'Marine park snorkel', description: 'Reef, turtles and a sandbank lunch.', titleIt: 'Snorkeling nel parco marino', descriptionIt: 'Barriera corallina, tartarughe e pranzo sul banco di sabbia.', duration: 'Half day', durationHours: 4, vibes: ['ocean'], active: true, ...price },
    { name: 'Hidden draft tour', description: 'Must never show on the website.', active: false, ...price },
  ]);
  await Hotel.create({ name: 'Turtle Bay Beach Club', type: 'hotel', description: 'Beachfront.', pricePerNight: 18000 });
  console.log(`[smoke-api] ready on http://localhost:${PORT}/api`);

  const stop = async () => {
    await mongoose.disconnect().catch(() => {});
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch((err) => {
  console.error('[smoke-api] failed to start:', err);
  process.exit(1);
});
