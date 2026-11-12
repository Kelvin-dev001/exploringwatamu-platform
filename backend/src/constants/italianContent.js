'use strict';

/*
 * Optional Italian text on listings, written by the team in the admin portal
 * (never machine-translated). Every field is optional: a listing without them
 * shows its English text on the Italian website. An empty value clears one.
 *
 *   titleIt              the Italian title (tours, group trips, services, property)
 *   shortDescriptionIt   group trips' short description
 *   descriptionIt        the main description
 *
 * The website counts a listing as having an Italian page (hreflang, sitemap)
 * only when descriptionIt or shortDescriptionIt is filled in
 * (client-vite/src/i18n/listingContent.js).
 */
const ITALIAN_LIMITS = { titleIt: 200, shortDescriptionIt: 1000, descriptionIt: 20000 };

// Which Italian fields each listing type has.
const ITALIAN_FIELDS = {
  tour: ['titleIt', 'descriptionIt'],
  group: ['titleIt', 'shortDescriptionIt', 'descriptionIt'],
  stay: ['descriptionIt'],
  transfer: ['descriptionIt'],
  carhire: ['descriptionIt'],
  service: ['titleIt', 'descriptionIt'],
  property: ['titleIt', 'descriptionIt'],
};

/**
 * The Italian fields present in a create/update body (form data arrives as
 * strings). Omitted fields stay omitted, so an older form never wipes them;
 * a blank one is sent as '' and clears it.
 */
function parseItalian(body = {}, fields) {
  const out = {};
  for (const field of fields) {
    if (body[field] !== undefined && body[field] !== null) out[field] = String(body[field]).trim();
  }
  return out;
}

module.exports = { ITALIAN_FIELDS, ITALIAN_LIMITS, parseItalian };
