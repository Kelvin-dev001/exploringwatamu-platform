const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authAdmin = require('../middleware/authAdmin');

router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getService);
router.post('/', authAdmin, serviceController.createService);
router.put('/:id', authAdmin, serviceController.updateService);
router.delete('/:id', authAdmin, serviceController.deleteService);

module.exports = router;