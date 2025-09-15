const express = require('express');
const router = express.Router();
const carHireController = require('../controllers/carHireController');
const authAdmin = require('../middleware/authAdmin');

// List all car hires
router.get('/', carHireController.getCarHires);

// Book a car hire (user-facing, must be a function in your controller)
router.post('/book', carHireController.bookCarHire);

// Get a single car hire by ID
router.get('/:id', carHireController.getCarHire);

// Admin: Create a new car hire
router.post('/', authAdmin, carHireController.createCarHire);

// Admin: Update a car hire
router.put('/:id', authAdmin, carHireController.updateCarHire);

// Admin: Delete a car hire
router.delete('/:id', authAdmin, carHireController.deleteCarHire);

module.exports = router;