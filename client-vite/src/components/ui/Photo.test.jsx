// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Photo from './Photo';

const STORED = 'https://res.cloudinary.com/demo/image/upload/v1/tours/reef.jpg';
const fallback = <span>illustration</span>;

afterEach(cleanup);

describe('Photo', () => {
  it('asks Cloudinary for right-sized versions, lazily', () => {
    render(<Photo src={STORED} alt="Reef" sizes="50vw" max={640} fallback={fallback} />);
    const img = screen.getByAltText('Reef');
    expect(img.getAttribute('src')).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/v1/tours/reef.jpg');
    expect(img.getAttribute('srcset')).toMatch(/w_320\/v1\/tours\/reef\.jpg 320w, .*w_640\/v1\/tours\/reef\.jpg 640w$/);
    expect(img.getAttribute('sizes')).toBe('50vw');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('loads the main photo of a page first', () => {
    render(<Photo src={STORED} alt="Hero" priority />);
    const img = screen.getByAltText('Hero');
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });

  it('falls back to the original upload, then to the illustration', () => {
    render(<Photo src={STORED} alt="Reef" fallback={fallback} />);
    fireEvent.error(screen.getByAltText('Reef'));
    const original = screen.getByAltText('Reef');
    expect(original.getAttribute('src')).toBe(STORED);
    expect(original.getAttribute('srcset')).toBeNull();

    fireEvent.error(original);
    expect(screen.queryByAltText('Reef')).toBeNull();
    expect(screen.getByText('illustration')).toBeTruthy();
  });

  it('uses other images as they are, and the fallback when there is none', () => {
    render(<Photo src="/images/hero.webp" alt="Local" fallback={fallback} />);
    expect(screen.getByAltText('Local').getAttribute('src')).toBe('/images/hero.webp');
    expect(screen.getByAltText('Local').getAttribute('srcset')).toBeNull();
    cleanup();

    render(<Photo src={null} alt="None" fallback={fallback} />);
    expect(screen.getByText('illustration')).toBeTruthy();
  });

  it('starts again from the resized version when the photo changes', () => {
    const { rerender } = render(<Photo src={STORED} alt="Gallery" fallback={fallback} />);
    fireEvent.error(screen.getByAltText('Gallery'));
    rerender(<Photo src="https://res.cloudinary.com/demo/image/upload/v1/tours/dhow.jpg" alt="Gallery" fallback={fallback} />);
    expect(screen.getByAltText('Gallery').getAttribute('src')).toMatch(/f_auto,q_auto,c_limit,w_960\/v1\/tours\/dhow\.jpg$/);
  });
});
