import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getConfig } from '../api/client';
import { useAdmin } from '../context/AdminContext';
import FeedbackEntryButton from '../components/FeedbackEntryButton';
import HubAction from '../components/HubAction';
import PartnersEntryButton from '../components/PartnersSection/PartnersEntryButton';
import AppIcon from '../components/AppIcon';
import { appIcons } from '../icons';
import styles from './EventInfo.module.css';

const CONF_HERO_GIF = `${import.meta.env.BASE_URL}conf-hero.gif`;
const CONF_HERO_FALLBACK = `${import.meta.env.BASE_URL}conf-hero.png`;

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
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [heroSrc, setHeroSrc] = useState(CONF_HERO_GIF);

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

  const aboutBody = eventDescription || EVENT_ABOUT_BODY;

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="event-hero-title">
        <h1 id="event-hero-title" className={styles.heroTitle}>
          <span className="sr-only">VK cloud Conf&apos;26</span>
          <img
            src={heroSrc}
            alt="VK cloud Conf'26"
            className={styles.heroArt}
            width={1024}
            height={576}
            decoding="async"
            onError={() => {
              if (heroSrc !== CONF_HERO_FALLBACK) {
                setHeroSrc(CONF_HERO_FALLBACK);
              }
            }}
          />
        </h1>
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
            <button
              type="button"
              className={styles.aboutToggle}
              onClick={() => setAboutExpanded((v) => !v)}
              aria-expanded={aboutExpanded}
              aria-controls="about-body"
            >
              {aboutExpanded ? 'Свернуть' : 'Подробнее'}
              <AppIcon
                icon={appIcons.expand}
                size="sm"
                className={
                  aboutExpanded ? styles.aboutChevronExpanded : styles.aboutChevron
                }
              />
            </button>
            {aboutExpanded && (
              <p id="about-body" className={styles.description}>
                {aboutBody}
              </p>
            )}
          </>
        )}
      </section>

      <div className="hubActions">
        <HubAction icon={appIcons.map} onClick={() => navigate('/map')}>
          Карта
        </HubAction>
        <PartnersEntryButton />
      </div>

      <FeedbackEntryButton />
    </div>
  );
}
