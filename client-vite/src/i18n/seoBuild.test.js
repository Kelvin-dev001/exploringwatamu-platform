import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fileFor, headFor, robotsTxt, sitemapEntries, sitemapXml, writeRoutePages } from '../../seo/plugin.js';
import middleware, { config as middlewareConfig, previewHead } from '../../middleware.js';

// What crawlers and link previews get without running JavaScript: the HTML
// files the build writes for each page and language, the sitemap, robots.txt,
// and the bot-preview middleware for listing pages.

const SITE = 'https://site.test';
const SHELL = '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <!--seo:start-->\n    <title data-static>x</title>\n    <!--seo:end-->\n  </head>\n  <body><div id="root"></div></body>\n</html>\n';

describe('route pages', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-seo-'));
  const written = writeRoutePages(dir, SHELL, SITE);
  const read = (file) => fs.readFileSync(path.join(dir, file), 'utf8');

  it('writes every static page in English (same files as before) and Italian (under it/)', () => {
    expect(written).toEqual(expect.arrayContaining(['index.html', 'it.html', 'experiences.html', 'it/experiences.html', 'login.html', 'it/login.html']));
    expect(fileFor('/', 'it')).toBe('it.html');
    expect(fileFor('/trip', 'it')).toBe('it/trip.html');
    expect(fileFor('/trip', 'en')).toBe('trip.html');
  });

  it('gives the Italian page lang="it", Italian text, its own canonical and the hreflang pair', () => {
    const html = read('it/experiences.html');
    expect(html).toContain('<html lang="it"');
    expect(html).toContain('<title data-static>Esperienze a Watamu · Exploring Watamu</title>');
    expect(html).toContain(`<link data-static rel="canonical" href="${SITE}/it/experiences" />`);
    expect(html).toContain(`hreflang="en" href="${SITE}/experiences"`);
    expect(html).toContain(`hreflang="it" href="${SITE}/it/experiences"`);
    expect(html).toContain(`hreflang="x-default" href="${SITE}/experiences"`);
    expect(html).toContain('property="og:locale" content="it_IT"');
    expect(html).toContain('property="og:locale:alternate" content="en_GB"');
    expect(html).toContain(`property="og:url" content="${SITE}/it/experiences"`);
  });

  it('leaves the English page English, now with the pair too', () => {
    const html = read('experiences.html');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('<title data-static>Experiences in Watamu · Exploring Watamu</title>');
    expect(html).toContain(`<link data-static rel="canonical" href="${SITE}/experiences" />`);
    expect(html).toContain(`hreflang="it" href="${SITE}/it/experiences"`);
    expect(read('index.html')).toContain('<title data-static>Exploring Watamu — Your Watamu, tuned to you</title>');
    expect(read('it.html')).toContain('<title data-static>Exploring Watamu — La tua Watamu, su misura per te</title>');
    expect(read('it.html')).toContain(`rel="canonical" href="${SITE}/it"`);
  });

  it('keeps sign-in pages out of search, with no language pair', () => {
    const html = read('it/login.html');
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).not.toContain('hreflang');
    expect(headFor({ title: 't', description: 'd', url: 'u', noindex: true, locale: 'en', alternates: { en: 'a', it: 'b' } })).not.toContain('hreflang');
  });
});

describe('sitemap and robots.txt', () => {
  it('lists both languages of each page with their alternates, and a listing’s Italian page only when it is translated', () => {
    const entries = sitemapEntries(SITE, [
      { path: '/experiences/t1', italian: true, lastmod: '2027-01-01' },
      { path: '/group-trips/reef', italian: false },
    ]);
    const locs = entries.map((e) => e.loc);
    expect(locs).toEqual(expect.arrayContaining([`${SITE}/`, `${SITE}/it`, `${SITE}/hotels`, `${SITE}/it/hotels`, `${SITE}/experiences/t1`, `${SITE}/it/experiences/t1`, `${SITE}/group-trips/reef`]));
    expect(locs).not.toContain(`${SITE}/it/group-trips/reef`);
    expect(locs.filter((l) => l.includes('login'))).toEqual([]);

    const xml = sitemapXml(entries);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain(`<loc>${SITE}/it/experiences/t1</loc><lastmod>2027-01-01</lastmod>`);
    expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="it" href="${SITE}/it/experiences/t1" />`);
    const untranslated = xml.slice(xml.indexOf(`<loc>${SITE}/group-trips/reef</loc>`)).split('</url>')[0];
    expect(untranslated).not.toContain('xhtml:link');
  });

  it('keeps private pages out in both languages', () => {
    const robots = robotsTxt(SITE);
    for (const p of ['/my-trips', '/it/my-trips', '/review/', '/it/review/', '/reset-password', '/it/reset-password', '/verify-email', '/it/verify-email']) expect(robots).toContain(`Disallow: ${p}\n`);
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });
});

describe('bot previews (middleware.js)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const bot = (url) => new Request(url, { headers: { 'user-agent': 'WhatsApp/2.23' } });
  const stubFetch = (listing) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        const u = String(url);
        if (u.includes('/api/')) return new Response(JSON.stringify(listing), { status: 200 });
        return new Response(SHELL, { status: 200 });
      })
    );

  it('covers the Italian listing pages too', () => {
    expect(middlewareConfig.matcher).toEqual(expect.arrayContaining(['/it/group-trips/:slug*', '/it/experiences/:id*']));
  });

  it('shows an Italian preview with the team’s Italian text, lang="it" and the language pair', async () => {
    stubFetch({ title: 'Reef weekend', titleIt: 'Weekend sulla barriera', shortDescription: 'Two nights', shortDescriptionIt: 'Due notti', heroImage: 'https://img.test/a.jpg' });
    const res = await middleware(bot('https://site.test/it/group-trips/reef-weekend'));
    const html = await res.text();
    expect(html).toContain('<html lang="it"');
    expect(html).toContain('<title>Weekend sulla barriera · Exploring Watamu</title>');
    expect(html).toContain('content="Due notti"');
    expect(html).toContain('<link rel="canonical" href="https://site.test/it/group-trips/reef-weekend" />');
    expect(html).toContain('hreflang="en" href="https://site.test/group-trips/reef-weekend"');
    expect(html).toContain('property="og:locale" content="it_IT"');
  });

  it('previews an untranslated listing’s Italian page with English text and the English canonical', async () => {
    stubFetch({ title: 'Reef weekend', shortDescription: 'Two nights' });
    const res = await middleware(bot('https://site.test/it/group-trips/reef-weekend'));
    const html = await res.text();
    expect(html).toContain('<title>Reef weekend · Exploring Watamu</title>');
    expect(html).toContain('<link rel="canonical" href="https://site.test/group-trips/reef-weekend" />');
    expect(html).not.toContain('hreflang');
  });

  it('keeps English previews as they were, and leaves people alone', async () => {
    stubFetch({ _id: 'a'.repeat(24), name: 'Marine park snorkel', description: 'Reef', titleIt: 'Snorkeling', descriptionIt: 'Barriera' });
    const res = await middleware(bot(`https://site.test/experiences/${'a'.repeat(24)}`));
    const html = await res.text();
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('<title>Marine park snorkel · Exploring Watamu</title>');
    expect(await middleware(new Request('https://site.test/experiences/x', { headers: { 'user-agent': 'Mozilla/5.0' } }))).toBeUndefined();
    expect(previewHead({ meta: { title: 'T', description: 'D', italian: false }, locale: 'en', origin: SITE, path: '/experiences/x' })).not.toContain('hreflang');
  });
});
