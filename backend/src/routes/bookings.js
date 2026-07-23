'use strict';

const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
const { adminLimiter } = require('../middleware/rateLimiters');
const bookingsController = require('../controllers/bookingsController');

// Unified admin view across all booking types.
router.get('/', adminLimiter, authAdmin, bookingsController.listAll);
router.get('/summary', adminLimiter, authAdmin, bookingsController.summary);

module.exports = router;
