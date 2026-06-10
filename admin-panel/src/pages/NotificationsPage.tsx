import ActionIcon from '../components/ActionIcon';
import { ListCardActions, ListCardMeta } from '../components/mobileList';
import { useCallback, useEffect, useState } from 'react';
import {
  deleteNotification,
  getNotifications,
  sendNotification,
  updateNotification,
} from '../api/client';
import type { Notification } from '../api/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  Modal,
  PageHeader,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import {
  formatDateTime,
  getErrorMessage,
  toDatetimeLocalValue,
} from '../lib/format';

type Tab = 'scheduled' | 'history';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('scheduled');
  const [pending, setPending] = useState<Notification[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);

  const [editing, setEditing] = useState<Notification | null>(null);
  const [editText, setEditText] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingList, historyList] = await Promise.all([
        getNotifications('pending'),
        getNotifications('sent'),
      ]);
      setPending(pendingList);
      setHistory(historyList);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSend(immediate: boolean) {
    if (!text.trim()) {
      toast('Введите текст сообщения', 'error');
      return;
    }

    setSending(true);
    try {
      const payload: { text: string; scheduledAt?: string } = { text: text.trim() };
      if (!immediate && scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const result = await sendNotification(payload);

      if (
        immediate &&
        result &&
        typeof result === 'object' &&
        'accepted' in result &&
        (result as { accepted?: boolean }).accepted
      ) {
        toast('Рассылка запущена в фоне — сообщения уйдут участникам постепенно', 'success');
      } else {
        toast(
          immediate
            ? 'Рассылка отправлена'
            : 'Рассылка запланирована — бот отправит в указанное время',
          'success',
        );
      }
      setText('');
      setScheduledAt('');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSending(false);
    }
  }

  function openEdit(item: Notification) {
    setEditing(item);
    setEditText(item.text);
    setEditScheduledAt(
      item.scheduledAt ? toDatetimeLocalValue(item.scheduledAt) : '',
    );
  }

  function closeEdit() {
    setEditing(null);
    setEditText('');
    setEditScheduledAt('');
  }

  async function handleSaveEdit() {
    if (!editing) return;
    if (!editText.trim()) {
      toast('Введите текст сообщения', 'error');
      return;
    }
    if (!editScheduledAt) {
      toast('Укажите время отправки', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateNotification(editing.id, {
        text: editText.trim(),
        scheduledAt: new Date(editScheduledAt).toISOString(),
      });
      toast('Рассылка обновлена', 'success');
      closeEdit();
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Notification) {
    if (!confirm('Отменить запланированную рассылку?')) return;
    try {
      await deleteNotification(item.id);
      toast('Рассылка удалена', 'success');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  const list = tab === 'scheduled' ? pending : history;

  return (
    <div>
      <PageHeader
        title="Рассылки"
        description="Мгновенные или отложенные сообщения в MAX"
      />

      <Card className="mb-6 w-full max-w-2xl space-y-4">
        <Textarea
          label="Текст сообщения"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Текст для участников в боте MAX…"
        />

        <label className="block space-y-1.5">
          <span className="text-sm text-slate-400">
            Отложенная отправка (необязательно)
          </span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-white"
          />
        </label>

        <p className="text-xs text-slate-500">
          Мгновенная рассылка работает, если бот запущен и доступен сервису admin.
          Отложенная сохраняется в БД — cron бота отправит подтверждённым участникам.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void handleSend(true)}
            disabled={sending || Boolean(scheduledAt)}
          >
            {sending ? 'Отправка…' : 'Отправить сейчас'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleSend(false)}
            disabled={sending || !scheduledAt}
          >
            Запланировать
          </Button>
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant={tab === 'scheduled' ? 'primary' : 'secondary'}
          className="w-full"
          onClick={() => setTab('scheduled')}
        >
          <ActionIcon name="pending" />
          Запланированные ({pending.length})
        </Button>
        <Button
          variant={tab === 'history' ? 'primary' : 'secondary'}
          className="w-full"
          onClick={() => setTab('history')}
        >
          <ActionIcon name="history" />
          История ({history.length})
        </Button>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <EmptyState
          message={
            tab === 'scheduled'
              ? 'Нет запланированных рассылок'
              : 'История рассылок пуста'
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <Card key={item.id} className="space-y-0">
              <div className="flex items-start gap-3">
                <p className="min-w-0 flex-1 whitespace-pre-wrap text-white">{item.text}</p>
                {tab === 'scheduled' ? (
                  <ListCardActions>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(item)}
                      aria-label="Редактировать"
                    >
                      <ActionIcon name="edit" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleDelete(item)}
                      aria-label="Удалить"
                    >
                      <ActionIcon name="delete" />
                    </Button>
                  </ListCardActions>
                ) : null}
              </div>
              <ListCardMeta>
                {tab === 'scheduled' && item.scheduledAt ? (
                  <span>Отправка: {formatDateTime(item.scheduledAt)}</span>
                ) : null}
                {tab === 'history' && item.sentAt ? (
                  <span>Отправлено: {formatDateTime(item.sentAt)}</span>
                ) : null}
                {tab === 'history' && !item.scheduledAt ? (
                  <Badge tone="success">Мгновенная</Badge>
                ) : null}
                {tab === 'history' && item.scheduledAt ? <Badge>Была запланирована</Badge> : null}
                <span>Создано: {formatDateTime(item.createdAt)}</span>
              </ListCardMeta>
            </Card>
          ))}
        </div>
      )}

      {editing ? (
        <Modal title="Редактировать рассылку" onClose={closeEdit}>
          <Textarea
            label="Текст сообщения"
            rows={6}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <label className="block space-y-1.5">
            <span className="text-sm text-slate-400">Время отправки</span>
            <input
              type="datetime-local"
              value={editScheduledAt}
              onChange={(e) => setEditScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-white"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleSaveEdit()} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
            <Button variant="secondary" onClick={closeEdit}>
              Отмена
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
