import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Luggage, LogOut, Menu, Mail, MapPin, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { Logo, BrandBadge } from '@/components/brand/Logo';
import { ArchBand, Rosette } from '@/components/brand/Patterns';
import { Container } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import ProfilePill from '@/components/personalise/ProfilePill';
import { useVibeProfile } from '@/context/VibeProfileContext';

// Only loaded when the question is actually shown (first visit or the pill).
const VibeOnboarding = lazy(() => import('@/components/personalise/VibeOnboarding'));
import TripDrawer, { TripToast, TripButton } from '@/components/trip/TripDrawer';
import { WhatsAppButton, WhatsAppNumberLink } from '@/components/contact/WhatsApp';
import { generalMessage, whatsappEnabled } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

const PRIMARY = [
  { to: '/experiences', label: 'Experiences' },
  { to: '/group-trips', label: 'Group trips' },
  { to: '/hotels', label: 'Stays' },
  { to: '/transfers', label: 'Transfers' },
];
const MORE = [
  { to: '/carhire', label: 'Car hire', desc: 'Self-drive or with a driver' },
  { to: '/services', label: 'Local services', desc: 'Chefs, guides, wellness and more' },
  { to: '/properties-for-sale', label: 'Property for sale', desc: 'Own a piece of the coast' },
];
const SUPPORT_EMAIL = 'hello@exploringwatamu.com';

const navLinkClass = ({ isActive }) =>
  cn(
    'relative px-3 py-2 text-[0.95rem] font-semibold transition-colors',
    'after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-coral-500 after:transition-transform after:duration-300',
    isActive ? 'text-ocean-900 after:scale-x-100' : 'text-ocean-900/65 hover:text-ocean-900 after:scale-x-0 hover:after:scale-x-100'
  );

/** Small accessible "More" dropdown. */
function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-3 py-2 text-[0.95rem] font-semibold text-ocean-900/65 transition hover:text-ocean-900"
      >
        More <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 rounded-2xl border border-sand-200 bg-white p-2 shadow-lift animate-[fade-in_.15s_ease-out]">
          {MORE.map((item) => (
            <Link key={item.to} to={item.to} className="block rounded-xl px-4 py-3 transition hover:bg-sand-100">
              <span className="block font-semibold text-ocean-900">{item.label}</span>
              <span className="block text-sm text-ocean-900/60">{item.desc}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const signOut = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-all duration-300',
        scrolled ? 'border-sand-200 bg-sand-50/90 backdrop-blur-md' : 'border-transparent bg-sand-50'
      )}
    >
      <Container size="wide" className="flex h-[4.5rem] items-center gap-4">
        <Logo />

        <nav aria-label="Main" className="ml-6 hidden items-center lg:flex">
          {PRIMARY.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
          <MoreMenu />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ProfilePill className="hidden md:inline-flex" />
          <WhatsAppButton iconOnly variant="ghost" message={generalMessage()} label="Chat with us on WhatsApp" className="hidden lg:inline-flex" />
          <TripButton />
          {user ? (
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut} className="hidden lg:inline-flex">
              <LogOut />
            </Button>
          ) : (
            <Button to="/login" variant="ocean" size="sm" className="hidden lg:inline-flex">
              Sign in
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden" onClick={() => setMenuOpen(true)}>
            <Menu />
          </Button>
        </div>
      </Container>

      {/* Personal pill gets its own row on small phones */}
      <div className="border-t border-sand-200/70 px-5 py-2 md:hidden">
        <ProfilePill compact className="w-full justify-center" />
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="Explore Watamu">
        <nav aria-label="Mobile" className="flex flex-1 flex-col px-3 pb-6">
          {[...PRIMARY, ...MORE].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-3 py-3.5 font-display text-xl transition',
                  isActive ? 'bg-white text-ocean-900 shadow-soft' : 'text-ocean-900/80 hover:bg-white/70'
                )
              }
            >
              {item.label}
              <ArrowUpRight className="size-4 text-coral-500" />
            </NavLink>
          ))}
          <div className="mt-auto space-y-3 border-t border-sand-200 px-3 pt-6">
            <Button to="/trip" className="w-full">
              <Luggage /> My trip planner
            </Button>
            <Button to="/my-trips" variant="outline" className="w-full">
              My bookings
            </Button>
            <WhatsAppButton full message={generalMessage()}>
              Chat with us on WhatsApp
            </WhatsAppButton>
            {user ? (
              <Button variant="ghost" className="w-full" onClick={signOut}>
                <LogOut /> Sign out
              </Button>
            ) : (
              <Button to="/login" variant="ocean" className="w-full">
                Sign in
              </Button>
            )}
          </div>
        </nav>
      </Sheet>
    </header>
  );
}

function Footer() {
  const columns = [
    { title: 'Explore', links: [...PRIMARY, MORE[0]] },
    { title: 'Plan', links: [MORE[1], MORE[2], { to: '/trip', label: 'Trip planner' }, { to: '/my-trips', label: 'My bookings' }, { to: '/login', label: 'Sign in' }] },
  ];
  return (
    <footer className="relative mt-24 overflow-hidden bg-ocean-900 text-sand-50">
      <div className="h-1.5 bg-gradient-to-r from-lagoon-500 via-ochre-500 to-coral-500" />
      <ArchBand className="text-ocean-700" />
      <Rosette className="pointer-events-none absolute -bottom-28 -right-20 text-ocean-800" size={380} strokeWidth={0.9} />
      <Container size="wide" className="relative grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" aria-label="Exploring Watamu — home" className="inline-block">
            <BrandBadge className="size-28 ring-4 ring-ocean-800" />
          </Link>
          <p className="mt-6 max-w-sm font-display text-2xl italic leading-snug text-sand-50/90">
            Your Watamu, tuned to you — built by people who live here.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow !text-lagoon-300">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to + l.label}>
                  <Link to={l.to} className="text-sand-50/75 transition hover:text-sand-50">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="eyebrow !text-lagoon-300">Talk to us</p>
          <ul className="mt-4 space-y-2.5 text-sand-50/75">
            {whatsappEnabled() && (
              <li>
                <WhatsAppNumberLink message={generalMessage()} className="inline-flex items-center gap-2 transition hover:text-sand-50" />
              </li>
            )}
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 transition hover:text-sand-50">
                <Mail className="size-4" /> {SUPPORT_EMAIL}
              </a>
            </li>
            <li className="inline-flex items-center gap-2">
              <MapPin className="size-4" /> Watamu, Kilifi County, Kenya
            </li>
          </ul>
        </div>
      </Container>
      <Container size="wide" className="relative flex flex-col gap-2 border-t border-sand-50/10 py-6 text-sm text-sand-50/65 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Exploring Watamu. All rights reserved.</p>
        <p>Prices on request · No payment until you confirm</p>
      </Container>
    </footer>
  );
}

export default function Layout({ children }) {
  const location = useLocation();
  const { onboardingOpen } = useVibeProfile();
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  useEffect(() => {
    if (onboardingOpen) setOnboardingLoaded(true);
  }, [onboardingOpen]);
  // Block body on purpose: newer browsers (Chrome 155+) make scrollTo() return a
  // Promise, and an effect that returns one hands React a non-function "cleanup"
  // that throws on the next navigation and blanks the whole page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-ocean-900 focus:px-4 focus:py-2 focus:text-sand-50"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      {onboardingLoaded && (
        <Suspense fallback={null}>
          <VibeOnboarding />
        </Suspense>
      )}
      <TripDrawer />
      <TripToast />
    </div>
  );
}
