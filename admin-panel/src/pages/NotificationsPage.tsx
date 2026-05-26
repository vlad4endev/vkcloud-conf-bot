import { useState } from 'react';
import { sendNotification } from '../api/client';
import { Button, Card, PageHeader, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../lib/format';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);

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

      if (immediate && result && typeof result === 'object' && 'sent' in result) {
        const sentCount = (result as { sentCount?: number }).sentCount;
        toast(`Отправлено: ${sentCount ?? 0} участникам`, 'success');
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
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Рассылки"
        description="Мгновенные или отложенные сообщения в MAX"
      />

      <Card className="max-w-2xl space-y-4">
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
    </div>
  );
}
