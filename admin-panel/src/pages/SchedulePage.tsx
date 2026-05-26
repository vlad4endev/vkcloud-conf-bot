import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  createScheduleSession,
  deleteScheduleSession,
  getSchedule,
  getSpeakers,
  reorderSchedule,
  updateScheduleSession,
} from '../api/client';
import type { ScheduleSession, Speaker } from '../api/types';
import { ReorderControls } from '../components/ReorderControls';
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
  speakerId: string;
};

const emptyForm: SessionForm = {
  startTime: '10:00',
  endTime: '11:00',
  title: '',
  description: '',
  location: '',
  speakerId: '',
};

function sessionToForm(session: ScheduleSession): SessionForm {
  return {
    startTime: formatScheduleTime(session.startTime),
    endTime: formatScheduleTime(session.endTime),
    title: session.title,
    description: session.description ?? '',
    location: session.location ?? '',
    speakerId: session.speakerId ?? '',
  };
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
      speakerId: form.speakerId || undefined,
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
          speakerId: form.speakerId || null,
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

  async function moveSession(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= sessions.length) return;
    const items = sessions.map((s, i) => ({
      id: s.id,
      order: i === index ? next : i === next ? index : i,
    }));
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
              <Download size={16} />
              Excel
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} />
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
            <Card key={session.id} className="flex gap-4">
              <ReorderControls
                onUp={() => void moveSession(index, -1)}
                onDown={() => void moveSession(index, 1)}
                disableUp={index === 0}
                disableDown={index === sessions.length - 1}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-blue-400">
                  {formatScheduleTime(session.startTime)} —{' '}
                  {formatScheduleTime(session.endTime)}
                </p>
                <h3 className="mt-1 font-semibold text-white">{session.title}</h3>
                {session.speaker ? (
                  <p className="text-sm text-slate-400">{session.speaker.name}</p>
                ) : null}
                {session.location ? (
                  <p className="text-xs text-slate-500">{session.location}</p>
                ) : null}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(session)}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void handleDelete(session)}>
                  <Trash2 size={16} className="text-red-400" />
                </Button>
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
          <Select
            label="Спикер"
            value={form.speakerId}
            onChange={(e) => setForm((f) => ({ ...f, speakerId: e.target.value }))}
          >
            <option value="">— без спикера —</option>
            {speakers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
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
