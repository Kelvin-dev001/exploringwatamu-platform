const express = require('express');
const router = express.Router();
const carHireController = require('../controllers/carHireController');
const authAdmin = require('../middleware/authAdmin');
const optionalAdmin = require('../middleware/optionalAdmin');
const objectIdParam = require('../middleware/objectIdParam');

router.param('id', objectIdParam);

// List car hires: live ones for the public; admins (optionalAdmin) also see hidden ones
router.get('/', optionalAdmin, carHireController.getCarHires);

// Book a car hire (user-facing, must be a function in your controller)
router.post('/book', carHireController.bookCarHire);

// Get a single car hire by ID
router.get('/:id', optionalAdmin, carHireController.getCarHire);

// Admin: Create a new car hire
router.post('/', authAdmin, carHireController.createCarHire);

// Admin: Update a car hire
router.put('/:id', authAdmin, carHireController.updateCarHire);

// Admin: Delete a car hire
router.delete('/:id', authAdmin, carHireController.deleteCarHire);

module.exports = router;