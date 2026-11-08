'use strict';

const { z } = require('zod');

// Group trips are submitted as multipart/form-data, so every value arrives as a
// string (blank when an admin leaves an input empty) and lists arrive
// JSON-encoded. These helpers coerce to real types and report blanks as
// "X is required", instead of letting Number('') === 0 or a Mongoose cast
// error through.

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const blankToUndefined = (v) => (isBlank(v) ? undefined : v);

const requiredText = (label) =>
  z.preprocess(
    blankToUndefined,
    z.string({ error: (iss) => (iss.input === undefined ? `${label} is required` : `${label} must be text`) }).trim()
  );

const optionalText = () => z.preprocess(blankToUndefined, z.string().trim().optional());

const numberField = (label, { integer = false, min }) => {
  let schema = z.number({
    error: (iss) => (iss.input === undefined ? `${label} is required` : `${label} must be a number`),
  });
  if (integer) schema = schema.int(`${label} must be a whole number`);
  schema = schema.min(min, `${label} must be at least ${min}`);
  return z.preprocess((v) => (isBlank(v) ? undefined : typeof v === 'string' ? Number(v.trim()) : v), schema);
};

const toDate = (v) => (isBlank(v) ? undefined : v instanceof Date ? v : new Date(v));
const dateSchema = (label) =>
  z.date({ error: (iss) => (iss.input === undefined ? `${label} is required` : `${label} must be a valid date`) });
const requiredDate = (label) => z.preprocess(toDate, dateSchema(label));
const optionalDate = (label) => z.preprocess(toDate, dateSchema(label).optional());

const jsonList = (label, item) =>
  z.preprocess((v, ctx) => {
    if (isBlank(v)) return [];
    if (typeof v !== 'string') return v;
    try {
      return JSON.parse(v);
    } catch {
      ctx.issues.push({ code: 'custom', message: `${label} must be a JSON array`, input: v });
      return z.NEVER;
    }
  }, z.array(item, { error: `${label} must be a list` }));

const itineraryDay = z.object({
  day: numberField('Itinerary day number', { integer: true, min: 1 }),
  title: requiredText('Day title'),
  activities: z.array(z.string().trim()).default([]),
});

const tripFields = {
  title: requiredText('Title'),
  shortDescription: requiredText('Short description'),
  fullDescription: optionalText(),
  startDate: requiredDate('Start date'),
  endDate: requiredDate('End date'),
  balanceDueDate: optionalDate('Balance due date'),
  meetingPoint: optionalText(),
  accommodationDetails: optionalText(),
  maxParticipants: numberField('Max participants', { integer: true, min: 1 }),
  fullPrice: numberField('Full price', { min: 0 }),
  depositAmount: numberField('Deposit amount', { min: 0 }),
  itinerary: jsonList('Itinerary', itineraryDay),
  includes: jsonList('Includes', z.string().trim()),
  excludes: jsonList('Excludes', z.string().trim()),
  status: z.preprocess(
    blankToUndefined,
    z.enum(['draft', 'published', 'full', 'closed'], { error: 'Status must be draft, published, full or closed' }).optional()
  ),
  // URL of an already-hosted image, when no new file is uploaded.
  heroImage: optionalText(),
};

function checkDatesAndPrices(trip, ctx) {
  if (trip.endDate < trip.startDate) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date cannot be before the start date' });
  }
  if (trip.depositAmount > trip.fullPrice) {
    ctx.addIssue({ code: 'custom', path: ['depositAmount'], message: 'Deposit amount cannot exceed the full price' });
  }
}

const createGroupTripSchema = z.object(tripFields).superRefine(checkDatesAndPrices);

const updateGroupTripSchema = z
  .object({ ...tripFields, existingGallery: jsonList('Existing gallery', z.string().trim()) })
  .superRefine(checkDatesAndPrices);

module.exports = { createGroupTripSchema, updateGroupTripSchema };
