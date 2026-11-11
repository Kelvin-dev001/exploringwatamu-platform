'use strict';

/*
 * Mongoose plugin: a listing's public rating, `reviewStats: { average, count }`,
 * from its approved reviews only. Stored on the listing so every list and card
 * gets it with no extra query (no N+1), and kept correct by recomputing it from
 * the reviews whenever one changes (services/reviewStats.js) — never by adding
 * or subtracting, so it can't drift or count a review twice.
 *
 * Only that service may write it: listing create/update bodies that include
 * reviewStats (admin forms send whole records) are ignored, so a stale value
 * can never overwrite a fresh one.
 */
const FIELD = 'reviewStats';
const ALLOW = 'allowReviewStats';

function stripUpdate(update) {
  if (!update) return;
  delete update[FIELD];
  for (const key of Object.keys(update)) {
    if (key === FIELD || key.startsWith(`${FIELD}.`)) delete update[key];
    if (key.startsWith('$') && update[key] && typeof update[key] === 'object') stripUpdate(update[key]);
  }
}

module.exports = function reviewStatsPlugin(schema) {
  schema.add({
    [FIELD]: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
  });

  for (const op of ['findOneAndUpdate', 'updateOne', 'updateMany', 'findOneAndReplace', 'replaceOne']) {
    schema.pre(op, function guardReviewStats() {
      if (!this.getOptions()[ALLOW]) stripUpdate(this.getUpdate());
    });
  }

  // A new listing starts unrated, whatever the request body said.
  schema.pre('validate', function resetOnCreate() {
    if (this.isNew && !this.$locals[ALLOW]) this.set(FIELD, { average: 0, count: 0 });
  });
};

module.exports.ALLOW_OPTION = ALLOW;
