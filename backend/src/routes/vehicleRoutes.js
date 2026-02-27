const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authAdmin = require('../middleware/authAdmin');
const upload = require('../middleware/upload');

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicle);
// Add upload.single('image') to handle FormData with image file
router.post('/', authAdmin, upload.single('image'), vehicleController.createVehicle);
router.put('/:id', authAdmin, upload.single('image'), vehicleController.updateVehicle);
router.delete('/:id', authAdmin, vehicleController.deleteVehicle);

module.exports = router;