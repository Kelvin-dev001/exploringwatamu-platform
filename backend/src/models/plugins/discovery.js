'use strict';

const { VIBES, SUITS, ENERGY } = require('../../constants/discovery');

/**
 * Mongoose plugin: adds the discovery tags used for personalised matching.
 * All optional — untagged listings still show, they just rank lower.
 */
module.exports = function discoveryPlugin(schema) {
  schema.add({
    vibes: [{ type: String, enum: VIBES }],
    suits: [{ type: String, enum: SUITS }],
    energy: { type: String, enum: [...ENERGY, null], default: null },
    // Typical length in hours (e.g. 4 for a half day, 48 for two days).
    durationHours: { type: Number, min: 0, default: null },
  });
  schema.index({ vibes: 1 });
};
