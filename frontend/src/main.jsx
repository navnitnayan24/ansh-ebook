window.global = window;
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('[SW] Registered:', reg.scope);

    const handleAutoReload = () => {
      // Prevent infinite loops if activation is buggy
      const lastReload = sessionStorage.getItem('last-sw-reload');
      const now = Date.now();
      if (!lastReload || (now - parseInt(lastReload)) > 5000) {
        sessionStorage.setItem('last-sw-reload', now.toString());
        window.location.reload();
      }
    };

    // When a new service worker takes control, reload the page to get fresh assets
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            handleAutoReload();
          }
        });
      }
    });

    // Also reload if a new SW takes control of this tab (Auto-Update)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      handleAutoReload();
    });
  });
}
