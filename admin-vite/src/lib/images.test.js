import { describe, expect, it } from 'vitest';
import { cloudinarySrcSet, cloudinaryUrl, isCloudinary } from './images.js';

const STORED = 'https://res.cloudinary.com/exploringwatamu/image/upload/v1712345678/tours/abc123.jpg';

describe('cloudinaryUrl', () => {
  it('adds a resize + automatic format/quality step to stored upload URLs', () => {
    expect(cloudinaryUrl(STORED, 640)).toBe('https://res.cloudinary.com/exploringwatamu/image/upload/f_auto,q_auto,c_limit,w_640/v1712345678/tours/abc123.jpg');
  });

  it('works for URLs without a version segment', () => {
    expect(cloudinaryUrl('https://res.cloudinary.com/demo/image/upload/tours/a.jpg', 320)).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_320/tours/a.jpg');
  });

  it('leaves everything else alone', () => {
    for (const url of [
      '/images/hero.webp',
      'https://images.example.com/a.jpg',
      'https://res.cloudinary.com/demo/video/upload/v1/clip.mp4',
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_100/v1/a.jpg', // already transformed
      'blob:http://localhost:5173/7f3e',
      '',
      null,
      undefined,
    ]) {
      expect(cloudinaryUrl(url, 640)).toBe(url);
    }
    expect(cloudinaryUrl(STORED, 0)).toBe(STORED);
  });

  it('never changes the stored URL itself', () => {
    const stored = STORED;
    cloudinaryUrl(stored, 640);
    expect(stored).toBe('https://res.cloudinary.com/exploringwatamu/image/upload/v1712345678/tours/abc123.jpg');
  });
});

describe('cloudinarySrcSet', () => {
  it('lists the standard widths up to the maximum', () => {
    expect(cloudinarySrcSet(STORED, 640).split(', ')).toEqual([
      `${cloudinaryUrl(STORED, 320)} 320w`,
      `${cloudinaryUrl(STORED, 480)} 480w`,
      `${cloudinaryUrl(STORED, 640)} 640w`,
    ]);
  });

  it('is undefined for other images (the browser just uses src)', () => {
    expect(cloudinarySrcSet('/images/hero.webp')).toBeUndefined();
    expect(isCloudinary('https://res.cloudinary.com/demo/image/upload/a.jpg')).toBe(true);
  });
});
