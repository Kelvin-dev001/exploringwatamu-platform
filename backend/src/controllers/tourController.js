const Tour = require('../models/Tour');
const { parseDiscovery } = require('../constants/discovery');
const { activeFilter, canSee } = require('../services/listingVisibility');
const { nextGallery, uploadedPaths } = require('../services/gallery');

// Helper to parse JSON strings from FormData
const parseJSON = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

exports.getTours = async (req, res) => {
  try {
    const { name, vehicleId, page = 1, limit = 10 } = req.query;
    let query = activeFilter(req);
    if (name) query.name = { $regex: name, $options: "i" };
    if (vehicleId) query.vehicles = vehicleId;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tours = await Tour.find(query).populate('vehicles').skip(skip).limit(parseInt(limit));
    const total = await Tour.countDocuments(query);
    res.json({ data: tours, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch tours' }); }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id).populate('vehicles');
    if (!tour || !canSee(req, tour)) return res.status(404).json({ error: 'Not found' });
    res.json(tour);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch tour' }); }
};

exports.createTour = async (req, res) => {
  try {
    const galleryUrls = req.files ? req.files.map(f => f.path) : [];

    // FIX: Filter out empty strings so Mongoose doesn't try to cast "" to ObjectId
    const vehicleIds = parseJSON(req.body.vehicles).filter(id => id && id.trim() !== '');

    const tourData = {
      name: req.body.name,
      description: req.body.description,
      recommendedTimes: req.body.recommendedTimes || '',
      duration: req.body.duration || '',
      highlights: parseJSON(req.body.highlights),
      whatToCarry: parseJSON(req.body.whatToCarry),
      vehicles: vehicleIds,
      gallery: galleryUrls,
      priceResidentAdult: Number(req.body.priceResidentAdult),
      priceResidentChild: Number(req.body.priceResidentChild),
      priceForeignerAdult: Number(req.body.priceForeignerAdult),
      priceForeignerChild: Number(req.body.priceForeignerChild),
      active: req.body.active === 'true' || req.body.active === true,
      ...parseDiscovery(req.body),
    };
    const tour = new Tour(tourData);
    await tour.save();
    res.status(201).json(await tour.populate('vehicles'));
  } catch (err) {
    res.status(400).json({ error: 'Failed to create tour', details: err.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const current = await Tour.findById(req.params.id).select('gallery');
    if (!current) return res.status(404).json({ error: 'Not found' });
    const gallery = nextGallery(current.gallery, req.body.existingGallery, uploadedPaths(req.files));

    // FIX: Same filter for update
    const vehicleIds = parseJSON(req.body.vehicles).filter(id => id && id.trim() !== '');

    const tourData = {
      name: req.body.name,
      description: req.body.description,
      recommendedTimes: req.body.recommendedTimes || '',
      duration: req.body.duration || '',
      highlights: parseJSON(req.body.highlights),
      whatToCarry: parseJSON(req.body.whatToCarry),
      vehicles: vehicleIds,
      ...(gallery ? { gallery } : {}),
      priceResidentAdult: Number(req.body.priceResidentAdult),
      priceResidentChild: Number(req.body.priceResidentChild),
      priceForeignerAdult: Number(req.body.priceForeignerAdult),
      priceForeignerChild: Number(req.body.priceForeignerChild),
      active: req.body.active === 'true' || req.body.active === true,
      ...parseDiscovery(req.body),
    };
    const tour = await Tour.findByIdAndUpdate(req.params.id, tourData, { new: true, runValidators: true }).populate('vehicles');
    if (!tour) return res.status(404).json({ error: 'Not found' });
    res.json(tour);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update tour', details: err.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ error: 'Not found' });
    res.json({ message: "Tour deleted" });
  } catch (err) { res.status(500).json({ error: 'Failed to delete tour' }); }
};