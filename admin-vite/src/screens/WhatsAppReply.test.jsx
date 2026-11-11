// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import WhatsAppReply from './WhatsAppReply';

// "Reply on WhatsApp" on a trip request: the number is checked before a link
// is made, the message is editable, and nothing is sent — the link opens
// WhatsApp, where the admin presses Send.

const request = (contact = {}, overrides = {}) => ({
  reference: 'EW-ABC234',
  status: 'new',
  contact: { name: 'Amina Hassan', email: 'amina@example.com', phone: '+254 712 345 678', ...contact },
  adults: 2,
  children: 0,
  arrival: '2027-01-10T00:00:00.000Z',
  departure: '2027-01-12T00:00:00.000Z',
  ...overrides,
});

function openReply(r) {
  render(<WhatsAppReply request={r} />);
  fireEvent.click(screen.getByRole('button', { name: 'Reply on WhatsApp' }));
  return {
    to: screen.getByRole('textbox', { name: /^To/ }),
    message: screen.getByRole('textbox', { name: /^Message/ }),
    link: () => screen.queryByRole('link', { name: /Open WhatsApp/ }),
  };
}
const textOf = (a) => new URL(a.getAttribute('href')).searchParams.get('text');

afterEach(cleanup);

describe('Reply on WhatsApp', () => {
  it('opens a chat with the traveller’s number and a message naming the request', () => {
    const { link, message } = openReply(request());
    const a = link();
    expect(a.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/254712345678\?text=/);
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(textOf(a)).toBe(message.value);
    expect(message.value).toMatch(/^Hi Amina, this is Exploring Watamu about your trip request EW-ABC234/);
    expect(screen.getByText(/Nothing is sent until you press Send there/)).toBeTruthy();
  });

  it('sends exactly what the admin typed', () => {
    const { link, message } = openReply(request());
    fireEvent.change(message, { target: { value: 'Hi Amina — quick one: are you flying into Malindi?' } });
    expect(textOf(link())).toBe('Hi Amina — quick one: are you flying into Malindi?');
  });

  it('switches to another starting message', () => {
    const { message } = openReply(request({}, { status: 'quoted', quote: { total: 145000 } }));
    expect(message.value).toMatch(/Your quote is ready: KES 145,000/);
    fireEvent.click(screen.getByRole('button', { name: 'Ask a question' }));
    expect(message.value).toMatch(/We have a quick question before we send your quote: $/);
    expect(screen.getByRole('button', { name: 'Ask a question' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('won’t make a link for a number without a country code', () => {
    const { link, to } = openReply(request({ phone: '2025550123' }));
    expect(link()).toBeNull();
    expect(screen.getByRole('button', { name: /Open WhatsApp/ }).disabled).toBe(true);
    expect(screen.getByText(/needs the full international number/)).toBeTruthy();

    fireEvent.change(to, { target: { value: '+1 202 555 0123' } });
    expect(link().getAttribute('href')).toMatch(/^https:\/\/wa\.me\/12025550123\?/);
  });

  it('says when it assumed a Kenyan number, next to the traveller’s country', () => {
    openReply(request({ phone: '0772 123 456', country: 'Uganda' }));
    expect(screen.getByText(/assumes a Kenyan number/).textContent).toMatch(/from Uganda\. Check it before you send\./);
  });

  it('asks for a number when the traveller gave none, and an empty message opens nothing', () => {
    const { to, message } = openReply(request({ phone: '' }));
    expect(screen.getByText(/didn’t give a phone number/)).toBeTruthy();
    fireEvent.change(to, { target: { value: '+254712345678' } });
    fireEvent.change(message, { target: { value: '  ' } });
    expect(screen.getByRole('button', { name: /Open WhatsApp/ }).disabled).toBe(true);
  });
});
