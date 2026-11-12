import fs from 'node:fs';
import path from 'node:path';
import { STATIC_ROUTES, SITE_NAME, fullTitle } from './routes.js';
import { LOCALES, LOCALE_META, localisePath } from '../src/i18n/locales.js';
import { hasItalianContent } from '../src/i18n/listingContent.js';

/*
 * Build-time SEO for a single-page app:
 *  - one HTML file per static route and language — dist/<route>.html in
 *    English, dist/it/<route>.html (dist/it.html for the homepage) in Italian —
 *    each with its own <html lang>, title, description, canonical, hreflang
 *    pair and Open Graph tags (Vercel serves them via "cleanUrls").
 *  - sitemap.xml: static routes in both languages with their alternates, plus
 *    live experiences and group trips from the API (when reachable; skipped
 *    quietly if not). A listing's Italian URL is only listed when the team has
 *    written Italian text for it.
 *  - robots.txt pointing at the sitemap.
 */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function siteUrl() {
  const fromEnv = process.env.VITE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return (fromEnv || 'https://exploringwatamu-platform.vercel.app').replace(/\/$/, '');
}

/** { en: url, it: url } for a path. */
const alternatesFor = (site, routePath) => Object.fromEntries(LOCALES.map((l) => [l, site + localisePath(routePath, l)]));

/** hreflang links for a page that exists in every language (x-default: English). */
export const hreflangLinks = (alternates, attr = 'data-static ') =>
  alternates
    ? [
        ...LOCALES.map((l) => `<link ${attr}rel="alternate" hreflang="${l}" href="${esc(alternates[l])}" />`),
        `<link ${attr}rel="alternate" hreflang="x-default" href="${esc(alternates.en)}" />`,
      ]
    : [];

export function headFor({ title, description, url, image, noindex, locale = 'en', alternates }) {
  const site = siteUrl();
  const img = image || `${site}/brand/logo-badge-512.png`;
  const languages = noindex ? null : alternates;
  return [
    `<title data-static>${esc(title)}</title>`,
    `<meta data-static name="description" content="${esc(description)}" />`,
    `<link data-static rel="canonical" href="${esc(url)}" />`,
    ...hreflangLinks(languages),
    noindex ? '<meta data-static name="robots" content="noindex" />' : '',
    '<meta data-static property="og:type" content="website" />',
    `<meta data-static property="og:site_name" content="${SITE_NAME}" />`,
    `<meta data-static property="og:title" content="${esc(title)}" />`,
    `<meta data-static property="og:description" content="${esc(description)}" />`,
    `<meta data-static property="og:url" content="${esc(url)}" />`,
    `<meta data-static property="og:image" content="${esc(img)}" />`,
    `<meta data-static property="og:locale" content="${LOCALE_META[locale].og}" />`,
    ...(languages ? LOCALES.filter((l) => l !== locale).map((l) => `<meta data-static property="og:locale:alternate" content="${LOCALE_META[l].og}" />`) : []),
    `<meta data-static name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

export function injectHead(html, head) {
  return html.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n    ${head}\n    <!--seo:end-->`);
}

/** The page shell in a language: <html lang="…">. */
export const withLang = (html, locale) => html.replace(/<html lang="[^"]*"/, `<html lang="${locale}"`);

/** dist file for a route in a language: "/" → index.html | it.html, "/trip" → trip.html | it/trip.html. */
export function fileFor(routePath, locale) {
  const localised = localisePath(routePath, locale);
  return localised === '/' ? 'index.html' : `${localised.slice(1)}.html`;
}

/** Write every static route in every language into outDir. Returns the files written. */
export function writeRoutePages(outDir, base, site) {
  const written = [];
  for (const r of STATIC_ROUTES) {
    const alternates = alternatesFor(site, r.path);
    for (const locale of LOCALES) {
      const text = { ...r.en, ...(r[locale] || {}) };
      const head = headFor({ title: fullTitle(text.title, locale), description: text.description, url: alternates[locale], noindex: r.noindex, locale, alternates });
      const file = fileFor(r.path, locale);
      fs.mkdirSync(path.dirname(path.join(outDir, file)), { recursive: true });
      fs.writeFileSync(path.join(outDir, file), injectHead(withLang(base, locale), head));
      written.push(file);
    }
  }
  return written;
}

/** sitemap.xml entries: [{ loc, lastmod?, priority, alternates? }] → XML with xhtml:link alternates. */
export function sitemapXml(entries) {
  const urls = entries
    .map((e) => {
      const links = e.alternates
        ? [...LOCALES.map((l) => [l, e.alternates[l]]), ['x-default', e.alternates.en]]
            .map(([l, href]) => `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(href)}" />`)
            .join('')
        : '';
      const lastmod = e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
      return `  <url><loc>${esc(e.loc)}</loc>${lastmod}<priority>${(e.priority ?? 0.5).toFixed(1)}</priority>${links}${links ? '\n  ' : ''}</url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

/**
 * Sitemap entries for static routes and listings. A page in both languages
 * gets both URLs, each listing the other as an alternate; a listing without
 * Italian text gets its English URL only.
 */
export function sitemapEntries(site, listings = []) {
  const entries = [];
  const both = (routePath, extra) => {
    const alternates = alternatesFor(site, routePath);
    LOCALES.forEach((l) => entries.push({ loc: alternates[l], alternates, ...extra }));
  };
  STATIC_ROUTES.filter((r) => !r.noindex).forEach((r) => both(r.path, { priority: r.priority }));
  listings.forEach((item) => {
    const extra = { lastmod: item.lastmod, priority: item.priority ?? 0.8 };
    if (item.italian) both(item.path, extra);
    else entries.push({ loc: site + item.path, ...extra });
  });
  return entries;
}

const PRIVATE = ['/my-trips', '/trip/sent/', '/reset-password', '/verify-email', '/review/', '/style-guide'];
export const robotsTxt = (site) =>
  `User-agent: *\nAllow: /\n${PRIVATE.flatMap((p) => LOCALES.map((l) => `Disallow: ${localisePath(p, l)}`)).join('\n')}\n\nSitemap: ${site}/sitemap.xml\n`;

async function fetchJson(url, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export default function seoPlugin() {
  let outDir = 'dist';
  return {
    name: 'ew-seo',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const base = fs.readFileSync(indexPath, 'utf8');
      if (!base.includes('<!--seo:start-->')) return;
      const site = siteUrl();

      const pages = writeRoutePages(outDir, base, site);

      // Dynamic pages for the sitemap (best effort — the API may be asleep).
      const api = (process.env.VITE_API_URL || '').replace(/\/$/, '');
      const listings = [];
      if (api && process.env.SEO_SKIP_API !== '1') {
        const [tours, trips] = await Promise.all([fetchJson(`${api}/tours?active=true&limit=500`), fetchJson(`${api}/group-trips`)]);
        (tours?.data || tours || []).forEach((t) => t?._id && listings.push({ path: `/experiences/${t._id}`, lastmod: t.updatedAt, italian: hasItalianContent(t) }));
        (Array.isArray(trips) ? trips : []).forEach((g) => g?.slug && listings.push({ path: `/group-trips/${g.slug}`, lastmod: g.updatedAt, italian: hasItalianContent(g) }));
      }

      const entries = sitemapEntries(site, listings);
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml(entries));
      fs.writeFileSync(path.join(outDir, 'robots.txt'), robotsTxt(site));
      console.log(`[ew-seo] wrote ${pages.length} route pages (${LOCALES.join(', ')}), sitemap (${entries.length} urls), robots.txt`);
    },
  };
}
