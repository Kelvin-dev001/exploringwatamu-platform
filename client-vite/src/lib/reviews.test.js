import { describe, expect, it } from 'vitest';
import { aggregateRatingLd, formatAverage, ratingOf, reviewPath, reviewsLabel, withRatingType } from '@/lib/reviews';
import { reviewError } from '@/lib/reviewErrors';
import { normaliseGroupTrip, normaliseTour } from '@/lib/catalog';

// Ratings come from approved reviews only (the API's reviewStats). These turn
// them into what pages show and into valid JSON-LD — never an invented rating.

describe('ratings', () => {
  it('are null until a listing has approved reviews', () => {
    expect(ratingOf(undefined)).toBeNull();
    expect(ratingOf({ average: 0, count: 0 })).toBeNull();
    expect(ratingOf({ average: 4.6, count: 3 })).toEqual({ average: 4.6, count: 3 });
  });

  it('read naturally', () => {
    expect(formatAverage(4.66)).toBe('4.7');
    expect(formatAverage(5)).toBe('5.0');
    expect([reviewsLabel(1), reviewsLabel(12)]).toEqual(['1 review', '12 reviews']);
  });

  it('come through the catalogue for experiences and group trips', () => {
    expect(normaliseTour({ _id: 't', name: 'Snorkel', reviewStats: { average: 4.5, count: 2 } }).rating).toEqual({ average: 4.5, count: 2 });
    expect(normaliseTour({ _id: 't', name: 'Snorkel' }).rating).toBeNull();
    expect(normaliseGroupTrip({ _id: 'g', title: 'Reef', slug: 'reef', reviewStats: { average: 0, count: 0 } }).rating).toBeNull();
  });
});

describe('AggregateRating JSON-LD', () => {
  it('uses the real average and count, within schema.org’s scale', () => {
    expect(aggregateRatingLd({ average: 4.66, count: 3 })).toEqual({ '@type': 'AggregateRating', ratingValue: 4.7, reviewCount: 3, bestRating: 5, worstRating: 1 });
  });

  it('is left out entirely without approved reviews', () => {
    expect(aggregateRatingLd({ average: 0, count: 0 })).toBeUndefined();
    expect(aggregateRatingLd(null)).toBeUndefined();
    const ld = { '@type': withRatingType('TouristTrip', null), aggregateRating: aggregateRatingLd(null) };
    expect(JSON.parse(JSON.stringify(ld))).toEqual({ '@type': 'TouristTrip' });
  });

  it('adds Product to the type, since TouristTrip has no aggregateRating property', () => {
    expect(withRatingType('TouristTrip', { average: 5, count: 1 })).toEqual(['TouristTrip', 'Product']);
  });
});

describe('review errors and links', () => {
  it('say what went wrong', () => {
    expect(reviewError({ response: { status: 400, data: { issues: [{ message: 'Pick 1 to 5 stars' }, { message: 'Tell us a little more' }] } } })).toBe('Pick 1 to 5 stars · Tell us a little more');
    expect(reviewError({ response: { status: 409, data: { error: 'You’ve already reviewed this for this trip.' } } })).toMatch(/already reviewed/);
    expect(reviewError({ response: { status: 429, data: {} } })).toMatch(/try again in a little while/);
    expect(reviewError({})).toMatch(/couldn’t reach our server/);
  });

  it('point at the booking’s review page', () => {
    expect(reviewPath({ type: 'tripRequest', id: 'abc' })).toBe('/review/tripRequest/abc');
  });
});
