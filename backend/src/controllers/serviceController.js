const Service = require('../models/Service');

// List services with pagination, search, and filter
exports.getServices = async (req, res) => {
  try {
    const { name, pricingType, day, active, page = 1, limit = 10 } = req.query;
    let query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (pricingType) query.pricingType = pricingType;
    if (active !== undefined) query.active = active === "true" || active === true;
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
    if (!service) return res.status(404).json({ error: 'Not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

// Admin: Create service
exports.createService = async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create service', details: err.message });
  }
};

// Admin: Update service
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
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