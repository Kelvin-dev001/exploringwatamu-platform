const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authAdmin = require('../middleware/authAdmin');

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicle);
router.post('/', authAdmin, vehicleController.createVehicle);
router.put('/:id', authAdmin, vehicleController.updateVehicle);
router.delete('/:id', authAdmin, vehicleController.deleteVehicle);

module.exports = router;