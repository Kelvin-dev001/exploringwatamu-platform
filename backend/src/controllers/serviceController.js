const Service = require('../models/Service');
const { activeFilter, canSee } = require('../services/listingVisibility');
const { nextGallery, uploadedPaths } = require('../services/gallery');

// Helper to parse JSON strings from FormData
const parseJSON = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

// List services with pagination, search, and filter
exports.getServices = async (req, res) => {
  try {
    const { name, pricingType, day, page = 1, limit = 10 } = req.query;
    let query = activeFilter(req);
    if (name) query.name = { $regex: name, $options: "i" };
    if (pricingType) query.pricingType = pricingType;
    if (day) query.availableDays = day;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const services = await Service.find(query)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Service.countDocuments(query);
    res.json({
      data: services,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// Single service
exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service || !canSee(req, service)) return res.status(404).json({ error: 'Not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

// Admin: Create service
exports.createService = async (req, res) => {
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
    };
    const service = new Service(serviceData);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create service', details: err.message });
  }
};

// Admin: Update service
exports.updateService = async (req, res) => {
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
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ error: 'Not found' });
    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};