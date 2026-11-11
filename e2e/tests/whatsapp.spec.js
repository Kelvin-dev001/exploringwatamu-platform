// @ts-check
const { test, expect, devices } = require('@playwright/test');

/*
 * WhatsApp click-to-chat in the real builds, on a phone. The website is built
 * with a placeholder business number (playwright.config.js); the traveller's
 * number is from the UK's fictional 07700 900xxx range. The links are checked,
 * never followed: nothing opens WhatsApp and no message is sent.
 */
const SITE = 'http://localhost:4173';
const ADMIN = 'http://localhost:4174';
const API = 'http://localhost:5055/api';
const BUSINESS = '254700000000';

const textOf = (href) => new URL(href || '').searchParams.get('text');
async function hrefOf(locator) {
  const href = await locator.getAttribute('href');
  expect(href).toMatch(new RegExp(`^https://wa\\.me/${BUSINESS}\\?text=`));
  expect(await locator.getAttribute('target')).toBe('_blank');
  return href;
}

test('a visitor can reach the team on WhatsApp from the menu, footer, a listing and the planner', async ({ page }) => {
  await page.goto(`${SITE}/`);
  await page.getByRole('button', { name: 'Just let me browse' }).click();

  // Mobile menu and footer
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Explore Watamu' });
  expect(textOf(await hrefOf(menu.getByRole('link', { name: 'Chat with us on WhatsApp' })))).toBe(
    'Hi Exploring Watamu! I’m planning a trip to Watamu and have a question.'
  );
  await menu.getByRole('link', { name: 'Stays' }).click();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'WhatsApp +254 700 000 000' })).toBeVisible();

  // A stay card
  const stay = page.getByRole('link', { name: 'Ask about Turtle Bay Beach Club on WhatsApp' });
  expect(textOf(await hrefOf(stay))).toContain('*Turtle Bay Beach Club* (hotel · KES 18,000 per night)');

  // An experience page
  await page.goto(`${SITE}/experiences`);
  await page.getByRole('link', { name: /Marine park snorkel/ }).first().click();
  const ask = page.getByRole('link', { name: 'Ask about it on WhatsApp' }).first();
  const askText = textOf(await hrefOf(ask));
  expect(askText).toContain('*Marine park snorkel*');
  expect(askText).toContain(`${SITE}/experiences/`);

  // The planner: review the message first, then the link carries exactly that
  await page.getByRole('button', { name: 'Add Marine park snorkel to my trip' }).first().click();
  await page.goto(`${SITE}/trip`);
  await page.getByRole('button', { name: 'Send plan on WhatsApp' }).click();
  const sheet = page.getByRole('dialog', { name: 'Send your plan on WhatsApp' });
  const box = sheet.getByRole('textbox', { name: 'Your message' });
  await expect(box).toHaveValue(/Day 1: Marine park snorkel/);
  await box.fill(`${await box.inputValue()}\n\nWe land in Malindi at 14:00.`);
  const open = sheet.getByRole('link', { name: 'Open WhatsApp' });
  expect(textOf(await hrefOf(open))).toBe(await box.inputValue().then((v) => v.trim()));
});

test('the team can reply to a trip request on WhatsApp', async ({ browser, request }) => {
  const created = await request.post(`${API}/trip-requests`, {
    data: {
      contact: { name: 'Ada Lovelace', email: 'ada.whatsapp@example.test', phone: '+44 7700 900123', country: 'United Kingdom' },
      adults: 2,
      days: [{ label: 'Day 1', items: [{ kind: 'tour', title: 'Marine park snorkel' }] }],
    },
  });
  expect(created.status()).toBe(201);
  const { reference } = await created.json();

  const context = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await context.newPage();
  await page.goto(`${ADMIN}/admin/login`);
  await page.getByRole('textbox', { name: 'Email' }).fill('smoke-admin@example.test');
  await page.getByRole('textbox', { name: /^Password/ }).fill('smoke-admin-pass-123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(`${ADMIN}/admin/dashboard`);

  await page.goto(`${ADMIN}/trip-requests`);
  await page.getByRole('link', { name: new RegExp(reference) }).click();
  await page.getByRole('button', { name: 'Reply on WhatsApp' }).click();
  const sheet = page.getByRole('dialog', { name: 'Reply on WhatsApp' });
  await expect(sheet.getByText('Opens a chat with')).toContainText('+447700900123');
  const link = sheet.getByRole('link', { name: 'Open WhatsApp' });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^https:\/\/wa\.me\/447700900123\?text=/);
  expect(textOf(href)).toContain(`Hi Ada, this is Exploring Watamu about your trip request ${reference}`);
  await context.close();
});
