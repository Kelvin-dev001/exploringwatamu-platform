const express = require('express');
const router = express.Router();
const serviceBookingController = require('../controllers/serviceBookingController');
const authAdmin = require('../middleware/authAdmin');
const validate = require('../middleware/validate');
const { adminLimiter, adminWriteLimiter, bookingLimiter, publicReadLimiter } = require('../middleware/rateLimiters');
const { serviceCheckSchema, serviceBookSchema } = require('../validators/legacyBookingValidators');
router.post('/book', bookingLimiter, validate(serviceBookSchema), serviceBookingController.bookService); // User booking
router.get('/', adminLimiter, authAdmin, serviceBookingController.getServiceBookings); // Admin list bookings
router.put('/:id/cancel', adminWriteLimiter, authAdmin, serviceBookingController.cancelBooking); // Admin cancel
router.post('/check', publicReadLimiter, validate(serviceCheckSchema), serviceBookingController.checkAvailability); // POST /servicebookings/check
module.exports = router;