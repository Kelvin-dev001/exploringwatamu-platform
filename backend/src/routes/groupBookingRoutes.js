const express = require('express');
const router = express.Router();
const groupBookingController = require('../controllers/groupBookingController');
const authUser = require('../middleware/authUser');

router.post('/join', authUser, groupBookingController.joinTrip);
router.get('/my-bookings', authUser, groupBookingController.getMyBookings);

module.exports = router;
