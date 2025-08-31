const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authAdmin = require('../middleware/authAdmin');

// Anyone can view tours
router.get('/', tourController.getTours);

// Only admins can create, update, delete tours
router.post('/', authAdmin, tourController.createTour);
router.put('/:id', authAdmin, tourController.updateTour);
router.delete('/:id', authAdmin, tourController.deleteTour);

module.exports = router;