// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { VibeProfileProvider } from '@/context/VibeProfileContext';
import { TripProvider } from '@/context/TripContext';

// Chrome 155+ returns a Promise from window.scrollTo(). Layout used to return
// that from an effect, React treated it as the cleanup, and the first in-app
// navigation threw "destroy is not a function" and blanked the whole site.

function Site() {
  return (
    <AuthProvider>
      <VibeProfileProvider initialRecord={{ version: 1, status: 'skipped', profile: null }}>
        <TripProvider>
          <MemoryRouter initialEntries={['/']}>
            <Layout>
              <Routes>
                <Route path="/" element={<Link to="/next">Go to the next page</Link>} />
                <Route path="/next" element={<p>Next page content</p>} />
              </Routes>
            </Layout>
          </MemoryRouter>
        </TripProvider>
      </VibeProfileProvider>
    </AuthProvider>
  );
}

describe('Layout', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn(() => Promise.resolve()); // modern-browser behaviour
  });
  afterEach(cleanup);

  it('survives navigation when scrollTo returns a Promise', async () => {
    render(<Site />);
    await act(async () => {
      fireEvent.click(screen.getByText('Go to the next page'));
    });
    expect(await screen.findByText('Next page content')).toBeTruthy();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});

describe('ErrorBoundary', () => {
  afterEach(cleanup);

  it('shows a way back instead of a blank page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Broken = () => {
      throw new Error('boom');
    };
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    expect(screen.getByRole('alert').textContent).toMatch(/Something went wrong/);
    expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy();
    vi.restoreAllMocks();
  });
});
