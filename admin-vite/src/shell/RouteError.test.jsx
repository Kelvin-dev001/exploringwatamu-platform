// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

vi.mock('@/lib/monitoring', () => ({ reportError: vi.fn() }));
const { reportError } = await import('@/lib/monitoring');
const { default: RouteError } = await import('./RouteError');
const { isStaleBuildError } = await import('./staleBuild');

// A route whose element throws, with RouteError as its error screen.
function renderCrash(error) {
  const Boom = () => {
    throw error;
  };
  const router = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <RouteError /> }]);
  return render(<RouterProvider router={router} />);
}

describe('RouteError', () => {
  const reload = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  function stubLocation() {
    vi.stubGlobal('location', { ...window.location, reload, assign: vi.fn() });
  }

  it('reports a crash and offers a reload', async () => {
    stubLocation();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Cannot read properties of undefined');
    renderCrash(error);

    expect((await screen.findByRole('alert')).textContent).toMatch(/Something went wrong/);
    expect(reportError).toHaveBeenCalledWith(error);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads once by itself when a deploy replaced the screen files', async () => {
    stubLocation();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCrash(new TypeError('Failed to fetch dynamically imported module: /assets/Team-abc.js'));

    expect((await screen.findByRole('alert')).textContent).toMatch(/new version/);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reportError).not.toHaveBeenCalled();
  });

  it('does not reload in a loop if the files are still missing after a reload', async () => {
    stubLocation();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    sessionStorage.setItem('ew:reloaded-for-update', '1');
    renderCrash(new TypeError('Importing a module script failed.'));

    expect((await screen.findByRole('alert')).textContent).toMatch(/new version/);
    expect(reload).not.toHaveBeenCalled();
    expect(reportError).toHaveBeenCalled();
  });

  it('recognises the browsers’ stale-build messages', () => {
    expect(isStaleBuildError(new Error('Failed to fetch dynamically imported module: x'))).toBe(true);
    expect(isStaleBuildError(new Error('error loading dynamically imported module'))).toBe(true);
    expect(isStaleBuildError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isStaleBuildError(new Error('x is undefined'))).toBe(false);
    expect(isStaleBuildError(new TypeError('Failed to fetch'))).toBe(false); // an ordinary network error
  });
});
