import { useCallback, useEffect, useRef, useState } from 'react';
import ActionIcon from '../components/ActionIcon';
import AppIcon from '../components/AppIcon';
import { panelIcons } from '../icons';
import {
  createPartner,
  deletePartner,
  deletePartnerLogo,
  getPartners,
  reorderPartners,
  setPartnersSectionVisible,
  updatePartner,
  uploadPartnerLogo,
} from '../api/client';
import type { Partner } from '../api/types';
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
import {
  DEFAULT_PARTNER_LOGO_SCALE,
  MAX_PARTNER_LOGO_SCALE,
  MIN_PARTNER_LOGO_SCALE,
  partnerLogoScaleFactor,
} from '../../../src/shared/partnerLogoScale';

type PartnerForm = {
  name: string;
  description: string;
  url: string;
  logoScale: number;
};

type LogoDraft =
  | { kind: 'none' }
  | { kind: 'existing'; url: string }
  | { kind: 'preview'; file: File; previewUrl: string };

const LOGO_SCALE_PRESETS = [75, 100, 125, 150] as const;

const emptyForm: PartnerForm = {
  name: '',
  description: '',
  url: '',
  logoScale: DEFAULT_PARTNER_LOGO_SCALE,
};
const emptyLogo: LogoDraft = { kind: 'none' };

function revokePreviewUrl(logo: LogoDraft) {
  if (logo.kind === 'preview') {
    URL.revokeObjectURL(logo.previewUrl);
  }
}

function logoFromPartner(partner: Partner | null): LogoDraft {
  if (partner?.logoUrl) {
    return { kind: 'existing', url: partner.logoUrl };
  }
  return emptyLogo;
}

function logoDisplayUrl(logo: LogoDraft): string | null {
  if (logo.kind === 'existing') return logo.url;
  if (logo.kind === 'preview') return logo.previewUrl;
  return null;
}

export default function PartnersPage() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [logo, setLogo] = useState<LogoDraft>(emptyLogo);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPartners();
      setPartners(data.partners);
      setSectionVisible(data.sectionVisible);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  async function toggleSectionVisible(visible: boolean) {
    if (visibilitySaving || visible === sectionVisible) return;
    setVisibilitySaving(true);
    try {
      const next = await setPartnersSectionVisible(visible);
      setSectionVisible(next);
      toast(
        next ? 'Блок партнёров показывается на главной' : 'Блок партнёров скрыт с главной',
        'success',
      );
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setVisibilitySaving(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  function closeModal() {
    setLogo((current) => {
      revokePreviewUrl(current);
      return emptyLogo;
    });
    setModal(null);
    setEditing(null);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setLogo(emptyLogo);
    setModal('create');
  }

  function openEdit(partner: Partner) {
    setForm({
      name: partner.name,
      description: partner.description,
      url: partner.url,
      logoScale: partner.logoScale,
    });
    setEditing(partner);
    setLogo(logoFromPartner(partner));
    setModal('edit');
  }

  function selectLogoFile(file: File) {
    setLogo((current) => {
      revokePreviewUrl(current);
      return {
        kind: 'preview',
        file,
        previewUrl: URL.createObjectURL(file),
      };
    });
  }

  function clearLogo() {
    setLogo((current) => {
      revokePreviewUrl(current);
      return emptyLogo;
    });
  }

  async function applyLogoChanges(partnerId: string, hadLogo: boolean) {
    if (logo.kind === 'preview') {
      await uploadPartnerLogo(partnerId, logo.file);
      return;
    }
    if (logo.kind === 'none' && hadLogo) {
      await deletePartnerLogo(partnerId);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        url: form.url.trim(),
        logoScale: form.logoScale,
      };

      if (!payload.name || !payload.url) {
        toast('Укажите название и ссылку', 'error');
        return;
      }

      if (modal === 'create') {
        const created = await createPartner(payload);
        if (logo.kind === 'preview') {
          await uploadPartnerLogo(created.id, logo.file);
        }
        toast('Партнёр добавлен', 'success');
      } else if (editing) {
        await updatePartner(editing.id, payload);
        await applyLogoChanges(editing.id, Boolean(editing.logoUrl));
        toast('Партнёр обновлён', 'success');
      }
      closeModal();
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(partner: Partner) {
    if (!confirm(`Удалить партнёра «${partner.name}»?`)) return;
    try {
      await deletePartner(partner.id);
      toast('Партнёр удалён', 'success');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  async function movePartnerTo(index: number, targetIndex: number) {
    if (targetIndex < 0 || targetIndex >= partners.length || targetIndex === index) {
      return;
    }
    const reordered = partners.map((partner) => ({ id: partner.id }));
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const items = reordered.map((partner, order) => ({ ...partner, order }));
    try {
      setPartners(await reorderPartners(items));
      toast('Порядок сохранён', 'success');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  const previewUrl = logoDisplayUrl(logo);

  return (
    <div>
      <PageHeader
        title="Партнёры"
        description="Карточки партнёров на главной мини-приложения"
        actions={
          <Button onClick={openCreate}>
            <ActionIcon name="add" />
            Добавить
          </Button>
        }
      />

      <Card className="mb-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white">Блок на главной</h3>
          <p className="mt-1 text-sm text-slate-400">
            {partners.length === 0
              ? 'На главной ничего не показывается, пока не добавлен хотя бы один партнёр'
              : sectionVisible
                ? 'Раздел «Партнёры VK Cloud Conf» виден пользователям'
                : 'Раздел скрыт — на главной мини-приложения не показывается'}
          </p>
        </div>
        {partners.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sectionVisible ? 'primary' : 'secondary'}
              size="sm"
              disabled={visibilitySaving}
              onClick={() => void toggleSectionVisible(true)}
            >
              Отображать
            </Button>
            <Button
              variant={!sectionVisible ? 'primary' : 'secondary'}
              size="sm"
              disabled={visibilitySaving}
              onClick={() => void toggleSectionVisible(false)}
            >
              Не отображать
            </Button>
          </div>
        ) : null}
      </Card>

      {loading ? (
        <LoadingBlock />
      ) : partners.length === 0 ? (
        <EmptyState message="Партнёров пока нет" />
      ) : (
        <div className="space-y-3">
          {partners.map((partner, index) => (
            <Card key={partner.id} className="space-y-3">
              <div className="flex items-start gap-3">
                {partner.logoUrl ? (
                  <span className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-surface-2)] sm:h-20 sm:w-32">
                    <img
                      src={partner.logoUrl}
                      alt=""
                      className="max-h-10 max-w-[68%] object-contain"
                      style={{
                        transform: `scale(${partnerLogoScaleFactor(partner.logoScale)})`,
                        transformOrigin: 'center center',
                      }}
                    />
                  </span>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-500 sm:h-20 sm:w-20">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{partner.name}</h3>
                    {partner.logoUrl ? (
                      <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-slate-400">
                        Лого {partner.logoScale}%
                      </span>
                    ) : null}
                  </div>
                  {partner.description ? (
                    <p className="mt-1 text-sm leading-snug text-slate-400">
                      {partner.description}
                    </p>
                  ) : null}
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block truncate text-sm text-blue-400 hover:underline"
                  >
                    {partner.url}
                  </a>
                </div>
              </div>
              <div className="flex justify-end">
                <ListCardActions>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(partner)}>
                    <ActionIcon name="edit" />
                  </Button>
                  <MoveToPositionButton
                    itemLabel={partner.name}
                    currentPosition={index + 1}
                    totalItems={partners.length}
                    onMoveToPosition={(position) => void movePartnerTo(index, position - 1)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => void handleDelete(partner)}>
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
          title={modal === 'create' ? 'Новый партнёр' : 'Редактировать партнёра'}
          onClose={closeModal}
        >
          <div className="space-y-3">
            <span className="text-sm text-slate-400">Логотип</span>
            <div className="flex flex-wrap items-start gap-4">
              {previewUrl ? (
                <span className="flex h-24 w-full max-w-xs items-center justify-center overflow-hidden rounded-xl bg-[var(--color-surface-2)] px-4 py-3">
                  <img
                    src={previewUrl}
                    alt=""
                    className="max-h-10 max-w-[68%] object-contain"
                    style={{
                      transform: `scale(${partnerLogoScaleFactor(form.logoScale)})`,
                      transformOrigin: 'center center',
                    }}
                  />
                </span>
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
                    if (file) selectLogoFile(file);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  {previewUrl ? 'Изменить лого' : 'Загрузить лого'}
                </Button>
                {previewUrl ? (
                  <Button variant="ghost" size="sm" onClick={clearLogo}>
                    <ActionIcon name="close" />
                    Удалить лого
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">Размер логотипа</span>
                <span className="text-sm font-medium text-white">{form.logoScale}%</span>
              </div>
              <input
                type="range"
                min={MIN_PARTNER_LOGO_SCALE}
                max={MAX_PARTNER_LOGO_SCALE}
                step={5}
                value={form.logoScale}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    logoScale: Number(e.target.value),
                  }))
                }
                className="w-full accent-blue-500"
              />
              <div className="flex flex-wrap gap-2">
                {LOGO_SCALE_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={form.logoScale === preset ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() =>
                      setForm((current) => ({ ...current, logoScale: preset }))
                    }
                  >
                    {preset}%
                  </Button>
                ))}
              </div>
              <p className="text-xs leading-snug text-slate-500">
                Превью повторяет мини-приложение. Для одинакового вида выставьте
                один и тот же процент у всех партнёров.
              </p>
            </div>
          </div>

          <Input
            label="Название"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Textarea
            label="Описание"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Ссылка на сайт"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://"
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
