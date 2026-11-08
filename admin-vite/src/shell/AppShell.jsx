import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, Monitor, LogOut, ChevronDown, LayoutDashboard, Inbox, CalendarCheck, LayoutGrid, Menu, ExternalLink } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useTheme } from '@/lib/theme';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Sheet } from '@/ui';
import { NAV, isActive } from './nav';
import CommandPalette from './CommandPalette';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://exploringwatamu-platform.vercel.app';

/** Count of new trip requests for the nav badge; refreshed every 2 minutes. */
function useNewRequestCount(enabled) {
  const [n, setN] = useState(0);
  const { pathname } = useLocation();
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const load = () => api.get('/trip-requests', { params: { status: 'new', limit: 1 } }).then((r) => alive && setN(r.data.total || 0)).catch(() => {});
    load();
    const t = setInterval(load, 120000);
    return () => { alive = false; clearInterval(t); };
  }, [enabled, pathname]);
  return n;
}

function Brand({ compact }) {
  return (
    <Link to="/admin/dashboard" className="flex items-center gap-2.5">
      <img src="/brand/logo-badge-96.png" alt="" className="size-8 rounded-full" width="32" height="32" />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-bold text-ink">Exploring Watamu</span>
          <span className="block text-xs text-faint">Admin</span>
        </span>
      )}
    </Link>
  );
}

function NavItem({ item, path, counts, onNavigate }) {
  const active = isActive(path, item.to);
  const count = item.badge ? counts[item.badge] : 0;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-subtle hover:text-ink'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <item.icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {count > 0 && <span className="rounded-full bg-accent px-1.5 text-[0.7rem] font-bold leading-5 text-white dark:text-canvas">{count}</span>}
    </NavLink>
  );
}

function NavGroups({ path, counts, onNavigate }) {
  const [open, setOpen] = useState(() => NAV.filter((g) => g.collapsible && g.items.some((i) => isActive(path, i.to))).map((g) => g.group));
  return (
    <nav aria-label="Admin" className="space-y-5">
      {NAV.map((g) => {
        const collapsed = g.collapsible && !open.includes(g.group);
        return (
          <div key={g.group}>
            {g.collapsible ? (
              <button
                type="button"
                onClick={() => setOpen((o) => (o.includes(g.group) ? o.filter((x) => x !== g.group) : [...o, g.group]))}
                className="mb-1 flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-faint hover:text-muted"
                aria-expanded={!collapsed}
              >
                {g.group}
                <ChevronDown className={cn('size-3.5 transition-transform', collapsed && '-rotate-90')} />
              </button>
            ) : (
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-faint">{g.group}</p>
            )}
            {!collapsed && (
              <div className="space-y-0.5">
                {g.items.map((it) => <NavItem key={it.to} item={it} path={path} counts={counts} onNavigate={onNavigate} />)}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function ThemeSwitch({ pref, setPref }) {
  const opts = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' },
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-lg bg-subtle p-0.5">
      {opts.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={pref === o.id} aria-label={o.label} title={o.label} onClick={() => setPref(o.id)}
          className={cn('flex flex-1 items-center justify-center rounded-md py-1.5', pref === o.id ? 'bg-surface text-ink shadow-card' : 'text-faint hover:text-ink')}>
          <o.icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

function Account({ admin, onLogout }) {
  const initial = (admin?.name || admin?.email || '?').trim()[0]?.toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">{initial}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{admin?.name || 'Admin'}</p>
        <p className="truncate text-xs text-faint">{admin?.email}</p>
      </div>
      <button type="button" onClick={onLogout} className="rounded-lg p-2 text-faint hover:bg-subtle hover:text-ink" aria-label="Sign out" title="Sign out">
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

const TABS = [
  { to: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/trip-requests', label: 'Requests', icon: Inbox, badge: 'newRequests' },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
];

export default function AppShell({ children }) {
  const { isAuthenticated, admin, logout } = useAdminAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [pref, setPref] = useTheme();
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(null); // null | 'all' | 'Catalogue'
  const newRequests = useNewRequestCount(isAuthenticated);
  const counts = { newRequests };
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setMenu(null), [pathname]);

  if (!isAuthenticated || pathname === '/admin/login') return children;

  const signOut = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-canvas">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 py-4"><Brand /></div>
        <div className="px-3">
          <button type="button" onClick={() => setPalette(true)} className="flex h-9 w-full items-center gap-2 rounded-lg border border-line bg-canvas px-3 text-sm text-faint hover:text-ink">
            <Search className="size-4" /> <span className="flex-1 text-left">Go to…</span>
            <kbd className="rounded border border-line px-1 text-[0.7rem]">Ctrl K</kbd>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5"><NavGroups path={pathname} counts={counts} /></div>
        <div className="space-y-2 border-t border-line p-3">
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-faint hover:text-ink">
            <ExternalLink className="size-3.5" /> View website
          </a>
          <ThemeSwitch pref={pref} setPref={setPref} />
          <Account admin={admin} onLogout={signOut} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Phone top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
          <Brand compact />
          <button type="button" onClick={() => setPalette(true)} className="ml-2 flex h-9 flex-1 items-center gap-2 rounded-lg border border-line bg-canvas px-3 text-sm text-faint">
            <Search className="size-4" /> Go to…
          </button>
        </header>

        <main id="main" className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* Phone tab bar */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {TABS.map((t) => {
          const active = isActive(pathname, t.to);
          const count = t.badge ? counts[t.badge] : 0;
          return (
            <NavLink key={t.to} to={t.to} className={cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold', active ? 'text-brand' : 'text-faint')} aria-current={active ? 'page' : undefined}>
              <t.icon className="size-5" />
              {t.label}
              {count > 0 && <span className="absolute right-[calc(50%-1.4rem)] top-2 rounded-full bg-accent px-1.5 text-[0.65rem] leading-4 text-white dark:text-canvas">{count}</span>}
            </NavLink>
          );
        })}
        <button type="button" onClick={() => setMenu('Catalogue')} className={cn('flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold', NAV[1].items.some((i) => isActive(pathname, i.to)) ? 'text-brand' : 'text-faint')}>
          <LayoutGrid className="size-5" /> Catalogue
        </button>
        <button type="button" onClick={() => setMenu('all')} className="flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold text-faint">
          <Menu className="size-5" /> More
        </button>
      </nav>

      <Sheet open={Boolean(menu)} onOpenChange={(o) => !o && setMenu(null)} title={menu === 'Catalogue' ? 'Catalogue' : 'Menu'}>
        {menu === 'Catalogue' ? (
          <div className="grid grid-cols-2 gap-2">
            {NAV[1].items.map((it) => (
              <div key={it.to} className="rounded-xl border border-line p-3">
                <Link to={it.to} className="flex items-center gap-2 text-sm font-semibold text-ink"><it.icon className="size-4 text-brand" />{it.label}</Link>
                {it.create && <Link to={it.create} className="mt-2 block text-xs font-semibold text-brand">+ Add new</Link>}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <NavGroups path={pathname} counts={counts} onNavigate={() => setMenu(null)} />
            <ThemeSwitch pref={pref} setPref={setPref} />
            <Account admin={admin} onLogout={signOut} />
          </div>
        )}
      </Sheet>

      <CommandPalette open={palette} onOpenChange={setPalette} dark={dark} onToggleTheme={() => setPref(dark ? 'light' : 'dark')} />
    </div>
  );
}
