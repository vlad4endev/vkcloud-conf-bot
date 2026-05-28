import { useCallback, useEffect, useState } from 'react';
import ActionIcon from '../components/ActionIcon';
import {
  createScheduleSession,
  deleteScheduleSession,
  getSchedule,
  getSpeakers,
  reorderSchedule,
  updateScheduleSession,
} from '../api/client';
import type { ScheduleSession, SessionTrack, Speaker } from '../api/types';
import { ListCardActions, MoveToPositionButton } from '../components/mobileList';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { downloadAdminExport } from '../lib/download';
import { formatScheduleTime, getErrorMessage } from '../lib/format';

type SessionForm = {
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  speakerIds: string[];
  track: SessionTrack;
};

const TRACK_OPTIONS: Array<{ value: SessionTrack; label: string }> = [
  { value: 'all', label: 'Общий трек' },
  { value: 'tech', label: 'Технологический трек' },
  { value: 'business', label: 'Бизнес-трек' },
];

const emptyForm: SessionForm = {
  startTime: '10:00',
  endTime: '11:00',
  title: '',
  description: '',
  location: '',
  speakerIds: [],
  track: 'all',
};

function sessionToForm(session: ScheduleSession): SessionForm {
  return {
    startTime: formatScheduleTime(session.startTime),
    endTime: formatScheduleTime(session.endTime),
    title: session.title,
    description: session.description ?? '',
    location: session.location ?? '',
    speakerIds: (session.speakers ?? []).map((speaker) => speaker.id),
    track: session.track ?? 'all',
  };
}

function toggleSpeakerId(ids: string[], speakerId: string, checked: boolean): string[] {
  if (checked) {
    return ids.includes(speakerId) ? ids : [...ids, speakerId];
  }
  return ids.filter((id) => id !== speakerId);
}

export default function SchedulePage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ScheduleSession | null>(null);
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleData, speakersData] = await Promise.all([
        getSchedule(),
        getSpeakers(),
      ]);
      setSessions(scheduleData);
      setSpeakers(speakersData);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setModal('create');
  }

  function openEdit(session: ScheduleSession) {
    setForm(sessionToForm(session));
    setEditing(session);
    setModal('edit');
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      startTime: form.startTime,
      endTime: form.endTime,
      title: form.title,
      description: form.description || undefined,
      location: form.location || undefined,
      speakerIds: form.speakerIds,
      track: form.track,
    };
    try {
      if (modal === 'create') {
        await createScheduleSession(payload);
        toast('Сессия добавлена', 'success');
      } else if (editing) {
        await updateScheduleSession(editing.id, {
          ...payload,
          description: form.description || null,
          location: form.location || null,
        });
        toast('Сессия обновлена', 'success');
      }
      setModal(null);
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(session: ScheduleSession) {
    if (!confirm(`Удалить «${session.title}»?`)) return;
    try {
      await deleteScheduleSession(session.id);
      toast('Сессия удалена', 'success');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  async function moveSessionTo(index: number, targetIndex: number) {
    if (targetIndex < 0 || targetIndex >= sessions.length || targetIndex === index) {
      return;
    }
    const reordered = sessions.map((session) => ({ id: session.id }));
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const items = reordered.map((session, order) => ({ ...session, order }));
    try {
      setSessions(await reorderSchedule(items));
      toast('Порядок сохранён', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Расписание"
        description="Программа конференции для мини-приложения"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                void downloadAdminExport(
                  '/admin/schedule/export',
                  'schedule.xlsx',
                ).catch((e) => toast(getErrorMessage(e), 'error'))
              }
            >
              <ActionIcon name="download" />
              Excel
            </Button>
            <Button onClick={openCreate}>
              <ActionIcon name="add" />
              Сессия
            </Button>
          </>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : sessions.length === 0 ? (
        <EmptyState message="Расписание пустое" />
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <Card key={session.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-400">
                    {formatScheduleTime(session.startTime)} —{' '}
                    {formatScheduleTime(session.endTime)}
                  </p>
                  <h3 className="mt-1 font-semibold text-white">{session.title}</h3>
                  {session.speakers.length > 0 ? (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                      {session.speakers.map((speaker) => speaker.name).join(', ')}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {session.location ? (
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                        {session.location}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                      {TRACK_OPTIONS.find((t) => t.value === (session.track ?? 'all'))?.label ??
                        'Общий трек'}
                    </span>
                  </div>
                </div>
                <ListCardActions>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(session)}>
                    <ActionIcon name="edit" />
                  </Button>
                  <MoveToPositionButton
                    itemLabel={session.title}
                    currentPosition={index + 1}
                    totalItems={sessions.length}
                    onMoveToPosition={(position) => void moveSessionTo(index, position - 1)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400"
                    onClick={() => void handleDelete(session)}
                  >
                    <ActionIcon name="delete" />
                  </Button>
                </ListCardActions>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal ? (
        <Modal
          title={modal === 'create' ? 'Новая сессия' : 'Редактировать сессию'}
          onClose={() => setModal(null)}
          wide
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Начало (ЧЧ:ММ)"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              placeholder="10:00"
            />
            <Input
              label="Конец (ЧЧ:ММ)"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              placeholder="11:00"
            />
          </div>
          <Input
            label="Название"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Описание"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Локация"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">Спикеры</span>
            {speakers.length === 0 ? (
              <p className="text-sm text-slate-500">Сначала добавьте спикеров в разделе «Спикеры»</p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                {speakers.map((speaker) => (
                  <label
                    key={speaker.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-800/60"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.speakerIds.includes(speaker.id)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          speakerIds: toggleSpeakerId(
                            f.speakerIds,
                            speaker.id,
                            e.target.checked,
                          ),
                        }))
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-white">{speaker.name}</span>
                      {speaker.profession ? (
                        <span className="block text-xs text-slate-400">{speaker.profession}</span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Select
            label="Трек"
            value={form.track}
            onChange={(e) =>
              setForm((f) => ({ ...f, track: e.target.value as SessionTrack }))
            }
          >
            {TRACK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(null)}>
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
