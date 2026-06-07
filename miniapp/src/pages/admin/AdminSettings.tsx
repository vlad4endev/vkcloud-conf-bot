import { useEffect, useState } from 'react';
import {
  getApiErrorMessage,
  getLinks,
  getTexts,
  updateLinks,
  updateTexts,
} from '../../api/adminClient';

export default function AdminSettings() {
  const [links, setLinks] = useState({ stickerUrl: '', quizUrl: '' });
  const [texts, setTexts] = useState({ eventDescription: '', botWelcome: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([getLinks(), getTexts()])
      .then(([l, t]) => {
        setLinks({ stickerUrl: l.stickerUrl, quizUrl: l.quizUrl });
        setTexts(t);
      })
      .catch((e) => setMessage(getApiErrorMessage(e)));
  }, []);

  async function saveLinks() {
    try {
      await updateLinks(links);
      setMessage('Ссылки сохранены');
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  async function saveTexts() {
    try {
      await updateTexts(texts);
      setMessage('Тексты сохранены');
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  return (
    <div className="page">
      <h1 className="title">Настройки</h1>
      {message ? <p className="success">{message}</p> : null}
      <div className="form">
        <input className="input" placeholder="Стикеры URL" value={links.stickerUrl} onChange={(e) => setLinks((l) => ({ ...l, stickerUrl: e.target.value }))} />
        <button type="button" className="btn btnSecondary" onClick={() => void saveLinks()}>
          Сохранить ссылки
        </button>
        <textarea className="textarea" rows={4} placeholder="Описание события" value={texts.eventDescription} onChange={(e) => setTexts((t) => ({ ...t, eventDescription: e.target.value }))} />
        <textarea className="textarea" rows={3} placeholder="Приветствие бота" value={texts.botWelcome} onChange={(e) => setTexts((t) => ({ ...t, botWelcome: e.target.value }))} />
        <button type="button" className="btn" onClick={() => void saveTexts()}>
          Сохранить тексты
        </button>
      </div>
    </div>
  );
}
