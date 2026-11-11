const express = require('express');
const router = express.Router();
const propertyForSaleController = require('../controllers/propertyForSaleController');
const authAdmin = require('../middleware/authAdmin');
const { adminWriteLimiter } = require('../middleware/rateLimiters');
const optionalAdmin = require('../middleware/optionalAdmin');
const objectIdParam = require('../middleware/objectIdParam');
const { uploadFields } = require('../middleware/upload');

// Accept both pictures and documents fields
const cpUpload = uploadFields([
  { name: 'pictures', maxCount: 10 },
  { name: 'documents', maxCount: 10 }
]);

router.param('id', objectIdParam);

// Public reads show live properties only; admins (optionalAdmin) also see hidden ones.
router.get('/', optionalAdmin, propertyForSaleController.getProperties);
router.get('/:id', optionalAdmin, propertyForSaleController.getProperty);
router.post('/', adminWriteLimiter, authAdmin, cpUpload, propertyForSaleController.createProperty);
router.put('/:id', adminWriteLimiter, authAdmin, cpUpload, propertyForSaleController.updateProperty);
router.delete('/:id', adminWriteLimiter, authAdmin, propertyForSaleController.deleteProperty);

module.exports = router;