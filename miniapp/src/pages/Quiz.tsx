import { useEffect, useRef, useState } from 'react';
import type { QuizOption, QuizQuestion, QuizStatus } from '../api/client';
import {
  getQuizQuestions,
  getQuizStatus,
  postQuizAnswer,
} from '../api/client';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import styles from './Page.module.css';
import quizStyles from './Quiz.module.css';

type QuizPageStatus = 'loading' | 'idle' | 'in_progress' | 'finished';

const OPTION_LABELS: Record<QuizOption, string> = {
  a: 'А',
  b: 'Б',
  c: 'В',
  d: 'Г',
};

const OPTIONS: QuizOption[] = ['a', 'b', 'c', 'd'];

function optionText(question: QuizQuestion, option: QuizOption): string {
  const map = {
    a: question.optionA,
    b: question.optionB,
    c: question.optionC,
    d: question.optionD,
  };
  return map[option];
}

export default function Quiz() {
  const { userId, haptic } = useContext(UserContext);

  const [status, setStatus] = useState<QuizPageStatus>('loading');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizOption>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [correctOptions, setCorrectOptions] = useState<
    Record<string, QuizOption>
  >({});
  const [quizStatus, setQuizStatus] = useState<QuizStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setError('Для участия в квизе нужен идентификатор пользователя');
      setStatus('idle');
      return;
    }

    let cancelled = false;
    const uid = userId;

    async function init() {
      try {
        const statusData = await getQuizStatus(uid);

        if (cancelled) {
          return;
        }

        if (statusData.answeredQuestions > 0) {
          setQuizStatus(statusData);
          setStatus('finished');
          return;
        }

        const loadedQuestions = await getQuizQuestions();

        if (cancelled) {
          return;
        }

        setQuestions(loadedQuestions);
        setStatus('idle');
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить квиз');
          setStatus('idle');
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function handleStart() {
    setCurrentIndex(0);
    setStatus('in_progress');
  }

  async function handleAnswer(option: QuizOption) {
    if (!userId || answering) {
      return;
    }

    const question = questions[currentIndex];
    if (!question || results[question.id] !== undefined) {
      return;
    }

    const questionIndex = currentIndex;

    setAnswering(true);
    setError(null);

    try {
      const result = await postQuizAnswer({
        userId,
        questionId: question.id,
        answer: option,
      });

      setAnswers((prev) => ({ ...prev, [question.id]: option }));
      setResults((prev) => ({ ...prev, [question.id]: result.isCorrect }));
      setCorrectOptions((prev) => ({
        ...prev,
        [question.id]: result.correctOption,
      }));
      haptic('success');

      advanceTimerRef.current = setTimeout(async () => {
        const isLast = questionIndex >= questions.length - 1;

        if (isLast) {
          try {
            const updatedStatus = await getQuizStatus(userId);
            setQuizStatus(updatedStatus);
            setStatus('finished');
          } catch {
            setError('Не удалось загрузить результаты');
          }
        } else {
          setCurrentIndex((prev) => prev + 1);
        }

        setAnswering(false);
      }, 1500);
    } catch {
      setError('Не удалось отправить ответ');
      haptic('error');
      setAnswering(false);
    }
  }

  function getOptionClassName(
    question: QuizQuestion,
    option: QuizOption,
  ): string {
    if (!(question.id in results)) {
      return quizStyles.optionBtn;
    }

    const selected = answers[question.id];
    const correct = correctOptions[question.id];
    if (option === correct) {
      return `${quizStyles.optionBtn} ${quizStyles.optionCorrect}`;
    }
    if (option === selected) {
      return `${quizStyles.optionBtn} ${quizStyles.optionWrong}`;
    }
    return quizStyles.optionBtn;
  }

  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  if (status === 'loading') {
    return (
      <div className={styles.page}>
        <p className={styles.placeholder}>Загрузка…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Квиз</h1>

      {error && <p className={styles.error}>{error}</p>}

      {status === 'in_progress' && questions.length > 0 && (
        <div className={quizStyles.progressTrack} aria-hidden>
          <div
            className={quizStyles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === 'idle' && (
        <>
          {questions.length === 0 && userId ? (
            <p className={styles.placeholder}>Квиз скоро появится</p>
          ) : questions.length > 0 ? (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btn}
                onClick={handleStart}
                disabled={!userId}
              >
                Начать квиз
              </button>
            </div>
          ) : null}
        </>
      )}

      {status === 'in_progress' && currentQuestion && (
        <>
          <p className={quizStyles.question}>{currentQuestion.question}</p>
          <div className={quizStyles.options}>
            {OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={getOptionClassName(currentQuestion, option)}
                onClick={() => handleAnswer(option)}
                disabled={answering || currentQuestion.id in results}
              >
                {OPTION_LABELS[option]}. {optionText(currentQuestion, option)}
              </button>
            ))}
          </div>
        </>
      )}

      {status === 'finished' && quizStatus && (
        <>
          {quizStatus.isWinner ? (
            <p className={quizStyles.resultWinner} role="status">
              🏆 Поздравляем! Вы победитель!
            </p>
          ) : (
            <p className={quizStyles.resultScore} role="status">
              Вы ответили правильно на {quizStatus.correctAnswers} из{' '}
              {quizStatus.totalQuestions} вопросов
            </p>
          )}
        </>
      )}
    </div>
  );
}
