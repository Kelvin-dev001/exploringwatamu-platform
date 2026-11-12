/*
 * Static routes with their search/share metadata, in English and Italian.
 *
 * The one source for these pages' titles and descriptions: the build writes
 * one HTML file per route and language from it (so link previews and crawlers
 * see the right text without running JavaScript), and each page's <Seo
 * route="…"> reads the same entry at runtime. Also drives sitemap.xml.
 *
 * Titles are short; fullTitle() adds the brand ("… · Exploring Watamu").
 */
export const SITE_NAME = 'Exploring Watamu';

export const SITE_TEXT = {
  en: {
    tagline: 'Your Watamu, tuned to you',
    description:
      'Personalised trips in Watamu, Kenya. Pick experiences, stays and group trips that fit how you travel, and get a tailored quote from our local team.',
  },
  it: {
    tagline: 'La tua Watamu, su misura per te',
    description:
      'Viaggi su misura a Watamu, in Kenya. Scegli esperienze, alloggi e viaggi di gruppo adatti a te e ricevi un preventivo personalizzato dal nostro team locale.',
  },
};

/** Kept for existing imports: the English default description. */
export const DEFAULT_DESCRIPTION = SITE_TEXT.en.description;

/** "Experiences in Watamu · Exploring Watamu"; no title → the homepage title. */
export const fullTitle = (title, locale = 'en') =>
  title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${(SITE_TEXT[locale] || SITE_TEXT.en).tagline}`;

export const STATIC_ROUTES = [
  {
    path: '/',
    priority: 1.0,
    en: { title: '', description: SITE_TEXT.en.description },
    it: { title: '', description: SITE_TEXT.it.description },
  },
  {
    path: '/experiences',
    priority: 0.9,
    en: {
      title: 'Experiences in Watamu',
      description: 'Snorkelling in the marine park, sunset dhows on Mida Creek, Gede Ruins and more — ranked for how you like to travel.',
    },
    it: {
      title: 'Esperienze a Watamu',
      description: 'Snorkeling nel parco marino, dhow al tramonto a Mida Creek, le rovine di Gede e molto altro, in ordine per il tuo modo di viaggiare.',
    },
  },
  {
    path: '/group-trips',
    priority: 0.9,
    en: {
      title: 'Group trips in Watamu',
      description: 'Join scheduled group adventures in Watamu, Kenya. Request your spot; pay after we confirm.',
    },
    it: {
      title: 'Viaggi di gruppo a Watamu',
      description: 'Unisciti alle avventure di gruppo in programma a Watamu, in Kenya. Richiedi il tuo posto: paghi solo dopo la nostra conferma.',
    },
  },
  {
    path: '/trip',
    priority: 0.8,
    en: {
      title: 'Plan your Watamu trip',
      description: 'Drag experiences onto days, add stays and transfers, and get one tailored quote from our local team.',
    },
    it: {
      title: 'Organizza il tuo viaggio a Watamu',
      description: 'Trascina le esperienze sui giorni, aggiungi alloggi e transfer e ricevi un unico preventivo su misura dal nostro team locale.',
    },
  },
  {
    path: '/hotels',
    priority: 0.8,
    en: {
      title: 'Where to stay in Watamu',
      description: 'Hotels, beach villas and Airbnbs in Watamu, Kenya. Add a stay to your trip and our local team includes it in your quote.',
    },
    it: {
      title: 'Dove alloggiare a Watamu',
      description: 'Hotel, ville sulla spiaggia e case Airbnb a Watamu, in Kenya. Aggiungi un alloggio al tuo viaggio e il nostro team locale lo include nel preventivo.',
    },
  },
  {
    path: '/transfers',
    priority: 0.7,
    en: {
      title: 'Airport & hotel transfers',
      description: 'Private transfers from Malindi and Mombasa airports to Watamu, and between hotels.',
    },
    it: {
      title: 'Transfer da aeroporti e hotel',
      description: 'Transfer privati dagli aeroporti di Malindi e Mombasa a Watamu e da un hotel all’altro.',
    },
  },
  {
    path: '/carhire',
    priority: 0.6,
    en: {
      title: 'Car hire in Watamu',
      description: 'Hire a car to explore Watamu, Malindi and the Kenyan coast at your own pace.',
    },
    it: {
      title: 'Noleggio auto a Watamu',
      description: 'Noleggia un’auto per esplorare Watamu, Malindi e la costa del Kenya con i tuoi tempi.',
    },
  },
  {
    path: '/services',
    priority: 0.6,
    en: {
      title: 'Local services in Watamu',
      description: 'Private chefs, guides, massage and more from trusted locals in Watamu.',
    },
    it: {
      title: 'Servizi locali a Watamu',
      description: 'Chef privati, guide, massaggi e molto altro, da persone di Watamu di cui ci fidiamo.',
    },
  },
  {
    path: '/properties-for-sale',
    priority: 0.6,
    en: {
      title: 'Property for sale in Watamu',
      description: 'Villas, apartments and land for sale in Watamu, Kenya. Book a viewing with our local team.',
    },
    it: {
      title: 'Immobili in vendita a Watamu',
      description: 'Ville, appartamenti e terreni in vendita a Watamu, in Kenya. Prenota una visita con il nostro team locale.',
    },
  },
  {
    path: '/login',
    noindex: true,
    en: { title: 'Sign in', description: SITE_TEXT.en.description },
    it: { title: 'Accedi', description: SITE_TEXT.it.description },
  },
  {
    path: '/register',
    noindex: true,
    en: { title: 'Create an account', description: SITE_TEXT.en.description },
    it: { title: 'Crea un account', description: SITE_TEXT.it.description },
  },
];

/** A static route's text in a language (falls back to English), or null for other paths. */
export function routeText(path, locale = 'en') {
  const route = STATIC_ROUTES.find((r) => r.path === path);
  if (!route) return null;
  return { ...route.en, ...(route[locale] || {}), noindex: Boolean(route.noindex) };
}
