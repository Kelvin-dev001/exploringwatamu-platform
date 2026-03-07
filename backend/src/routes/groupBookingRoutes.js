const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const groupBookingController = require('../controllers/groupBookingController');
const authUser = require('../middleware/authUser');
const authAdmin = require('../middleware/authAdmin');

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/trip/:tripId/participants', groupBookingController.getTripParticipants);

// Protected routes (user)
router.post('/join', bookingLimiter, authUser, groupBookingController.joinTrip);
router.post('/confirm', bookingLimiter, authUser, groupBookingController.confirmBooking);
router.get('/my-bookings', bookingLimiter, authUser, groupBookingController.getMyBookings);
router.get('/:bookingId', bookingLimiter, authUser, groupBookingController.getBookingById);

// Admin routes
router.get('/admin/all', adminLimiter, authAdmin, groupBookingController.getAllBookingsAdmin);
router.get('/admin/trip/:tripId', adminLimiter, authAdmin, groupBookingController.getBookingsByTripAdmin);

module.exports = router;