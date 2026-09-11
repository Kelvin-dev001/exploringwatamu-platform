'use strict';

const { createGroupTripSchema, updateGroupTripSchema } = require('../src/validators/groupTripValidators');

// What NewGroupTrip.jsx sends: every value is a string.
const form = (overrides = {}) => ({
  title: 'Watamu Weekend Escape',
  shortDescription: 'Two nights by the ocean',
  fullDescription: '',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
  meetingPoint: '',
  accommodationDetails: '',
  maxParticipants: '12',
  fullPrice: '25000',
  depositAmount: '10000',
  itinerary: '[]',
  includes: '[]',
  excludes: '[]',
  status: 'draft',
  ...overrides,
});

const issuesOf = (schema, input) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
};

describe('group trip validators', () => {
  it('coerces multipart strings to numbers, dates and arrays', () => {
    const data = createGroupTripSchema.parse(form({
      itinerary: '[{"day":1,"title":"Arrive","activities":["Snorkel"]}]',
      includes: '["Breakfast"]',
    }));
    expect(data.maxParticipants).toBe(12);
    expect(data.fullPrice).toBe(25000);
    expect(data.startDate).toBeInstanceOf(Date);
    expect(data.balanceDueDate).toBeUndefined();
    expect(data.itinerary).toEqual([{ day: 1, title: 'Arrive', activities: ['Snorkel'] }]);
    expect(data.includes).toEqual(['Breakfast']);
  });

  it.each([
    ['maxParticipants', '', 'Max participants is required'],
    ['maxParticipants', '0', 'Max participants must be at least 1'],
    ['maxParticipants', '2.5', 'Max participants must be a whole number'],
    ['fullPrice', 'abc', 'Full price must be a number'],
    ['depositAmount', '', 'Deposit amount is required'],
    ['title', '   ', 'Title is required'],
    ['startDate', '', 'Start date is required'],
    ['endDate', 'not-a-date', 'End date must be a valid date'],
    ['balanceDueDate', 'not-a-date', 'Balance due date must be a valid date'],
    ['itinerary', '{oops', 'Itinerary must be a JSON array'],
  ])('rejects %s=%j with a field-level message', (field, value, message) => {
    expect(issuesOf(createGroupTripSchema, form({ [field]: value }))).toContainEqual({ path: field, message });
  });

  it('treats a blank balance due date as not set', () => {
    expect(createGroupTripSchema.parse(form({ balanceDueDate: '' })).balanceDueDate).toBeUndefined();
  });

  it('rejects an itinerary day without a title', () => {
    expect(issuesOf(createGroupTripSchema, form({ itinerary: '[{"day":1,"title":"","activities":[]}]' })))
      .toContainEqual({ path: 'itinerary.0.title', message: 'Day title is required' });
  });

  it('rejects an end date before the start date and a deposit above the full price', () => {
    const issues = issuesOf(createGroupTripSchema, form({ endDate: '2026-09-30', depositAmount: '30000' }));
    expect(issues).toContainEqual({ path: 'endDate', message: 'End date cannot be before the start date' });
    expect(issues).toContainEqual({ path: 'depositAmount', message: 'Deposit amount cannot exceed the full price' });
  });

  it('accepts the edit form, including the kept gallery and a full trip', () => {
    const data = updateGroupTripSchema.parse(form({
      status: 'full',
      existingGallery: '["https://res.cloudinary.com/demo/a.jpg"]',
    }));
    expect(data.status).toBe('full');
    expect(data.existingGallery).toEqual(['https://res.cloudinary.com/demo/a.jpg']);
  });
});
