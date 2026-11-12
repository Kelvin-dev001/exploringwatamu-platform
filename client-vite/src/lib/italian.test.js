import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '@/i18n';
import { LENGTHS, formatKES, normaliseGroupTrip, normaliseTour, unitLabel } from '@/lib/catalog';
import { addItem, dayLabel, emptyTrip, setDates, snapLength, snapRate, snapTitle, snapTitleLang, snapshotFor, toRequestPayload, toSnapshot, tripSummary, TRANSFERS } from '@/lib/trip';
import { generalMessage, listingEnquiry, referenceMessage, tripMessage } from '@/lib/whatsapp';
import { VIBES, personalHeadline, profileSummary } from '@/lib/vibes';
import { scoreExperience } from '@/lib/match';
import { formatAverage, reviewsLabel } from '@/lib/reviews';
import { reviewError } from '@/lib/reviewErrors';
import { apiError } from '@/lib/apiErrors';

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

// The site in Italian: our own words are Italian, listing text is the team's
// Italian when they wrote it (English otherwise), and what goes to the team
// stays English. No price or quote value changes.

const tourDoc = { _id: 't1', name: 'Marine park snorkel', titleIt: 'Snorkeling nel parco marino', description: 'Reef and turtles', duration: 'Half day', priceForeignerAdult: 6500, priceResidentAdult: 3000, vibes: ['ocean'], suits: ['couple'] };

beforeEach(() => setLocale('it', { persist: false }));
afterEach(() => setLocale('en', { persist: false }));

describe('the catalogue in Italian', () => {
  it('shows the Italian title, the English description (no Italian one) and Italian lengths', () => {
    const t = normaliseTour(tourDoc);
    expect(t.title).toBe('Snorkeling nel parco marino');
    expect(t.titleLang).toBe('it');
    expect(t.summary).toBe('Reef and turtles');
    expect(t.summaryLang).toBe('en');
    expect(t.lengthLabel).toBe('Mezza giornata');
    expect(t.titleEn).toBe('Marine park snorkel');
    expect(LENGTHS.map((l) => l.label)).toEqual(['Mezza giornata', 'Giornata intera', 'Più giorni']);
  });

  it('follows a language switch without reloading (the catalogue is cached)', () => {
    const t = normaliseTour(tourDoc);
    setLocale('en', { persist: false });
    expect(t.title).toBe('Marine park snorkel');
    expect(t.lengthLabel).toBe('Half day');
  });

  it('rebuilds lengths it can read and keeps free text it can’t', () => {
    expect(normaliseTour({ ...tourDoc, duration: '3 hours' }).lengthLabel).toBe('3 ore');
    expect(normaliseTour({ ...tourDoc, duration: 'Sunset' }).lengthLabel).toBe('Sunset');
    expect(normaliseGroupTrip({ _id: 'g', title: 'Reef weekend', slug: 'r', startDate: '2027-02-01', endDate: '2027-02-03' }).lengthLabel).toBe('3 giorni');
  });

  it('writes prices and units in Italian without changing them', () => {
    expect(formatKES(18000)).toBe('18.000 KES');
    expect(unitLabel('per adult')).toBe('per adulto');
    expect(unitLabel('per meal')).toBe('per meal');
    const t = normaliseTour(tourDoc);
    expect(t.price).toEqual({ resident: 3000, nonResident: 6500, unit: 'per adult' });
  });
});

describe('trip items in Italian', () => {
  const tour = () => toSnapshot(normaliseTour(tourDoc));

  it('stores English for the team and shows Italian', () => {
    const snap = tour();
    expect(snap).toMatchObject({ title: 'Marine park snorkel', titleIt: 'Snorkeling nel parco marino', lengthLabel: 'Half day' });
    expect(snapTitle(snap)).toBe('Snorkeling nel parco marino');
    expect(snapLength(snap)).toBe('Mezza giornata');

    const stay = snapshotFor('stay', { _id: 'h1', name: 'Turtle Bay', pricePerNight: 18000 });
    expect(stay).toMatchObject({ title: 'Stay · Turtle Bay', rateLabel: 'KES 18,000 / night', rate: { amount: 18000, per: 'night' } });
    expect(snapTitle(stay)).toBe('Alloggio · Turtle Bay');
    expect(snapRate(stay)).toBe('18.000 KES / notte');
    expect(snapTitle(TRANSFERS.in)).toBe('Transfer dall’aeroporto');
    expect(snapLength(TRANSFERS.in)).toBe('Circa un’ora e mezza');
  });

  it('marks English listing names so screen readers read them in English', () => {
    expect(snapTitleLang(tour())).toBe('it');
    expect(snapTitleLang({ kind: 'tour', title: 'Gede ruins' })).toBe('en');
    expect(snapTitleLang(snapshotFor('stay', { _id: 'h', name: 'Turtle Bay' }))).toBe('it');
  });

  it('keeps an item saved before languages existed readable', () => {
    const old = { key: 'carhire:c1', kind: 'carhire', id: 'c1', title: 'Car hire · Prado', rateLabel: 'KES 9,000 / day', price: {} };
    expect(snapTitle(old)).toBe('Noleggio auto · Prado');
    expect(snapRate(old)).toBe('KES 9,000 / day');
  });

  it('labels days in Italian but sends English day labels and the language with the request', () => {
    let t = setDates(emptyTrip(), '2027-01-10', '2027-01-11');
    t = addItem(t, tour(), 0);
    expect(dayLabel(t, 0)).toBe('Giorno 1 · dom 10 gen');
    const p = toRequestPayload(t, { contact: { name: 'Giulia', email: 'g@example.com' } });
    expect(p.locale).toBe('it');
    expect(p.days[0].label).toBe('Day 1 · Sun 10 Jan');
    expect(p.days[0].items[0]).toMatchObject({ title: 'Marine park snorkel', listedPrice: 6500 });
    expect(tripSummary(t)).toContain('Date: dal 2027-01-10 al 2027-01-11');
    expect(tripSummary(t)).toContain('  - Snorkeling nel parco marino');
  });
});

describe('WhatsApp messages in Italian', () => {
  it('opens in Italian and links to the Italian page', () => {
    expect(generalMessage()).toBe('Ciao Exploring Watamu! Sto organizzando un viaggio a Watamu e ho una domanda.');
    expect(generalMessage('stay')).toBe('Ciao Exploring Watamu! Potete aiutarmi con la ricerca di un alloggio a Watamu?');
    expect(referenceMessage('EW-ABC234', 'quote')).toBe('Ciao Exploring Watamu! Ho una domanda sul mio preventivo EW-ABC234.');
    const stay = listingEnquiry('stay', { name: 'Turtle Bay', type: 'hotel', stars: 4, pricePerNight: 18000 });
    expect(stay).toContain('Mi interessa questo alloggio:\n*Turtle Bay* (Hotel · 4 stelle · 18.000 KES a notte)');
    expect(listingEnquiry('service', { name: 'Private chef', titleIt: 'Chef privato', price: 6000, pricingType: 'daily' })).toContain('*Chef privato* (6000 KES al giorno)');
  });

  it('describes the plan in Italian', () => {
    let t = setDates(emptyTrip({ stay: 'weekend' }), '2027-01-08', '2027-01-09');
    t = addItem(t, TRANSFERS.in, 0);
    t = addItem(t, toSnapshot(normaliseTour(tourDoc)), 0);
    t = addItem(t, snapshotFor('stay', { _id: 'h1', name: 'Turtle Bay' }), 'ideas');
    const text = tripMessage(t);
    expect(text).toContain('Ciao Exploring Watamu! Ecco il mio piano di viaggio a Watamu. Potete mandarmi un preventivo?');
    expect(text).toContain('Date: ven 8 gen 2027 – sab 9 gen 2027 (2 giorni)');
    expect(text).toContain('Viaggiatori: 2 adulti');
    expect(text).toContain('Giorno 1 · ven 8 gen: Transfer dall’aeroporto, Snorkeling nel parco marino');
    expect(text).toContain('Giorno 2 · sab 9 gen: giorno libero');
    expect(text).toContain('*Alloggio:* Turtle Bay');
  });
});

describe('personalisation in Italian', () => {
  it('writes the headline and pill in Italian, keeping the stored ids', () => {
    const profile = { vibes: ['ocean', 'romance'], companions: 'couple', stay: 'short' };
    expect(personalHeadline(profile)).toBe('Qualche giorno di acque turchesi e tramonti, in due.');
    expect(profileSummary(profile)).toBe('Mare +1 · In due · 3–4 giorni');
    expect(VIBES.map((v) => v.id)).toEqual(['ocean', 'slow', 'adventure', 'culture', 'romance', 'social']);
    expect(scoreExperience(normaliseTour(tourDoc), profile).reasons).toEqual(['Mare e barriera corallina', 'Ideale per le coppie']);
  });
});

describe('reviews and errors in Italian', () => {
  it('writes ratings the Italian way', () => {
    expect(formatAverage(4.75)).toBe('4,8');
    expect(reviewsLabel(1)).toBe('1 recensione');
    expect(reviewsLabel(12)).toBe('12 recensioni');
  });

  it('says the API’s refusals in Italian, never an English sentence', () => {
    expect(reviewError({ response: { status: 409, data: { error: 'You’ve already reviewed this for this trip.', code: 'ALREADY_REVIEWED' } } })).toBe('Hai già recensito questo viaggio.');
    expect(reviewError({ response: { status: 400, data: { error: 'Something new', code: 'NEW_CODE' } } })).toBe('Qualcosa è andato storto. Riprova.');
    expect(reviewError({})).toMatch(/^Non riusciamo a raggiungere/);
    expect(apiError({ response: { status: 401, data: { error: 'Invalid credentials.' } } }, 'fallback')).toBe('Email o password non corrette.');
    expect(apiError({ response: { status: 400, data: { error: 'Validation failed', issues: [{ message: 'Password must be at least 8 characters' }] } } }, 'fallback')).toBe('La password deve avere almeno 8 caratteri');
    expect(apiError({ response: { status: 400, data: { error: 'Some other problem' } } }, 'Riprova più tardi')).toBe('Riprova più tardi');
    expect(apiError({ response: { status: 429 } }, 'x')).toMatch(/^Hai inviato molte richieste/);
  });

  it('keeps the API’s own words on the English site, as before', () => {
    setLocale('en', { persist: false });
    expect(apiError({ response: { status: 401, data: { error: 'Invalid credentials.' } } }, 'fallback')).toBe('Invalid credentials.');
    expect(apiError({ response: { status: 400, data: { error: 'Validation failed', issues: [{ message: 'A' }, { message: 'B' }] } } }, 'x')).toBe('A · B');
    expect(apiError({}, 'Sign-in failed.')).toBe('Sign-in failed.');
  });
});
