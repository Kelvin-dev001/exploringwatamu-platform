'use strict';

// Entry point. Requiring config first asserts required env vars (fail-fast),
// then we connect to the database and start listening.

const config = require('./config/env');
const connectDB = require('./config/db');
const buildApp = require('./app');
const ensureBootstrapAdmin = require('./bootstrap/ensureAdmin');

async function start() {
  if (!config.cloudinary.enabled) {
    console.warn('[config] Cloudinary is not configured: image uploads will answer 503 until CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are set.');
  }
  await connectDB();
  await ensureBootstrapAdmin();
  const app = buildApp();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
