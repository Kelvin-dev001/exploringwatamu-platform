const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const mpesaController = require('../controllers/mpesaController');
const authUser = require('../middleware/authUser');

const mpesaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const callbackLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/stkpush', mpesaLimiter, authUser, mpesaController.stkPush);
router.post('/callback', callbackLimiter, mpesaController.mpesaCallback);
router.post('/query', mpesaLimiter, authUser, mpesaController.queryTransaction);

module.exports = router;
