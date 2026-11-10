const express = require('express');
const router = express.Router();
const tourBookingController = require('../controllers/tourBookingController');
const authAdmin = require('../middleware/authAdmin');
const { adminLimiter, adminWriteLimiter } = require('../middleware/rateLimiters');

router.get('/', adminLimiter, authAdmin, tourBookingController.getTourBookings);
router.put('/:id/cancel', adminWriteLimiter, authAdmin, tourBookingController.cancelBooking);

module.exports = router;