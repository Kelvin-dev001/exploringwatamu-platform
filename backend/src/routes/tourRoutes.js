const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authAdmin = require('../middleware/authAdmin');
const upload = require('../middleware/upload');

router.get('/', tourController.getTours);
router.get('/:id', tourController.getTour);
router.post('/', authAdmin, upload.array('gallery', 10), tourController.createTour);
router.put('/:id', authAdmin, upload.array('gallery', 10), tourController.updateTour);
router.delete('/:id', authAdmin, tourController.deleteTour);

module.exports = router;