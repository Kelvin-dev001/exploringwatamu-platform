import { BedDouble, Plane, CarFront, Car, Sparkles, Home, Star } from 'lucide-react';
import { kes } from '@/lib/utils';
import { Badge } from '@/ui';
import CatalogueScreen from './CatalogueScreen';

const minRoom = (h) => {
  const prices = (h.roomTypes || []).map((r) => r.price).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : null;
};

export const STAYS = {
  title: 'Stays', noun: 'Stay', what: 'stay', path: '/hotels', endpoint: '/hotels', quick: 'hotels', icon: BedDouble,
  description: 'Hotels, villas and Airbnbs travellers can add to their trip.',
  name: (r) => r.name, image: (r) => r.images?.[0],
  subtitle: (r) => [r.type && r.type[0].toUpperCase() + r.type.slice(1), r.location?.address || (typeof r.location === 'string' ? r.location : '')].filter(Boolean).join(' · '),
  search: (r) => `${r.name} ${r.type} ${r.location?.address || ''}`,
  price: { field: 'pricePerNight', label: 'Per night' },
  columns: [
    { key: 'stars', header: 'Stars', sort: (r) => r.stars || 0, cell: (r) => (r.stars ? <span className="inline-flex items-center gap-1 text-sm"><Star className="size-3.5 fill-current text-warn" />{r.stars}</span> : <span className="text-faint">—</span>) },
    { key: 'rooms', header: 'Rooms', sort: (r) => (r.roomTypes || []).length, cell: (r) => <span className="text-sm text-muted">{(r.roomTypes || []).length || '—'}{minRoom(r) ? ` · from ${kes(minRoom(r))}` : ''}</span> },
  ],
  filters: [{ key: 'type', label: 'Type', options: [{ value: 'hotel', label: 'Hotels' }, { value: 'villa', label: 'Villas' }, { value: 'airbnb', label: 'Airbnbs' }], test: (r, v) => r.type === v }],
  website: '/hotels',
};

export const TRANSFERS = {
  title: 'Transfers', noun: 'Transfer', what: 'transfer', path: '/transfers', endpoint: '/transfers', params: { limit: 1000 }, quick: 'transfers', icon: Plane, active: true,
  description: 'Airport and hotel transfer routes and prices.',
  name: (r) => r.route || 'Transfer', image: (r) => r.vehicle?.image,
  subtitle: (r) => [r.vehicle?.name, r.vehicle?.capacity && `${r.vehicle.capacity} seats`].filter(Boolean).join(' · ') || 'No vehicle set',
  search: (r) => `${r.route} ${r.vehicle?.name || ''}`,
  price: { field: 'price', label: 'Price' },
  website: '/transfers',
};

export const CARHIRE = {
  title: 'Car hire', noun: 'Car', what: 'car hire listing', path: '/carhire', endpoint: '/carhire', params: { limit: 1000 }, quick: 'carhire', icon: CarFront, active: true,
  description: 'Cars available to hire, with daily rates.',
  name: (r) => r.vehicle?.name || 'Vehicle', image: (r) => r.vehicle?.image,
  subtitle: (r) => [r.vehicle?.capacity && `${r.vehicle.capacity} seats`, r.description].filter(Boolean).join(' · '),
  search: (r) => `${r.vehicle?.name || ''} ${r.description || ''}`,
  price: { field: 'dailyRate', label: 'Per day' },
  website: '/carhire',
};

export const VEHICLES = {
  title: 'Vehicles', noun: 'Vehicle', what: 'vehicle', path: '/vehicles', endpoint: '/vehicles', icon: Car,
  description: 'Your fleet — used by transfers, car hire and tours.',
  name: (r) => r.name, image: (r) => r.image,
  subtitle: (r) => r.description,
  search: (r) => `${r.name} ${r.description || ''}`,
  columns: [{ key: 'capacity', header: 'Seats', sort: (r) => r.capacity || 0, cell: (r) => <span className="text-sm">{r.capacity || '—'}</span> }],
  cardExtra: (r) => r.capacity ? <Badge>{r.capacity} seats</Badge> : null,
};

export const SERVICES = {
  title: 'Services', noun: 'Service', what: 'service', path: '/services', endpoint: '/services', params: { limit: 1000 }, quick: 'services', icon: Sparkles, active: true,
  description: 'Chefs, guides, wellness and other local services.',
  name: (r) => r.name, image: (r) => r.gallery?.[0],
  subtitle: (r) => [r.pricingType && `Priced ${r.pricingType}`, (r.availableDays || []).length && `${r.availableDays.length} days a week`].filter(Boolean).join(' · '),
  search: (r) => `${r.name} ${r.description || ''}`,
  price: { field: 'price', label: 'Price' },
  filters: [{ key: 'pricing', label: 'Pricing', options: [{ value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' }], test: (r, v) => r.pricingType === v }],
  website: '/services',
};

export const PROPERTIES = {
  title: 'Property', noun: 'Property', what: 'property listing', path: '/properties', endpoint: '/properties', params: { limit: 1000 }, quick: 'properties', icon: Home, active: true,
  description: 'Villas, apartments and land for sale.',
  name: (r) => r.name, image: (r) => r.pictures?.[0],
  subtitle: (r) => [r.type && r.type[0].toUpperCase() + r.type.slice(1), r.location].filter(Boolean).join(' · '),
  search: (r) => `${r.name} ${r.location || ''} ${r.type}`,
  price: { field: 'price', label: 'Asking' },
  filters: [{ key: 'type', label: 'Type', options: [{ value: 'villa', label: 'Villas' }, { value: 'apartment', label: 'Apartments' }, { value: 'land', label: 'Land' }], test: (r, v) => r.type === v }],
  website: '/properties-for-sale',
};

export const Stays = () => <CatalogueScreen c={STAYS} />;
export const Transfers = () => <CatalogueScreen c={TRANSFERS} />;
export const CarHire = () => <CatalogueScreen c={CARHIRE} />;
export const Vehicles = () => <CatalogueScreen c={VEHICLES} />;
export const Services = () => <CatalogueScreen c={SERVICES} />;
export const Properties = () => <CatalogueScreen c={PROPERTIES} />;
