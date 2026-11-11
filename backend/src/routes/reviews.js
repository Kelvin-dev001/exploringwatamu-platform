'use strict';

const express = require('express');
const c = require('../controllers/reviewController');
const authUser = require('../middleware/authUser');
const authAdmin = require('../middleware/authAdmin');
const validate = require('../middleware/validate');
const objectIdParam = require('../middleware/objectIdParam');
const { uploadArray } = require('../middleware/upload');
const { publicReadLimiter, sessionLimiter, reviewWriteLimiter, adminLimiter, adminWriteLimiter } = require('../middleware/rateLimiters');
const { PHOTOS_MAX } = require('../constants/reviews');
const v = require('../validators/reviewValidators');

/*
 * Reviews of any listing (see constants/reviews.js, services/reviewEligibility.js).
 *
 *   GET  /api/reviews?listingType=&listingId=   public: approved reviews + rating
 *   GET  /api/reviews/eligible                  traveller: what they can review
 *   GET  /api/reviews/mine                      traveller: their reviews and status
 *   POST /api/reviews                           traveller: new review (pending)
 *   POST /api/reviews/:id/photos                traveller: photos for their pending review
 *   GET  /api/reviews/admin, /admin/:id         admin: moderation queue, details
 *   PUT  /api/reviews/admin/:id/status          admin: approve / hide / back to pending
 *   PUT  /api/reviews/admin/:id/reply           admin: write, edit or remove the reply
 *
 * The old stay-only routes (/api/reviews/:accommodationId, PUT/DELETE /:id) are
 * gone: anyone signed in could post, edit and delete reviews there with no
 * booking behind them. Nothing on the website used them.
 */
const router = express.Router();
router.param('id', objectIdParam);

router.get('/', publicReadLimiter, validate(v.listReviewsQuery, 'query'), c.listForListing);

router.get('/eligible', sessionLimiter, authUser, validate(v.eligibleQuery, 'query'), c.eligible);
router.get('/mine', sessionLimiter, authUser, c.mine);
// Writes are limited per account, so authUser comes first.
router.post('/', authUser, reviewWriteLimiter, validate(v.submitReviewSchema), c.submit);
router.post('/:id/photos', authUser, reviewWriteLimiter, c.loadOwnPendingReview, uploadArray('photos', PHOTOS_MAX), c.addPhotos);

router.get('/admin', adminLimiter, authAdmin, validate(v.adminListQuery, 'query'), c.adminList);
router.get('/admin/:id', adminLimiter, authAdmin, c.adminGet);
router.put('/admin/:id/status', adminWriteLimiter, authAdmin, validate(v.moderateSchema), c.moderate);
router.put('/admin/:id/reply', adminWriteLimiter, authAdmin, validate(v.replySchema), c.reply);

module.exports = router;
