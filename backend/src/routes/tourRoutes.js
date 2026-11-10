const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authAdmin = require('../middleware/authAdmin');
const { adminWriteLimiter } = require('../middleware/rateLimiters');
const optionalAdmin = require('../middleware/optionalAdmin');
const objectIdParam = require('../middleware/objectIdParam');
const { uploadArray } = require('../middleware/upload');

router.param('id', objectIdParam);

// Public reads show live tours only; admins (optionalAdmin) also see hidden ones.
router.get('/', optionalAdmin, tourController.getTours);
router.get('/:id', optionalAdmin, tourController.getTour);
router.post('/', adminWriteLimiter, authAdmin, uploadArray('gallery', 10), tourController.createTour);
router.put('/:id', adminWriteLimiter, authAdmin, uploadArray('gallery', 10), tourController.updateTour);
router.delete('/:id', adminWriteLimiter, authAdmin, tourController.deleteTour);

module.exports = router;
