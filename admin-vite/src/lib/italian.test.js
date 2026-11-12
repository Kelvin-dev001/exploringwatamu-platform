import { describe, expect, it } from 'vitest';
import { replyLanguageOf, tripReplyMessage } from '@/lib/tripReplies';
import { appendItalian, emptyItalian, italianFrom, italianProblems } from '@/forms/italian';

// Italian in the admin portal: replies to a traveller who used the Italian
// website start in Italian (the admin can switch), and listings carry
// optional Italian text that is always sent so a cleared field clears.

const request = (overrides = {}) => ({
  reference: 'EW-ABC234',
  status: 'new',
  locale: 'it',
  contact: { name: 'Giulia Rossi', phone: '+393331234567' },
  adults: 2,
  children: 1,
  arrival: '2027-01-10T00:00:00.000Z',
  departure: '2027-01-12T00:00:00.000Z',
  ...overrides,
});

describe('WhatsApp replies in the traveller’s language', () => {
  it('starts in Italian for an Italian request', () => {
    expect(replyLanguageOf(request())).toBe('it');
    expect(tripReplyMessage(request())).toBe(
      'Ciao Giulia, siamo Exploring Watamu, ti scriviamo per la tua richiesta di viaggio EW-ABC234 (10 gen – 12 gen 2027, 2 adulti, 1 bambino). Grazie per aver organizzato con noi il tuo viaggio a Watamu! Stiamo verificando la disponibilità e ti invieremo presto il preventivo. Vuoi aggiungere o chiedere qualcosa?'
    );
  });

  it('writes the quote in Italian amounts and dates', () => {
    const r = request({ status: 'quoted', quote: { total: 145000, validUntil: '2027-01-01T00:00:00.000Z' } });
    expect(tripReplyMessage(r)).toBe(
      'Ciao Giulia, siamo Exploring Watamu, ti scriviamo per la tua richiesta di viaggio EW-ABC234. Il tuo preventivo è pronto: 145.000 KES per l’intero viaggio, valido fino al 1 gennaio. Hai domande o vuoi che cambiamo qualcosa?'
    );
  });

  it('can be written in English instead, and older requests are English', () => {
    expect(tripReplyMessage(request(), 'confirmed', 'en')).toMatch(/^Hi Giulia, this is Exploring Watamu\. Thank you for confirming/);
    expect(replyLanguageOf(request({ locale: undefined }))).toBe('en');
    expect(tripReplyMessage(request({ locale: undefined }))).toMatch(/^Hi Giulia, this is Exploring Watamu about your trip request/);
  });

  it('has an Italian version of every template', () => {
    for (const t of ['received', 'question', 'quote', 'confirmed', 'followUp']) expect(tripReplyMessage(request(), t, 'it')).toMatch(/^Ciao Giulia, siamo Exploring Watamu/);
    expect(tripReplyMessage(request({ arrival: null, departure: null, contact: { name: '' } }), 'question', 'it')).toMatch(/^Ciao, siamo Exploring Watamu, .*\(date flessibili, 2 adulti, 1 bambino\)/);
  });
});

describe('optional Italian listing text', () => {
  const FIELDS = ['titleIt', 'descriptionIt'];

  it('loads blanks for listings without it, and sends every field (blank clears)', () => {
    expect(emptyItalian(FIELDS)).toEqual({ titleIt: '', descriptionIt: '' });
    expect(italianFrom({ titleIt: 'Snorkeling' }, FIELDS)).toEqual({ titleIt: 'Snorkeling', descriptionIt: '' });
    const fd = new FormData();
    appendItalian(fd, { titleIt: 'Snorkeling', descriptionIt: '' }, FIELDS);
    expect([...fd.entries()]).toEqual([['titleIt', 'Snorkeling'], ['descriptionIt', '']]);
  });

  it('flags text over the API’s limits before saving', () => {
    expect(italianProblems({ titleIt: 'x'.repeat(200) }, FIELDS)).toEqual({});
    expect(italianProblems({ titleIt: 'x'.repeat(201) }, FIELDS).titleIt).toMatch(/at most 200 characters/);
  });
});
