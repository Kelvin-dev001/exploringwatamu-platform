const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const referralController = require('../controllers/referralController');
const authUser = require('../middleware/authUser');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Protected routes (user only)
router.get('/my-referrals', limiter, authUser, referralController.getMyReferrals);
router.post('/redeem-points', limiter, authUser, referralController.redeemPoints);

// Public routes
router.post('/apply-code', limiter, referralController.applyReferralDiscount);

module.exports = router;