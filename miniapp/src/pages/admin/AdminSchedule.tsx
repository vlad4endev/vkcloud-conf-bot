import { useEffect, useState } from 'react';
import {
  createScheduleSession,
  deleteScheduleSession,
  getApiErrorMessage,
  getSchedule,
  getSpeakers,
  updateScheduleSession,
} from '../../api/adminClient';

function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

type Session = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  speakerId: string | null;
};

export default function AdminSchedule() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [speakers, setSpeakers] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    startTime: '10:00',
    endTime: '11:00',
    title: '',
    speakerId: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const [s, sp] = await Promise.all([getSchedule(), getSpeakers()]);
      setSessions(s);
      setSpeakers(sp);
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    const payload = {
      startTime: form.startTime,
      endTime: form.endTime,
      title: form.title,
      speakerId: form.speakerId || undefined,
    };
    try {
      if (editingId) {
        await updateScheduleSession(editingId, {
          ...payload,
          speakerId: form.speakerId || null,
        });
      } else {
        await createScheduleSession(payload);
      }
      setForm({ startTime: '10:00', endTime: '11:00', title: '', speakerId: '' });
      setEditingId(null);
      setMessage('Сохранено');
      await load();
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  return (
    <div className="page">
      <h1 className="title">Расписание</h1>
      {message ? <p className={message === 'Сохранено' ? 'success' : 'error'}>{message}</p> : null}
      <div className="form">
        <input className="input" placeholder="Начало 10:00" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
        <input className="input" placeholder="Конец 11:00" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
        <input className="input" placeholder="Название" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <select
          className="input"
          value={form.speakerId}
          onChange={(e) => setForm((f) => ({ ...f, speakerId: e.target.value }))}
        >
          <option value="">Без спикера</option>
          {speakers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => void save()}>
          {editingId ? 'Обновить' : 'Добавить сессию'}
        </button>
      </div>
      <ul className="list" style={{ marginTop: 16 }}>
        {sessions.map((s) => (
          <li key={s.id} className="session">
            <p className="sessionTime">
              {formatTime(s.startTime)} — {formatTime(s.endTime)}
            </p>
            <p className="sessionTitle">{s.title}</p>
            <div className="actions" style={{ marginTop: 8, flexDirection: 'row' }}>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => {
                  setEditingId(s.id);
                  setForm({
                    startTime: formatTime(s.startTime),
                    endTime: formatTime(s.endTime),
                    title: s.title,
                    speakerId: s.speakerId ?? '',
                  });
                }}
              >
                Изменить
              </button>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => {
                  if (confirm('Удалить?')) void deleteScheduleSession(s.id).then(load);
                }}
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
