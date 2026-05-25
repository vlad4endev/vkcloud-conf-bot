import { useEffect, useMemo, useState } from 'react';
import { getSchedule, type ScheduleSession } from '../api/client';

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
    <div className="page">
      <h1 className="title">Программа</h1>

      {loading && <p className="placeholder">Загрузка…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && sortedSessions.length === 0 && (
        <p className="placeholder">Сессии пока не добавлены</p>
      )}

      {!loading && !error && sortedSessions.length > 0 && (
        <ul className="list">
          {sortedSessions.map((session) => (
            <li key={session.id} className="session">
              <p className="sessionTime">
                {formatTime(session.startTime)} – {formatTime(session.endTime)}
              </p>
              <h2 className="sessionTitle">{session.title}</h2>
              {session.location && (
                <p className="sessionMeta">{session.location}</p>
              )}
              {session.speaker?.name && (
                <p className="sessionMeta">{session.speaker.name}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
