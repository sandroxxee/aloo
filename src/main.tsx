import { Buffer } from 'buffer';
window.Buffer = Buffer;
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ToastProvider } from './components/Toast.tsx';
import './index.css';

// Intercept all fetch requests to automatically inject custom Gemini API key safely
const originalFetch = window.fetch;
if (typeof originalFetch === 'function') {
  const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request)?.url);
      if (url && typeof url === 'string' && url.includes('/api/')) {
        const customKey = localStorage.getItem('truck_miner_google_ai_key');
        if (customKey) {
          init = init || {};
          init.headers = init.headers || {};
          if (init.headers instanceof Headers) {
            init.headers.set('x-gemini-api-key', customKey);
          } else if (Array.isArray(init.headers)) {
            init.headers.push(['x-gemini-api-key', customKey]);
          } else {
            (init.headers as Record<string, string>)['x-gemini-api-key'] = customKey;
          }
        }
      }
    } catch (e) {}
    return originalFetch.call(window, input, init);
  };

  try {
    window.fetch = customFetch;
  } catch (e) {
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true
      });
    } catch (err) {
      console.warn('Could not override window.fetch:', err);
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
