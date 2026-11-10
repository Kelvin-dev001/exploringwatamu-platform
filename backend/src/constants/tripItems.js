'use strict';

/*
 * What a trip-planner item is. Mirrors the snapshot kinds in
 * client-vite/src/lib/trip.js, so the admin sees whether an item is an
 * experience, a stay, a car or a service. 'other' covers anything else
 * (and older requests saved before stays/car hire/services had their own kind).
 */
const TRIP_ITEM_KINDS = ['tour', 'group', 'transfer', 'stay', 'carhire', 'service', 'other'];

module.exports = { TRIP_ITEM_KINDS };
