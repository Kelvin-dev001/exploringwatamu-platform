'use strict';

const { ITALIAN_LIMITS } = require('../../constants/italianContent');

/**
 * Mongoose plugin: optional Italian text fields for a listing
 * (see constants/italianContent.js). Nothing is required, so existing
 * listings stay valid without them.
 *
 *   schema.plugin(italianContent, { fields: ['titleIt', 'descriptionIt'] })
 */
module.exports = function italianContentPlugin(schema, { fields = [] } = {}) {
  const add = {};
  for (const field of fields) {
    const max = ITALIAN_LIMITS[field];
    add[field] = { type: String, trim: true, default: undefined, maxlength: [max, `${field} can be at most ${max} characters`] };
  }
  schema.add(add);
};
