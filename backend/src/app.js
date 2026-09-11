'use strict';

// Express application factory. Builds and returns the app WITHOUT connecting to
// the database or starting a listener, so tests can import it directly
// (see tests/) and server.js can own the DB connection + listen lifecycle.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { globalLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function buildApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());

  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8081',
    'https://exploringwatamuadmin.vercel.app',
    'https://exploringwatamu.vercel.app',
    'https://exploringwatamu-platform.vercel.app',
  ];
  const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...config.frontendUrls]));

  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin not allowed: ${origin}`), false);
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(globalLimiter);

  // Lightweight health check — no DB dependency, safe for uptime probes.
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: config.nodeEnv, uptime: process.uptime(), imageUploads: config.cloudinary.enabled });
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
