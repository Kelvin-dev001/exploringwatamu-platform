'use strict';

const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
const { adminLimiter } = require('../middleware/rateLimiters');
const notificationsController = require('../controllers/notificationsController');

// Admin: browse the notification audit log.
router.get('/', adminLimiter, authAdmin, notificationsController.list);

module.exports = router;
