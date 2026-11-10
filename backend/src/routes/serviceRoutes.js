const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authAdmin = require('../middleware/authAdmin');
const optionalAdmin = require('../middleware/optionalAdmin');
const objectIdParam = require('../middleware/objectIdParam');
const { uploadArray } = require('../middleware/upload');

router.param('id', objectIdParam);

// Public reads show live services only; admins (optionalAdmin) also see hidden ones.
router.get('/', optionalAdmin, serviceController.getServices);
router.get('/:id', optionalAdmin, serviceController.getService);
router.post('/', authAdmin, uploadArray('gallery', 10), serviceController.createService);
router.put('/:id', authAdmin, uploadArray('gallery', 10), serviceController.updateService);
router.delete('/:id', authAdmin, serviceController.deleteService);

module.exports = router;