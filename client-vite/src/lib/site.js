/** Public site details used for SEO, share links and structured data. */
export const SITE = {
  name: 'Exploring Watamu',
  url: (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://exploringwatamu.com')).replace(/\/$/, ''),
  email: 'hello@exploringwatamu.com',
  image: '/brand/logo-badge-512.png',
  description:
    'Personalised trips in Watamu, Kenya. Pick experiences, stays and group trips that fit how you travel, and get a tailored quote from our local team.',
};

export const absoluteUrl = (path = '/') => (/^https?:/.test(path) ? path : `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`);
