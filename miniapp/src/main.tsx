import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';

const rootEl = document.getElementById('root');

if (!rootEl) {
  document.body.innerHTML =
    '<p style="padding:16px;font-family:sans-serif;color:#e8edf5;background:#0a0f1e">Ошибка: не найден #root</p>';
} else {
  createRoot(rootEl).render(
    <ErrorBoundary title="VK Cloud Conf">
      <App />
    </ErrorBoundary>,
  );
}
