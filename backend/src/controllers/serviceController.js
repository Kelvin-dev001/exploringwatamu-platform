const Service = require('../models/Service');
const { ITALIAN_FIELDS, parseItalian } = require('../constants/italianContent');
const { activeFilter, canSee } = require('../services/listingVisibility');
const { contains, pageParams, pageOf } = require('../services/listQuery');
const { nextGallery, uploadedPaths } = require('../services/gallery');

// Helper to parse JSON strings from FormData
const parseJSON = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

// List services with pagination, search, and filter
exports.getServices = async (req, res, next) => {
  try {
    const { name, pricingType, day } = req.query;
    const paging = pageParams(req.query);
    const query = activeFilter(req);
    const match = contains(name);
    if (match) query.name = match;
    if (pricingType) query.pricingType = pricingType;
    if (day) query.availableDays = day;
    const [services, total] = await Promise.all([
      Service.find(query).skip(paging.skip).limit(paging.limit),
      Service.countDocuments(query),
    ]);
    res.json(pageOf(services, total, paging));
  } catch (err) {
    next(err);
  }
};

// Single service
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service || !canSee(req, service)) return res.status(404).json({ error: 'Not found' });
    res.json(service);
  } catch (err) {
    next(err);
  }
};

// Admin: Create service
exports.createService = async (req, res, next) => {
  try {
    const galleryUrls = req.files ? req.files.map(f => f.path) : [];
    const serviceData = {
      name: req.body.name,
      description: req.body.description,
      pricingType: req.body.pricingType,
      price: Number(req.body.price),
      availableDays: parseJSON(req.body.availableDays),
      availableHours: parseJSON(req.body.availableHours, { start: '', end: '' }),
      gallery: galleryUrls,
      active: req.body.active === 'true' || req.body.active === true,
      ...parseItalian(req.body, ITALIAN_FIELDS.service),
    };
    const service = new Service(serviceData);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create service', details: err.message });
  }
};

// Admin: Update service
exports.updateService = async (req, res, next) => {
  try {
    const current = await Service.findById(req.params.id).select('gallery');
    if (!current) return res.status(404).json({ error: 'Not found' });
    const gallery = nextGallery(current.gallery, req.body.existingGallery, uploadedPaths(req.files));
    const serviceData = {
      name: req.body.name,
      description: req.body.description,
      pricingType: req.body.pricingType,
      price: Number(req.body.price),
      availableDays: parseJSON(req.body.availableDays),
      availableHours: parseJSON(req.body.availableHours, { start: '', end: '' }),
      ...(gallery ? { gallery } : {}),
      active: req.body.active === 'true' || req.body.active === true,
      ...parseItalian(req.body, ITALIAN_FIELDS.service),
    };
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      serviceData,
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ error: 'Not found' });
    res.json(service);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update service', details: err.message });
  }
};

// Admin: Delete service
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ error: 'Not found' });
    res.json({ message: "Service deleted" });
  } catch (err) {
    next(err);
  }
};