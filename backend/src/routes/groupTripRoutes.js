const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const groupTripController = require('../controllers/groupTripController');
const authAdmin = require('../middleware/authAdmin');
const validate = require('../middleware/validate');
const objectIdParam = require('../middleware/objectIdParam');
const { uploadFields } = require('../middleware/upload');
const { createGroupTripSchema, updateGroupTripSchema } = require('../validators/groupTripValidators');
const { adminLimiter, adminWriteLimiter } = require('../middleware/rateLimiters');

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Multipart body: trip fields plus up to 1 hero image and 10 gallery images.
const tripImages = uploadFields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
]);

router.param('id', objectIdParam);

// Public routes
router.get('/', publicLimiter, groupTripController.getPublishedGroupTrips);
router.get('/admin/all', adminLimiter, authAdmin, groupTripController.getAllGroupTripsAdmin);
router.get('/:slug', publicLimiter, groupTripController.getGroupTripBySlug);

// Admin routes (uploads run before validation: they parse the multipart body)
router.post('/', adminWriteLimiter, authAdmin, tripImages, validate(createGroupTripSchema), groupTripController.createGroupTrip);
router.put('/:id/publish', adminWriteLimiter, authAdmin, groupTripController.publishGroupTrip);
router.put('/:id/close', adminWriteLimiter, authAdmin, groupTripController.closeGroupTrip);
router.put('/:id', adminWriteLimiter, authAdmin, tripImages, validate(updateGroupTripSchema), groupTripController.updateGroupTrip);
router.delete('/:id', adminWriteLimiter, authAdmin, groupTripController.deleteGroupTrip);

module.exports = router;
