import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getConfig } from '../api/client';
import { useAdmin } from '../context/AdminContext';
import styles from './EventInfo.module.css';

const EVENT_ABOUT_LEAD =
  'Облачная конференция VK Tech для бизнеса и разработчиков';

const EVENT_ABOUT_BODY =
  'Покажем, как строить безопасную и производительную инфраструктуру для бизнес-критичных систем в облаке — от высоконагруженных баз данных до ИИ-сервисов. Представим новые сервисы облачной платформы, расскажем про планы развития VK Cloud и эксклюзивно презентуем исследование рынка искусственного интеллекта России с прогнозом развития на 2026–2030 годы';

type LocationState = {
  notification?: string;
};

export default function EventInfo() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdminMode, openUnlockModal } = useAdmin();
  const notification = (location.state as LocationState | null)?.notification;
  const needUnlock = (location.state as { needAdminUnlock?: boolean } | null)?.needAdminUnlock;

  const [eventDescription, setEventDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfig()
      .then((config) => {
        setEventDescription(config.event_description);
      })
      .catch(() => {
        setEventDescription('');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (needUnlock) {
      openUnlockModal();
    }
  }, [needUnlock, openUnlockModal]);

  useEffect(() => {
    if (isAdminMode) {
      navigate('/admin', { replace: true });
    }
  }, [isAdminMode, navigate]);

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="event-hero-title">
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>Конструкторское бюро будущего</span>
          <h1 id="event-hero-title" className={styles.heroTitle}>
            VK Cloud Conf 2026
          </h1>
          <p className={styles.heroSubtitle}>17 июня · Москва</p>
          <span className={styles.heroAccent} aria-hidden />
        </div>
      </section>

      {notification && (
        <p className="notification" role="status">
          {notification}
        </p>
      )}

      <section className={styles.section} aria-labelledby="about-title">
        <h2 id="about-title" className={styles.sectionTitle}>
          О мероприятии
        </h2>
        {loading ? (
          <p className="placeholder">Загрузка…</p>
        ) : (
          <>
            <p className={styles.aboutLead}>{EVENT_ABOUT_LEAD}</p>
            <p className={styles.description}>
              {eventDescription || EVENT_ABOUT_BODY}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
