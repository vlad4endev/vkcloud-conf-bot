import ActionIcon from '../components/ActionIcon';
import { ListCardActions, ListCardMeta } from '../components/mobileList';
import { useCallback, useEffect, useState } from 'react';
import { deleteUser, getUsers, updateUser } from '../api/client';
import type { User } from '../api/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  SearchInput,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { downloadAdminExport } from '../lib/download';
import { formatDateTime, getErrorMessage } from '../lib/format';

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', isVerified: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await getUsers(debouncedSearch || undefined));
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(user: User) {
    setEditing(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      isVerified: user.isVerified,
    });
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await updateUser(editing.id, form);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast('Участник обновлён', 'success');
      setEditing(null);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleVerified(user: User) {
    try {
      const updated = await updateUser(user.id, { isVerified: !user.isVerified });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast(updated.isVerified ? 'Участник подтверждён' : 'Подтверждение снято', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  async function handleDelete(user: User) {
    const label = user.fullName.trim() || user.email;
    if (
      !confirm(
        `Удалить участника «${label}»?\n\nБудут удалены ответы квиза и вопросы спикерам. Отзывы останутся без привязки к пользователю.`,
      )
    ) {
      return;
    }
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (editing?.id === user.id) {
        setEditing(null);
      }
      toast('Участник удалён', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Участники"
        description="Поиск, редактирование и экспорт зарегистрированных пользователей"
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              void downloadAdminExport('/admin/users/export', 'users.xlsx').catch(
                (e) => toast(getErrorMessage(e), 'error'),
              )
            }
          >
            <ActionIcon name="download" />
            Excel
          </Button>
        }
      />

      <Card className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по имени или email…"
        />
      </Card>

      {loading ? (
        <LoadingBlock />
      ) : users.length === 0 ? (
        <EmptyState message="Участники не найдены" />
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          {users.map((user) => (
            <Card key={user.id} className="space-y-0">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">{user.fullName}</h3>
                  <p className="mt-0.5 break-all text-sm text-slate-400">{user.email}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">MAX: {user.maxUserId}</p>
                </div>
                <ListCardActions>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                    <ActionIcon name="edit" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Удалить участника"
                    onClick={() => void handleDelete(user)}
                  >
                    <span className="text-red-400">
                      <ActionIcon name="delete" />
                    </span>
                  </Button>
                </ListCardActions>
              </div>
              <ListCardMeta>
                <button type="button" onClick={() => void toggleVerified(user)}>
                  <Badge tone={user.isVerified ? 'success' : 'warning'}>
                    {user.isVerified ? 'Подтверждён' : 'Не подтверждён'}
                  </Badge>
                </button>
                <span>{formatDateTime(user.createdAt)}</span>
              </ListCardMeta>
            </Card>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-2xl border border-[var(--color-border)] md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">ФИО</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">MAX ID</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Регистрация</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-[var(--color-border)] hover:bg-slate-900/50"
                >
                  <td className="px-4 py-3 font-medium text-white">{user.fullName}</td>
                  <td className="px-4 py-3 text-slate-300">{user.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {user.maxUserId}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void toggleVerified(user)}>
                      <Badge tone={user.isVerified ? 'success' : 'warning'}>
                        {user.isVerified ? 'Подтверждён' : 'Не подтверждён'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDateTime(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                        <ActionIcon name="edit" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Удалить участника"
                        onClick={() => void handleDelete(user)}
                      >
                        <span className="text-red-400">
                          <ActionIcon name="delete" />
                        </span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {editing ? (
        <Modal title="Редактировать участника" onClose={() => setEditing(null)}>
          <Input
            label="ФИО"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.isVerified}
              onChange={(e) =>
                setForm((f) => ({ ...f, isVerified: e.target.checked }))
              }
              className="rounded"
            />
            Подтверждён в боте
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
