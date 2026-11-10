import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import axios from 'axios';
import App from './App.jsx';
import { installRetry } from './lib/http.js';
import { AuthProvider } from './context/AuthContext.jsx';
import { VibeProfileProvider } from './context/VibeProfileContext.jsx';
import { TripProvider } from './context/TripContext.jsx';

// Static head tags exist for crawlers and link previews that don't run JS;
// once the app runs, each page renders its own (see components/seo/Seo.jsx).
document.querySelectorAll('head [data-static]').forEach((el) => el.remove());

// Retry GETs a couple of times while the free-tier API wakes up (see lib/http.js).
installRetry(axios);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <VibeProfileProvider>
        <TripProvider>
          <BrowserRouter>
            <MotionConfig reducedMotion="user">
              <App />
            </MotionConfig>
          </BrowserRouter>
        </TripProvider>
      </VibeProfileProvider>
    </AuthProvider>
  </React.StrictMode>
);