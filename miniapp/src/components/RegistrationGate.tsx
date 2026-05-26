import type { ReactNode } from 'react';
import { useRegistration } from '../hooks/useRegistration';
import styles from './RegistrationGate.module.css';

const REGISTRATION_TITLE = 'Нужна регистрация';

const REGISTRATION_MESSAGE = `Доступ к приложению конференции открывается после регистрации в боте MAX.

Отправьте боту сообщение в формате:
Иванов Иван Иванович mail@mail.ru

Укажите ФИО и корпоративную почту, которые использовали при регистрации на конференцию. После подтверждения снова откройте приложение.`;

export default function RegistrationGate({ children }: { children: ReactNode }) {
  const { status, close, isInMax } = useRegistration();

  if (!isInMax || status === 'skipped' || status === 'registered') {
    return children;
  }

  if (status === 'loading') {
    return (
      <div className={styles.screen}>
        <p className={styles.loading}>Загрузка…</p>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <span className={styles.logo}>VK CLOUD CONF</span>
        <h1 className={styles.title}>{REGISTRATION_TITLE}</h1>
        <p className={styles.message}>{REGISTRATION_MESSAGE}</p>
        <button type="button" className={styles.btn} onClick={close}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
