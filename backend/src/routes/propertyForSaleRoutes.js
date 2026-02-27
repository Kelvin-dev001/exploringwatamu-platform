const express = require('express');
const router = express.Router();
const propertyForSaleController = require('../controllers/propertyForSaleController');
const authAdmin = require('../middleware/authAdmin');
const upload = require('../middleware/upload');

// Accept both pictures and documents fields
const cpUpload = upload.fields([
  { name: 'pictures', maxCount: 10 },
  { name: 'documents', maxCount: 10 }
]);

router.get('/', propertyForSaleController.getProperties);
router.get('/:id', propertyForSaleController.getProperty);
router.post('/', authAdmin, cpUpload, propertyForSaleController.createProperty);
router.put('/:id', authAdmin, cpUpload, propertyForSaleController.updateProperty);
router.delete('/:id', authAdmin, propertyForSaleController.deleteProperty);

module.exports = router;