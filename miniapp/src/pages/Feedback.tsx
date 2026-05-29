import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { postFeedback } from '../api/client';
import { useUserContext } from '../context/UserContext';

export default function Feedback() {
  const navigate = useNavigate();
  const { userId } = useUserContext();

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
        userId,
      });
      navigate('/', {
        state: { notification: 'Спасибо! Сообщение отправлено.' },
      });
    } catch {
      setError('Не удалось отправить обратную связь');
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1 className="title">Связь</h1>

      <form className="form" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}

        <textarea
          className="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ваш отзыв или предложение…"
          disabled={submitting}
        />

        <button
          type="submit"
          className="btn"
          disabled={submitting || text.trim().length < 5}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
