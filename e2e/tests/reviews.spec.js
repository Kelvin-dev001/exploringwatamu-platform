// @ts-check
const { test, expect, devices } = require('@playwright/test');

/*
 * A verified review, end to end, on a phone: a traveller whose accepted trip is
 * over writes a review; it isn't public until the team approves it in the
 * admin; then it shows, with the rating, on the experience page.
 * Uses the throwaway API (e2e/scripts/smoke-api.js): nothing is sent anywhere.
 */
const SITE = 'http://localhost:4173';
const ADMIN = 'http://localhost:4174';
const API = 'http://localhost:5055/api';
const DAY = 86400000;
const isoDay = (offset) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
// The first-visit question, if it shows.
const skipQuestion = (page) => page.getByRole('button', { name: 'Just let me browse' }).click({ timeout: 5000 }).catch(() => {});

test.describe.serial('write a review after the trip, then publish it', () => {
  const email = `reviewer-${Date.now()}@example.test`;
  const password = 'review-pass-123';
  let tourId;
  let requestId;

  test.beforeAll(async ({ request }) => {
    // A traveller, and their trip from last week, accepted by the team.
    const reg = await request.post(`${API}/auth/register`, { data: { name: 'Rhea Reviewer', email, password } });
    expect(reg.status()).toBe(201);
    const { token } = await reg.json();
    const tours = await (await request.get(`${API}/tours`)).json();
    tourId = (Array.isArray(tours) ? tours : tours.data).find((t) => t.name === 'Marine park snorkel')._id;

    const created = await request.post(`${API}/trip-requests`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        contact: { name: 'Rhea Reviewer', email },
        adults: 2,
        arrival: isoDay(-9),
        departure: isoDay(-7),
        days: [{ label: 'Day 1', date: isoDay(-9), items: [{ kind: 'tour', refId: tourId, title: 'Marine park snorkel' }] }],
      },
    });
    expect(created.status()).toBe(201);
    const { reference } = await created.json();

    const admin = await (await request.post(`${API}/admin/login`, { data: { email: 'smoke-admin@example.test', password: 'smoke-admin-pass-123' } })).json();
    const auth = { Authorization: `Bearer ${admin.token}` };
    requestId = (await (await request.get(`${API}/trip-requests`, { headers: auth, params: { q: reference } })).json()).data[0]._id;
    expect((await request.put(`${API}/trip-requests/${requestId}/status`, { headers: auth, data: { status: 'accepted', notify: false } })).status()).toBe(200);
  });

  test('the traveller writes a review from My bookings', async ({ page }) => {
    await page.goto(`${SITE}/login`);
    await skipQuestion(page);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel(/^Password/).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(`${SITE}/my-trips`);

    await page.getByRole('link', { name: /Write a review/ }).click();
    await expect(page).toHaveURL(`${SITE}/review/tripRequest/${requestId}`);
    await expect(page.getByRole('heading', { name: 'Marine park snorkel' })).toBeVisible();
    await page.getByRole('button', { name: 'Write a review' }).click();
    await page.getByRole('radio', { name: /^5 stars/ }).check({ force: true });
    await page.getByLabel('Your review').fill('Turtles, a sandbank lunch and a very patient guide. Book it!');
    await page.getByRole('button', { name: 'Send my review' }).click();
    await expect(page.getByText('Thanks — waiting for a quick check')).toBeVisible();

    // Not public yet.
    await page.goto(`${SITE}/experiences/${tourId}`);
    await expect(page.getByText('No reviews yet')).toBeVisible();
  });

  test('the team approves it and it appears with its rating', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['Pixel 7'] });
    const admin = await context.newPage();
    await admin.goto(`${ADMIN}/admin/login`);
    await admin.getByRole('textbox', { name: 'Email' }).fill('smoke-admin@example.test');
    await admin.getByRole('textbox', { name: /^Password/ }).fill('smoke-admin-pass-123');
    await admin.getByRole('button', { name: 'Sign in' }).click();
    await expect(admin).toHaveURL(`${ADMIN}/admin/dashboard`);
    await admin.goto(`${ADMIN}/reviews`);
    await admin.getByRole('button', { name: /Marine park snorkel/ }).click();
    const sheet = admin.getByRole('dialog', { name: 'Review' });
    await expect(sheet.getByText(/Rhea Reviewer/)).toBeVisible();
    await sheet.getByRole('button', { name: 'Approve' }).click();
    await expect(admin.getByText(/Approved — it’s on the website. Rating now 5 from 1/)).toBeVisible();
    await context.close();

    const site = await browser.newContext({ ...devices['Pixel 7'] });
    const page = await site.newPage();
    await page.goto(`${SITE}/experiences/${tourId}`);
    await skipQuestion(page);
    await expect(page.getByText('Turtles, a sandbank lunch and a very patient guide. Book it!')).toBeVisible();
    await expect(page.getByText('Verified trip')).toBeVisible();
    await expect(page.getByText('Rhea R.')).toBeVisible();
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const ld = blocks.map((b) => JSON.parse(b)).find((b) => [].concat(b['@type']).includes('TouristTrip'));
    expect(ld.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 5, reviewCount: 1, bestRating: 5, worstRating: 1 });
    expect(ld['@type']).toEqual(['TouristTrip', 'Product']);
    await site.close();
  });
});
