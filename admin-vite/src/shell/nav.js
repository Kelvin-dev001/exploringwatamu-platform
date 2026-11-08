import {
  LayoutDashboard, Inbox, CalendarCheck, Compass, Users, BedDouble, Plane, CarFront, Car, Sparkles, Home,
  Bell, UsersRound, Ticket, Map, Wrench, KeyRound, Building2,
} from 'lucide-react';

/* Single source for the sidebar, phone menus and the quick-jump palette. */
export const NAV = [
  {
    group: 'Today',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/trip-requests', label: 'Trip requests', icon: Inbox, badge: 'newRequests' },
      { to: '/bookings', label: 'All bookings', icon: CalendarCheck },
    ],
  },
  {
    group: 'Catalogue',
    items: [
      { to: '/tours', label: 'Experiences', icon: Compass, create: '/tours/new' },
      { to: '/grouptrips', label: 'Group trips', icon: Users, create: '/grouptrips/new' },
      { to: '/hotels', label: 'Stays', icon: BedDouble, create: '/hotels/new' },
      { to: '/transfers', label: 'Transfers', icon: Plane, create: '/transfers/new' },
      { to: '/carhire', label: 'Car hire', icon: CarFront, create: '/carhire/new' },
      { to: '/vehicles', label: 'Vehicles', icon: Car, create: '/vehicles/new' },
      { to: '/services', label: 'Services', icon: Sparkles, create: '/services/new' },
      { to: '/properties', label: 'Property', icon: Home, create: '/properties/new' },
    ],
  },
  {
    group: 'Bookings by type',
    collapsible: true,
    items: [
      { to: '/tourbookings', label: 'Experience bookings', icon: Map },
      { to: '/transferbookings', label: 'Transfer bookings', icon: Ticket },
      { to: '/carhirebookings', label: 'Car hire bookings', icon: KeyRound },
      { to: '/servicebookings', label: 'Service bookings', icon: Wrench },
      { to: '/propertyviewingbookings', label: 'Property viewings', icon: Building2 },
    ],
  },
  {
    group: 'Admin',
    items: [
      { to: '/notifications', label: 'Emails & SMS', icon: Bell },
      { to: '/team', label: 'Team', icon: UsersRound },
    ],
  },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));

/* Routes rebuilt in the new design; everything else renders in the legacy frame. */
export const REDESIGNED = [/^\/admin\/dashboard$/, /^\/trip-requests(\/[^/]+)?$/, /^\/team$/];
export const isRedesigned = (path) => REDESIGNED.some((re) => re.test(path));

export const isActive = (path, to) => path === to || (to !== '/admin/dashboard' && path.startsWith(`${to}/`)) || (to === '/grouptrips' && path.startsWith('/grouptripbookings'));
