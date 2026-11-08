const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authAdmin = require('../middleware/authAdmin');
const { uploadArray } = require('../middleware/upload');

router.get('/', tourController.getTours);
router.get('/:id', tourController.getTour);
router.post('/', authAdmin, uploadArray('gallery', 10), tourController.createTour);
router.put('/:id', authAdmin, uploadArray('gallery', 10), tourController.updateTour);
router.delete('/:id', authAdmin, tourController.deleteTour);

module.exports = router;