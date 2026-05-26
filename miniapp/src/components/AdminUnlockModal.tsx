import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/adminClient';
import { useAdmin } from '../context/AdminContext';

export default function AdminUnlockModal() {
  const { showUnlockModal, closeUnlockModal, unlock } = useAdmin();
  const navigate = useNavigate();
  const [codeWord, setCodeWord] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMaxBridge = Boolean(
    window.WebApp?.initData?.trim() || window.MaxBridge?.initData?.trim(),
  );

  if (!showUnlockModal) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await unlock(codeWord.trim());
      setCodeWord('');
      navigate('/admin');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="admin-unlock-title">
      <div className="modalCard">
        <h2 id="admin-unlock-title" className="title">
          Режим организатора
        </h2>
        <p className="text" style={{ marginTop: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Введите кодовое слово. Мини-приложение переключится в админ-режим.
        </p>
        {!hasMaxBridge ? (
          <p className="error" style={{ marginTop: 12 }}>
            Админ-режим в MAX работает только внутри приложения MAX. В обычном браузере
            используйте веб-админку:{' '}
            <a href="/panel/login" style={{ color: 'var(--color-accent)' }}>
              /panel/login
            </a>
          </p>
        ) : null}
        <form className="form" style={{ marginTop: 16 }} onSubmit={handleSubmit}>
          <input
            className="input"
            type="password"
            value={codeWord}
            onChange={(e) => setCodeWord(e.target.value)}
            placeholder="Кодовое слово"
            required
            autoComplete="off"
          />
          {error ? <p className="error">{error}</p> : null}
          <div className="actions">
            <button type="submit" className="btn" disabled={loading || !hasMaxBridge}>
              {loading ? 'Проверка…' : 'Включить админ-режим'}
            </button>
            <button type="button" className="btn btnSecondary" onClick={closeUnlockModal}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
