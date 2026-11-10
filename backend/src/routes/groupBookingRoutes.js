'use strict';

const express = require('express');
const router = express.Router();
const groupBookingController = require('../controllers/groupBookingController');
const authUser = require('../middleware/authUser');
const authAdmin = require('../middleware/authAdmin');
const validate = require('../middleware/validate');
const { joinTripSchema } = require('../validators/groupBookingValidators');
const { bookingLimiter, sessionLimiter, adminLimiter, adminWriteLimiter, publicReadLimiter } = require('../middleware/rateLimiters');

// Public
router.get('/trip/:tripId/participants', publicReadLimiter, groupBookingController.getTripParticipants);

// User (traveller submits a booking request + vibe data)
router.post('/join', bookingLimiter, authUser, validate(joinTripSchema), groupBookingController.joinTrip);
router.get('/my-bookings', sessionLimiter, authUser, groupBookingController.getMyBookings);

// Admin — confirming a booking is an admin action in the admin-approve flow
// (payments are disabled). This also closes the prior hole where any user
// could confirm any booking.
router.post('/confirm', adminWriteLimiter, authAdmin, groupBookingController.confirmBooking);
router.put('/admin/:id/cancel', adminWriteLimiter, authAdmin, groupBookingController.cancelBookingAdmin);
router.get('/admin/all', adminLimiter, authAdmin, groupBookingController.getAllBookingsAdmin);
router.get('/admin/trip/:tripId', adminLimiter, authAdmin, groupBookingController.getBookingsByTripAdmin);

module.exports = router;
