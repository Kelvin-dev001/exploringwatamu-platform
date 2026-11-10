'use strict';

module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testMatch: ['**/tests/**/*.test.js'],
  // E2E hooks start an in-memory MongoDB and hash passwords with bcrypt; on a
  // busy 2-core CI runner that can pass Jest's 5 s default and fail spuriously.
  testTimeout: 30000,
  verbose: true,
};
