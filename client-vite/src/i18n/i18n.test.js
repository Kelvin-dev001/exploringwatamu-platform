// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bootLocale,
  followAddress,
  formatKES,
  formatNumber,
  getLocale,
  localeFromPath,
  localisePath,
  readPreference,
  richText,
  setLocale,
  stripLocale,
  switchLocale,
  translate,
  weekdayName,
} from '@/i18n';
import { hasItalianContent, pickText } from '@/i18n/listingContent';

// The language core: which language a URL is in, how the choice is
// remembered, and what happens when a message or a preference is missing.

const messages = {
  en: { hello: 'Hello {name}', items_one: '{count} item', items_other: '{count} items', onlyEnglish: 'Only in English', link: 'Read <b>this</b> now' },
  it: { hello: 'Ciao {name}', items_one: '{count} elemento', items_other: '{count} elementi', link: 'Leggi <b>questo</b> ora' },
};

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  setLocale('en', { persist: false });
});
afterEach(() => vi.restoreAllMocks());

describe('language URLs', () => {
  it('reads the language from the address — /it is Italian, everything else English', () => {
    expect(localeFromPath('/it')).toBe('it');
    expect(localeFromPath('/it/experiences/abc')).toBe('it');
    expect(localeFromPath('/it?plan=x')).toBe('it');
    expect(localeFromPath('/italy')).toBe('en');
    expect(localeFromPath('/experiences')).toBe('en');
  });

  it('turns any page into its other language, keeping query and hash', () => {
    expect(localisePath('/experiences', 'it')).toBe('/it/experiences');
    expect(localisePath('/', 'it')).toBe('/it');
    expect(localisePath('/?x=1', 'it')).toBe('/it?x=1');
    expect(localisePath('/it/hotels', 'en')).toBe('/hotels');
    expect(localisePath('/it', 'en')).toBe('/');
    expect(localisePath('/it/trip', 'it')).toBe('/it/trip');
    expect(stripLocale('/it/group-trips/reef')).toBe('/group-trips/reef');
  });
});

describe('remembering the language', () => {
  it('takes the language from the address and remembers it', () => {
    window.history.replaceState(null, '', '/it/hotels');
    expect(bootLocale()).toBe('it');
    expect(getLocale()).toBe('it');
    expect(document.documentElement.lang).toBe('it');
    expect(readPreference()).toBe('it');
  });

  it('opens an English link in Italian for someone who last used Italian', () => {
    localStorage.setItem('ew.locale', JSON.stringify('it'));
    window.history.replaceState(null, '', '/my-trips?x=1#top');
    expect(bootLocale()).toBe('it');
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/it/my-trips?x=1#top');
  });

  it('stays English with no preference (crawlers) and ignores junk in storage', () => {
    window.history.replaceState(null, '', '/hotels');
    expect(bootLocale()).toBe('en');
    expect(window.location.pathname).toBe('/hotels');
    localStorage.setItem('ew.locale', '"klingon"');
    expect(bootLocale()).toBe('en');
    localStorage.setItem('ew.locale', '{not json');
    expect(readPreference()).toBeNull();
    expect(bootLocale()).toBe('en');
  });

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    window.history.replaceState(null, '', '/it/trip');
    expect(bootLocale()).toBe('it');
    expect(readPreference()).toBeNull();
  });

  it('switches to the same page in the other language as a new history entry, and back follows the address', () => {
    window.history.replaceState(null, '', '/hotels?type=villa');
    bootLocale();
    const push = vi.spyOn(window.history, 'pushState');
    switchLocale('it');
    expect(push).toHaveBeenCalledWith(null, '', '/it/hotels?type=villa');
    expect(getLocale()).toBe('it');
    expect(readPreference()).toBe('it');

    window.history.replaceState(null, '', '/hotels?type=villa'); // as the browser does on Back
    followAddress();
    expect(getLocale()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('treats an unknown language as English', () => {
    setLocale('fr');
    expect(getLocale()).toBe('en');
  });
});

describe('messages', () => {
  it('fills placeholders and picks plural forms', () => {
    expect(translate(messages, 'it', 'hello', { name: 'Giulia' })).toBe('Ciao Giulia');
    expect(translate(messages, 'it', 'items', { count: 1 })).toBe('1 elemento');
    expect(translate(messages, 'it', 'items', { count: 1000000 })).toBe('1.000.000 elementi'); // Italian "many" falls back to "other"
    expect(translate(messages, 'en', 'items', { count: 1250 })).toBe('1,250 items');
  });

  it('falls back to English, then to the key, never to a blank', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(translate(messages, 'it', 'onlyEnglish')).toBe('Only in English');
    expect(translate(messages, 'it', 'missingEverywhere')).toBe('missingEverywhere');
    expect(translate(messages, 'it', 'genericError')).toBe('Qualcosa è andato storto. Riprova.'); // shared messages
    expect(translate(messages, 'en', 'hello')).toBe('Hello {name}'); // a missing value stays visible
  });

  it('turns simple markup into elements, without HTML', () => {
    const out = richText(translate(messages, 'it', 'link'), { b: (text) => ({ type: 'b', text }) });
    expect(out.props.children).toEqual(['Leggi ', { type: 'b', text: 'questo' }, ' ora']);
    expect(richText('plain <i>unknown</i> tag')).toEqual(expect.objectContaining({ props: { children: ['plain ', 'unknown', ' tag'] } }));
  });
});

describe('formatting', () => {
  it('writes prices and numbers the language’s way', () => {
    expect(formatKES(18000.4, 'en')).toBe('KES 18,000');
    expect(formatKES(18000.4, 'it')).toBe('18.000 KES');
    expect(formatNumber(4.5, 'it')).toBe('4,5');
  });

  it('says English weekday names from listings in Italian', () => {
    expect(weekdayName('Monday', 'it')).toBe('lunedì');
    expect(weekdayName('sun', 'it')).toBe('domenica');
    expect(weekdayName('Monday', 'en')).toBe('Monday');
    expect(weekdayName('Holidays', 'it')).toBe('Holidays');
  });
});

describe('listing text', () => {
  const tour = { name: 'Marine park snorkel', description: 'Reef and turtles', titleIt: 'Snorkeling nel parco marino', descriptionIt: '   ' };

  it('uses the team’s Italian when there is some, English otherwise — and says which', () => {
    expect(pickText(tour, 'title', 'it', tour.name)).toEqual({ text: 'Snorkeling nel parco marino', lang: 'it' });
    expect(pickText(tour, 'description', 'it')).toEqual({ text: 'Reef and turtles', lang: 'en' });
    expect(pickText(tour, 'title', 'en', tour.name)).toEqual({ text: 'Marine park snorkel', lang: 'en' });
  });

  it('counts a listing as translated only with an Italian description', () => {
    expect(hasItalianContent(tour)).toBe(false); // a title alone isn't a translation
    expect(hasItalianContent({ descriptionIt: 'Barriera' })).toBe(true);
    expect(hasItalianContent({ shortDescriptionIt: 'Due notti' })).toBe(true);
  });
});
