import { useNavigate } from 'react-router-dom';

export default function AdminContentHub() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="title">Контент</h1>
      <div className="hubActions">
        <button type="button" className="hubBtn" onClick={() => navigate('/admin/speakers')}>
          🎤 Спикеры
        </button>
        <button type="button" className="hubBtn" onClick={() => navigate('/admin/schedule')}>
          📅 Расписание
        </button>
        <button type="button" className="hubBtn" onClick={() => navigate('/admin/quiz')}>
          🎮 Квиз
        </button>
      </div>
    </div>
  );
}
