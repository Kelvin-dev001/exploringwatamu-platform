const express = require('express');
const router = express.Router();
const groupTripController = require('../controllers/groupTripController');
const authAdmin = require('../middleware/authAdmin');
const upload = require('../middleware/upload');

// Public routes
router.get('/', groupTripController.getPublishedGroupTrips);
router.get('/admin/all', authAdmin, groupTripController.getAllGroupTripsAdmin);
router.get('/:slug', groupTripController.getGroupTripBySlug);

// Admin routes
router.post('/', authAdmin, upload.fields([{ name: 'heroImage', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), groupTripController.createGroupTrip);
router.put('/:id/publish', authAdmin, groupTripController.publishGroupTrip);
router.put('/:id/close', authAdmin, groupTripController.closeGroupTrip);
router.put('/:id', authAdmin, upload.fields([{ name: 'heroImage', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), groupTripController.updateGroupTrip);
router.delete('/:id', authAdmin, groupTripController.deleteGroupTrip);

module.exports = router;
