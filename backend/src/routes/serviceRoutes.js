const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authAdmin = require('../middleware/authAdmin');

// Anyone can view services
router.get('/', serviceController.getServices);

// Only admins can create, update, delete services
router.post('/', authAdmin, serviceController.createService);
router.put('/:id', authAdmin, serviceController.updateService);
router.delete('/:id', authAdmin, serviceController.deleteService);

module.exports = router;