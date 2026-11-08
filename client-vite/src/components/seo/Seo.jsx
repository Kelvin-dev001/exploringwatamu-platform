import { useLocation } from 'react-router-dom';
import { SITE, absoluteUrl } from '@/lib/site';

/*
 * Per-page metadata. React 19 hoists <title>, <meta> and <link> into <head>,
 * so every page can declare its own. Static copies are also written into
 * per-route HTML at build time (vite.config.js) for crawlers and link
 * previews that don't run JavaScript.
 */
export default function Seo({ title, description = SITE.description, image, type = 'website', jsonLd, noindex = false, path }) {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} · ${SITE.name}` : `${SITE.name} — Your Watamu, tuned to you`;
  const url = absoluteUrl(path || pathname);
  const img = absoluteUrl(image || SITE.image);
  const desc = description?.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
    </>
  );
}
