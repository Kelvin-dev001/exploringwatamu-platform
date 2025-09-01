const express = require('express');
const router = express.Router();
const propertyForSaleController = require('../controllers/propertyForSaleController');
const authAdmin = require('../middleware/authAdmin');

router.get('/', propertyForSaleController.getProperties);
router.get('/:id', propertyForSaleController.getProperty);
router.post('/', authAdmin, propertyForSaleController.createProperty);
router.put('/:id', authAdmin, propertyForSaleController.updateProperty);
router.delete('/:id', authAdmin, propertyForSaleController.deleteProperty);

module.exports = router;