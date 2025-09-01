const express = require('express');
const router = express.Router();
const propertyViewingBookingController = require('../controllers/propertyViewingBookingController');
const authAdmin = require('../middleware/authAdmin');

router.post('/check', propertyViewingBookingController.checkAvailability); // POST /propertyviewings/check
router.post('/book', propertyViewingBookingController.bookViewing); // User booking
router.get('/', authAdmin, propertyViewingBookingController.getViewingBookings); // Admin list bookings
router.put('/:id/cancel', authAdmin, propertyViewingBookingController.cancelBooking); // Admin cancel

module.exports = router;