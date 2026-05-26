import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSpeaker,
  deleteSpeaker,
  getSpeakers,
  reorderSpeakers,
  updateSpeaker,
  uploadSpeakerPhoto,
} from '../api/client';
import type { Speaker } from '../api/types';
import { ReorderControls } from '../components/ReorderControls';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../lib/format';

type SpeakerForm = { name: string; bio: string };

const emptyForm: SpeakerForm = { name: '', bio: '' };

export default function SpeakersPage() {
  const { toast } = useToast();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Speaker | null>(null);
  const [form, setForm] = useState<SpeakerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoTarget, setPhotoTarget] = useState<Speaker | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSpeakers(await getSpeakers());
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

  function openEdit(speaker: Speaker) {
    setForm({ name: speaker.name, bio: speaker.bio });
    setEditing(speaker);
    setModal('edit');
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (modal === 'create') {
        await createSpeaker(form);
        toast('Спикер добавлен', 'success');
      } else if (editing) {
        await updateSpeaker(editing.id, form);
        toast('Спикер обновлён', 'success');
      }
      setModal(null);
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(speaker: Speaker) {
    if (!confirm(`Удалить спикера «${speaker.name}»?`)) return;
    try {
      await deleteSpeaker(speaker.id);
      toast('Спикер удалён', 'success');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  async function moveSpeaker(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= speakers.length) return;
    const items = speakers.map((s, i) => ({
      id: s.id,
      order: i === index ? next : i === next ? index : i,
    }));
    try {
      setSpeakers(await reorderSpeakers(items));
      toast('Порядок сохранён', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  async function handlePhoto(file: File) {
    if (!photoTarget) return;
    try {
      await uploadSpeakerPhoto(photoTarget.id, file);
      toast('Фото загружено', 'success');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setPhotoTarget(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Спикеры"
        description="Карточки спикеров для мини-приложения"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Добавить
          </Button>
        }
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handlePhoto(file);
          e.target.value = '';
        }}
      />

      {loading ? (
        <LoadingBlock />
      ) : speakers.length === 0 ? (
        <EmptyState message="Спикеров пока нет" />
      ) : (
        <div className="space-y-3">
          {speakers.map((speaker, index) => (
            <Card key={speaker.id} className="flex gap-4">
              <ReorderControls
                onUp={() => void moveSpeaker(index, -1)}
                onDown={() => void moveSpeaker(index, 1)}
                disableUp={index === 0}
                disableDown={index === speakers.length - 1}
              />
              {speaker.photoUrl ? (
                <img
                  src={speaker.photoUrl}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
                  ?
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white">{speaker.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{speaker.bio}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotoTarget(speaker);
                    fileRef.current?.click();
                  }}
                >
                  <ImagePlus size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(speaker)}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void handleDelete(speaker)}>
                  <Trash2 size={16} className="text-red-400" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal ? (
        <Modal
          title={modal === 'create' ? 'Новый спикер' : 'Редактировать спикера'}
          onClose={() => setModal(null)}
        >
          <Input
            label="Имя"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Textarea
            label="Биография"
            rows={5}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
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
