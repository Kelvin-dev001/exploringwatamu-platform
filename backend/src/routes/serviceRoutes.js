const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authAdmin = require('../middleware/authAdmin');
const upload = require('../middleware/upload');

router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getService);
router.post('/', authAdmin, upload.array('gallery', 10), serviceController.createService);
router.put('/:id', authAdmin, upload.array('gallery', 10), serviceController.updateService);
router.delete('/:id', authAdmin, serviceController.deleteService);

module.exports = router;