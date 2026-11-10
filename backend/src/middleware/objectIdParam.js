'use strict';

// router.param('id', objectIdParam): a malformed id can never match a record,
// so answer 404 up front instead of letting Mongoose throw a CastError (which
// several listing controllers would otherwise report as a 500).
const OBJECT_ID = /^[a-f0-9]{24}$/i;

module.exports = function objectIdParam(req, res, next, value) {
  if (!OBJECT_ID.test(String(value))) return res.status(404).json({ error: 'Not found' });
  next();
};

module.exports.isObjectId = (value) => OBJECT_ID.test(String(value));
