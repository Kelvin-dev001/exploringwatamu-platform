'use strict';

const { z } = require('zod');
const { VIBES, SUITS } = require('../constants/discovery');
const { TRIP_ITEM_KINDS } = require('../constants/tripItems');
const { LOCALES } = require('../constants/locales');

// JSON bodies from the website's trip planner and the admin quote builder.

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const optionalDate = z.preprocess((v) => (isBlank(v) ? undefined : new Date(v)), z.date({ error: 'Invalid date' }).optional());
const text = (max) => z.string().trim().max(max);

const item = z.object({
  kind: z.enum(TRIP_ITEM_KINDS).catch('other'),
  refId: text(80).optional(),
  title: text(200).min(1, 'Every item needs a title'),
  hours: z.number().min(0).max(24 * 30).nullish().transform((v) => v ?? undefined),
  listedPrice: z.number().min(0).nullish().transform((v) => v ?? undefined),
});

const day = z.object({
  label: text(60).optional(),
  date: optionalDate,
  items: z.array(item).max(12).default([]),
});

const createTripRequestSchema = z
  .object({
    contact: z.object({
      name: text(120).min(2, 'Please tell us your name'),
      email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(200),
      phone: text(40).optional(),
      country: text(80).optional(),
    }),
    profile: z
      .object({
        vibes: z.array(z.enum(VIBES)).max(6).default([]),
        companions: z.enum(SUITS).nullish(),
        stay: text(20).nullish(),
      })
      .partial()
      .optional(),
    arrival: optionalDate,
    departure: optionalDate,
    adults: z.number().int().min(1, 'At least one adult').max(50),
    children: z.number().int().min(0).max(50).default(0),
    residency: z.enum(['resident', 'nonResident']).default('nonResident'),
    // The website's language: the traveller's emails and quote come back in it.
    locale: z.enum(LOCALES).optional(),
    days: z.array(day).max(30).default([]),
    ideas: z.array(item).max(40).default([]),
    notes: text(2000).optional(),
    estimate: z
      .object({ total: z.number().min(0).nullish(), unpriced: z.number().int().min(0).nullish() })
      .partial()
      .optional(),
    // Honeypot: real people never fill this hidden field.
    website: z.string().max(0, 'Spam detected').optional(),
  })
  .superRefine((r, ctx) => {
    const count = r.days.reduce((n, d) => n + d.items.length, 0) + r.ideas.length;
    if (count === 0) ctx.addIssue({ code: 'custom', path: ['days'], message: 'Add at least one experience to your trip' });
    if (r.arrival && r.departure && r.departure < r.arrival) {
      ctx.addIssue({ code: 'custom', path: ['departure'], message: 'Departure cannot be before arrival' });
    }
  });

const sendQuoteSchema = z.object({
  lines: z
    .array(z.object({ label: text(200).min(1, 'Each line needs a description'), amount: z.coerce.number().min(0, 'Amounts cannot be negative') }))
    .min(1, 'Add at least one quote line')
    .max(100, 'A quote can have at most 100 lines'),
  message: text(4000).optional(),
  validUntil: optionalDate,
  adminNotes: text(4000).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['new', 'quoted', 'accepted', 'declined', 'cancelled']),
  note: text(500).optional(),
  notify: z.boolean().default(true),
});

const updateNotesSchema = z.object({ adminNotes: text(4000) });

module.exports = { createTripRequestSchema, sendQuoteSchema, updateStatusSchema, updateNotesSchema };
