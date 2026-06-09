import { useEffect, useRef, useState } from 'react';
import type { QuizOption, QuizQuestion, QuizStatus } from '../api/client';
import {
  getQuizQuestions,
  getQuizStatus,
  postQuizAnswer,
} from '../api/client';
import { useUserContext } from '../context/UserContext';
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

function filterPendingQuestions(
  allQuestions: QuizQuestion[],
  answeredQuestionIds: string[],
): QuizQuestion[] {
  const answered = new Set(answeredQuestionIds);
  return allQuestions.filter((question) => !answered.has(question.id));
}

export default function Quiz() {
  const { userId, haptic } = useUserContext();

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
      return;
    }

    let cancelled = false;
    const uid = userId;

    async function init() {
      try {
        const [statusData, allQuestions] = await Promise.all([
          getQuizStatus(uid),
          getQuizQuestions(),
        ]);

        if (cancelled) {
          return;
        }

        setQuizStatus(statusData);

        if (statusData.isComplete) {
          setStatus('finished');
          return;
        }

        const pendingQuestions = filterPendingQuestions(
          allQuestions,
          statusData.answeredQuestionIds,
        );

        setQuestions(pendingQuestions);
        setStatus(pendingQuestions.length > 0 ? 'idle' : 'finished');
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
    if (answering) {
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
            setStatus(updatedStatus.isComplete ? 'finished' : 'idle');
            if (!updatedStatus.isComplete) {
              const allQuestions = await getQuizQuestions();
              setQuestions(
                filterPendingQuestions(
                  allQuestions,
                  updatedStatus.answeredQuestionIds,
                ),
              );
              setCurrentIndex(0);
            }
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
  const answeredBefore = quizStatus?.answeredQuestions ?? 0;
  const totalQuestions = quizStatus?.totalQuestions ?? questions.length;
  const progress =
    totalQuestions > 0
      ? ((answeredBefore + currentIndex) / totalQuestions) * 100
      : 0;
  const hasProgress = (quizStatus?.answeredQuestions ?? 0) > 0;

  if (status === 'loading') {
    return (
      <div className="page">
        <p className="placeholder">Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="title">Квиз</h1>

      {error && <p className="error">{error}</p>}

      {status === 'in_progress' && totalQuestions > 0 && (
        <div className={quizStyles.progressTrack} aria-hidden>
          <div
            className={quizStyles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === 'idle' && (
        <>
          {questions.length === 0 ? (
            <p className="placeholder">Квиз скоро появится</p>
          ) : (
            <>
              {quizStatus && totalQuestions > 0 ? (
                <p className={quizStyles.progressHint}>
                  {hasProgress
                    ? `Пройдено ${quizStatus.answeredQuestions} из ${totalQuestions} вопросов`
                    : `Вопросов в квизе: ${totalQuestions}`}
                </p>
              ) : null}
              <div className="actions">
                <button
                  type="button"
                  className="btn"
                  onClick={handleStart}
                >
                  {hasProgress ? 'Продолжить квиз' : 'Начать квиз'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {status === 'in_progress' && currentQuestion && (
        <>
          <p className={quizStyles.questionMeta}>
            Вопрос {answeredBefore + currentIndex + 1} из {totalQuestions}
          </p>
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
