// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('axios', () => ({ default: { get: vi.fn(() => new Promise(() => {})), post: vi.fn() } }));
const { getLocale, setLocale } = await import('@/i18n');
const { default: LanguageSwitcher } = await import('@/components/LanguageSwitcher');
const { default: Seo } = await import('@/components/seo/Seo');
const { default: Layout } = await import('@/components/Layout');
const { default: NotFound } = await import('@/pages/NotFound');
const { AuthProvider } = await import('@/context/AuthContext');
const { VibeProfileProvider } = await import('@/context/VibeProfileContext');
const { TripProvider } = await import('@/context/TripContext');

// The language switcher, each page's search metadata in both languages, and
// the site shell rendering in Italian.

const head = () => ({
  title: document.title,
  canonical: document.head.querySelector('link[rel=canonical]')?.getAttribute('href'),
  alternates: [...document.head.querySelectorAll('link[rel=alternate]')].map((l) => `${l.getAttribute('hreflang')} ${l.getAttribute('href')}`),
  robots: document.head.querySelector('meta[name=robots]')?.getAttribute('content') ?? null,
  ogLocale: document.head.querySelector('meta[property="og:locale"]')?.getAttribute('content'),
  ogAlternate: [...document.head.querySelectorAll('meta[property="og:locale:alternate"]')].map((m) => m.getAttribute('content')),
  description: document.head.querySelector('meta[name=description]')?.getAttribute('content'),
});
const at = (path, ui) => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
const origin = window.location.origin;

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  setLocale('en', { persist: false });
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('LanguageSwitcher', () => {
  it('offers both languages as real links to this page, marking the current one', () => {
    at('/hotels?type=villa', <LanguageSwitcher />);
    const group = screen.getByRole('group', { name: 'Language' });
    const [en, it] = group.querySelectorAll('a');
    expect(en.getAttribute('href')).toBe('/hotels?type=villa');
    expect(it.getAttribute('href')).toBe('/it/hotels?type=villa');
    expect(it.getAttribute('hreflang')).toBe('it');
    expect(it.getAttribute('lang')).toBe('it');
    expect(en.getAttribute('aria-current')).toBe('true');
    expect(it.getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Italiano' })).toBe(it);
  });

  it('switches in place on a click, and remembers the choice', () => {
    const push = vi.spyOn(window.history, 'pushState');
    window.history.replaceState(null, '', '/hotels');
    at('/hotels', <LanguageSwitcher full />);
    act(() => {
      fireEvent.click(screen.getByRole('link', { name: 'Italiano' }));
    });
    expect(push).toHaveBeenCalledWith(null, '', '/it/hotels');
    expect(getLocale()).toBe('it');
    expect(localStorage.getItem('ew.locale')).toBe('"it"');
    expect(screen.getByRole('group', { name: 'Lingua' })).toBeTruthy();
  });

  it('leaves a ctrl/cmd-click to the browser (new tab)', () => {
    at('/hotels', <LanguageSwitcher />);
    // After React has seen the click: note whether it was left alone, then stop jsdom following the link.
    let leftToBrowser;
    const after = (e) => {
      leftToBrowser = !e.defaultPrevented;
      e.preventDefault();
    };
    window.addEventListener('click', after);
    screen.getByRole('link', { name: 'Italiano' }).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    window.removeEventListener('click', after);
    expect(leftToBrowser).toBe(true);
    expect(getLocale()).toBe('en');
  });
});

describe('page metadata', () => {
  it('gives a static page its own canonical, an hreflang pair and og:locale in each language', () => {
    at('/experiences', <Seo route="/experiences" />);
    expect(head()).toEqual({
      title: 'Experiences in Watamu · Exploring Watamu',
      canonical: `${origin}/experiences`,
      alternates: [`en ${origin}/experiences`, `it ${origin}/it/experiences`, `x-default ${origin}/experiences`],
      robots: null,
      ogLocale: 'en_GB',
      ogAlternate: ['it_IT'],
      description: expect.stringMatching(/^Snorkelling in the marine park/),
    });
    cleanup();

    setLocale('it', { persist: false });
    at('/experiences', <Seo route="/experiences" />);
    expect(head()).toMatchObject({
      title: 'Esperienze a Watamu · Exploring Watamu',
      canonical: `${origin}/it/experiences`,
      alternates: [`en ${origin}/experiences`, `it ${origin}/it/experiences`, `x-default ${origin}/experiences`],
      ogLocale: 'it_IT',
      ogAlternate: ['en_GB'],
      description: expect.stringMatching(/^Snorkeling nel parco marino/),
    });
  });

  it('points an untranslated listing’s Italian page at the English one, with no hreflang', () => {
    setLocale('it', { persist: false });
    at('/experiences/t1', <Seo title="Marine park snorkel" description="Reef" path="/experiences/t1" translated={false} />);
    expect(head()).toMatchObject({ canonical: `${origin}/experiences/t1`, alternates: [], ogAlternate: [], ogLocale: 'it_IT' });
    cleanup();
    at('/experiences/t1', <Seo title="Snorkeling" description="Barriera" path="/experiences/t1" translated />);
    expect(head()).toMatchObject({ canonical: `${origin}/it/experiences/t1`, alternates: [`en ${origin}/experiences/t1`, `it ${origin}/it/experiences/t1`, `x-default ${origin}/experiences/t1`] });
  });

  it('keeps private pages out of search in both languages, without alternates', () => {
    setLocale('it', { persist: false });
    at('/login', <Seo route="/login" />);
    expect(head()).toMatchObject({ title: 'Accedi · Exploring Watamu', robots: 'noindex', alternates: [], canonical: `${origin}/it/login` });
  });
});

describe('the site in Italian', () => {
  it('renders the header, menus, footer and a page in Italian, with Italian links', async () => {
    setLocale('it', { persist: false });
    render(
      <AuthProvider>
        <VibeProfileProvider initialRecord={{ version: 1, status: 'skipped', profile: null }}>
          <TripProvider>
            <MemoryRouter initialEntries={['/nowhere']}>
              <Layout>
                <NotFound />
              </Layout>
            </MemoryRouter>
          </TripProvider>
        </VibeProfileProvider>
      </AuthProvider>
    );
    expect(screen.getByRole('navigation', { name: 'Principale' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Esperienze' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Questa pagina è andata via con la marea' })).toBeTruthy();
    expect(screen.getByText('Vai al contenuto')).toBeTruthy();
    expect(screen.getByText(/Tutti i diritti riservati/)).toBeTruthy();
    expect(screen.getAllByRole('group', { name: 'Lingua' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Il mio viaggio, 0 elementi' })).toBeTruthy();
    expect(document.title).toBe('Pagina non trovata · Exploring Watamu');
  });
});
