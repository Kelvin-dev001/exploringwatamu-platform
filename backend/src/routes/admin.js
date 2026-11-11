'use strict';

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const Admin = require('../models/Admin');
const validate = require('../middleware/validate');
const { signAdminToken } = require('../services/tokens');
const authAdmin = require('../middleware/authAdmin');
const { authLimiter, adminLimiter } = require('../middleware/rateLimiters');

const loginSchema = z.object({
  email: z.string({ error: 'Email and password are required.' }).trim().toLowerCase().min(1, 'Email and password are required.').max(200),
  password: z.string({ error: 'Email and password are required.' }).min(1, 'Email and password are required.').max(200),
});

// --- Login (DB-backed admin, hashed passwords only) ---
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await admin.validatePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = signAdminToken(admin);
    res.json({ token, admin: { id: admin._id, email: admin.email, name: admin.name || '', role: admin.role || 'admin' } });
  } catch (err) {
    next(err);
  }
});

// --- Profile ---
router.get('/profile', adminLimiter, authAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

// --- Dashboard stats ---
router.get('/stats', adminLimiter, authAdmin, async (req, res, next) => {
  try {
    const Hotel = require('../models/Hotel');
    const Transfer = require('../models/Transfer');
    const Tour = require('../models/Tour');
    const Service = require('../models/Service');
    const Vehicle = require('../models/Vehicle');
    const Property = require('../models/PropertyForSale');
    const User = require('../models/User');
    const TourBooking = require('../models/TourBooking');
    const CarHireBooking = require('../models/CarHireBooking');
    const ServiceBooking = require('../models/ServiceBooking');
    const PropertyViewing = require('../models/PropertyViewingBooking');
    const GroupBooking = require('../models/GroupBooking');

    const [users, hotels, transfers, tours, services, vehicles, properties, tb, cb, sb, pv, gb] =
      await Promise.all([
        User.countDocuments(),
        Hotel.countDocuments(),
        Transfer.countDocuments(),
        Tour.countDocuments(),
        Service.countDocuments(),
        Vehicle.countDocuments(),
        Property.countDocuments(),
        TourBooking.countDocuments(),
        CarHireBooking.countDocuments(),
        ServiceBooking.countDocuments(),
        PropertyViewing.countDocuments(),
        GroupBooking.countDocuments(),
      ]);

    res.json({
      users,
      bookings: tb + cb + sb + pv + gb,
      groupBookings: gb,
      hotels,
      vehicles,
      transfers,
      properties,
      services,
      tours,
    });
  } catch (err) {
    next(err);
  }
});

// --- Recent bookings across all booking types ---
router.get('/recent-bookings', adminLimiter, authAdmin, async (req, res, next) => {
  try {
    const sources = [
      ['../models/TourBooking', 'Tour'],
      ['../models/CarHireBooking', 'CarHire'],
      ['../models/ServiceBooking', 'Service'],
      ['../models/PropertyViewingBooking', 'PropertyViewing'],
      ['../models/GroupBooking', 'GroupTour'],
    ];

    const all = [];
    for (const [modelPath, bookingType] of sources) {
      const Model = require(modelPath);
      const rows = await Model.find().sort({ createdAt: -1 }).limit(5).lean();
      rows.forEach((b) => all.push({ ...b, bookingType }));
    }

    all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(all.slice(0, 10));
  } catch (err) {
    next(err);
  }
});

// --- Dashboard overview (to-do, money, content health, activity) ---
router.get('/overview', adminLimiter, authAdmin, require('../controllers/adminOverviewController').overview);

// --- Team: every admin is a full admin; anyone can add or remove a colleague,
// but the last remaining admin can never be removed. ---
router.use('/team', adminLimiter, authAdmin, require('./adminTeamRoutes'));

// --- Quick inline edits from admin lists (publish, price, mark full) ---
router.use('/quick', adminLimiter, authAdmin, require('./adminQuickRoutes'));

module.exports = router;
