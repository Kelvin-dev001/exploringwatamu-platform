import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext'; // <-- Import provider
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AdminAuthProvider> {/* <-- Wrap the app in the provider */}
      <App />
    </AdminAuthProvider>
  </React.StrictMode>
);