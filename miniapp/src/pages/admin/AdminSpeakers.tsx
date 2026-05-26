import { useEffect, useState } from 'react';
import {
  createSpeaker,
  deleteSpeaker,
  getApiErrorMessage,
  getSpeakers,
  updateSpeaker,
} from '../../api/adminClient';

type Speaker = { id: string; name: string; bio: string };

export default function AdminSpeakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      setSpeakers(await getSpeakers());
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    try {
      if (editingId) {
        await updateSpeaker(editingId, { name, bio });
      } else {
        await createSpeaker({ name, bio });
      }
      setName('');
      setBio('');
      setEditingId(null);
      setMessage('Сохранено');
      await load();
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  return (
    <div className="page">
      <h1 className="title">Спикеры</h1>
      {message ? <p className={message === 'Сохранено' ? 'success' : 'error'}>{message}</p> : null}
      <div className="form">
        <input className="input" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="textarea" placeholder="Биография" value={bio} onChange={(e) => setBio(e.target.value)} />
        <button type="button" className="btn" onClick={() => void save()}>
          {editingId ? 'Обновить' : 'Добавить'}
        </button>
      </div>
      <ul className="list" style={{ marginTop: 16 }}>
        {speakers.map((s) => (
          <li key={s.id} className="session">
            <p className="sessionTitle">{s.name}</p>
            <p className="sessionMeta">{s.bio.slice(0, 120)}…</p>
            <div className="actions" style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => {
                  setEditingId(s.id);
                  setName(s.name);
                  setBio(s.bio);
                }}
              >
                Изменить
              </button>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => {
                  if (confirm('Удалить?')) {
                    void deleteSpeaker(s.id).then(load);
                  }
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
