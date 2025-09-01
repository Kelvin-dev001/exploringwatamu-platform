const PropertyForSale = require('../models/PropertyForSale');

// List properties with filter, pagination, and type
exports.getProperties = async (req, res) => {
  try {
    const { type, name, location, active, page = 1, limit = 10 } = req.query;
    let query = {};
    if (type) query.type = type;
    if (name) query.name = { $regex: name, $options: "i" };
    if (location) query.location = { $regex: location, $options: "i" };
    if (active !== undefined) query.active = active === "true" || active === true;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const properties = await PropertyForSale.find(query)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await PropertyForSale.countDocuments(query);
    res.json({
      data: properties,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
};

// Single property
exports.getProperty = async (req, res) => {
  try {
    const property = await PropertyForSale.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch property' });
  }
};

// Admin: Create property
exports.createProperty = async (req, res) => {
  try {
    const property = new PropertyForSale(req.body);
    await property.save();
    res.status(201).json(property);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create property', details: err.message });
  }
};

// Admin: Update property
exports.updateProperty = async (req, res) => {
  try {
    const property = await PropertyForSale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json(property);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update property', details: err.message });
  }
};

// Admin: Delete property
exports.deleteProperty = async (req, res) => {
  try {
    const property = await PropertyForSale.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json({ message: "Property deleted" });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete property' });
  }
};