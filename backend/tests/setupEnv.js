'use strict';

// Ensures required env vars exist before any module (incl. config/env.js) loads.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_16_chars_long';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ew_test';
process.env.PAYMENTS_ENABLED = 'false';
