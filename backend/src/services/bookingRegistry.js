'use strict';

// Single source of truth for every booking type. The unified bookings endpoint
// and shared services use this so a new booking type only needs one entry here.
// `normalize` maps a type-specific document into a common shape.

const GroupBooking = require('../models/GroupBooking');
const TourBooking = require('../models/TourBooking');
const CarHireBooking = require('../models/CarHireBooking');
const ServiceBooking = require('../models/ServiceBooking');
const PropertyViewingBooking = require('../models/PropertyViewingBooking');
const TripRequest = require('../models/TripRequest');

const registry = {
  triprequest: {
    label: 'Trip Request',
    Model: TripRequest,
    populate: [],
    normalize: (r) => ({
      id: r._id,
      type: 'triprequest',
      status: r.status,
      customerName: r.contact?.name,
      customerContact: r.contact?.email || r.contact?.phone,
      item: `${r.reference} · ${r.itemCount} item${r.itemCount === 1 ? '' : 's'}`,
      date: r.arrival || null,
      amount: r.quote?.total ?? null,
      createdAt: r.createdAt,
    }),
  },

  grouptour: {
    label: 'Group Tour',
    Model: GroupBooking,
    populate: [
      { path: 'trip', select: 'title startDate endDate' },
      { path: 'user', select: 'name email' },
    ],
    normalize: (b) => ({
      id: b._id,
      type: 'grouptour',
      status: b.status,
      customerName: b.fullName,
      customerContact: b.email || b.phone,
      item: b.trip ? b.trip.title : null,
      date: b.trip ? b.trip.startDate : null,
      amount: b.amountPaid ?? null,
      createdAt: b.createdAt,
    }),
  },

  tour: {
    label: 'Tour',
    Model: TourBooking,
    populate: [{ path: 'tour', select: 'name title' }],
    normalize: (b) => ({
      id: b._id,
      type: 'tour',
      status: b.status,
      customerName: b.userName,
      customerContact: b.userContact,
      item: b.tour ? b.tour.name || b.tour.title : null,
      date: b.date,
      amount: null,
      createdAt: b.createdAt,
    }),
  },

  carhire: {
    label: 'Car Hire',
    Model: CarHireBooking,
    populate: [{ path: 'carHire', populate: { path: 'vehicle' } }],
    normalize: (b) => ({
      id: b._id,
      type: 'carhire',
      status: b.status,
      customerName: b.userName,
      customerContact: b.userContact,
      item: b.carHire && b.carHire.vehicle ? b.carHire.vehicle.name || b.carHire.vehicle.model : b.carHire ? 'Car hire' : null,
      date: b.startDate,
      amount: null,
      createdAt: b.createdAt,
    }),
  },

  service: {
    label: 'Service',
    Model: ServiceBooking,
    populate: [{ path: 'service', select: 'name title' }],
    normalize: (b) => ({
      id: b._id,
      type: 'service',
      status: b.status,
      customerName: b.userName,
      customerContact: b.userContact,
      item: b.service ? b.service.name || b.service.title : null,
      date: b.date,
      amount: null,
      createdAt: b.createdAt,
    }),
  },

  propertyviewing: {
    label: 'Property Viewing',
    Model: PropertyViewingBooking,
    populate: [{ path: 'property', select: 'title name' }],
    normalize: (b) => ({
      id: b._id,
      type: 'propertyviewing',
      status: b.status,
      customerName: b.userName,
      customerContact: b.userContact,
      item: b.property ? b.property.title || b.property.name : null,
      date: b.date,
      amount: null,
      createdAt: b.createdAt,
    }),
  },
};

module.exports = registry;
