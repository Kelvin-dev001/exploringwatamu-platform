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
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { generalMessage, whatsappEnabled } from '@/lib/whatsapp';
import { useI18n } from '@/i18n';
import messages from '@/locales/layout';
import { cn } from '@/lib/utils';

// Labels are message keys: the menus render in the current language.
const PRIMARY = [
  { to: '/experiences', label: 'navExperiences' },
  { to: '/group-trips', label: 'navGroupTrips' },
  { to: '/hotels', label: 'navStays' },
  // Below 1280px the header has no room for it: it moves into "More" (wide: true).
  { to: '/transfers', label: 'navTransfers', desc: 'navTransfersDesc', wide: true },
];
const MORE = [
  { to: '/carhire', label: 'navCarHire', desc: 'navCarHireDesc' },
  { to: '/services', label: 'navServices', desc: 'navServicesDesc' },
  { to: '/properties-for-sale', label: 'navProperty', desc: 'navPropertyDesc' },
];
const SUPPORT_EMAIL = 'hello@exploringwatamu.com';

const navLinkClass = ({ isActive }) =>
  cn(
    'relative whitespace-nowrap px-2 py-2 text-[0.95rem] font-semibold transition-colors xl:px-3',
    'after:absolute after:inset-x-2 xl:after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-coral-500 after:transition-transform after:duration-300',
    isActive ? 'text-ocean-900 after:scale-x-100' : 'text-ocean-900/65 hover:text-ocean-900 after:scale-x-0 hover:after:scale-x-100'
  );

/** Small accessible "More" dropdown. */
function MoreMenu() {
  const { t } = useI18n(messages);
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
        className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-2 text-[0.95rem] font-semibold text-ocean-900/65 transition hover:text-ocean-900 xl:px-3"
      >
        {t('navMore')} <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 rounded-2xl border border-sand-200 bg-white p-2 shadow-lift animate-[fade-in_.15s_ease-out]">
          {[...PRIMARY.filter((item) => item.wide), ...MORE].map((item) => (
            <Link key={item.to} to={item.to} className={cn('block rounded-xl px-4 py-3 transition hover:bg-sand-100', item.wide && 'xl:hidden')}>
              <span className="block font-semibold text-ocean-900">{t(item.label)}</span>
              <span className="block text-sm text-ocean-900/60">{t(item.desc)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  const { t } = useI18n(messages);
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
        <Logo className="shrink-0" />

        <nav aria-label={t('navMain')} className="ml-2 hidden items-center lg:flex xl:ml-6">
          {PRIMARY.map((item) => (
            <NavLink key={item.to} to={item.to} className={(state) => cn(navLinkClass(state), item.wide && 'hidden xl:block')}>
              {t(item.label)}
            </NavLink>
          ))}
          <MoreMenu />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ProfilePill className="hidden max-w-[15rem] md:inline-flex 2xl:max-w-sm" />
          <LanguageSwitcher className="hidden md:inline-flex" />
          <WhatsAppButton iconOnly variant="ghost" message={generalMessage()} label={t('chatWhatsApp')} className="hidden xl:inline-flex" />
          <TripButton />
          {user ? (
            <Button variant="ghost" size="icon" aria-label={t('signOut')} title={t('signOut')} onClick={signOut} className="hidden lg:inline-flex">
              <LogOut />
            </Button>
          ) : (
            <Button to="/login" variant="ocean" size="sm" className="hidden lg:inline-flex">
              {t('signIn')}
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label={t('openMenu')} className="lg:hidden" onClick={() => setMenuOpen(true)}>
            <Menu />
          </Button>
        </div>
      </Container>

      {/* Phones: the personal pill and the language switcher get their own row */}
      <div className="flex items-center gap-2 border-t border-sand-200/70 px-5 py-2 md:hidden">
        <ProfilePill compact className="min-w-0 flex-1 justify-center" />
        <LanguageSwitcher className="shrink-0" />
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title={t('menuTitle')}>
        <nav aria-label={t('navMobile')} className="flex flex-1 flex-col px-3 pb-6">
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
              {t(item.label)}
              <ArrowUpRight className="size-4 text-coral-500" />
            </NavLink>
          ))}
          <div className="mt-auto space-y-3 border-t border-sand-200 px-3 pt-6">
            <LanguageSwitcher full className="flex w-full [&>a]:flex-1" />
            <Button to="/trip" className="w-full">
              <Luggage /> {t('myTripPlanner')}
            </Button>
            <Button to="/my-trips" variant="outline" className="w-full">
              {t('myBookings')}
            </Button>
            <WhatsAppButton full message={generalMessage()}>
              {t('chatWhatsApp')}
            </WhatsAppButton>
            {user ? (
              <Button variant="ghost" className="w-full" onClick={signOut}>
                <LogOut /> {t('signOut')}
              </Button>
            ) : (
              <Button to="/login" variant="ocean" className="w-full">
                {t('signIn')}
              </Button>
            )}
          </div>
        </nav>
      </Sheet>
    </header>
  );
}

function Footer() {
  const { t } = useI18n(messages);
  const columns = [
    { title: 'footerExplore', links: [...PRIMARY, MORE[0]] },
    { title: 'footerPlan', links: [MORE[1], MORE[2], { to: '/trip', label: 'footerTripPlanner' }, { to: '/my-trips', label: 'myBookings' }, { to: '/login', label: 'signIn' }] },
  ];
  return (
    <footer className="relative mt-24 overflow-hidden bg-ocean-900 text-sand-50">
      <div className="h-1.5 bg-gradient-to-r from-lagoon-500 via-ochre-500 to-coral-500" />
      <ArchBand className="text-ocean-700" />
      <Rosette className="pointer-events-none absolute -bottom-28 -right-20 text-ocean-800" size={380} strokeWidth={0.9} />
      <Container size="wide" className="relative grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" aria-label={t('brandHome')} className="inline-block">
            <BrandBadge className="size-28 ring-4 ring-ocean-800" />
          </Link>
          <p className="mt-6 max-w-sm font-display text-2xl italic leading-snug text-sand-50/90">{t('footerTagline')}</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow !text-lagoon-300">{t(col.title)}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to + l.label}>
                  <Link to={l.to} className="text-sand-50/75 transition hover:text-sand-50">
                    {t(l.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="eyebrow !text-lagoon-300">{t('footerTalk')}</p>
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
              <MapPin className="size-4" /> {t('footerPlace')}
            </li>
          </ul>
          <LanguageSwitcher full tone="dark" className="mt-6" />
        </div>
      </Container>
      <Container size="wide" className="relative flex flex-col gap-2 border-t border-sand-50/10 py-6 text-sm text-sand-50/65 sm:flex-row sm:justify-between">
        <p>{t('footerRights', { year: new Date().getFullYear() })}</p>
        <p>{t('footerNote')}</p>
      </Container>
    </footer>
  );
}

export default function Layout({ children }) {
  const { t } = useI18n(messages);
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
        {t('skipToContent')}
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
