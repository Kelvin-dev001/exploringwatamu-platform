const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@exploringwatamu.com";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// --- Auth middleware ---
const authAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing authorization header" });
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.admin) throw new Error("Not admin");
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// --- Login ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  let isValid = false;
  if (ADMIN_PASSWORD_HASH) {
    isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else if (ADMIN_PASSWORD_PLAIN) {
    isValid = password === ADMIN_PASSWORD_PLAIN;
  } else {
    isValid = password === "123456";
  }
  if (isValid) {
    const token = jwt.sign({ email, admin: true }, JWT_SECRET, { expiresIn: "2d" });
    return res.json({ token, admin: { email } });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

// --- Profile ---
router.get('/profile', authAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

// --- Dashboard Stats ---
router.get('/stats', authAdmin, async (req, res) => {
  try {
    const Hotel = require('../models/Hotel');
    const Transfer = require('../models/Transfer');
    const Tour = require('../models/Tour');
    const Service = require('../models/Service');
    const Vehicle = require('../models/Vehicle');
    const Property = require('../models/PropertyForSale');

    const [hotels, transfers, tours, services, vehicles, properties] = await Promise.all([
      Hotel.countDocuments(),
      Transfer.countDocuments(),
      Tour.countDocuments(),
      Service.countDocuments(),
      Vehicle.countDocuments(),
      Property.countDocuments(),
    ]);

    // Count all bookings across collections
    let bookings = 0;
    try {
      const TourBooking = require('../models/TourBooking');
      const CarHireBooking = require('../models/CarHireBooking');
      const ServiceBooking = require('../models/ServiceBooking');
      const PropertyViewing = require('../models/PropertyViewingBooking');
      const [tb, cb, sb, pv] = await Promise.all([
        TourBooking.countDocuments(),
        CarHireBooking.countDocuments(),
        ServiceBooking.countDocuments(),
        PropertyViewing.countDocuments(),
      ]);
      bookings = tb + cb + sb + pv;
    } catch {
      bookings = 0;
    }

    res.json({
      users: 0,
      bookings,
      hotels,
      vehicles,
      transfers,
      properties,
      services,
      tours,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to load stats", details: err.message });
  }
});

// --- Recent Bookings ---
router.get('/recent-bookings', authAdmin, async (req, res) => {
  try {
    const allBookings = [];

    // Try each booking model — if a model doesn't exist, skip it
    try {
      const TourBooking = require('../models/TourBooking');
      const tourBookings = await TourBooking.find().sort({ createdAt: -1 }).limit(5).lean();
      tourBookings.forEach(b => allBookings.push({ ...b, bookingType: 'Tour' }));
    } catch {}

    try {
      const CarHireBooking = require('../models/CarHireBooking');
      const carBookings = await CarHireBooking.find().sort({ createdAt: -1 }).limit(5).lean();
      carBookings.forEach(b => allBookings.push({ ...b, bookingType: 'CarHire' }));
    } catch {}

    try {
      const ServiceBooking = require('../models/ServiceBooking');
      const serviceBookings = await ServiceBooking.find().sort({ createdAt: -1 }).limit(5).lean();
      serviceBookings.forEach(b => allBookings.push({ ...b, bookingType: 'Service' }));
    } catch {}

    try {
      const PropertyViewing = require('../models/PropertyViewingBooking');
      const pvBookings = await PropertyViewing.find().sort({ createdAt: -1 }).limit(5).lean();
      pvBookings.forEach(b => allBookings.push({ ...b, bookingType: 'PropertyViewing' }));
    } catch {}

    // Sort all by date, return most recent 10
    allBookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(allBookings.slice(0, 10));
  } catch (err) {
    console.error("Recent bookings error:", err);
    res.status(500).json({ error: "Failed to load recent bookings" });
  }
});

module.exports = router;