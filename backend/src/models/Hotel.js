const mongoose = require('mongoose');

const RoomTypeSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  amenities: [String],
  availability: Boolean,
});

const FAQSchema = new mongoose.Schema({
  question: String,
  answer: String,
});

const ReviewSchema = new mongoose.Schema({
  user: String,
  rating: Number,
  text: String,
  date: Date,
});

const ContactSchema = new mongoose.Schema({
  whatsapp: String,
  email: String,
});

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['hotel', 'villa', 'airbnb'] }, // <--- enum added
  stars: { type: Number, min: 1, max: 5 },
  location: {
    address: String,
    mapUrl: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  description: { type: String },
  images: [String], // Array of Cloudinary URLs
  facilities: [String],
  popularFacilities: [String],
  roomTypes: [RoomTypeSchema],
  pricePerNight: Number,
  amenities: [String],
  availability: [String],
  faqs: [FAQSchema],
  houseRules: [String],
  reviews: [ReviewSchema],
  contact: ContactSchema,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hotel', HotelSchema);