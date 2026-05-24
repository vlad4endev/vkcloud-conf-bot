import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getConfig } from '../api/client';
import styles from './Page.module.css';

type LocationState = {
  notification?: string;
};

export default function EventInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const notification = (location.state as LocationState | null)?.notification;

  const [eventDescription, setEventDescription] = useState('');
  const [chatUrl, setChatUrl] = useState('');
  const [stickerUrl, setStickerUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfig()
      .then((config) => {
        setEventDescription(config.event_description);
        setChatUrl(config.chat_url);
        setStickerUrl(config.sticker_url);
      })
      .catch(() => {
        setEventDescription('');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>О конференции</h1>

      {notification && (
        <p className={styles.notification} role="status">
          {notification}
        </p>
      )}

      {loading ? (
        <p className={styles.placeholder}>Загрузка…</p>
      ) : eventDescription ? (
        <p className={styles.text}>{eventDescription}</p>
      ) : (
        <p className={styles.placeholder}>Описание мероприятия скоро появится</p>
      )}

      <div className={styles.actions}>
        {chatUrl && (
          <a
            className={styles.linkBtn}
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Чат участников
          </a>
        )}
        {stickerUrl && (
          <a
            className={styles.linkBtn}
            href={stickerUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Стикерпак
          </a>
        )}
        <button
          type="button"
          className={styles.btn}
          onClick={() => navigate('/quiz')}
        >
          Перейти к Квизу
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => navigate('/feedback')}
        >
          Отправить обратную связь
        </button>
      </div>
    </div>
  );
}
