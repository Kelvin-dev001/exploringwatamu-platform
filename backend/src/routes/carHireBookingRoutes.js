const express = require('express');
const router = express.Router();
const carHireBookingController = require('../controllers/carHireBookingController');
const authAdmin = require('../middleware/authAdmin');
const { adminLimiter, adminWriteLimiter } = require('../middleware/rateLimiters');

// Admin: bookings list, filters, pagination
router.get('/', adminLimiter, authAdmin, carHireBookingController.getCarHireBookings);
// Cancel booking
router.put('/:id/cancel', adminWriteLimiter, authAdmin, carHireBookingController.cancelBooking);

module.exports = router;