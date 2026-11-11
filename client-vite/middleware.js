/*
 * Vercel Routing Middleware: link previews for shared trips.
 *
 * WhatsApp, Facebook, X, Slack and search crawlers don't run JavaScript, so a
 * shared /group-trips/<slug> or /experiences/<id> link would preview as the
 * generic homepage. For those bots only, we fetch the listing from the API and
 * return index.html with that listing's title, description and photo in <head>.
 * People (and any failure) fall straight through to the normal app.
 *
 * Italian pages (/it/group-trips/…, /it/experiences/…) get lang="it" and the
 * team's Italian title and description when the listing has them. Only a
 * listing with Italian text counts as its own Italian page (hreflang pair, its
 * own canonical) — otherwise the Italian address names the English page as
 * canonical. Same rule as src/i18n/listingContent.js and the build's sitemap.
 */
export const config = { matcher: ['/group-trips/:slug*', '/experiences/:id*', '/it/group-trips/:slug*', '/it/experiences/:id*'] };

const BOTS = /(facebookexternalhit|facebot|whatsapp|twitterbot|slackbot|linkedinbot|telegrambot|discordbot|pinterest|googlebot|bingbot|duckduckbot|applebot|embedly|skypeuripreview)/i;
const API = (process.env.VITE_API_URL || 'https://exploringwatamu-platform.onrender.com/api').replace(/\/$/, '');
const OG_LOCALE = { en: 'en_GB', it: 'it_IT' };

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clip = (s, n = 160) => (s && s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s || '');
const filled = (v) => typeof v === 'string' && v.trim() !== '';
const pick = (italian, english, locale) => (locale === 'it' && filled(italian) ? italian.trim() : english);
// Keep in step with hasItalianContent() in src/i18n/listingContent.js.
const hasItalian = (doc) => filled(doc?.descriptionIt) || filled(doc?.shortDescriptionIt);

async function getJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000); // free-tier API may be asleep; don't hold bots forever
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    return res.ok ? await res.json() : null;
  } finally {
    clearTimeout(t);
  }
}

/** The <head> for a listing page. Exported for tests. */
export function previewHead({ meta, locale, origin, path }) {
  const title = `${meta.title} · Exploring Watamu`;
  const image = meta.image || `${origin}/brand/logo-badge-512.png`;
  const en = origin + path;
  const it = `${origin}/it${path}`;
  const self = locale === 'it' ? it : en;
  const canonical = meta.italian ? self : en;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(clip(meta.description))}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    ...(meta.italian
      ? [
          `<link rel="alternate" hreflang="en" href="${esc(en)}" />`,
          `<link rel="alternate" hreflang="it" href="${esc(it)}" />`,
          `<link rel="alternate" hreflang="x-default" href="${esc(en)}" />`,
        ]
      : []),
    '<meta property="og:type" content="article" />',
    '<meta property="og:site_name" content="Exploring Watamu" />',
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(clip(meta.description, 200))}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[locale]}" />`,
    `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" />`,
  ].join('\n    ');
}

export default async function middleware(request) {
  try {
    if (!BOTS.test(request.headers.get('user-agent') || '')) return undefined;
    const url = new URL(request.url);
    const locale = /^\/it(\/|$)/.test(url.pathname) ? 'it' : 'en';
    const path = locale === 'it' ? url.pathname.slice(3) : url.pathname;
    const [, section, key] = path.split('/');
    if (!key) return undefined;

    let meta = null;
    if (section === 'group-trips') {
      const g = await getJson(`${API}/group-trips/${encodeURIComponent(key)}`);
      if (g) meta = { title: pick(g.titleIt, g.title, locale), description: pick(g.shortDescriptionIt, g.shortDescription, locale), image: g.heroImage || g.gallery?.[0], italian: hasItalian(g) };
    } else if (section === 'experiences' && /^[a-f0-9]{24}$/i.test(key)) {
      const t = await getJson(`${API}/tours/${key}`);
      if (t) meta = { title: pick(t.titleIt, t.name, locale), description: pick(t.descriptionIt, t.description, locale), image: t.gallery?.[0], italian: hasItalian(t) };
    }
    if (!meta?.title) return undefined;

    const shell = await fetch(new URL('/index.html', url.origin));
    if (!shell.ok) return undefined;
    const html = (await shell.text()).replace(/<html lang="[^"]*"/, `<html lang="${locale}"`);
    const head = previewHead({ meta, locale, origin: url.origin, path });

    return new Response(html.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, head), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=600' },
    });
  } catch {
    return undefined;
  }
}
