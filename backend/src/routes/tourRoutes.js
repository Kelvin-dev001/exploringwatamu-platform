const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authAdmin = require('../middleware/authAdmin');

router.get('/', tourController.getTours);
router.get('/:id', tourController.getTour);
router.post('/', authAdmin, tourController.createTour);
router.put('/:id', authAdmin, tourController.updateTour);
router.delete('/:id', authAdmin, tourController.deleteTour);

module.exports = router;