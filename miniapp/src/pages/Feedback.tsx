import { useContext, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { postFeedback } from '../api/client';
import { UserContext } from '../context/UserContext';
import styles from './Page.module.css';

export default function Feedback() {
  const navigate = useNavigate();
  const { userId } = useContext(UserContext);

  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 5) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await postFeedback({
        text: trimmed,
        ...(userId ? { userId } : {}),
      });
      navigate('/', {
        state: { notification: 'Спасибо! Обратная связь отправлена.' },
      });
    } catch {
      setError('Не удалось отправить обратную связь');
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Обратная связь</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}

        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ваш отзыв или предложение…"
          disabled={submitting}
        />

        <button
          type="submit"
          className={styles.btn}
          disabled={submitting || text.trim().length < 5}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
