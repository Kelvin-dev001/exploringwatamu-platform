const express = require('express');
const router = express.Router();
const tourBookingController = require('../controllers/tourBookingController');
const authAdmin = require('../middleware/authAdmin');

router.get('/', authAdmin, tourBookingController.getTourBookings);
router.put('/:id/cancel', authAdmin, tourBookingController.cancelBooking);

module.exports = router;