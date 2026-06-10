import { useEffect, useRef, useState } from 'react';
import {
  createPartner,
  deletePartner,
  deletePartnerLogo,
  getApiErrorMessage,
  getPartners,
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logo, setLogo] = useState<LogoDraft>(emptyLogo);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      setPartners(await getPartners());
    } catch (e) {
      setMessage(getApiErrorMessage(e));
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
        <p className={message === 'Сохранено' ? 'success' : 'error'}>{message}</p>
      ) : null}

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
            <div
              style={{
                width: 120,
                height: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                borderRadius: 8,
                border: '1px solid var(--color-border)',
              }}
            >
              <img
                src={preview}
                alt=""
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div
              className="avatar"
              style={{
                borderRadius: 8,
                width: 120,
                height: 72,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              ?
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
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
              <div
                style={{
                  width: 88,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {partner.logoUrl ? (
                  <img
                    src={partner.logoUrl}
                    alt=""
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span className="sessionMeta">?</span>
                )}
              </div>
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
