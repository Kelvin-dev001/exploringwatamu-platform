'use strict';

// Entry point. Requiring config first asserts required env vars (fail-fast),
// then we start error monitoring (if configured), connect to the database and
// start listening.

const config = require('./config/env');
const logger = require('./services/logger');
const monitoring = require('./services/monitoring');

monitoring.init();

const connectDB = require('./config/db');
const buildApp = require('./app');
const ensureBootstrapAdmin = require('./bootstrap/ensureAdmin');

// A promise nobody handled: log and report it, but keep serving.
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled promise rejection', logger.errorFields(reason, { stack: true }));
  monitoring.captureException(reason instanceof Error ? reason : new Error(String(reason)), { kind: 'unhandledRejection' });
});

// A thrown error nobody caught leaves the process in an unknown state: log,
// report, then exit so Render starts a fresh instance.
process.on('uncaughtException', async (err) => {
  logger.error('uncaught exception — exiting', logger.errorFields(err, { stack: true }));
  monitoring.captureException(err, { kind: 'uncaughtException' });
  await monitoring.flush();
  process.exit(1);
});

async function start() {
  if (!config.cloudinary.enabled) {
    logger.warn('image uploads off: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to enable them (uploads answer 503 until then)');
  }
  if (!config.mail.enabled) logger.warn('email off: set SMTP_HOST and SMTP_USER to send emails (the admin is warned that nothing was emailed)');
  await connectDB();
  await ensureBootstrapAdmin();
  const app = buildApp();
  app.listen(config.port, () => {
    logger.info('server started', { port: config.port, env: config.nodeEnv, release: config.release || undefined, errorMonitoring: monitoring.enabled() });
  });
}

start().catch(async (err) => {
  logger.error('failed to start server', logger.errorFields(err));
  monitoring.captureException(err, { kind: 'startup' });
  await monitoring.flush();
  process.exit(1);
});
