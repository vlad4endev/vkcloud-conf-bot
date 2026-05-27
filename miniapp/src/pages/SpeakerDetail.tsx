import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getSpeakerById,
  postQuestion,
  type Speaker,
} from '../api/client';
import { useUserContext } from '../context/UserContext';
import { formatSpeakerSessionLine } from '../lib/speakerSessions';

export default function SpeakerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, haptic } = useUserContext();

  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      setQuestion('');
      haptic('success');
      navigate('/speakers', {
        state: { notification: 'Вопрос отправлен спикеру!' },
      });
    } catch {
      setSubmitError('Не удалось отправить вопрос');
      haptic('error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="placeholder">Загрузка…</p>
      </div>
    );
  }

  if (error || !speaker) {
    return (
      <div className="page">
        <p className="error">{error ?? 'Спикер не найден'}</p>
      </div>
    );
  }

  return (
    <div className="page">
      {speaker.photoUrl ? (
        <img src={speaker.photoUrl} alt="" className="detailPhoto" />
      ) : (
        <div className="detailAvatar" aria-hidden>
          👤
        </div>
      )}

      <h1 className="title">{speaker.name}</h1>
      {speaker.profession ? (
        <p className="text speakerProfession">{speaker.profession}</p>
      ) : null}
      {speaker.sessions.length > 0 ? (
        <ul className="speakerSessions">
          {speaker.sessions.map((session) => (
            <li key={session.id}>{formatSpeakerSessionLine(session)}</li>
          ))}
        </ul>
      ) : null}

      <form className="form" onSubmit={handleSubmit}>
        <h2 className="title" style={{ fontSize: '18px' }}>
          Задать вопрос спикеру
        </h2>

        {submitError && <p className="error">{submitError}</p>}

        <textarea
          className="textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ваш вопрос…"
          disabled={submitting}
        />

        <button
          type="submit"
          className="btn"
          disabled={submitting || question.trim().length < 10}
        >
          Подтвердить отправку
        </button>
      </form>
    </div>
  );
}
