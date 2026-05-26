import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function AdminMore() {
  const navigate = useNavigate();
  const { exitAdminMode } = useAdmin();

  return (
    <div className="page">
      <h1 className="title">Ещё</h1>
      <div className="hubActions">
        <button type="button" className="hubBtn" onClick={() => navigate('/admin/questions')}>
          ❓ Вопросы участников
        </button>
        <button type="button" className="hubBtn" onClick={() => navigate('/admin/feedback')}>
          💬 Отзывы
        </button>
        <button type="button" className="hubBtn" onClick={() => navigate('/admin/notify')}>
          📣 Рассылка
        </button>
        <button type="button" className="hubBtn" onClick={() => navigate('/admin/settings')}>
          ⚙️ Настройки
        </button>
        <button
          type="button"
          className="hubBtn"
          onClick={() => {
            exitAdminMode();
            navigate('/');
          }}
        >
          🚪 Выйти из админ-режима
        </button>
      </div>
    </div>
  );
}
