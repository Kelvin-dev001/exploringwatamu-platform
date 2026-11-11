'use strict';

// Express application factory. Builds and returns the app WITHOUT connecting to
// the database or starting a listener, so tests can import it directly
// (see tests/) and server.js can own the DB connection + listen lifecycle.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const config = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const { globalLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const PRODUCTION_ORIGINS = [
  'https://exploringwatamuadmin.vercel.app',
  'https://exploringwatamu-platform.vercel.app',
];
const LOCAL_ORIGINS = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:8081'];

// A quick database round trip for the readiness check, bounded so a stuck
// connection answers "down" instead of hanging the probe.
async function databaseUp(timeoutMs = 2000) {
  if (mongoose.connection.readyState !== 1) return false;
  try {
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    return true;
  } catch {
    return false;
  }
}

function buildApp() {
  const app = express();

  app.set('trust proxy', config.trustProxy);
  app.use(requestLogger);
  app.use(helmet());

  // Local dev origins are only trusted outside production.
  const allowedOrigins = new Set([...PRODUCTION_ORIGINS, ...(config.isProd ? [] : LOCAL_ORIGINS), ...config.frontendUrls]);
  app.use(cors({
    // Unknown origins just get no CORS headers (the browser blocks the call);
    // passing an Error here used to turn every stray request into a 500.
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
  }));

  // Generous for the largest real payload (a 30-day trip request is ~125 KB).
  app.use(express.json({ limit: '256kb' }));

  // Responses to signed-in requests are private: never store them in any
  // cache. Public reads may be cached but must be revalidated (ETag), so an
  // admin's change shows on the website at once.
  app.use((req, res, next) => {
    res.set('Cache-Control', req.get('authorization') ? 'private, no-store' : 'no-cache');
    res.vary('Authorization');
    next();
  });

  app.use(globalLimiter);

  // Liveness — the process is up. No database call, so a database blip doesn't
  // make Render restart a healthy server (used as Render's health check).
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: config.nodeEnv, uptime: process.uptime(), release: config.release || undefined, imageUploads: config.cloudinary.enabled });
  });

  // Readiness — can the API serve data right now? 503 when the database is
  // unreachable. Optional services are reported but never make it fail.
  app.get('/api/health/ready', async (req, res) => {
    const up = await databaseUp();
    res.status(up ? 200 : 503).json({
      status: up ? 'ok' : 'unavailable',
      database: up ? 'up' : 'down',
      services: {
        email: config.mail.enabled,
        sms: config.sms.enabled,
        imageUploads: config.cloudinary.enabled,
        googleSignIn: Boolean(config.googleClientId),
        errorMonitoring: Boolean(config.monitoring.dsn),
      },
    });
  });

  // Feature routes
  app.use('/api/hotels', require('./routes/hotelRoutes'));
  app.use('/api/transfers', require('./routes/transferRoutes'));
  app.use('/api/tours', require('./routes/tourRoutes'));
  app.use('/api/services', require('./routes/serviceRoutes'));
  app.use('/api/carhire', require('./routes/carHireRoutes'));
  app.use('/api/vehicles', require('./routes/vehicleRoutes'));
  app.use('/api/carhirebookings', require('./routes/carHireBookingRoutes'));
  app.use('/api/tourbookings', require('./routes/tourBookingRoutes'));
  app.use('/api/servicebookings', require('./routes/serviceBookingRoutes'));
  app.use('/api/properties', require('./routes/propertyForSaleRoutes'));
  app.use('/api/propertyviewings', require('./routes/propertyViewingBookingRoutes'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/auth', require('./routes/userAuth'));
  app.use('/api/group-trips', require('./routes/groupTripRoutes'));
  app.use('/api/group-bookings', require('./routes/groupBookingRoutes'));
  app.use('/api/bookings', require('./routes/bookings'));
  app.use('/api/trip-requests', require('./routes/tripRequestRoutes'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/referrals', require('./routes/referralRoutes'));
  app.use('/api/reviews', require('./routes/reviews'));

  // M-Pesa routes are gated OFF until payments are explicitly enabled.
  if (config.paymentsEnabled) {
    app.use('/api/mpesa', require('./routes/mpesaRoutes'));
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = buildApp;
