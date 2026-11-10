// @ts-check
const { test, expect, devices } = require('@playwright/test');

/*
 * The main journey, on a phone, against local builds and a throwaway API:
 * a first-time visitor finds an experience, adds it to their trip and asks for
 * a quote; the team finds the request in the admin portal and prices it.
 * Moving around with in-app links also guards against the Chrome 155 crash
 * that blanked the site on navigation.
 */
const SITE = 'http://localhost:4173';
const ADMIN = 'http://localhost:4174';

test.describe.serial('request a quote, then price it', () => {
  let reference;

  test('a visitor builds a trip and sends it', async ({ page }) => {
    await page.goto(`${SITE}/`);
    await page.getByRole('button', { name: 'Just let me browse' }).click(); // first-visit question

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('dialog', { name: 'Explore Watamu' }).getByRole('link', { name: 'Experiences' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Experiences in Watamu' })).toBeVisible();
    await expect(page.getByText('Marine park snorkel').first()).toBeVisible();
    await expect(page.getByText('Hidden draft tour')).toHaveCount(0);

    await page.getByRole('button', { name: 'Add Marine park snorkel to my trip' }).click();
    await page.getByRole('button', { name: 'View trip' }).click();
    await page.getByRole('dialog', { name: 'My Watamu trip' }).getByRole('link', { name: /Plan my days/ }).click();
    await expect(page).toHaveURL(`${SITE}/trip`);

    await page.getByRole('button', { name: 'Request my quote' }).click();
    const sheet = page.getByRole('dialog', { name: 'Request my quote' });
    await sheet.getByLabel('Your name').fill('Smoke Test Traveller');
    await sheet.getByLabel(/^Email/).fill('smoke.traveller@example.test');
    await sheet.getByRole('button', { name: /Send my trip/ }).click();

    await expect(page).toHaveURL(/\/trip\/sent\/EW-[A-Z2-9]{6}$/);
    reference = page.url().split('/').pop();
    await expect(page.getByText(reference, { exact: true })).toBeVisible();
    await expect(page.getByText('Asante! Your trip is with our team.')).toBeVisible();
  });

  test('the team finds the request and sends a priced quote', async ({ browser }) => {
    test.skip(!reference, 'needs the request from the previous test');
    const context = await browser.newContext({ ...devices['Pixel 7'] });
    const page = await context.newPage();

    await page.goto(`${ADMIN}/admin/login`);
    await page.getByRole('textbox', { name: 'Email' }).fill('smoke-admin@example.test');
    await page.getByRole('textbox', { name: /^Password/ }).fill('smoke-admin-pass-123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(`${ADMIN}/admin/dashboard`);

    await page.goto(`${ADMIN}/trip-requests`);
    await page.getByRole('link', { name: new RegExp(reference) }).click();
    await expect(page.getByText('Price this trip')).toBeVisible();
    await expect(page.getByText('Marine park snorkel · 4h')).toBeVisible();
    // Pre-filled from the listed adult price × 2 adults.
    await expect(page.getByLabel('Line 1 amount in KES')).toHaveValue('13000');

    await page.getByRole('button', { name: 'Send · KES 13,000' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Send KES 13,000' }).click();

    // No SMTP here (or in production today): the team must be told nothing was emailed.
    await expect(page.getByText(/traveller was NOT emailed/)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Quoted');
    await context.close();
  });
});
