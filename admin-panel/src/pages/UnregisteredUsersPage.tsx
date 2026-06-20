import ActionIcon from '../components/ActionIcon';
import OpenChatButton from '../components/OpenChatButton';
import { ListCardActions, ListCardMeta } from '../components/mobileList';
import { useCallback, useEffect, useState } from 'react';
import { deleteUser, getUsers } from '../api/client';
import type { User } from '../api/types';
import {
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  SearchInput,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { downloadAdminExport } from '../lib/download';
import { formatDateTime, getErrorMessage } from '../lib/format';

function profileName(user: User): { firstName: string; lastName: string } {
  if (user.profileFirstName || user.profileLastName) {
    return {
      firstName: user.profileFirstName,
      lastName: user.profileLastName,
    };
  }

  const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? '', lastName: '' };
  }

  return {
    firstName: parts[0] ?? '',
    lastName: parts[parts.length - 1] ?? '',
  };
}

export default function UnregisteredUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await getUsers(debouncedSearch || undefined, false));
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(user: User) {
    const { firstName, lastName } = profileName(user);
    const label = [firstName, lastName].filter(Boolean).join(' ') || user.maxUserId;
    if (!confirm(`Удалить запись «${label}»?`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast('Запись удалена', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Не зарегистрированные"
        description="Пользователи, запустившие бота, но не завершившие регистрацию"
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              void downloadAdminExport(
                '/admin/users/unregistered/export',
                'unregistered-users.xlsx',
              ).catch((e) => toast(getErrorMessage(e), 'error'))
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
          placeholder="Поиск по имени, фамилии или MAX ID…"
        />
      </Card>

      {loading ? (
        <LoadingBlock />
      ) : users.length === 0 ? (
        <EmptyState message="Незарегистрированные пользователи не найдены" />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((user) => {
              const { firstName, lastName } = profileName(user);
              return (
                <Card key={user.id} className="space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white">
                        {[firstName, lastName].filter(Boolean).join(' ') || '—'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Имя: {firstName || '—'}
                      </p>
                      <p className="text-sm text-slate-400">
                        Фамилия: {lastName || '—'}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        MAX ID: {user.maxUserId}
                      </p>
                    </div>
                    <ListCardActions>
                      <OpenChatButton user={user} />
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Удалить"
                        onClick={() => void handleDelete(user)}
                      >
                        <span className="text-red-400">
                          <ActionIcon name="delete" />
                        </span>
                      </Button>
                    </ListCardActions>
                  </div>
                  <ListCardMeta>
                    <span>Запуск бота: {formatDateTime(user.createdAt)}</span>
                  </ListCardMeta>
                </Card>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-[var(--color-border)] md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[var(--color-surface-2)] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">Фамилия</th>
                  <th className="px-4 py-3 font-medium">MAX ID</th>
                  <th className="px-4 py-3 font-medium">Запуск бота</th>
                  <th className="px-4 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const { firstName, lastName } = profileName(user);
                  return (
                    <tr
                      key={user.id}
                      className="border-t border-[var(--color-border)] hover:bg-slate-900/50"
                    >
                      <td className="px-4 py-3 text-white">{firstName || '—'}</td>
                      <td className="px-4 py-3 text-white">{lastName || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {user.maxUserId}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <OpenChatButton user={user} />
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Удалить"
                            onClick={() => void handleDelete(user)}
                          >
                          <span className="text-red-400">
                            <ActionIcon name="delete" />
                          </span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
