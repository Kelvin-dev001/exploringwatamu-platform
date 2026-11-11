// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import { WhatsAppButton } from '@/components/contact/WhatsApp';
import { ContactLinks } from '@/components/listing/ListingCard';
import WhatsAppPlanSheet from '@/components/trip/WhatsAppPlanSheet';
import { AuthProvider } from '@/context/AuthContext';
import { VibeProfileProvider } from '@/context/VibeProfileContext';
import { TripProvider } from '@/context/TripContext';
import { addItem, emptyTrip, snapshotFor, toSnapshot } from '@/lib/trip';
import { normaliseTour } from '@/lib/catalog';
import { MAX_ENCODED_MESSAGE } from '@/lib/whatsapp';

// The WhatsApp buttons: hidden without a business number, correct links with
// one, and the trip planner's review-before-opening step. Nothing is sent:
// these are links that open WhatsApp, where the visitor presses Send.

const waLinks = (root = document.body) => [...root.querySelectorAll('a[href^="https://wa.me/"]')];
const textOf = (a) => new URL(a.getAttribute('href')).searchParams.get('text');

function Site({ trip, children = <p>Page</p> }) {
  return (
    <AuthProvider>
      <VibeProfileProvider initialRecord={{ version: 1, status: 'skipped', profile: null }}>
        <TripProvider initialTrip={trip}>
          <MemoryRouter>
            <Layout>{children}</Layout>
          </MemoryRouter>
        </TripProvider>
      </VibeProfileProvider>
    </AuthProvider>
  );
}

beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('without a WhatsApp number', () => {
  it('shows no WhatsApp buttons anywhere — never a dead link', () => {
    vi.stubEnv('VITE_WHATSAPP_NUMBER', '');
    render(
      <Site>
        <WhatsAppButton message="Hi">Chat on WhatsApp</WhatsAppButton>
      </Site>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(waLinks()).toEqual([]);
    expect(screen.queryByText(/WhatsApp/)).toBeNull();
  });

  it('treats an unusable number as unset', () => {
    vi.stubEnv('VITE_WHATSAPP_NUMBER', '0712 345');
    render(<WhatsAppButton message="Hi" />);
    expect(waLinks()).toEqual([]);
  });
});

describe('with a WhatsApp number', () => {
  beforeEach(() => vi.stubEnv('VITE_WHATSAPP_NUMBER', '+254 712 345 678'));

  it('puts a labelled chat link in the header and the number in the footer', () => {
    render(<Site />);
    const header = within(document.querySelector('header'));
    const chat = header.getByRole('link', { name: 'Chat with us on WhatsApp' });
    expect(chat.getAttribute('href')).toBe('https://wa.me/254712345678?text=Hi%20Exploring%20Watamu!%20I%E2%80%99m%20planning%20a%20trip%20to%20Watamu%20and%20have%20a%20question.');
    expect(chat.getAttribute('target')).toBe('_blank');
    expect(chat.getAttribute('rel')).toBe('noopener noreferrer');

    const footer = within(document.querySelector('footer'));
    expect(footer.getByRole('link', { name: /WhatsApp \+254 712 345 678/ })).toBeTruthy();
  });

  it('offers WhatsApp in the mobile menu', () => {
    render(<Site />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const menu = within(screen.getByRole('dialog'));
    expect(textOf(menu.getByRole('link', { name: /Chat with us on WhatsApp/ }))).toBe('Hi Exploring Watamu! I’m planning a trip to Watamu and have a question.');
  });

  it('gives icon-only buttons an accessible name', () => {
    render(<WhatsAppButton iconOnly message="About the Prado" label="Ask about Prado on WhatsApp" />);
    const link = screen.getByRole('link', { name: 'Ask about Prado on WhatsApp' });
    expect(link.textContent).toBe('');
    expect(textOf(link)).toBe('About the Prado');
  });
});

describe('a host’s own WhatsApp number on a stay card', () => {
  it('is normalised like ours, and left out when it can’t be used', () => {
    const { unmount } = render(<ContactLinks whatsapp="0712 345 678" email="host@example.test" />);
    expect(waLinks().map((a) => a.getAttribute('href'))).toEqual(['https://wa.me/254712345678']); // was wa.me/0712345678
    unmount();
    render(<ContactLinks whatsapp="ask at reception" email="host@example.test" />);
    expect(waLinks()).toEqual([]);
    expect(screen.getByRole('link', { name: 'Email' })).toBeTruthy();
  });
});

describe('sending the trip plan on WhatsApp', () => {
  beforeEach(() => vi.stubEnv('VITE_WHATSAPP_NUMBER', '+254712345678'));

  function trip() {
    let t = emptyTrip({ stay: 'weekend' });
    t = addItem(t, toSnapshot(normaliseTour({ _id: 't1', name: 'Marine park snorkel', description: 'd', durationHours: 4, priceForeignerAdult: 6500 })), 0);
    t = addItem(t, snapshotFor('stay', { _id: 'h1', name: 'Turtle Bay', pricePerNight: 18000 }), 'ideas');
    return t;
  }
  const renderSheet = () =>
    render(
      <VibeProfileProvider initialRecord={{ version: 1, status: 'skipped', profile: null }}>
        <TripProvider initialTrip={trip()}>
          <WhatsAppPlanSheet open onOpenChange={() => {}} />
        </TripProvider>
      </VibeProfileProvider>
    );

  it('shows the message for review, and the link carries exactly what is in the box', () => {
    renderSheet();
    const box = screen.getByRole('textbox', { name: /Your message/ });
    expect(box.value).toContain('Day 1: Marine park snorkel');
    expect(box.value).toContain('*Stay:* Turtle Bay');
    const open = screen.getByRole('link', { name: /Open WhatsApp/ });
    expect(textOf(open)).toBe(box.value);
    expect(screen.getByText(/Nothing is sent until you press Send/)).toBeTruthy();
  });

  it('uses the visitor’s edits, and can start again', () => {
    renderSheet();
    const box = screen.getByRole('textbox', { name: /Your message/ });
    const original = box.value;
    fireEvent.change(box, { target: { value: `${original}\n\nWe land at 14:00.` } });
    expect(textOf(screen.getByRole('link', { name: /Open WhatsApp/ }))).toMatch(/We land at 14:00\.$/);
    fireEvent.click(screen.getByRole('button', { name: /Start again/ }));
    expect(box.value).toBe(original);
  });

  it('won’t open an over-long or empty message', () => {
    renderSheet();
    const box = screen.getByRole('textbox', { name: /Your message/ });
    fireEvent.change(box, { target: { value: 'word '.repeat(MAX_ENCODED_MESSAGE) } });
    expect(screen.getByRole('alert').textContent).toMatch(/too long/);
    expect(screen.queryByRole('link', { name: /Open WhatsApp/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Open WhatsApp/ }).disabled).toBe(true);

    fireEvent.change(box, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: /Open WhatsApp/ }).disabled).toBe(true);
  });
});
