import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSpeakers, type Speaker } from '../api/client';

type LocationState = {
  notification?: string;
};

export default function Speakers() {
  const navigate = useNavigate();
  const location = useLocation();
  const notification = (location.state as LocationState | null)?.notification;
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSpeakers()
      .then(setSpeakers)
      .catch(() => setError('Не удалось загрузить спикеров'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1 className="title">Спикеры</h1>

      {notification && (
        <p className="notification" role="status">
          {notification}
        </p>
      )}

      {loading && <p className="placeholder">Загрузка…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && speakers.length === 0 && (
        <p className="placeholder">Спикеры скоро появятся</p>
      )}

      {!loading && !error && speakers.length > 0 && (
        <ul className="list">
          {speakers.map((speaker) => (
            <li key={speaker.id}>
              <button
                type="button"
                className="card"
                onClick={() => navigate(`/speakers/${speaker.id}`)}
              >
                {speaker.photoUrl ? (
                  <img
                    src={speaker.photoUrl}
                    alt=""
                    className="cardPhoto"
                  />
                ) : (
                  <span className="avatar" aria-hidden>
                    👤
                  </span>
                )}
                <span className="cardName">{speaker.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
