/*
 * Static routes with their search/share metadata. Used at build time to write
 * one HTML file per route (so link previews and crawlers see the right title
 * without running JavaScript) and to generate sitemap.xml. Keep in step with
 * the <Seo> on each page.
 */
export const DEFAULT_DESCRIPTION =
  'Personalised trips in Watamu, Kenya. Pick experiences, stays and group trips that fit how you travel, and get a tailored quote from our local team.';

export const STATIC_ROUTES = [
  { path: '/', title: 'Exploring Watamu — Your Watamu, tuned to you', description: DEFAULT_DESCRIPTION, priority: 1.0 },
  { path: '/experiences', title: 'Experiences in Watamu · Exploring Watamu', description: 'Snorkelling in the marine park, sunset dhows on Mida Creek, Gede Ruins and more — ranked for how you like to travel.', priority: 0.9 },
  { path: '/group-trips', title: 'Group trips in Watamu · Exploring Watamu', description: 'Join scheduled group adventures in Watamu, Kenya. Request your spot; pay after we confirm.', priority: 0.9 },
  { path: '/trip', title: 'Plan your Watamu trip · Exploring Watamu', description: 'Drag experiences onto days, add stays and transfers, and get one tailored quote from our local team.', priority: 0.8 },
  { path: '/hotels', title: 'Where to stay in Watamu · Exploring Watamu', description: 'Hotels, beach villas and Airbnbs in Watamu, Kenya. Add a stay to your trip and our local team includes it in your quote.', priority: 0.8 },
  { path: '/transfers', title: 'Airport & hotel transfers · Exploring Watamu', description: 'Private transfers from Malindi and Mombasa airports to Watamu, and between hotels.', priority: 0.7 },
  { path: '/carhire', title: 'Car hire in Watamu · Exploring Watamu', description: 'Hire a car to explore Watamu, Malindi and the Kenyan coast at your own pace.', priority: 0.6 },
  { path: '/services', title: 'Local services in Watamu · Exploring Watamu', description: 'Private chefs, guides, massage and more from trusted locals in Watamu.', priority: 0.6 },
  { path: '/properties-for-sale', title: 'Property for sale in Watamu · Exploring Watamu', description: 'Villas, apartments and land for sale in Watamu, Kenya. Book a viewing with our local team.', priority: 0.6 },
  { path: '/login', title: 'Sign in · Exploring Watamu', description: DEFAULT_DESCRIPTION, noindex: true },
  { path: '/register', title: 'Create an account · Exploring Watamu', description: DEFAULT_DESCRIPTION, noindex: true },
];
