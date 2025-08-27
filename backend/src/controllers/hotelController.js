const Hotel = require('../models/Hotel');

// Get all hotels
exports.getHotels = async (req, res) => {
  const hotels = await Hotel.find();
  res.json(hotels);
};

// Create hotel
exports.createHotel = async (req, res) => {
  const hotel = new Hotel(req.body);
  await hotel.save();
  res.status(201).json(hotel);
};

// Update hotel
exports.updateHotel = async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(hotel);
};

// Delete hotel
exports.deleteHotel = async (req, res) => {
  await Hotel.findByIdAndDelete(req.params.id);
  res.json({ message: "Hotel deleted" });
};