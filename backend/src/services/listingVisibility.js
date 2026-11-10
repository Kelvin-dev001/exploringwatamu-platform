'use strict';

/*
 * Which listings a request may see. Every listing type with an `active` flag
 * (tours, transfers, car hire, services, properties) follows the same rule:
 *
 *   public website   live listings only (active !== false), whatever is asked
 *   signed-in admin  everything; ?active=true or ?active=false narrows it
 *
 * Routes put optionalAdmin in front so req.admin is set for admin tokens.
 */
const LIVE = { active: { $ne: false } };

function activeFilter(req) {
  if (!req.admin) return { ...LIVE };
  const wanted = String(req.query?.active ?? '');
  if (wanted === 'true') return { ...LIVE };
  if (wanted === 'false') return { active: false };
  return {};
}

/** Whether a single listing (already loaded) may be shown to this request. */
const canSee = (req, doc) => Boolean(req.admin) || (doc && doc.active !== false);

module.exports = { activeFilter, canSee };
