import { useNavigate } from 'react-router-dom';

export default function ScheduleHub() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="title">Программа, карта, спикеры</h1>

      <div className="hubActions">
        <button
          type="button"
          className="hubBtn"
          onClick={() => navigate('/map')}
        >
          🗺 Карта
        </button>
        <button
          type="button"
          className="hubBtn"
          onClick={() => navigate('/schedule')}
        >
          📅 Программа
        </button>
        <button
          type="button"
          className="hubBtn"
          onClick={() => navigate('/speakers')}
        >
          🎤 Спикеры
        </button>
      </div>
    </div>
  );
}
