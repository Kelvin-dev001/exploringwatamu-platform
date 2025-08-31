const express = require('express');
const router = express.Router();
const carHireBookingController = require('../controllers/carHireBookingController');
const authAdmin = require('../middleware/authAdmin');

// Admin: bookings list, filters, pagination
router.get('/', authAdmin, carHireBookingController.getCarHireBookings);
// Cancel booking
router.put('/:id/cancel', authAdmin, carHireBookingController.cancelBooking);

module.exports = router;