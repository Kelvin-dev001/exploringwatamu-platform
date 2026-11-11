const { parseDiscovery } = require('../constants/discovery');
const GroupTrip = require('../models/GroupTrip');
const { nextGallery, uploadedPaths } = require('../services/gallery');
const logger = require('../services/logger');

// Helper to parse JSON strings from FormData
const parseJSON = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

// POST / — Create group trip (admin)
exports.createGroupTrip = async (req, res, next) => {
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
      owner: (req.admin && req.admin.id) || null,
      heroImage,
      gallery: galleryUrls,
      ...parseDiscovery(req.body),
    };

    const trip = new GroupTrip(data);
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    logger.warn('group trip not created', { requestId: req.id, ...logger.errorFields(err) });
    res.status(400).json({ error: 'Failed to create group trip.', details: err.message });
  }
};

// PUT /:id — Update group trip (admin)
exports.updateGroupTrip = async (req, res, next) => {
  try {
    const heroFile = req.files && req.files['heroImage'] ? req.files['heroImage'][0] : null;
    const current = await GroupTrip.findById(req.params.id).select('gallery confirmedParticipants');
    if (!current) return res.status(404).json({ error: 'Group trip not found.' });

    // Same rule as quick edits: seats can't drop below travellers already confirmed.
    const seats = Number(req.body.maxParticipants);
    if (seats < (current.confirmedParticipants || 0)) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: [{ path: 'maxParticipants', message: `There are already ${current.confirmedParticipants} confirmed travellers.` }],
      });
    }
    const gallery = nextGallery(current.gallery, req.body.existingGallery, uploadedPaths(req.files && req.files['gallery']));

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
      maxParticipants: seats,
      fullPrice: Number(req.body.fullPrice),
      depositAmount: Number(req.body.depositAmount),
      balanceDueDate: req.body.balanceDueDate || undefined,
      status: req.body.status,
      ...parseDiscovery(req.body),
      ...(gallery ? { gallery } : {}),
    };

    if (heroFile) update.heroImage = heroFile.path;
    else if (req.body.heroImage) update.heroImage = req.body.heroImage;

    const trip = await GroupTrip.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json(trip);
  } catch (err) {
    logger.warn('group trip not updated', { requestId: req.id, ...logger.errorFields(err) });
    res.status(400).json({ error: 'Failed to update group trip.', details: err.message });
  }
};

// PUT /:id/publish — Set status to 'published' (admin)
exports.publishGroupTrip = async (req, res, next) => {
  try {
    const trip = await GroupTrip.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true });
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json(trip);
  } catch (err) {
    next(err);
  }
};

// PUT /:id/close — Set status to 'closed' (admin)
exports.closeGroupTrip = async (req, res, next) => {
  try {
    const trip = await GroupTrip.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json(trip);
  } catch (err) {
    next(err);
  }
};

// DELETE /:id (admin)
exports.deleteGroupTrip = async (req, res, next) => {
  try {
    const trip = await GroupTrip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json({ message: 'Group trip deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /admin/all — All trips for admin
// GET /admin/:id — one trip, any status (admin form and bookings screen)
exports.getGroupTripAdmin = async (req, res, next) => {
  try {
    const trip = await GroupTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json(trip);
  } catch (err) {
    next(err);
  }
};

exports.getAllGroupTripsAdmin = async (req, res, next) => {
  try {
    const trips = await GroupTrip.find().sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    next(err);
  }
};

// GET / — Published group trips (public)
exports.getPublishedGroupTrips = async (req, res, next) => {
  try {
    const trips = await GroupTrip.find({ status: { $in: ['published', 'full'] } }).sort({ startDate: 1 });
    res.json(trips);
  } catch (err) {
    next(err);
  }
};

// GET /:slug — Single trip by slug (public, must be published or full)
exports.getGroupTripBySlug = async (req, res, next) => {
  try {
    const trip = await GroupTrip.findOne({ slug: req.params.slug, status: { $in: ['published', 'full'] } });
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    res.json(trip);
  } catch (err) {
    next(err);
  }
};
