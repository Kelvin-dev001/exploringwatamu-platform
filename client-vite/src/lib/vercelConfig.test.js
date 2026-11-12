import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fileFor } from '../../seo/plugin.js';

// Vercel's routing, which no local server reproduces (vite preview falls back
// to index.html on its own). Every page without its own built file — My
// bookings, reset password, email confirmation, listing pages — reaches the
// app through these rewrites. With cleanUrls on, Vercel only finds a
// destination written without ".html"; "/index.html" answered NOT_FOUND for
// all of those pages when opened from a link.

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../vercel.json'), 'utf8'));
const destinations = config.rewrites.map((r) => r.destination);

describe('vercel.json', () => {
  it('writes rewrite destinations without .html while cleanUrls is on', () => {
    expect(config.cleanUrls).toBe(true);
    for (const d of destinations) expect(d).not.toMatch(/\.html$/);
  });

  it('sends Italian pages to the Italian shell and everything else to the English one', () => {
    expect(config.rewrites).toEqual([
      { source: '/it/(.*)', destination: '/it' },
      { source: '/(.*)', destination: '/' },
    ]);
    // The shells the build writes for those two addresses.
    expect([fileFor('/', 'it'), fileFor('/', 'en')]).toEqual(['it.html', 'index.html']);
  });
});
