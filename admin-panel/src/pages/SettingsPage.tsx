import ActionIcon from '../components/ActionIcon';
import AppIcon from '../components/AppIcon';
import { panelIcons } from '../icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteMapImage,
  getLinks,
  getTexts,
  updateLinks,
  updateTexts,
  uploadMapImage,
} from '../api/client';
import type { LinksConfig, TextsConfig } from '../api/types';
import { Button, Card, Input, LoadingBlock, PageHeader, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../lib/format';

export default function SettingsPage() {
  const { toast } = useToast();
  const [links, setLinks] = useState<LinksConfig | null>(null);
  const [texts, setTexts] = useState<TextsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapBusy, setMapBusy] = useState(false);
  const mapRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, t] = await Promise.all([getLinks(), getTexts()]);
      setLinks(l);
      setTexts(t);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveLinks() {
    if (!links) return;
    setSaving(true);
    try {
      setLinks(await updateLinks(links));
      toast('Ссылки сохранены', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveTexts() {
    if (!texts) return;
    setSaving(true);
    try {
      setTexts(await updateTexts(texts));
      toast('Тексты сохранены', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleMapUpload(file: File) {
    setMapBusy(true);
    try {
      const url = await uploadMapImage(file);
      setLinks((prev) => (prev ? { ...prev, mapImageUrl: url } : prev));
      toast(links?.mapImageUrl ? 'Карта обновлена' : 'Карта загружена', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setMapBusy(false);
    }
  }

  async function handleMapDelete() {
    if (!links?.mapImageUrl) return;
    if (!confirm('Удалить карту площадки?')) return;
    setMapBusy(true);
    try {
      await deleteMapImage();
      setLinks((prev) => (prev ? { ...prev, mapImageUrl: '' } : prev));
      toast('Карта удалена', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setMapBusy(false);
    }
  }

  if (loading || !links || !texts) {
    return <LoadingBlock />;
  }

  return (
    <div>
      <PageHeader
        title="Настройки"
        description="Тексты мини-приложения, ссылки и карта площадки"
      />

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-semibold text-white">Ссылки</h2>
          <Input
            label="Чат"
            type="url"
            value={links.chatUrl}
            onChange={(e) => setLinks((l) => l && { ...l, chatUrl: e.target.value })}
          />
          <Input
            label="Стикерпак"
            type="url"
            value={links.stickerUrl}
            onChange={(e) =>
              setLinks((l) => l && { ...l, stickerUrl: e.target.value })
            }
          />
          <Input
            label="Квиз (внешняя ссылка)"
            type="url"
            value={links.quizUrl}
            onChange={(e) => setLinks((l) => l && { ...l, quizUrl: e.target.value })}
          />
          <Button onClick={() => void saveLinks()} disabled={saving}>
            Сохранить ссылки
          </Button>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-white">Карта</h2>
          <div className="flex flex-wrap items-start gap-4">
            {links.mapImageUrl ? (
              <img
                src={links.mapImageUrl}
                alt="Карта"
                className="max-h-48 max-w-full rounded-xl border border-[var(--color-border)] object-contain"
              />
            ) : (
              <div className="flex h-36 w-full min-w-[8rem] max-w-xs items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] text-slate-500 sm:w-48">
                <AppIcon icon={panelIcons.photo} size={32} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={mapRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleMapUpload(file);
                  e.target.value = '';
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={mapBusy}
                onClick={() => mapRef.current?.click()}
              >
                {links.mapImageUrl ? 'Изменить карту' : 'Загрузить карту'}
              </Button>
              {links.mapImageUrl ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={mapBusy}
                  onClick={() => void handleMapDelete()}
                >
                  <ActionIcon name="close" />
                  Удалить карту
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="space-y-4 xl:col-span-2">
          <h2 className="font-semibold text-white">Тексты</h2>
          <Textarea
            label="Описание события (мини-приложение)"
            rows={6}
            value={texts.eventDescription}
            onChange={(e) =>
              setTexts((t) => t && { ...t, eventDescription: e.target.value })
            }
          />
          <Textarea
            label="Приветствие бота"
            rows={4}
            value={texts.botWelcome}
            onChange={(e) =>
              setTexts((t) => t && { ...t, botWelcome: e.target.value })
            }
          />
          <Button onClick={() => void saveTexts()} disabled={saving}>
            Сохранить тексты
          </Button>
        </Card>
      </div>
    </div>
  );
}
