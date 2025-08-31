const express = require('express');
const router = express.Router();
const carHireController = require('../controllers/carHireController');
const authAdmin = require('../middleware/authAdmin');

router.get('/', carHireController.getCarHires);
router.post('/book', carHireController.bookCarHire);

router.get('/:id', carHireController.getCarHire);
router.post('/', authAdmin, carHireController.createCarHire);
router.put('/:id', authAdmin, carHireController.updateCarHire);
router.delete('/:id', authAdmin, carHireController.deleteCarHire);

module.exports = router;