'use strict';

const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
const authUser = require('../middleware/authUser');
const optionalUser = require('../middleware/optionalUser');
const validate = require('../middleware/validate');
const objectIdParam = require('../middleware/objectIdParam');
const { bookingLimiter, adminLimiter } = require('../middleware/rateLimiters');
const c = require('../controllers/tripRequestController');
const { createTripRequestSchema, sendQuoteSchema, updateStatusSchema } = require('../validators/tripRequestValidators');

router.param('id', objectIdParam);

// Traveller
router.post('/', bookingLimiter, optionalUser, validate(createTripRequestSchema), c.create);
router.get('/mine', bookingLimiter, authUser, c.listMine);

// Admin
router.get('/', adminLimiter, authAdmin, c.adminList);
router.get('/:id', adminLimiter, authAdmin, c.adminGet);
router.put('/:id/quote', adminLimiter, authAdmin, validate(sendQuoteSchema), c.sendQuote);
router.put('/:id/status', adminLimiter, authAdmin, validate(updateStatusSchema), c.updateStatus);
router.put('/:id/notes', adminLimiter, authAdmin, c.updateNotes);

module.exports = router;
