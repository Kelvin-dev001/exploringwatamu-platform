const express = require('express');
const router = express.Router();
const propertyViewingBookingController = require('../controllers/propertyViewingBookingController');
const authAdmin = require('../middleware/authAdmin');
const validate = require('../middleware/validate');
const { adminLimiter, adminWriteLimiter, bookingLimiter, publicReadLimiter } = require('../middleware/rateLimiters');
const { propertyViewingCheckSchema, propertyViewingBookSchema } = require('../validators/legacyBookingValidators');

router.post('/check', publicReadLimiter, validate(propertyViewingCheckSchema), propertyViewingBookingController.checkAvailability); // POST /propertyviewings/check
router.post('/book', bookingLimiter, validate(propertyViewingBookSchema), propertyViewingBookingController.bookViewing); // User booking
router.get('/', adminLimiter, authAdmin, propertyViewingBookingController.getViewingBookings); // Admin list bookings
router.put('/:id/cancel', adminWriteLimiter, authAdmin, propertyViewingBookingController.cancelBooking); // Admin cancel

module.exports = router;