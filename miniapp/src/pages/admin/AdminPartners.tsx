import { useEffect, useRef, useState } from 'react';
import {
  createPartner,
  deletePartner,
  deletePartnerLogo,
  getApiErrorMessage,
  getPartners,
  setPartnersSectionVisible,
  updatePartner,
  uploadPartnerLogo,
  type AdminPartner,
} from '../../api/adminClient';

type LogoDraft =
  | { kind: 'none' }
  | { kind: 'existing'; url: string }
  | { kind: 'preview'; file: File; previewUrl: string };

const emptyLogo: LogoDraft = { kind: 'none' };

function revokePreview(logo: LogoDraft) {
  if (logo.kind === 'preview') {
    URL.revokeObjectURL(logo.previewUrl);
  }
}

function logoFromPartner(partner: AdminPartner | null): LogoDraft {
  if (partner?.logoUrl) {
    return { kind: 'existing', url: partner.logoUrl };
  }
  return emptyLogo;
}

function logoPreviewUrl(logo: LogoDraft): string | null {
  if (logo.kind === 'existing') return logo.url;
  if (logo.kind === 'preview') return logo.previewUrl;
  return null;
}

export default function AdminPartners() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logo, setLogo] = useState<LogoDraft>(emptyLogo);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const data = await getPartners();
      setPartners(data.partners);
      setSectionVisible(data.sectionVisible);
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  async function toggleSectionVisible(visible: boolean) {
    if (visibilitySaving || visible === sectionVisible) return;
    setVisibilitySaving(true);
    try {
      const next = await setPartnersSectionVisible(visible);
      setSectionVisible(next);
      setMessage(next ? 'Блок показывается на главной' : 'Блок скрыт с главной');
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    } finally {
      setVisibilitySaving(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setName('');
    setDescription('');
    setUrl('');
    setEditingId(null);
    setLogo((current) => {
      revokePreview(current);
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

  async function save() {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName || !trimmedUrl) {
      setMessage('Укажите название и ссылку');
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        description: description.trim(),
        url: trimmedUrl,
      };

      if (editingId) {
        const existing = partners.find((p) => p.id === editingId);
        await updatePartner(editingId, payload);
        await applyLogoChanges(editingId, Boolean(existing?.logoUrl));
      } else {
        const created = await createPartner(payload);
        if (logo.kind === 'preview') {
          await uploadPartnerLogo(created.id, logo.file);
        }
      }

      resetForm();
      setMessage('Сохранено');
      await load();
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  const preview = logoPreviewUrl(logo);

  return (
    <div className="page">
      <h1 className="title">Партнёры</h1>
      {message ? (
        <p
          className={
            message === 'Сохранено' ||
            message === 'Блок показывается на главной' ||
            message === 'Блок скрыт с главной'
              ? 'success'
              : 'error'
          }
        >
          {message}
        </p>
      ) : null}

      <div className="session">
        <p className="sessionTitle">Блок на главной</p>
        <p className="sessionMeta">
          {partners.length === 0
            ? 'На главной ничего не показывается, пока не добавлен хотя бы один партнёр'
            : sectionVisible
              ? 'Партнёры видны пользователям под разделом «О мероприятии»'
              : 'Раздел партнёров скрыт в мини-приложении'}
        </p>
        {partners.length > 0 ? (
          <div
            className="actions"
            style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
          >
            <button
              type="button"
              className={sectionVisible ? 'btn' : 'btn btnSecondary'}
              style={{ width: 'auto', flex: 1 }}
              disabled={visibilitySaving}
              onClick={() => void toggleSectionVisible(true)}
            >
              Отображать
            </button>
            <button
              type="button"
              className={!sectionVisible ? 'btn' : 'btn btnSecondary'}
              style={{ width: 'auto', flex: 1 }}
              disabled={visibilitySaving}
              onClick={() => void toggleSectionVisible(false)}
            >
              Не отображать
            </button>
          </div>
        ) : null}
      </div>

      <div className="form">
        <input
          className="input"
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="textarea"
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <input
          className="input"
          placeholder="Ссылка (https://…)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
        />

        <div className="actions" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {preview ? (
            <img
              src={preview}
              alt=""
              className="cardPhoto"
              style={{ borderRadius: 8, width: 56, height: 56, objectFit: 'contain' }}
            />
          ) : (
            <div
              className="avatar"
              style={{ borderRadius: 8, width: 56, height: 56, fontSize: 12 }}
            >
              ?
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLogo((current) => {
                revokePreview(current);
                return {
                  kind: 'preview',
                  file,
                  previewUrl: URL.createObjectURL(file),
                };
              });
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn btnSecondary"
            style={{ width: 'auto', flex: 1 }}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? 'Сменить лого' : 'Загрузить лого'}
          </button>
          {preview ? (
            <button
              type="button"
              className="btn btnSecondary"
              style={{ width: 'auto' }}
              onClick={() => {
                setLogo((current) => {
                  revokePreview(current);
                  return emptyLogo;
                });
              }}
            >
              Убрать
            </button>
          ) : null}
        </div>

        <button type="button" className="btn" onClick={() => void save()}>
          {editingId ? 'Обновить' : 'Добавить'}
        </button>
        {editingId ? (
          <button type="button" className="btn btnSecondary" onClick={resetForm}>
            Отмена
          </button>
        ) : null}
      </div>

      <ul className="list" style={{ marginTop: 16 }}>
        {partners.map((partner) => (
          <li key={partner.id} className="session">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {partner.logoUrl ? (
                <img
                  src={partner.logoUrl}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    objectFit: 'contain',
                    border: '1px solid var(--color-border)',
                  }}
                />
              ) : null}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="sessionTitle">{partner.name}</p>
                {partner.description ? (
                  <p className="sessionMeta">{partner.description}</p>
                ) : null}
                <p className="sessionMeta">{partner.url}</p>
              </div>
            </div>
            <div className="actions" style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => {
                  setEditingId(partner.id);
                  setName(partner.name);
                  setDescription(partner.description);
                  setUrl(partner.url);
                  setLogo((current) => {
                    revokePreview(current);
                    return logoFromPartner(partner);
                  });
                }}
              >
                Изменить
              </button>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => {
                  if (confirm('Удалить партнёра?')) {
                    void deletePartner(partner.id).then(load);
                  }
                }}
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
