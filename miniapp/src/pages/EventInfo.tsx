import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getConfig } from '../api/client';
import { useAdmin } from '../context/AdminContext';
import VkTechLogo from '../components/VkTechLogo';
import styles from './EventInfo.module.css';

const EVENT_ABOUT_LEAD =
  'Облачная конференция VK Tech для бизнеса и разработчиков';

const EVENT_ABOUT_BODY =
  'Покажем, как строить безопасную и производительную инфраструктуру для бизнес-критичных систем в облаке — от высоконагруженных баз данных до ИИ-сервисов. Представим новые сервисы облачной платформы, расскажем про планы развития VK Cloud и эксклюзивно презентуем исследование рынка искусственного интеллекта России с прогнозом развития на 2026–2030 годы';

type GuestJourneyStep = {
  step: string;
  title: string;
  text: string;
  highlight?: boolean;
};

const GUEST_JOURNEY: GuestJourneyStep[] = [
  {
    step: '1',
    title: 'Пригласительный этап',
    text: 'Атмосфера конференции, архитектура VK Cloud Conf и регистрация в MAX.',
  },
  {
    step: '2',
    title: 'Прибытие на площадку',
    text: 'Регистрация, бейджи, welcome pack и встреча гостей.',
  },
  {
    step: '3',
    title: 'Welcome, экспозона',
    text: 'Интерактивные зоны, фотозоны и экспозона партнёров.',
    highlight: true,
  },
  {
    step: '4',
    title: 'Деловая программа',
    text: 'Доклады, кофе-брейки, обед и нетворкинг.',
  },
  {
    step: '5',
    title: 'Вечерняя программа',
    text: 'Переход от деловой части к неформальному общению.',
  },
  {
    step: '6',
    title: 'После события',
    text: 'Фото, видео и материалы для участников.',
  },
];

const TRACKS = [
  { name: 'Технологии', desc: 'Security Gate, облачная платформа, ИИ-сервисы' },
  { name: 'Бизнес-кейсы', desc: 'Практика внедрения и масштабирования в облаке' },
] as const;

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
        <p className={styles.heroDate}>17 июня 2026</p>
        <h1 id="event-hero-title" className={styles.heroTitle}>
          VK Cloud Conf&apos;26
        </h1>
        <p className={styles.heroTagline}>Конструкторское бюро будущего</p>
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

      <section className={styles.section} aria-labelledby="tracks-title">
        <h2 id="tracks-title" className={styles.sectionTitle}>
          Два трека
        </h2>
        <ul className={styles.trackList}>
          {TRACKS.map((track) => (
            <li key={track.name} className={styles.trackItem}>
              <span className={styles.trackName}>{track.name}</span>
              <span className={styles.trackDesc}>{track.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.journeySection} aria-labelledby="journey-title">
        <h2 id="journey-title" className={styles.journeyTitle}>
          путь гостя
        </h2>
        <div className={styles.journeyScroll}>
          {GUEST_JOURNEY.map((item) => (
            <article key={item.step} className={styles.journeyCard}>
              <span className={styles.journeyWatermark} aria-hidden>
                {item.step}
              </span>
              <h3 className={styles.journeyCardTitle}>{item.title}</h3>
              <p
                className={
                  item.highlight ? styles.journeyCardTextHighlight : styles.journeyCardText
                }
              >
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.brandFooter}>
        <VkTechLogo size="md" muted />
      </footer>
    </div>
  );
}
