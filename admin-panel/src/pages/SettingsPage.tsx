import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
    try {
      const url = await uploadMapImage(file);
      setLinks((prev) => (prev ? { ...prev, mapImageUrl: url } : prev));
      toast('Карта загружена', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
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

      <div className="grid gap-6 xl:grid-cols-2">
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
          {links.mapImageUrl ? (
            <img
              src={links.mapImageUrl}
              alt="Карта"
              className="max-h-48 rounded-xl border border-[var(--color-border)] object-contain"
            />
          ) : (
            <p className="text-sm text-slate-500">Карта не загружена</p>
          )}
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
          <Button variant="secondary" onClick={() => mapRef.current?.click()}>
            Загрузить карту
          </Button>
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
