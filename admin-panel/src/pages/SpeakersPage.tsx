import { useCallback, useEffect, useRef, useState } from 'react';
import ActionIcon from '../components/ActionIcon';
import AppIcon from '../components/AppIcon';
import { panelIcons } from '../icons';
import {
  createSpeaker,
  deleteSpeaker,
  deleteSpeakerPhoto,
  getSpeakers,
  reorderSpeakers,
  updateSpeaker,
  uploadSpeakerPhoto,
} from '../api/client';
import type { Speaker } from '../api/types';
import { ListCardActions, MoveToPositionButton } from '../components/mobileList';
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

type SpeakerForm = { name: string; profession: string; bio: string };

type PhotoDraft =
  | { kind: 'none' }
  | { kind: 'existing'; url: string }
  | { kind: 'preview'; file: File; previewUrl: string };

const emptyForm: SpeakerForm = { name: '', profession: '', bio: '' };
const emptyPhoto: PhotoDraft = { kind: 'none' };

function revokePreviewUrl(photo: PhotoDraft) {
  if (photo.kind === 'preview') {
    URL.revokeObjectURL(photo.previewUrl);
  }
}

function photoFromSpeaker(speaker: Speaker | null): PhotoDraft {
  if (speaker?.photoUrl) {
    return { kind: 'existing', url: speaker.photoUrl };
  }
  return { kind: 'none' };
}

function photoDisplayUrl(photo: PhotoDraft): string | null {
  if (photo.kind === 'existing') return photo.url;
  if (photo.kind === 'preview') return photo.previewUrl;
  return null;
}

export default function SpeakersPage() {
  const { toast } = useToast();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Speaker | null>(null);
  const [form, setForm] = useState<SpeakerForm>(emptyForm);
  const [photo, setPhoto] = useState<PhotoDraft>(emptyPhoto);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  function closeModal() {
    setPhoto((current) => {
      revokePreviewUrl(current);
      return emptyPhoto;
    });
    setModal(null);
    setEditing(null);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setPhoto(emptyPhoto);
    setModal('create');
  }

  function openEdit(speaker: Speaker) {
    setForm({
      name: speaker.name,
      profession: speaker.profession ?? '',
      bio: speaker.bio,
    });
    setEditing(speaker);
    setPhoto(photoFromSpeaker(speaker));
    setModal('edit');
  }

  function selectPhotoFile(file: File) {
    setPhoto((current) => {
      revokePreviewUrl(current);
      return {
        kind: 'preview',
        file,
        previewUrl: URL.createObjectURL(file),
      };
    });
  }

  function clearPhoto() {
    setPhoto((current) => {
      revokePreviewUrl(current);
      return emptyPhoto;
    });
  }

  async function applyPhotoChanges(speakerId: string, hadPhoto: boolean) {
    if (photo.kind === 'preview') {
      await uploadSpeakerPhoto(speakerId, photo.file);
      return;
    }
    if (photo.kind === 'none' && hadPhoto) {
      await deleteSpeakerPhoto(speakerId);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        bio: form.bio.trim(),
        profession: form.profession.trim() || undefined,
      };

      if (modal === 'create') {
        const created = await createSpeaker(payload);
        if (photo.kind === 'preview') {
          await uploadSpeakerPhoto(created.id, photo.file);
        }
        toast('Спикер добавлен', 'success');
      } else if (editing) {
        await updateSpeaker(editing.id, {
          ...payload,
          profession: form.profession.trim() || null,
        });
        await applyPhotoChanges(editing.id, Boolean(editing.photoUrl));
        toast('Спикер обновлён', 'success');
      }
      closeModal();
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

  async function moveSpeakerTo(index: number, targetIndex: number) {
    if (targetIndex < 0 || targetIndex >= speakers.length || targetIndex === index) {
      return;
    }
    const reordered = speakers.map((speaker) => ({ id: speaker.id }));
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const items = reordered.map((speaker, order) => ({ ...speaker, order }));
    try {
      setSpeakers(await reorderSpeakers(items));
      toast('Порядок сохранён', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  const previewUrl = photoDisplayUrl(photo);

  return (
    <div>
      <PageHeader
        title="Спикеры"
        description="Карточки спикеров для мини-приложения"
        actions={
          <Button onClick={openCreate}>
            <ActionIcon name="add" />
            Добавить
          </Button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : speakers.length === 0 ? (
        <EmptyState message="Спикеров пока нет" />
      ) : (
        <div className="space-y-3">
          {speakers.map((speaker, index) => (
            <Card key={speaker.id} className="space-y-3">
              <div className="flex items-start gap-3">
                {speaker.photoUrl ? (
                  <img
                    src={speaker.photoUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-500 sm:h-20 sm:w-20">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">{speaker.name}</h3>
                  {speaker.profession ? (
                    <p className="mt-0.5 text-sm text-slate-400">{speaker.profession}</p>
                  ) : null}
                </div>
                <ListCardActions>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(speaker)}>
                    <ActionIcon name="edit" />
                  </Button>
                  <MoveToPositionButton
                    itemLabel={speaker.name}
                    currentPosition={index + 1}
                    totalItems={speakers.length}
                    onMoveToPosition={(position) => void moveSpeakerTo(index, position - 1)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => void handleDelete(speaker)}>
                    <span className="text-red-400">
                      <ActionIcon name="delete" />
                    </span>
                  </Button>
                </ListCardActions>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal ? (
        <Modal
          title={modal === 'create' ? 'Новый спикер' : 'Редактировать спикера'}
          onClose={closeModal}
        >
          <div className="space-y-3">
            <span className="text-sm text-slate-400">Фото</span>
            <div className="flex flex-wrap items-start gap-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-28 w-28 rounded-xl border border-[var(--color-border)] object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] text-slate-500">
                  <AppIcon icon={panelIcons.photo} size={28} />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) selectPhotoFile(file);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  {previewUrl ? 'Изменить фото' : 'Загрузить фото'}
                </Button>
                {previewUrl ? (
                  <Button variant="ghost" size="sm" onClick={clearPhoto}>
                    <ActionIcon name="close" />
                    Удалить фото
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <Input
            label="Имя"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Профессия"
            value={form.profession}
            onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
            placeholder="Например: CTO, VK Cloud"
          />
          <Textarea
            label="Биография (необязательно)"
            rows={5}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>
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
