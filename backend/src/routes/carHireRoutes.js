const express = require('express');
const router = express.Router();
const carHireController = require('../controllers/carHireController');

router.get('/', carHireController.getCarHires);
router.post('/', carHireController.createCarHire);
router.put('/:id', carHireController.updateCarHire);
router.delete('/:id', carHireController.deleteCarHire);

module.exports = router;