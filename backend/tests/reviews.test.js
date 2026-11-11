'use strict';

// Review building blocks without a database: request validation, display
// names, invitation tokens, and the query validation fix.

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const config = require('../src/config/env');
const validate = require('../src/middleware/validate');
const v = require('../src/validators/reviewValidators');
const { signReviewInvite, verifyReviewInvite, verifyToken, signUserToken } = require('../src/services/tokens');
const { displayNameOf } = require('../src/controllers/reviewController');
const { dayOver } = require('../src/services/reviewEligibility');
const { toReview } = require('../src/services/legacyReviewMigration');
const { LISTING_TYPES, LISTINGS } = require('../src/constants/reviews');

const ID = '64b000000000000000000001';
const good = { listingType: 'stay', listingId: ID, bookingType: 'tripRequest', bookingId: ID, rating: 4, text: 'Lovely, quiet and close to the beach.' };

describe('review submission schema', () => {
  it('accepts a complete review and trims the text', () => {
    expect(v.submitReviewSchema.parse({ ...good, text: `  ${good.text}  ` }).text).toBe(good.text);
    expect(v.submitReviewSchema.parse({ ...good, rating: '5' }).rating).toBe(5);
  });

  it.each([
    [{ rating: 0 }], [{ rating: 6 }], [{ rating: 3.5 }], [{ rating: 'five' }],
    [{ text: 'Short' }], [{ text: 'x'.repeat(2001) }], [{ text: ' '.repeat(40) }],
    [{ listingType: 'property' }], [{ bookingType: 'legacy' }], [{ bookingType: 'tourBooking' }],
    [{ listingId: 'abc' }], [{ bookingId: { $gt: '' } }],
  ])('refuses %j', (patch) => {
    expect(v.submitReviewSchema.safeParse({ ...good, ...patch }).success).toBe(false);
  });

  it('drops fields a traveller must not set', () => {
    const parsed = v.submitReviewSchema.parse({ ...good, status: 'approved', verified: true, user: ID, displayName: 'The Owner' });
    expect(Object.keys(parsed).sort()).toEqual(['bookingId', 'bookingType', 'listingId', 'listingType', 'rating', 'text']);
  });

  it('caps a listing’s page size and needs booking type and id together', () => {
    expect(v.listReviewsQuery.parse({ listingType: 'tour', listingId: ID })).toMatchObject({ page: 1, limit: 5 });
    expect(v.listReviewsQuery.safeParse({ listingType: 'tour', listingId: ID, limit: 21 }).success).toBe(false);
    expect(v.eligibleQuery.safeParse({ bookingType: 'tripRequest' }).success).toBe(false);
    expect(v.eligibleQuery.safeParse({}).success).toBe(true);
    expect(v.moderateSchema.safeParse({ status: 'deleted' }).success).toBe(false);
    expect(v.replySchema.parse({ text: '  ' }).text).toBe('');
  });

  it('covers the six listing types, each with a model', () => {
    expect(LISTING_TYPES).toEqual(['tour', 'group', 'stay', 'transfer', 'carhire', 'service']);
    for (const type of LISTING_TYPES) expect(LISTINGS[type].model).toEqual(expect.any(String));
  });
});

describe('display names', () => {
  it('show a first name and initial', () => {
    expect(displayNameOf('Amina Hassan')).toBe('Amina H.');
    expect(displayNameOf('  jean  claude van damme ')).toBe('jean D.');
    expect(displayNameOf('Cher')).toBe('Cher');
    expect(displayNameOf('')).toBe('Traveller');
  });
});

describe('review invitations', () => {
  const invite = { bookingType: 'tripRequest', bookingId: ID, email: 'Ada@Example.com' };

  it('round-trip, with the email lower-cased', () => {
    expect(verifyReviewInvite(signReviewInvite(invite))).toEqual({ bookingType: 'tripRequest', bookingId: ID, email: 'ada@example.com' });
  });

  it('refuse forgeries, sign-in tokens and expired invitations', () => {
    expect(verifyReviewInvite(jwt.sign({ bt: 'tripRequest', bid: ID, em: 'a@b.co' }, 'wrong-secret-0123456789', { audience: 'review-invite' }))).toBeNull();
    expect(verifyReviewInvite(signUserToken({ _id: ID }))).toBeNull();
    const expired = jwt.sign({ bt: 'tripRequest', bid: ID, em: 'a@b.co', exp: Math.floor(Date.now() / 1000) - 10 }, config.jwtSecret, { audience: 'review-invite' });
    expect(verifyReviewInvite(expired)).toBeNull();
    expect(verifyReviewInvite('')).toBeNull();
  });

  it('can never be used to sign in', () => {
    expect(() => verifyToken(signReviewInvite(invite))).toThrow(/not a session token/);
    expect(verifyToken(signUserToken({ _id: ID })).id).toBe(ID);
  });
});

describe('dates', () => {
  it('treat a calendar day as over at the next midnight', () => {
    expect(dayOver(new Date('2027-01-10T00:00:00Z')).toISOString()).toBe('2027-01-11T00:00:00.000Z');
    expect(dayOver(null)).toBeNull();
  });
});

describe('legacy review mapping', () => {
  it('rounds ratings into 1–5 and refuses what can’t be kept', () => {
    const base = { source: 'reviews', id: ID, hotelId: ID, hotel: { name: 'Turtle Bay' }, name: 'Jo', text: 'Fine' };
    expect(toReview({ ...base, rating: 4.6 }).doc.rating).toBe(5);
    expect(toReview({ ...base, rating: 0 }).skip).toMatch(/not 1–5/);
    expect(toReview({ ...base, rating: 'x' }).skip).toMatch(/not 1–5/);
    expect(toReview({ ...base, rating: 3, text: '' }).skip).toBe('empty text');
    expect(toReview({ ...base, rating: 3, name: '' }).doc.displayName).toBe('Guest');
    expect(toReview({ ...base, rating: 3, hotel: null }).doc.status).toBe('hidden');
  });
});

describe('validate(schema, "query")', () => {
  it('replaces req.query with the parsed value under Express 5', async () => {
    const app = express();
    app.get('/x', validate(z.object({ page: z.coerce.number().default(1), limit: z.coerce.number().default(5) }), 'query'), (req, res) => res.json(req.query));
    expect((await request(app).get('/x?page=3')).body).toEqual({ page: 3, limit: 5 });
  });
});
