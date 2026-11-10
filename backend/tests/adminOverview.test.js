'use strict';

const { monthStart } = require('../src/controllers/adminOverviewController');

// The dashboard's "this month" figures use calendar months in East Africa
// Time (UTC+3), not UTC: 1 Nov 00:00 EAT is 31 Oct 21:00 UTC.
describe('dashboard month boundary (EAT)', () => {
  it('starts the month at midnight EAT', () => {
    expect(monthStart(new Date('2026-11-10T12:00:00Z')).toISOString()).toBe('2026-10-31T21:00:00.000Z');
  });

  it('counts the first hours of a month in EAT as the new month', () => {
    // 31 Oct 22:00 UTC is already 1 Nov 01:00 in Watamu.
    expect(monthStart(new Date('2026-10-31T22:00:00Z')).toISOString()).toBe('2026-10-31T21:00:00.000Z');
    // 31 Oct 20:59 UTC is still October in Watamu.
    expect(monthStart(new Date('2026-10-31T20:59:00Z')).toISOString()).toBe('2026-09-30T21:00:00.000Z');
  });

  it('handles the year change', () => {
    expect(monthStart(new Date('2026-12-31T21:30:00Z')).toISOString()).toBe('2026-12-31T21:00:00.000Z');
  });
});
