import { useEffect, useMemo, useState } from 'react';
import { getSchedule, type ScheduleSession } from '../api/client';
import styles from './Page.module.css';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Schedule() {
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSchedule()
      .then(setSessions)
      .catch(() => setError('Не удалось загрузить программу'))
      .finally(() => setLoading(false));
  }, []);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => a.order - b.order),
    [sessions],
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Программа</h1>

      {loading && <p className={styles.placeholder}>Загрузка…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && sortedSessions.length === 0 && (
        <p className={styles.placeholder}>Сессии пока не добавлены</p>
      )}

      {!loading && !error && sortedSessions.length > 0 && (
        <ul className={styles.list}>
          {sortedSessions.map((session) => (
            <li key={session.id} className={styles.session}>
              <p className={styles.sessionTime}>
                {formatTime(session.startTime)} – {formatTime(session.endTime)}
              </p>
              <h2 className={styles.sessionTitle}>{session.title}</h2>
              {session.location && (
                <p className={styles.sessionMeta}>{session.location}</p>
              )}
              {session.speaker?.name && (
                <p className={styles.sessionMeta}>{session.speaker.name}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
