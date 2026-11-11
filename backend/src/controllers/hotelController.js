const Hotel = require('../models/Hotel');
const { nextGallery, uploadedPaths } = require('../services/gallery');

// Multipart sends these objects/arrays as JSON strings (JSON.stringify on the
// admin form). Parses them in place; returns the first field that isn't valid
// JSON, or null.
const JSON_FIELDS = ['roomTypes', 'faqs', 'houseRules', 'location', 'contact', 'facilities', 'popularFacilities'];
function parseJsonFields(data) {
  for (const key of JSON_FIELDS) {
    const value = data[key];
    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        return key;
      }
    }
  }
  return null;
}

// The old embedded Hotel.reviews were never moderated: they stay in the
// database (see scripts/migrateLegacyReviews.js) but are never sent out.
const PUBLIC = '-reviews';

// Get all hotels
exports.getHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find().select(PUBLIC);
    res.json(hotels);
  } catch (err) {
    next(err);
  }
};

// Get single hotel by ID
exports.getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).select(PUBLIC);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    next(err);
  }
};

// Create hotel with image upload
exports.createHotel = async (req, res, next) => {
  try {
    const hotelData = { ...req.body, images: uploadedPaths(req.files) };
    const bad = parseJsonFields(hotelData);
    if (bad) return res.status(400).json({ error: `Invalid JSON in field "${bad}"` });

    // Cast stars to number if present
    if (hotelData.stars) hotelData.stars = Number(hotelData.stars);

    // Validate required fields
    if (!hotelData.type) {
      return res.status(400).json({ error: 'Missing required field "type"' });
    }
    if (!hotelData.name) {
      return res.status(400).json({ error: 'Missing required field "name"' });
    }

    const hotel = new Hotel(hotelData);
    await hotel.save();
    res.status(201).json(hotel);
  } catch (err) {
    next(err);
  }
};

// Update hotel with image upload
exports.updateHotel = async (req, res, next) => {
  try {
    const current = await Hotel.findById(req.params.id).select('images');
    if (!current) return res.status(404).json({ error: 'Hotel not found' });

    // Kept photos come as `existingImages` (a JSON list); older admin forms sent
    // them as repeated `images` text values instead.
    const { existingImages, images: legacyKept, ...body } = req.body;
    const images = nextGallery(current.images, existingImages !== undefined ? existingImages : legacyKept, uploadedPaths(req.files));
    const hotelData = { ...body, ...(images ? { images } : {}) };
    const bad = parseJsonFields(hotelData);
    if (bad) return res.status(400).json({ error: `Invalid JSON in field "${bad}"` });

    // Cast stars to number if present
    if (hotelData.stars) hotelData.stars = Number(hotelData.stars);

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, hotelData, { new: true });
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    next(err);
  }
};

// Delete hotel
exports.deleteHotel = async (req, res, next) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ message: "Hotel deleted" });
  } catch (err) {
    next(err);
  }
};