'use strict';

const registry = require('../services/bookingRegistry');
const { paginate } = require('../services/bookingService');

const TYPES = Object.keys(registry);

// GET /api/bookings?type=&status=&page=&limit=
// One admin view across ALL booking types, in a consistent normalized shape.
// With ?type=... it paginates that type; without it, aggregates recent
// bookings from every type, merged and sorted by date.
exports.listAll = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;

    if (type) {
      const entry = registry[type];
      if (!entry) {
        return res.status(400).json({ error: `Unknown booking type: ${type}`, validTypes: TYPES });
      }
      const query = status ? { status } : {};
      const result = await paginate(entry.Model, query, { page, limit, populate: entry.populate });
      return res.json({ ...result, data: result.data.map(entry.normalize) });
    }

    const perType = 50;
    const lists = await Promise.all(
      TYPES.map(async (t) => {
        const entry = registry[t];
        let q = entry.Model.find(status ? { status } : {}).sort({ createdAt: -1 }).limit(perType);
        entry.populate.forEach((pp) => { q = q.populate(pp); });
        const docs = await q.exec();
        return docs.map(entry.normalize);
      })
    );

    const merged = lists.flat().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    res.json({ data: merged.slice(0, l), total: merged.length, page: 1, totalPages: 1, aggregated: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/summary — counts per type + per status, for dashboards.
exports.summary = async (req, res, next) => {
  try {
    const byType = await Promise.all(
      TYPES.map(async (t) => {
        const { Model, label } = registry[t];
        const [total, cancelled] = await Promise.all([
          Model.countDocuments(),
          Model.countDocuments({ status: 'cancelled' }),
        ]);
        return { type: t, label, total, active: total - cancelled, cancelled };
      })
    );
    res.json({ total: byType.reduce((s, r) => s + r.total, 0), byType });
  } catch (err) {
    next(err);
  }
};
