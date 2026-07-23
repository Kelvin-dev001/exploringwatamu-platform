'use strict';

// Entry point. Requiring config first asserts required env vars (fail-fast),
// then we connect to the database and start listening.

const config = require('./config/env');
const connectDB = require('./config/db');
const buildApp = require('./app');

async function start() {
  await connectDB();
  const app = buildApp();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
