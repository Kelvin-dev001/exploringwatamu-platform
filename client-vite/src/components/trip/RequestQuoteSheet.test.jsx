// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

vi.mock('axios', () => ({ default: { post: vi.fn(), get: vi.fn() } }));
const axios = (await import('axios')).default;
const { default: RequestQuoteSheet } = await import('@/components/trip/RequestQuoteSheet');
const { VibeProfileProvider } = await import('@/context/VibeProfileContext');
const { TripProvider } = await import('@/context/TripContext');
const { addItem, emptyTrip, snapshotFor, toSnapshot } = await import('@/lib/trip');
const { normaliseTour } = await import('@/lib/catalog');

// The quote form: validation, what is sent, the confirmation page, and the
// messages a traveller sees when something goes wrong.

function tripWithItems() {
  let t = emptyTrip({ stay: 'weekend' });
  t = addItem(t, toSnapshot(normaliseTour({ _id: 't1', name: 'Marine park snorkel', description: 'd', durationHours: 4, priceForeignerAdult: 6500, priceResidentAdult: 3000 })), 0);
  t = addItem(t, snapshotFor('stay', { _id: 'h1', name: 'Turtle Bay', pricePerNight: 18000 }), 'ideas');
  return t;
}

function Sent() {
  const { state } = useLocation();
  return <p>Sent {state?.request?.reference} to {state?.email}</p>;
}

function renderSheet() {
  return render(
    <VibeProfileProvider initialRecord={{ version: 1, status: 'set', profile: { vibes: ['ocean'], companions: 'couple', stay: 'weekend' } }}>
      <TripProvider initialTrip={tripWithItems()}>
        <MemoryRouter initialEntries={['/trip']}>
          <Routes>
            <Route path="/trip" element={<RequestQuoteSheet open onOpenChange={() => {}} residency="nonResident" />} />
            <Route path="/trip/sent/:reference" element={<Sent />} />
          </Routes>
        </MemoryRouter>
      </TripProvider>
    </VibeProfileProvider>
  );
}

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const send = () => act(async () => fireEvent.click(screen.getByRole('button', { name: /Send my trip/ })));

describe('RequestQuoteSheet', () => {
  afterEach(() => {
    cleanup();
    axios.post.mockReset();
  });

  it('checks the name and email before sending anything', async () => {
    renderSheet();
    fill('Your name', 'A');
    fill(/^Email/, 'not-an-email');
    await send();
    expect(screen.getByText('Please tell us your name')).toBeTruthy();
    expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('sends the whole trip and opens the confirmation page with the reference', async () => {
    axios.post.mockResolvedValue({ data: { reference: 'EW-ABC234', delivery: { email: false, sms: false } } });
    renderSheet();
    fill('Your name', ' Amina Traveller ');
    fill(/^Email/, 'amina@example.com');
    fill(/^Phone or WhatsApp/, '+254700000000');
    await send();

    const [url, payload, config] = axios.post.mock.calls[0];
    expect(url).toMatch(/\/trip-requests$/);
    expect(config).toBeUndefined(); // a guest: no Authorization header
    expect(payload.contact).toEqual({ name: 'Amina Traveller', email: 'amina@example.com', phone: '+254700000000', country: '' });
    expect(payload.profile).toEqual({ vibes: ['ocean'], companions: 'couple', stay: 'weekend' });
    expect(payload.days[0].items[0]).toMatchObject({ kind: 'tour', refId: 't1', listedPrice: 6500 });
    expect(payload.ideas[0]).toMatchObject({ kind: 'stay', refId: 'h1' });
    expect(payload.website).toBe('');
    expect(await screen.findByText('Sent EW-ABC234 to amina@example.com')).toBeTruthy();
  });

  it('keeps the honeypot out of sight and out of the tab order', () => {
    renderSheet();
    const trap = screen.getByLabelText('Website', { selector: 'input' });
    expect(trap.tabIndex).toBe(-1);
    expect(trap.closest('[aria-hidden="true"]')).toBeTruthy();
  });

  it('shows the API’s field errors next to the right field', async () => {
    axios.post.mockRejectedValue({ response: { status: 400, data: { error: 'Validation failed', issues: [{ path: 'contact.email', message: 'That email bounced' }] } } });
    renderSheet();
    fill('Your name', 'Amina');
    fill(/^Email/, 'amina@example.com');
    await send();
    expect(screen.getByText('That email bounced')).toBeTruthy();
  });

  it('explains rate limits and connection problems, and keeps the form', async () => {
    renderSheet();
    fill('Your name', 'Amina');
    fill(/^Email/, 'amina@example.com');

    axios.post.mockRejectedValueOnce({ response: { status: 429 } });
    await send();
    expect(screen.getByText(/Too many requests/)).toBeTruthy();

    axios.post.mockRejectedValueOnce({ code: 'ERR_NETWORK' });
    await send();
    expect(screen.getByText(/your trip is saved/)).toBeTruthy();
    expect(screen.getByLabelText('Your name').value).toBe('Amina');
  });
});
