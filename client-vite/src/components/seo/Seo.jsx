import { useLocation } from 'react-router-dom';
import { SITE, absoluteUrl } from '@/lib/site';
import { LOCALES, LOCALE_META, localisePath, useLocale } from '@/i18n';
import { SITE_TEXT, fullTitle, routeText } from '../../../seo/routes.js';

/*
 * Per-page metadata, in the page's language. React 19 hoists <title>, <meta>
 * and <link> into <head>, so every page can declare its own. Static copies are
 * also written into per-route HTML at build time (seo/plugin.js) for crawlers
 * and link previews that don't run JavaScript.
 *
 *   route       a static route ("/experiences"): title and description come
 *               from seo/routes.js, the same text the build writes.
 *   translated  false for a page whose main content has no Italian version
 *               (a listing without Italian text): no hreflang pair, and the
 *               Italian page names the English one as canonical instead of
 *               claiming to be a translation.
 */
export default function Seo({ route, title, description, image, type = 'website', jsonLd, noindex = false, path, translated = true }) {
  const locale = useLocale();
  const { pathname } = useLocation(); // without the /it prefix (it's the router's basename)
  const fromRoute = route ? routeText(route, locale) : null;
  const fullTitleText = fullTitle(title ?? fromRoute?.title, locale);
  const hidden = noindex || Boolean(fromRoute?.noindex);
  const page = path || route || pathname;

  const alternates = Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(localisePath(page, l))]));
  const languages = !hidden && translated;
  const url = !hidden && !translated ? alternates.en : alternates[locale];

  const img = absoluteUrl(image || SITE.image);
  const text = description ?? fromRoute?.description ?? (SITE_TEXT[locale] || SITE_TEXT.en).description;
  const desc = text?.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;

  return (
    <>
      <title>{fullTitleText}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {languages && LOCALES.map((l) => <link key={l} rel="alternate" hrefLang={l} href={alternates[l]} />)}
      {languages && <link rel="alternate" hrefLang="x-default" href={alternates.en} />}
      {hidden && <meta name="robots" content="noindex" />}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitleText} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content={LOCALE_META[locale].og} />
      {languages && LOCALES.filter((l) => l !== locale).map((l) => <meta key={l} property="og:locale:alternate" content={LOCALE_META[l].og} />)}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitleText} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
    </>
  );
}
