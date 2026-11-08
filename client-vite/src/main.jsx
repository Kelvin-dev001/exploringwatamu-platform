import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { VibeProfileProvider } from './context/VibeProfileContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <VibeProfileProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </VibeProfileProvider>
    </AuthProvider>
  </React.StrictMode>
);