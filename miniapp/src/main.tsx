import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from './components/AppErrorBoundary.tsx';
import { normalizeMaxLaunchUrl } from './lib/webApp.ts';
import './index.css';

declare global {
  interface Window {
    __MINIAPP_MOUNTED__?: boolean;
  }
}

normalizeMaxLaunchUrl();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('#root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);

window.__MINIAPP_MOUNTED__ = true;
