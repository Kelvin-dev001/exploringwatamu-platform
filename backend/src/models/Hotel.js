const mongoose = require('mongoose');
const HotelSchema = new mongoose.Schema({
  name: String,
  description: String,
  images: [String],
  amenities: [String],
  pricePerNight: Number,
  availability: [String],
});
module.exports = mongoose.model('Hotel', HotelSchema);