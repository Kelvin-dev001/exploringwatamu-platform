const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authAdmin = require('../middleware/authAdmin');
const { adminWriteLimiter } = require('../middleware/rateLimiters');
const objectIdParam = require('../middleware/objectIdParam');
const { uploadSingle } = require('../middleware/upload');

router.param('id', objectIdParam);

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicle);
// uploadSingle('image') parses the FormData and its image file
router.post('/', adminWriteLimiter, authAdmin, uploadSingle('image'), vehicleController.createVehicle);
router.put('/:id', adminWriteLimiter, authAdmin, uploadSingle('image'), vehicleController.updateVehicle);
router.delete('/:id', adminWriteLimiter, authAdmin, vehicleController.deleteVehicle);

module.exports = router;