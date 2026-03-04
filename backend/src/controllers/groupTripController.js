const GroupTrip = require('../models/GroupTrip');

// Helper to parse JSON strings from FormData
const parseJSON = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

// POST / — Create group trip (admin)
exports.createGroupTrip = async (req, res) => {
  try {
    const heroFile = req.files && req.files['heroImage'] ? req.files['heroImage'][0] : null;
    const galleryFiles = req.files && req.files['gallery'] ? req.files['gallery'] : [];
    const heroImage = heroFile ? heroFile.path : req.body.heroImage || '';
    const galleryUrls = galleryFiles.map(f => f.path);

    const data = {
      title: req.body.title,
      shortDescription: req.body.shortDescription,
      fullDescription: req.body.fullDescription || '',
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      meetingPoint: req.body.meetingPoint || '',
      itinerary: parseJSON(req.body.itinerary),
      includes: parseJSON(req.body.includes),
      excludes: parseJSON(req.body.excludes),
      accommodationDetails: req.body.accommodationDetails || '',
      maxParticipants: Number(req.body.maxParticipants),
      fullPrice: Number(req.body.fullPrice),
      depositAmount: Number(req.body.depositAmount),
      balanceDueDate: req.body.balanceDueDate || undefined,
      status: req.body.status || 'draft',
      heroImage,
      gallery: galleryUrls,
    };

    const trip = new GroupTrip(data);
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    console.error('Create group trip error:', err);
    res.status(400).json({ error: 'Failed to create group trip.', details: err.message });
  }
};

// PUT /:id — Update group trip (admin)
exports.updateGroupTrip = async (req, res) => {
  try {
    const heroFile = req.files && req.files['heroImage'] ? req.files['heroImage'][0] : null;
    const galleryFiles = req.files && req.files['gallery'] ? req.files['gallery'] : [];
    const newGalleryUrls = galleryFiles.map(f => f.path);
    const existingGallery = parseJSON(req.body.existingGallery);

    const update = {
      title: req.body.title,
      shortDescription: req.body.shortDescription,
      fullDescription: req.body.fullDescription || '',
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      meetingPoint: req.body.meetingPoint || '',
      itinerary: parseJSON(req.body.itinerary),
      includes: parseJSON(req.body.includes),
      excludes: parseJSON(req.body.excludes),
      accommodationDetails: req.body.accommodationDetails || '',
      maxParticipants: Number(req.body.maxParticipants),
      fullPrice: Number(req.body.fullPrice),
      depositAmount: Number(req.body.depositAmount),
      balanceDueDate: req.body.balanceDueDate || undefined,
      status: req.body.status,
      gallery: [...existingGallery, ...newGalleryUrls],
    };

    if (heroFile) update.heroImage = heroFile.path;
    else if (req.body.heroImage) update.heroImage = req.body.heroImage;

    const trip = await GroupTrip.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json(trip);
  } catch (err) {
    console.error('Update group trip error:', err);
    res.status(400).json({ error: 'Failed to update group trip.', details: err.message });
  }
};

// PUT /:id/publish — Set status to 'published' (admin)
exports.publishGroupTrip = async (req, res) => {
  try {
    const trip = await GroupTrip.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true });
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish group trip.' });
  }
};

// PUT /:id/close — Set status to 'closed' (admin)
exports.closeGroupTrip = async (req, res) => {
  try {
    const trip = await GroupTrip.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to close group trip.' });
  }
};

// DELETE /:id (admin)
exports.deleteGroupTrip = async (req, res) => {
  try {
    const trip = await GroupTrip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json({ message: 'Group trip deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete group trip.' });
  }
};

// GET /admin/all — All trips for admin
exports.getAllGroupTripsAdmin = async (req, res) => {
  try {
    const trips = await GroupTrip.find().sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group trips.' });
  }
};

// GET / — Published group trips (public)
exports.getPublishedGroupTrips = async (req, res) => {
  try {
    const trips = await GroupTrip.find({ status: { $in: ['published', 'full'] } }).sort({ startDate: 1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group trips.' });
  }
};

// GET /:slug — Single trip by slug (public, must be published or full)
exports.getGroupTripBySlug = async (req, res) => {
  try {
    const trip = await GroupTrip.findOne({ slug: req.params.slug, status: { $in: ['published', 'full'] } });
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group trip.' });
  }
};
