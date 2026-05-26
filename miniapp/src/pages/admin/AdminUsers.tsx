import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage, getUsers, updateUser } from '../../api/adminClient';

type User = {
  id: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  maxUserId: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', isVerified: false });
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await getUsers(search.trim() || undefined));
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  async function save() {
    if (!editing) return;
    try {
      await updateUser(editing.id, form);
      setEditing(null);
      setMessage('Сохранено');
      await load();
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  async function toggleVerified(user: User) {
    try {
      await updateUser(user.id, { isVerified: !user.isVerified });
      await load();
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  return (
    <div className="page">
      <h1 className="title">Участники</h1>
      <input
        className="input"
        placeholder="Поиск…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {message ? <p className={message === 'Сохранено' ? 'success' : 'error'}>{message}</p> : null}
      {loading ? (
        <p className="placeholder">Загрузка…</p>
      ) : (
        <ul className="list">
          {users.map((user) => (
            <li key={user.id} className="session">
              <p className="sessionTitle">{user.fullName}</p>
              <p className="sessionMeta">{user.email}</p>
              <div className="actions" style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => void toggleVerified(user)}
                >
                  {user.isVerified ? '✓ Подтверждён' : 'Не подтверждён'}
                </button>
                <button
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => {
                    setEditing(user);
                    setForm({
                      fullName: user.fullName,
                      email: user.email,
                      isVerified: user.isVerified,
                    });
                  }}
                >
                  Изменить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <div className="modalOverlay">
          <div className="modalCard">
            <h2 className="title">Редактирование</h2>
            <div className="form" style={{ marginTop: 12 }}>
              <input
                className="input"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="ФИО"
              />
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
              />
              <label className="text" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.isVerified}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isVerified: e.target.checked }))
                  }
                />
                Подтверждён
              </label>
              <div className="actions">
                <button type="button" className="btn" onClick={() => void save()}>
                  Сохранить
                </button>
                <button type="button" className="btn btnSecondary" onClick={() => setEditing(null)}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
