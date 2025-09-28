const Hotel = require('../models/Hotel');

// Get all hotels
exports.getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hotels', details: err.message });
  }
};

// Get single hotel by ID
exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hotel', details: err.message });
  }
};

// Create hotel with image upload
exports.createHotel = async (req, res) => {
  try {
    const imageUrls = req.files ? req.files.map(file => file.path) : [];
    const hotelData = { ...req.body, images: imageUrls };

    // Cast stars to number if present
    if (hotelData.stars) hotelData.stars = Number(hotelData.stars);

    // Convert facilities and roomTypes from comma-separated string to array
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
    let imageUrls = [];
    if (req.body.images) {
      if (typeof req.body.images === "string")
        imageUrls = [req.body.images];
      else
        imageUrls = req.body.images;
    }
    if (req.files) imageUrls = imageUrls.concat(req.files.map(file => file.path));

    const hotelData = { ...req.body, images: imageUrls };

    // Cast stars to number if present
    if (hotelData.stars) hotelData.stars = Number(hotelData.stars);

    // Convert facilities and roomTypes from comma-separated string to array
    if (typeof hotelData.facilities === "string")
      hotelData.facilities = hotelData.facilities.split(',').map(f => f.trim());
    if (typeof hotelData.roomTypes === "string")
      hotelData.roomTypes = hotelData.roomTypes.split(',').map(r => r.trim());

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, hotelData, { new: true });
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: "Failed to update hotel", details: err.message });
  }
};

// Delete hotel
exports.deleteHotel = async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ message: "Hotel deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete hotel", details: err.message });
  }
};