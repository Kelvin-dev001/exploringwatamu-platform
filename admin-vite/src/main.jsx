import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ToastProvider } from '@/ui';
import { initTheme } from '@/lib/theme';

initTheme(); // apply light/dark before first paint

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AdminAuthProvider>
  </React.StrictMode>
);
