import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@entry'; // resolved by vite.config.js (App.jsx normally, AppBaseline.jsx in baseline mode)
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
