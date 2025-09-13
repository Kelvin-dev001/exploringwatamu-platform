const express = require('express');
const router = express.Router();
const serviceBookingController = require('../controllers/serviceBookingController');
const authAdmin = require('../middleware/authAdmin');
router.post('/book', serviceBookingController.bookService); // User booking
router.get('/', authAdmin, serviceBookingController.getServiceBookings); // Admin list bookings
router.put('/:id/cancel', authAdmin, serviceBookingController.cancelBooking); // Admin cancel
router.post('/check', serviceBookingController.checkAvailability); // POST /servicebookings/chec
module.exports = router;