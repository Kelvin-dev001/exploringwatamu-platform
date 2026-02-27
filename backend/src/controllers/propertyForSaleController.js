const PropertyForSale = require('../models/PropertyForSale');

// Helper to parse JSON strings from FormData
const parseJSON = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

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
    // req.files comes from upload.fields([{name:'pictures'},{name:'documents'}])
    const pictureUrls = req.files && req.files.pictures
      ? req.files.pictures.map(f => f.path)
      : [];
    const documentUrls = req.files && req.files.documents
      ? req.files.documents.map(f => f.path)
      : [];

    const propertyData = {
      type: req.body.type,
      name: req.body.name,
      description: req.body.description,
      location: req.body.location,
      price: Number(req.body.price),
      pictures: pictureUrls,
      documents: documentUrls,
      active: req.body.active === 'true' || req.body.active === true,
    };
    const property = new PropertyForSale(propertyData);
    await property.save();
    res.status(201).json(property);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create property', details: err.message });
  }
};

// Admin: Update property
exports.updateProperty = async (req, res) => {
  try {
    const newPictureUrls = req.files && req.files.pictures
      ? req.files.pictures.map(f => f.path)
      : [];
    const newDocumentUrls = req.files && req.files.documents
      ? req.files.documents.map(f => f.path)
      : [];
    const existingPictures = parseJSON(req.body.existingPictures);
    const existingDocuments = parseJSON(req.body.existingDocuments);

    const propertyData = {
      type: req.body.type,
      name: req.body.name,
      description: req.body.description,
      location: req.body.location,
      price: Number(req.body.price),
      pictures: [...existingPictures, ...newPictureUrls],
      documents: [...existingDocuments, ...newDocumentUrls],
      active: req.body.active === 'true' || req.body.active === true,
    };
    const property = await PropertyForSale.findByIdAndUpdate(
      req.params.id,
      propertyData,
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