const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const authAdmin = require('../middleware/authAdmin');
const upload = require('../middleware/upload');

// List hotels
router.get('/', hotelController.getHotels);
// Get single hotel
router.get('/:id', hotelController.getHotel);

// Create hotel (with image upload)
router.post('/', authAdmin, upload.array('images', 10), hotelController.createHotel);

// Update hotel (with image upload)
router.put('/:id', authAdmin, upload.array('images', 10), hotelController.updateHotel);

// Delete hotel
router.delete('/:id', authAdmin, hotelController.deleteHotel);

module.exports = router;