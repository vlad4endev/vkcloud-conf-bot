import type { ReactNode } from 'react';
import ConfDecor from './ConfDecor';
import { useRegistration } from '../hooks/useRegistration';
import VkTechLogo from './VkTechLogo';
import styles from './RegistrationGate.module.css';

const REGISTRATION_TITLE = 'Нужна регистрация';

const REGISTRATION_MESSAGE = `Доступ к приложению конференции открывается после регистрации в боте MAX.

Отправьте боту сообщение в формате:
Иванов Иван Иванович mail@mail.ru

Укажите ФИО и корпоративную почту, которые использовали при регистрации на конференцию. После подтверждения снова откройте приложение.`;

export default function RegistrationGate({ children }: { children: ReactNode }) {
  const { status, close, isInMax } = useRegistration();

  // Локально в браузере (без MAX) — не блокируем UI.
  if (!isInMax) {
    return children;
  }

  if (status === 'registered') {
    return children;
  }

  if (status === 'loading') {
    return (
      <div className={styles.screen}>
        <ConfDecor />
        <div className={styles.loadingWrap}>
          <VkTechLogo size="lg" />
          <p className={styles.eventName}>VK Cloud Conf&apos;26</p>
          <p className={styles.loading}>Загрузка…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <ConfDecor />
      <div className={styles.card}>
        <header className={styles.hero}>
          <VkTechLogo size="lg" className={styles.brandLogo} />
          <p className={styles.eventDate}>17 июня 2026</p>
          <h1 className={styles.eventName}>VK Cloud Conf&apos;26</h1>
        </header>
        <h2 className={styles.title}>{REGISTRATION_TITLE}</h2>
        <p className={styles.message}>{REGISTRATION_MESSAGE}</p>
        <button type="button" className={styles.btn} onClick={close}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
