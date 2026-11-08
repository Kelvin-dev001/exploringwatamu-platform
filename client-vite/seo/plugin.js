import fs from 'node:fs';
import path from 'node:path';
import { STATIC_ROUTES, DEFAULT_DESCRIPTION } from './routes.js';

/*
 * Build-time SEO for a single-page app:
 *  - dist/<route>.html for each static route with its own <title>, description,
 *    canonical and Open Graph tags (Vercel serves them via "cleanUrls").
 *  - sitemap.xml with static routes plus live experiences and group trips
 *    (fetched from the API when reachable; skipped quietly if not).
 *  - robots.txt pointing at the sitemap.
 */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function siteUrl() {
  const fromEnv = process.env.VITE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return (fromEnv || 'https://exploringwatamu.vercel.app').replace(/\/$/, '');
}

export function headFor({ title, description = DEFAULT_DESCRIPTION, url, image, noindex }) {
  const img = image || `${siteUrl()}/brand/logo-badge-512.png`;
  return [
    `<title data-static>${esc(title)}</title>`,
    `<meta data-static name="description" content="${esc(description)}" />`,
    `<link data-static rel="canonical" href="${esc(url)}" />`,
    noindex ? '<meta data-static name="robots" content="noindex" />' : '',
    '<meta data-static property="og:type" content="website" />',
    '<meta data-static property="og:site_name" content="Exploring Watamu" />',
    `<meta data-static property="og:title" content="${esc(title)}" />`,
    `<meta data-static property="og:description" content="${esc(description)}" />`,
    `<meta data-static property="og:url" content="${esc(url)}" />`,
    `<meta data-static property="og:image" content="${esc(img)}" />`,
    `<meta data-static name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

export function injectHead(html, head) {
  return html.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n    ${head}\n    <!--seo:end-->`);
}

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

      for (const r of STATIC_ROUTES) {
        const html = injectHead(base, headFor({ ...r, url: `${site}${r.path}` }));
        const file = r.path === '/' ? 'index.html' : `${r.path.slice(1)}.html`;
        fs.writeFileSync(path.join(outDir, file), html);
      }

      // Dynamic pages for the sitemap (best effort — the API may be asleep).
      const api = (process.env.VITE_API_URL || '').replace(/\/$/, '');
      const dynamic = [];
      if (api && process.env.SEO_SKIP_API !== '1') {
        const [tours, trips] = await Promise.all([fetchJson(`${api}/tours?active=true&limit=500`), fetchJson(`${api}/group-trips`)]);
        (tours?.data || tours || []).forEach((t) => t?._id && dynamic.push({ path: `/experiences/${t._id}`, lastmod: t.updatedAt, priority: 0.8 }));
        (Array.isArray(trips) ? trips : []).forEach((g) => g?.slug && dynamic.push({ path: `/group-trips/${g.slug}`, lastmod: g.updatedAt, priority: 0.8 }));
      }

      const urls = [...STATIC_ROUTES.filter((r) => !r.noindex), ...dynamic]
        .map((r) => `  <url><loc>${esc(site + r.path)}</loc>${r.lastmod ? `<lastmod>${new Date(r.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}<priority>${(r.priority ?? 0.5).toFixed(1)}</priority></url>`)
        .join('\n');
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
      fs.writeFileSync(
        path.join(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\nDisallow: /my-trips\nDisallow: /trip/sent/\nDisallow: /reset-password\nDisallow: /style-guide\n\nSitemap: ${site}/sitemap.xml\n`
      );
      console.log(`[ew-seo] wrote ${STATIC_ROUTES.length} route pages, sitemap (${STATIC_ROUTES.filter((r) => !r.noindex).length + dynamic.length} urls), robots.txt`);
    },
  };
}
