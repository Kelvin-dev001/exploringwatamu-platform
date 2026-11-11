const PropertyForSale = require('../models/PropertyForSale');
const { activeFilter, canSee } = require('../services/listingVisibility');
const { contains, pageParams, pageOf } = require('../services/listQuery');
const { nextGallery } = require('../services/gallery');

// List properties with filter, pagination, and type
exports.getProperties = async (req, res, next) => {
  try {
    const { type, name, location } = req.query;
    const paging = pageParams(req.query);
    const query = activeFilter(req);
    if (type) query.type = type;
    const nameMatch = contains(name);
    if (nameMatch) query.name = nameMatch;
    const locationMatch = contains(location);
    if (locationMatch) query.location = locationMatch;
    const [properties, total] = await Promise.all([
      PropertyForSale.find(query).skip(paging.skip).limit(paging.limit),
      PropertyForSale.countDocuments(query),
    ]);
    res.json(pageOf(properties, total, paging));
  } catch (err) {
    next(err);
  }
};

// Single property
exports.getProperty = async (req, res, next) => {
  try {
    const property = await PropertyForSale.findById(req.params.id);
    if (!property || !canSee(req, property)) return res.status(404).json({ error: 'Not found' });
    res.json(property);
  } catch (err) {
    next(err);
  }
};

// Admin: Create property
exports.createProperty = async (req, res, next) => {
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
exports.updateProperty = async (req, res, next) => {
  try {
    const newPictureUrls = req.files && req.files.pictures
      ? req.files.pictures.map(f => f.path)
      : [];
    const newDocumentUrls = req.files && req.files.documents
      ? req.files.documents.map(f => f.path)
      : [];
    const current = await PropertyForSale.findById(req.params.id).select('pictures documents');
    if (!current) return res.status(404).json({ error: 'Not found' });
    const pictures = nextGallery(current.pictures, req.body.existingPictures, newPictureUrls);
    const documents = nextGallery(current.documents, req.body.existingDocuments, newDocumentUrls);

    const propertyData = {
      type: req.body.type,
      name: req.body.name,
      description: req.body.description,
      location: req.body.location,
      price: Number(req.body.price),
      ...(pictures ? { pictures } : {}),
      ...(documents ? { documents } : {}),
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
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await PropertyForSale.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json({ message: "Property deleted" });
  } catch (err) {
    next(err);
  }
};