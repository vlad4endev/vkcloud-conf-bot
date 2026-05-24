import { useContext, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  getSpeakerById,
  postQuestion,
  type Speaker,
} from '../api/client';
import { UserContext } from '../context/UserContext';
import styles from './Page.module.css';

export default function SpeakerDetail() {
  const { id } = useParams<{ id: string }>();
  const { userId, haptic } = useContext(UserContext);

  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Спикер не найден');
      setLoading(false);
      return;
    }

    getSpeakerById(id)
      .then(setSpeaker)
      .catch(() => setError('Не удалось загрузить спикера'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!id || !userId || !question.trim()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await postQuestion(id, { userId, question: question.trim() });
      setSubmitted(true);
      setQuestion('');
      haptic('success');
    } catch {
      setSubmitError('Не удалось отправить вопрос');
      haptic('error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.placeholder}>Загрузка…</p>
      </div>
    );
  }

  if (error || !speaker) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error ?? 'Спикер не найден'}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {speaker.photoUrl ? (
        <img
          src={speaker.photoUrl}
          alt=""
          className={styles.detailPhoto}
        />
      ) : (
        <div className={styles.detailAvatar} aria-hidden>
          👤
        </div>
      )}

      <h1 className={styles.title}>{speaker.name}</h1>
      {speaker.bio && <p className={styles.text}>{speaker.bio}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title} style={{ fontSize: '18px' }}>
          Задать вопрос спикеру
        </h2>

        {submitted && (
          <p className={styles.success} role="status">
            Вопрос отправлен!
          </p>
        )}
        {submitError && <p className={styles.error}>{submitError}</p>}
        {!userId && (
          <p className={styles.error}>
            Для отправки вопроса нужен идентификатор пользователя
          </p>
        )}

        <textarea
          className={styles.textarea}
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            setSubmitted(false);
          }}
          placeholder="Ваш вопрос…"
          disabled={submitting}
        />

        <button
          type="submit"
          className={styles.btn}
          disabled={submitting || !userId || question.trim().length < 10}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
