import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { LazyMotion, MotionConfig } from 'motion/react';
import axios from 'axios';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { installRetry } from './lib/http.js';
import { initMonitoring } from './lib/monitoring.js';
import { bootLocale } from './i18n';
import LocaleRouter from './i18n/LocaleRouter.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { VibeProfileProvider } from './context/VibeProfileContext.jsx';
import { TripProvider } from './context/TripContext.jsx';

// English or Italian, from the address (or the last language used here) —
// decided before anything renders, so the first paint is already right.
bootLocale();

// Static head tags exist for crawlers and link previews that don't run JS;
// once the app runs, each page renders its own (see components/seo/Seo.jsx).
document.querySelectorAll('head [data-static]').forEach((el) => el.remove());

// Retry GETs a couple of times while the free-tier API wakes up (see lib/http.js).
installRetry(axios);

// Error monitoring, only when VITE_SENTRY_DSN is set (loads after the page).
initMonitoring();

// Animations: components use the light <m.*> elements; the engine (~40 KB
// gzip) arrives in its own chunk after first paint. strict: a full <motion.*>
// component would pull the whole library back into the first load, so it throws.
const motionFeatures = () => import('./lib/motionFeatures.js').then((mod) => mod.default);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <VibeProfileProvider>
          <TripProvider>
            <LocaleRouter>
              <LazyMotion features={motionFeatures} strict>
                <MotionConfig reducedMotion="user">
                  <App />
                </MotionConfig>
              </LazyMotion>
            </LocaleRouter>
          </TripProvider>
        </VibeProfileProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);