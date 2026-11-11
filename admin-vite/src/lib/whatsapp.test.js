import { describe, expect, it } from 'vitest';
import { formatWhatsAppNumber, normaliseWhatsAppNumber, parseWhatsAppNumber, whatsappLink } from '@/lib/whatsapp';
import { waNumber } from '@/lib/utils';

// The same number table as the API's and the website's: wa.me needs the full
// international number, and a guessed country opens a chat with a stranger.

describe('WhatsApp numbers', () => {
  it.each([
    ['+254 712 345 678', '254712345678'],
    ['254712345678', '254712345678'],
    ['0712 345 678', '254712345678'],
    ['0112345678', '254112345678'],
    ['+254 0712 345 678', '254712345678'],
    ['+44 7700 900123', '447700900123'],
    ['+44 (0)20 7946 0018', '442079460018'],
    ['0044 20 7946 0018', '442079460018'],
    ['+1 (202) 555-0123', '12025550123'],
  ])('uses %s as %s', (input, digits) => {
    expect(normaliseWhatsAppNumber(input)).toBe(digits);
  });

  it.each([[''], [null], ['12345'], ['+1234567890123456'], ['+254 712 345'], ['2025550123'], ['0412 345 678'], ['07700 900123'], ['+0712345678'], ['0712 345 678 (WhatsApp)'], ['0712345678 / 0722345678']])(
    'refuses %j',
    (input) => {
      expect(normaliseWhatsAppNumber(input)).toBeNull();
    }
  );

  it('says when a Kenyan local number was assumed', () => {
    expect(parseWhatsAppNumber('0772 123 456')).toEqual({ digits: '254772123456', local: true });
    expect(parseWhatsAppNumber('+256 772 123456')).toEqual({ digits: '256772123456', local: false });
  });

  it('is what the list screens’ quick WhatsApp buttons use', () => {
    expect(waNumber('+44 7700 900123')).toBe('447700900123');
    expect(waNumber('2025550123')).toBeNull(); // was "2025550123" (Egypt, +20) before
  });

  it('formats numbers and URL-encodes messages', () => {
    expect(formatWhatsAppNumber('254712345678')).toBe('+254 712 345 678');
    const link = whatsappLink('447700900123', 'Hi Ada,\nyour quote: KES 19,000 & more?');
    expect(link).toBe('https://wa.me/447700900123?text=Hi%20Ada%2C%0Ayour%20quote%3A%20KES%2019%2C000%20%26%20more%3F');
    expect(whatsappLink(null, 'x')).toBeNull();
  });
});
