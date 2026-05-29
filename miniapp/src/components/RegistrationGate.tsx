import type { ReactNode } from 'react';
import ConfDecor from './ConfDecor';
import { useRegistration } from '../hooks/useRegistration';
import {
  MINIAPP_REGISTRATION_MESSAGE,
  MINIAPP_REGISTRATION_TITLE,
} from '../../../src/shared/registrationMessages';
import VkTechLogo from './VkTechLogo';
import styles from './RegistrationGate.module.css';

export default function RegistrationGate({ children }: { children: ReactNode }) {
  const { status, close, isInMax } = useRegistration();

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
        <h2 className={styles.title}>{MINIAPP_REGISTRATION_TITLE}</h2>
        <p className={styles.message}>{MINIAPP_REGISTRATION_MESSAGE}</p>
        <button type="button" className={styles.btn} onClick={close}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
