import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from './components/AppErrorBoundary.tsx';
import { normalizeMaxLaunchUrl, notifyWebAppReady } from './lib/webApp.ts';
import './index.css';

normalizeMaxLaunchUrl();
notifyWebAppReady();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
