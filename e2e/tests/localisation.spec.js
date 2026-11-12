// @ts-check
const { test, expect, devices } = require('@playwright/test');

/*
 * English and Italian, on a phone, against local builds and a throwaway API:
 * the built HTML crawlers read, switching and remembering the language,
 * links that keep it, English links that open in Italian for someone who
 * chose Italian, and an Italian quote request reaching the team marked as
 * Italian. The seeded experience has Italian text; the stay has none.
 */
const SITE = 'http://localhost:4173';
const ADMIN = 'http://localhost:4174';

test('the built pages carry each language for crawlers and link previews', async ({ request }) => {
  const it = await (await request.get(`${SITE}/it/experiences`)).text();
  expect(it).toContain('<html lang="it"');
  expect(it).toContain('<title data-static>Esperienze a Watamu · Exploring Watamu</title>');
  expect(it).toMatch(/rel="canonical" href="[^"]+\/it\/experiences"/);
  expect(it).toMatch(/hreflang="en" href="[^"]+\/experiences"/);
  expect(it).toContain('property="og:locale" content="it_IT"');

  const en = await (await request.get(`${SITE}/experiences`)).text();
  expect(en).toContain('<html lang="en"');
  expect(en).toContain('<title data-static>Experiences in Watamu · Exploring Watamu</title>');
  expect(en).toMatch(/hreflang="it" href="[^"]+\/it\/experiences"/);

  const home = await (await request.get(`${SITE}/it`)).text();
  expect(home).toContain('<title data-static>Exploring Watamu — La tua Watamu, su misura per te</title>');

  const sitemap = await (await request.get(`${SITE}/sitemap.xml`)).text();
  expect(sitemap).toMatch(/<loc>[^<]+\/it\/experiences<\/loc>/);
  expect(sitemap).toContain('xhtml:link rel="alternate" hreflang="it"');
  const robots = await (await request.get(`${SITE}/robots.txt`)).text();
  expect(robots).toContain('Disallow: /it/my-trips');
});

test('switching language, keeping it, and coming back to English', async ({ page }) => {
  await page.goto(`${SITE}/experiences`);
  await expect(page.getByRole('heading', { level: 1, name: 'Experiences in Watamu' })).toBeVisible();

  await page.getByRole('group', { name: 'Language' }).first().getByRole('link', { name: 'Italiano' }).click();
  await expect(page).toHaveURL(`${SITE}/it/experiences`);
  await expect(page.getByRole('heading', { level: 1, name: 'Esperienze a Watamu' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('it');
  await expect(page.getByText('Snorkeling nel parco marino').first()).toBeVisible(); // the team's Italian title
  await expect(page).toHaveTitle('Esperienze a Watamu · Exploring Watamu');

  // A refresh keeps it; so does an old English link.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Esperienze a Watamu' })).toBeVisible();
  await page.goto(`${SITE}/hotels`);
  await expect(page).toHaveURL(`${SITE}/it/hotels`);
  await expect(page.getByRole('heading', { level: 1, name: 'Dove alloggiare a Watamu' })).toBeVisible();
  // A stay without Italian text: Italian page, English description marked as English.
  await expect(page.locator('p[lang="en"]', { hasText: 'Beachfront.' })).toBeVisible();

  // In-app links keep the language.
  await page.getByRole('button', { name: 'Apri il menu' }).click();
  await page.getByRole('dialog', { name: 'Esplora Watamu' }).getByRole('link', { name: 'Viaggi di gruppo' }).click();
  await expect(page).toHaveURL(`${SITE}/it/group-trips`);

  // Back to English, and it stays English.
  await page.getByRole('group', { name: 'Lingua' }).first().getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(`${SITE}/group-trips`);
  await expect(page.getByRole('heading', { level: 1, name: 'Come for the coast, leave with a crew' })).toBeVisible();
  await page.goto(`${SITE}/hotels`);
  await expect(page).toHaveURL(`${SITE}/hotels`);
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
});

test.describe.serial('an Italian quote request', () => {
  let reference;

  test('a visitor plans and sends a trip in Italian', async ({ page }) => {
    await page.goto(`${SITE}/it/experiences`);
    await page.getByRole('button', { name: 'Aggiungi Snorkeling nel parco marino al viaggio' }).click();
    await page.getByRole('button', { name: 'Vedi il viaggio' }).click();
    await page.getByRole('dialog', { name: 'Il mio viaggio a Watamu' }).getByRole('link', { name: /Organizza i miei giorni/ }).click();
    await expect(page).toHaveURL(`${SITE}/it/trip`);
    await expect(page.getByText(/^Giorno 1/).first()).toBeVisible();

    await page.getByRole('button', { name: 'Richiedi il preventivo' }).click();
    const sheet = page.getByRole('dialog', { name: 'Richiedi il preventivo' });
    await sheet.getByRole('button', { name: /Invia il mio viaggio/ }).click();
    await expect(sheet.getByText('Dicci il tuo nome')).toBeVisible(); // Italian validation
    await sheet.getByLabel('Il tuo nome').fill('Giulia Prova');
    await sheet.getByLabel(/^Email/).fill('giulia.prova@example.test');
    await sheet.getByRole('button', { name: /Invia il mio viaggio/ }).click();

    await expect(page).toHaveURL(/\/it\/trip\/sent\/EW-[A-Z2-9]{6}$/);
    reference = page.url().split('/').pop();
    await expect(page.getByText('Asante! Il tuo viaggio è nelle mani del nostro team.')).toBeVisible();
  });

  test('the team sees it is Italian, and the WhatsApp reply starts in Italian', async ({ browser }) => {
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
    await expect(page.getByText('Italiano — emails and quote PDF in Italian')).toBeVisible();
    // The team reads the itinerary in English.
    await expect(page.getByText('Marine park snorkel · 4h')).toBeVisible();

    await page.getByRole('button', { name: 'Reply on WhatsApp' }).click();
    const reply = page.getByRole('dialog', { name: 'Reply on WhatsApp' });
    await expect(reply.getByRole('textbox', { name: 'Message' })).toHaveValue(new RegExp(`^Ciao Giulia, siamo Exploring Watamu, ti scriviamo per la tua richiesta di viaggio ${reference}`));
    await reply.getByRole('button', { name: 'English' }).click();
    await expect(reply.getByRole('textbox', { name: 'Message' })).toHaveValue(/^Hi Giulia, this is Exploring Watamu/);
    await context.close();
  });
});
