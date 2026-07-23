'use strict';

// Reusable booking helpers shared by every booking controller, replacing the
// per-type duplicated list + cancel logic.

function normalizePageParams({ page, limit } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  return { page: p, limit: l, skip: (p - 1) * l };
}

// Paginated, optionally-populated find. Returns { data, page, totalPages, total }.
async function paginate(Model, query = {}, { page, limit, populate, sort = { createdAt: -1 } } = {}) {
  const { page: p, limit: l, skip } = normalizePageParams({ page, limit });
  let q = Model.find(query).sort(sort).skip(skip).limit(l);
  if (populate) [].concat(populate).forEach((pp) => { q = q.populate(pp); });
  const [data, total] = await Promise.all([q.exec(), Model.countDocuments(query)]);
  return { data, page: p, totalPages: Math.ceil(total / l) || 1, total };
}

// Cancel by id (soft: sets status to 'cancelled'). Returns the updated doc or null.
async function cancelById(Model, id, { populate } = {}) {
  let q = Model.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
  if (populate) [].concat(populate).forEach((pp) => { q = q.populate(pp); });
  return q.exec();
}

module.exports = { paginate, cancelById, normalizePageParams };
