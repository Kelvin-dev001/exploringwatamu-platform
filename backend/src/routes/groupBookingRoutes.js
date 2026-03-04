const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const groupBookingController = require('../controllers/groupBookingController');
const authUser = require('../middleware/authUser');

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/join', bookingLimiter, authUser, groupBookingController.joinTrip);
router.get('/my-bookings', bookingLimiter, authUser, groupBookingController.getMyBookings);

module.exports = router;
