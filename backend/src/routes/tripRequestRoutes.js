'use strict';

const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
const authUser = require('../middleware/authUser');
const optionalUser = require('../middleware/optionalUser');
const validate = require('../middleware/validate');
const objectIdParam = require('../middleware/objectIdParam');
const { bookingLimiter, sessionLimiter, adminLimiter, adminWriteLimiter } = require('../middleware/rateLimiters');
const c = require('../controllers/tripRequestController');
const { createTripRequestSchema, sendQuoteSchema, updateStatusSchema, updateNotesSchema } = require('../validators/tripRequestValidators');

router.param('id', objectIdParam);

// Traveller
router.post('/', bookingLimiter, optionalUser, validate(createTripRequestSchema), c.create);
router.get('/mine', sessionLimiter, authUser, c.listMine);

// Admin
router.get('/', adminLimiter, authAdmin, c.adminList);
router.get('/:id', adminLimiter, authAdmin, c.adminGet);
router.put('/:id/quote', adminWriteLimiter, authAdmin, validate(sendQuoteSchema), c.sendQuote);
router.put('/:id/status', adminWriteLimiter, authAdmin, validate(updateStatusSchema), c.updateStatus);
router.put('/:id/notes', adminWriteLimiter, authAdmin, validate(updateNotesSchema), c.updateNotes);

module.exports = router;
