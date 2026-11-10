import { Component } from 'react';
import { buttonClasses } from '@/components/ui/button';

/**
 * Last line of defence: if rendering crashes, show a way back instead of a
 * blank page (which is what visitors got when a browser change broke an
 * effect in Layout). The trip and preferences live in localStorage, so a
 * reload loses nothing.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[app] page crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-sand-50 px-6 text-center">
        <div className="max-w-md" role="alert">
          <p className="font-display text-3xl text-ocean-900">Something went wrong on this page</p>
          <p className="mt-3 text-ocean-900/70">Your trip is saved on this device. Reload the page to carry on.</p>
          <button type="button" onClick={() => window.location.reload()} className={buttonClasses({ className: 'mt-6' })}>
            Reload
          </button>
          <p className="mt-4 text-sm">
            <a href="/" className="font-semibold text-ocean-900 underline">Back to the homepage</a>
          </p>
        </div>
      </main>
    );
  }
}
