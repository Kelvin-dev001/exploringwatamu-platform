const Hotel = require('../models/Hotel');

// Get all hotels
exports.getHotels = async (req, res) => {
  const hotels = await Hotel.find();
  res.json(hotels);
};

// Create hotel with image upload
exports.createHotel = async (req, res) => {
  try {
    // Images: req.files (array from multer)
    const imageUrls = req.files ? req.files.map(file => file.path) : [];
    const hotelData = { ...req.body, images: imageUrls };

    // Convert facilities and roomTypes from comma string to array if needed
    if (typeof hotelData.facilities === "string")
      hotelData.facilities = hotelData.facilities.split(',').map(f => f.trim());
    if (typeof hotelData.roomTypes === "string")
      hotelData.roomTypes = hotelData.roomTypes.split(',').map(r => r.trim());

    const hotel = new Hotel(hotelData);
    await hotel.save();
    res.status(201).json(hotel);
  } catch (err) {
    res.status(500).json({ error: "Failed to create hotel", details: err.message });
  }
};

// Update hotel with image upload
exports.updateHotel = async (req, res) => {
  try {
    // Images: req.files (array from multer), existing URLs: req.body.images (array)
    let imageUrls = [];
    if (req.body.images) {
      if (typeof req.body.images === "string")
        imageUrls = [req.body.images];
      else
        imageUrls = req.body.images;
    }
    if (req.files) imageUrls = imageUrls.concat(req.files.map(file => file.path));

    const hotelData = { ...req.body, images: imageUrls };

    // Convert facilities and roomTypes from comma string to array if needed
    if (typeof hotelData.facilities === "string")
      hotelData.facilities = hotelData.facilities.split(',').map(f => f.trim());
    if (typeof hotelData.roomTypes === "string")
      hotelData.roomTypes = hotelData.roomTypes.split(',').map(r => r.trim());

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, hotelData, { new: true });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: "Failed to update hotel", details: err.message });
  }
};

// Delete hotel
exports.deleteHotel = async (req, res) => {
  await Hotel.findByIdAndDelete(req.params.id);
  res.json({ message: "Hotel deleted" });
};