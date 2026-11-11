'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');
const { VIBES, SUITS } = require('../constants/discovery');
const { TRIP_ITEM_KINDS } = require('../constants/tripItems');

/*
 * A custom itinerary sent from the website's trip planner. The traveller
 * builds days of experiences; our team prices the whole trip and emails a
 * quote. No payment is taken at this stage.
 *
 * Lifecycle: new -> quoted -> accepted | declined;  any -> cancelled
 */
const STATUSES = ['new', 'quoted', 'accepted', 'declined', 'cancelled'];

const itemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: TRIP_ITEM_KINDS, default: 'other' },
    refId: { type: String }, // listing id on our side (tour, group trip, stay...), if any
    title: { type: String, required: true, trim: true, maxlength: 200 },
    hours: { type: Number, min: 0 },
    // Price the traveller saw when they planned (indicative only).
    listedPrice: { type: Number, min: 0 },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 60 },
    date: { type: Date },
    items: [itemSchema],
  },
  { _id: false }
);

const quoteLineSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const tripRequestSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    contact: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
      phone: { type: String, trim: true, maxlength: 40 },
      country: { type: String, trim: true, maxlength: 80 },
    },

    profile: {
      vibes: [{ type: String, enum: VIBES }],
      companions: { type: String, enum: [...SUITS, null], default: null },
      stay: { type: String, trim: true, maxlength: 20 },
    },

    arrival: { type: Date },
    departure: { type: Date },
    flexibleDates: { type: Boolean, default: false },
    adults: { type: Number, min: 1, max: 50, default: 2 },
    children: { type: Number, min: 0, max: 50, default: 0 },
    residency: { type: String, enum: ['resident', 'nonResident'], default: 'nonResident' },

    days: [daySchema],
    ideas: [itemSchema], // added but not scheduled on a day
    notes: { type: String, trim: true, maxlength: 2000 },
    estimate: { total: { type: Number, min: 0 }, unpriced: { type: Number, min: 0 } },

    status: { type: String, enum: STATUSES, default: 'new' },
    quote: {
      lines: [quoteLineSchema],
      total: { type: Number, min: 0 },
      currency: { type: String, default: 'KES' },
      message: { type: String, trim: true, maxlength: 4000 },
      validUntil: { type: Date },
      sentAt: { type: Date },
      sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    },
    adminNotes: { type: String, trim: true, maxlength: 4000 },
    history: [
      {
        _id: false,
        status: { type: String, enum: STATUSES },
        at: { type: Date, default: Date.now },
        by: { type: String }, // 'traveller' | 'admin'
        note: { type: String, maxlength: 500 },
      },
    ],
  },
  { timestamps: true }
);

// Human-friendly reference, e.g. EW-7K3Q9M (no 0/O/1/I to avoid confusion).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeReference() {
  const bytes = crypto.randomBytes(6);
  return 'EW-' + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

tripRequestSchema.pre('validate', function setReference(next) {
  if (!this.reference) this.reference = makeReference();
  next();
});

tripRequestSchema.virtual('itemCount').get(function itemCount() {
  return (this.days || []).reduce((n, d) => n + (d.items || []).length, 0) + (this.ideas || []).length;
});
tripRequestSchema.set('toJSON', { virtuals: true });

tripRequestSchema.statics.STATUSES = STATUSES;

// Indexes follow the real queries (docs/DATABASE.md):
// admin inbox by status, newest first (also the dashboard's oldest "new")
tripRequestSchema.index({ status: 1, createdAt: -1 });
// admin inbox without a status filter
tripRequestSchema.index({ createdAt: -1 });
// "My trips": requests made signed in, or as a guest with the same email
tripRequestSchema.index({ user: 1, createdAt: -1 });
tripRequestSchema.index({ 'contact.email': 1 });

module.exports = mongoose.model('TripRequest', tripRequestSchema);
