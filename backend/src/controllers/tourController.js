const Tour = require('../models/Tour');
const { parseDiscovery } = require('../constants/discovery');
const { activeFilter, canSee } = require('../services/listingVisibility');
const { contains, pageParams, pageOf } = require('../services/listQuery');
const { nextGallery, uploadedPaths } = require('../services/gallery');

// Helper to parse JSON strings from FormData
const parseJSON = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

exports.getTours = async (req, res, next) => {
  try {
    const { name, vehicleId } = req.query;
    const paging = pageParams(req.query);
    const query = activeFilter(req);
    const match = contains(name);
    if (match) query.name = match;
    if (vehicleId) query.vehicles = vehicleId;
    const [tours, total] = await Promise.all([
      Tour.find(query).populate('vehicles').skip(paging.skip).limit(paging.limit),
      Tour.countDocuments(query),
    ]);
    res.json(pageOf(tours, total, paging));
  } catch (err) { next(err); }
};

exports.getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id).populate('vehicles');
    if (!tour || !canSee(req, tour)) return res.status(404).json({ error: 'Not found' });
    res.json(tour);
  } catch (err) { next(err); }
};

exports.createTour = async (req, res, next) => {
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

exports.updateTour = async (req, res, next) => {
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

exports.deleteTour = async (req, res, next) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ error: 'Not found' });
    res.json({ message: "Tour deleted" });
  } catch (err) { next(err); }
};