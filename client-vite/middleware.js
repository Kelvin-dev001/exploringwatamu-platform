/*
 * Vercel Routing Middleware: link previews for shared trips.
 *
 * WhatsApp, Facebook, X, Slack and search crawlers don't run JavaScript, so a
 * shared /group-trips/<slug> or /experiences/<id> link would preview as the
 * generic homepage. For those bots only, we fetch the listing from the API and
 * return index.html with that listing's title, description and photo in <head>.
 * People (and any failure) fall straight through to the normal app.
 */
export const config = { matcher: ['/group-trips/:slug*', '/experiences/:id*'] };

const BOTS = /(facebookexternalhit|facebot|whatsapp|twitterbot|slackbot|linkedinbot|telegrambot|discordbot|pinterest|googlebot|bingbot|duckduckbot|applebot|embedly|skypeuripreview)/i;
const API = (process.env.VITE_API_URL || 'https://exploringwatamu-platform.onrender.com/api').replace(/\/$/, '');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clip = (s, n = 160) => (s && s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s || '');

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

export default async function middleware(request) {
  try {
    if (!BOTS.test(request.headers.get('user-agent') || '')) return undefined;
    const url = new URL(request.url);
    const [, section, key] = url.pathname.split('/');
    if (!key) return undefined;

    let meta = null;
    if (section === 'group-trips') {
      const g = await getJson(`${API}/group-trips/${encodeURIComponent(key)}`);
      if (g) meta = { title: g.title, description: g.shortDescription, image: g.heroImage || g.gallery?.[0] };
    } else if (section === 'experiences' && /^[a-f0-9]{24}$/i.test(key)) {
      const t = await getJson(`${API}/tours/${key}`);
      if (t) meta = { title: t.name, description: t.description, image: t.gallery?.[0] };
    }
    if (!meta?.title) return undefined;

    const shell = await fetch(new URL('/index.html', url.origin));
    if (!shell.ok) return undefined;
    const html = await shell.text();
    const title = `${meta.title} · Exploring Watamu`;
    const image = meta.image || `${url.origin}/brand/logo-badge-512.png`;
    const head = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(clip(meta.description))}" />`,
      `<link rel="canonical" href="${esc(url.origin + url.pathname)}" />`,
      '<meta property="og:type" content="article" />',
      '<meta property="og:site_name" content="Exploring Watamu" />',
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(clip(meta.description, 200))}" />`,
      `<meta property="og:url" content="${esc(url.origin + url.pathname)}" />`,
      `<meta property="og:image" content="${esc(image)}" />`,
      `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" />`,
    ].join('\n    ');

    return new Response(html.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, head), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=600' },
    });
  } catch {
    return undefined;
  }
}
