import { useEffect, useMemo, useState } from 'react';
import type { QuizVisibilityInfo } from '../api/client';
import { updateQuizVisibility } from '../api/client';
import {
  formatCountdownToStart,
  formatQuizStartAtForDisplay,
  formatQuizStartAtForInput,
  getQuizPublicationMode,
  parseQuizStartAtFromInput,
  type QuizPublicationMode,
} from '../../../src/shared/quizVisibility';
import { Badge, Button, Card, Input } from './ui';
import { getErrorMessage } from '../lib/format';

type QuizPublicationSettingsProps = {
  hasQuestions: boolean;
  visibility: QuizVisibilityInfo;
  onUpdated: (next: QuizVisibilityInfo) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onScheduleElapsed?: () => void;
};

const modeOptions: Array<{
  id: QuizPublicationMode;
  title: string;
  description: string;
}> = [
  {
    id: 'hidden',
    title: 'Скрыт',
    description: 'Вкладка «Квиз» не показывается участникам',
  },
  {
    id: 'now',
    title: 'Опубликован',
    description: 'Раздел доступен в мини-приложении сразу',
  },
  {
    id: 'scheduled',
    title: 'По расписанию',
    description: 'Автоматически откроется в указанное время (МСК)',
  },
];

function statusMeta(visibility: QuizVisibilityInfo, nowMs: number) {
  const mode = getQuizPublicationMode(visibility);

  if (!visibility.manuallyEnabled) {
    return {
      tone: 'default' as const,
      label: 'Скрыт',
      description: 'Участники не видят раздел «Квиз» в нижней навигации.',
    };
  }

  if (visibility.awaitingSchedule && visibility.startAt) {
    const startsAtMs = Date.parse(visibility.startAt);
    return {
      tone: 'warning' as const,
      label: 'Ожидает старта',
      description: `Квиз откроется ${formatQuizStartAtForDisplay(visibility.startAt)} (через ${formatCountdownToStart(startsAtMs, nowMs)}).`,
    };
  }

  if (mode === 'scheduled' && visibility.startAt) {
    return {
      tone: 'success' as const,
      label: 'Опубликован',
      description: `Раздел открыт с ${formatQuizStartAtForDisplay(visibility.startAt)}.`,
    };
  }

  return {
    tone: 'success' as const,
    label: 'Опубликован',
    description: 'Раздел «Квиз» доступен участникам в мини-приложении.',
  };
}

export default function QuizPublicationSettings({
  hasQuestions,
  visibility,
  onUpdated,
  onError,
  onSuccess,
  onScheduleElapsed,
}: QuizPublicationSettingsProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<QuizPublicationMode>(() =>
    getQuizPublicationMode(visibility),
  );
  const [scheduleInput, setScheduleInput] = useState(() =>
    formatQuizStartAtForInput(visibility.startAt),
  );

  useEffect(() => {
    setMode(getQuizPublicationMode(visibility));
    setScheduleInput(formatQuizStartAtForInput(visibility.startAt));
  }, [visibility]);

  useEffect(() => {
    if (!visibility.awaitingSchedule || !visibility.startAt) {
      return;
    }

    const startsAtMs = Date.parse(visibility.startAt);
    const tick = () => {
      const current = Date.now();
      setNowMs(current);
      if (current >= startsAtMs) {
        onScheduleElapsed?.();
      }
    };

    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [onScheduleElapsed, visibility.awaitingSchedule, visibility.startAt]);

  const status = useMemo(() => statusMeta(visibility, nowMs), [visibility, nowMs]);

  async function persist(payload: { visible?: boolean; startAt?: string | null }) {
    setSaving(true);
    try {
      const next = await updateQuizVisibility(payload);
      onUpdated(next);
      onSuccess('Настройки публикации сохранены');
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function applyMode(nextMode: QuizPublicationMode) {
    setMode(nextMode);

    if (nextMode === 'hidden') {
      await persist({ visible: false, startAt: null });
      return;
    }

    if (nextMode === 'now') {
      await persist({ visible: true, startAt: null });
      return;
    }

    setScheduleInput(formatQuizStartAtForInput(visibility.startAt));
  }

  async function saveSchedule() {
    const iso = parseQuizStartAtFromInput(scheduleInput);
    if (!iso) {
      onError('Укажите корректные дату и время старта');
      return;
    }

    await persist({ visible: true, startAt: iso });
  }

  if (!hasQuestions) {
    return (
      <Card className="mb-4 border-dashed">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">Публикация в мини-приложении</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
              Добавьте хотя бы один вопрос, чтобы настроить отображение раздела «Квиз» и
              запланировать автоматический старт.
            </p>
          </div>
          <Badge tone="default">Недоступно</Badge>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-4 overflow-hidden p-0">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/80 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">Публикация в мини-приложении</h3>
            <p className="mt-0.5 text-sm text-slate-400">
              Вкладка «Квиз» в нижней навигации мини-приложения
            </p>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{status.description}</p>
      </div>

      <div className="space-y-5 px-4 py-4 sm:px-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Режим публикации
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {modeOptions.map((option) => {
              const active = mode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={saving}
                  onClick={() => void applyMode(option.id)}
                  className={
                    active
                      ? 'rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)]/10 p-3 text-left transition'
                      : 'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-left transition hover:border-slate-600'
                  }
                >
                  <span
                    className={
                      active
                        ? 'text-sm font-semibold text-white'
                        : 'text-sm font-semibold text-slate-200'
                    }
                  >
                    {option.title}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-slate-400">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {mode === 'scheduled' ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-white">Дата и время старта</h4>
                <p className="mt-0.5 text-xs text-slate-400">Часовой пояс: Москва (МСK, UTC+3)</p>
              </div>
              {visibility.startAt ? (
                <span className="text-xs text-slate-400">
                  Сохранено: {formatQuizStartAtForDisplay(visibility.startAt)}
                </span>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Input
                label="Старт квиза"
                type="datetime-local"
                value={scheduleInput}
                disabled={saving}
                onChange={(event) => setScheduleInput(event.target.value)}
              />
              <Button disabled={saving || !scheduleInput} onClick={() => void saveSchedule()}>
                Сохранить расписание
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
