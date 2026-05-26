import { useState } from 'react';
import { getApiErrorMessage, sendNotification } from '../../api/adminClient';

export default function AdminNotify() {
  const [text, setText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [message, setMessage] = useState('');

  async function send(immediate: boolean) {
    try {
      await sendNotification({
        text: text.trim(),
        scheduledAt:
          !immediate && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : undefined,
      });
      setMessage(immediate ? 'Отправлено' : 'Запланировано');
      setText('');
      setScheduledAt('');
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  return (
    <div className="page">
      <h1 className="title">Рассылка</h1>
      <div className="form">
        <textarea className="textarea" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Текст сообщения" />
        <input className="input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        {message ? <p className={message.includes('Ошиб') || message.includes('unavailable') ? 'error' : 'success'}>{message}</p> : null}
        <button type="button" className="btn" onClick={() => void send(true)} disabled={Boolean(scheduledAt)}>
          Отправить сейчас
        </button>
        <button type="button" className="btn btnSecondary" onClick={() => void send(false)} disabled={!scheduledAt}>
          Запланировать
        </button>
      </div>
    </div>
  );
}
