import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpeakers, type Speaker } from '../api/client';
import styles from './Page.module.css';

export default function Speakers() {
  const navigate = useNavigate();
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
    <div className={styles.page}>
      <h1 className={styles.title}>Спикеры</h1>

      {loading && <p className={styles.placeholder}>Загрузка…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && speakers.length === 0 && (
        <p className={styles.placeholder}>Спикеры скоро появятся</p>
      )}

      {!loading && !error && speakers.length > 0 && (
        <ul className={styles.list}>
          {speakers.map((speaker) => (
            <li key={speaker.id}>
              <button
                type="button"
                className={styles.card}
                onClick={() => navigate(`/speakers/${speaker.id}`)}
              >
                {speaker.photoUrl ? (
                  <img
                    src={speaker.photoUrl}
                    alt=""
                    className={styles.cardPhoto}
                  />
                ) : (
                  <span className={styles.avatar} aria-hidden>
                    👤
                  </span>
                )}
                <span className={styles.cardName}>{speaker.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
