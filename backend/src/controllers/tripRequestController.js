'use strict';

const TripRequest = require('../models/TripRequest');
const { paginate } = require('../services/bookingService');
const { notifyTripRequested, notifyQuoteSent, notifyStatus } = require('../services/tripRequestNotifications');

// Fire-and-forget: notifications must never delay or fail the response.
const later = (fn) => setImmediate(() => fn().catch((err) => console.error('[trip-request]', err.message)));

// Only what the traveller needs to see (no admin notes, no internal ids).
function publicView(r) {
  return {
    reference: r.reference,
    status: r.status,
    arrival: r.arrival,
    departure: r.departure,
    adults: r.adults,
    children: r.children,
    days: r.days,
    ideas: r.ideas,
    itemCount: r.itemCount,
    quote: r.status === 'quoted' || r.status === 'accepted' ? { lines: r.quote.lines, total: r.quote.total, currency: r.quote.currency, validUntil: r.quote.validUntil, message: r.quote.message } : null,
    createdAt: r.createdAt,
  };
}

// POST /api/trip-requests — public (signed in or guest)
exports.create = async (req, res, next) => {
  try {
    const { website, ...body } = req.body; // honeypot already validated empty
    const request = await TripRequest.create({
      ...body,
      flexibleDates: !body.arrival,
      user: req.user?._id || null,
      history: [{ status: 'new', by: 'traveller' }],
    });
    later(() => notifyTripRequested(request));
    res.status(201).json(publicView(request));
  } catch (err) {
    next(err);
  }
};

// GET /api/trip-requests/mine — signed-in traveller's requests
exports.listMine = async (req, res, next) => {
  try {
    const list = await TripRequest.find({ $or: [{ user: req.user._id }, { 'contact.email': req.user.email }] })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(list.map(publicView));
  } catch (err) {
    next(err);
  }
};

// GET /api/trip-requests — admin list (?status=&q=&page=&limit=)
exports.adminList = async (req, res, next) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && TripRequest.STATUSES.includes(status)) query.status = status;
    if (q && typeof q === 'string') {
      const safe = q.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ reference: new RegExp(safe, 'i') }, { 'contact.name': new RegExp(safe, 'i') }, { 'contact.email': new RegExp(safe, 'i') }];
    }
    const result = await paginate(TripRequest, query, { page, limit });
    const counts = await TripRequest.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
    res.json({ ...result, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
  } catch (err) {
    next(err);
  }
};

// GET /api/trip-requests/:id — admin detail
exports.adminGet = async (req, res, next) => {
  try {
    const r = await TripRequest.findById(req.params.id).populate('user', 'name email');
    if (!r) return res.status(404).json({ error: 'Trip request not found' });
    res.json(r);
  } catch (err) {
    next(err);
  }
};

// PUT /api/trip-requests/:id/quote — admin prices the trip and emails the quote
exports.sendQuote = async (req, res, next) => {
  try {
    const r = await TripRequest.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Trip request not found' });
    if (r.status === 'cancelled') return res.status(409).json({ error: 'This request was cancelled. Reopen it before sending a quote.' });

    const { lines, message, validUntil, adminNotes } = req.body;
    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    r.quote = { lines, total, currency: 'KES', message, validUntil, sentAt: new Date(), sentBy: req.admin?.id };
    if (adminNotes !== undefined) r.adminNotes = adminNotes;
    r.status = 'quoted';
    r.history.push({ status: 'quoted', by: 'admin', note: `Quote sent: KES ${total.toLocaleString('en-KE')}` });
    await r.save();

    later(() => notifyQuoteSent(r));
    res.json(r);
  } catch (err) {
    next(err);
  }
};

// PUT /api/trip-requests/:id/status — admin marks accepted / declined / cancelled / reopens
exports.updateStatus = async (req, res, next) => {
  try {
    const r = await TripRequest.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Trip request not found' });
    const { status, note, notify } = req.body;
    if (status === 'quoted' && !r.quote?.sentAt) {
      return res.status(409).json({ error: 'Send a quote first — it sets the status to quoted.' });
    }
    if (r.status === status) return res.json(r);
    r.status = status;
    r.history.push({ status, by: 'admin', note });
    await r.save();
    if (notify) later(() => notifyStatus(r, status));
    res.json(r);
  } catch (err) {
    next(err);
  }
};

// PUT /api/trip-requests/:id/notes — admin-only internal notes
exports.updateNotes = async (req, res, next) => {
  try {
    const adminNotes = typeof req.body.adminNotes === 'string' ? req.body.adminNotes.slice(0, 4000) : '';
    const r = await TripRequest.findByIdAndUpdate(req.params.id, { adminNotes }, { new: true });
    if (!r) return res.status(404).json({ error: 'Trip request not found' });
    res.json(r);
  } catch (err) {
    next(err);
  }
};

exports.publicView = publicView;
