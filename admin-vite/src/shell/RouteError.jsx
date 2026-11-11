import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { Button } from '@/ui';
import { reportError } from '@/lib/monitoring';
import { isStaleBuildError, RELOADED_KEY as RELOADED } from './staleBuild';

/** The router's error screen: reports the crash and offers a way back. */
export default function RouteError() {
  const error = useRouteError();
  const stale = isStaleBuildError(error);

  useEffect(() => {
    // A new version was deployed: reload once, quietly.
    if (stale) {
      let already = false;
      try {
        already = sessionStorage.getItem(RELOADED) === '1';
        sessionStorage.setItem(RELOADED, '1');
      } catch {
        /* storage blocked: fall through to the button */
      }
      if (!already) {
        window.location.reload();
        return;
      }
    }
    reportError(error instanceof Error ? error : new Error(String(error?.statusText || error?.message || error)));
  }, [error, stale]);

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6 text-center">
      <div className="max-w-md" role="alert">
        <p className="text-xl font-bold text-ink">{stale ? 'A new version of the admin is available' : 'Something went wrong on this screen'}</p>
        <p className="mt-2 text-sm text-muted">
          {stale ? 'Reload to get it — nothing you saved is lost.' : 'Reload to try again. If it keeps happening, tell the team what you were doing.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button variant="secondary" onClick={() => window.location.assign('/admin/dashboard')}>Dashboard</Button>
        </div>
      </div>
    </main>
  );
}
