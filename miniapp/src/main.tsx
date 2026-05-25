import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';

const rootEl = document.getElementById('root');

if (!rootEl) {
  document.body.innerHTML =
    '<p style="padding:16px;font-family:sans-serif">Ошибка: не найден #root</p>';
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary title="VK Cloud Conf">
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
