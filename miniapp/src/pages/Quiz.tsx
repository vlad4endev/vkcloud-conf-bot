import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
import type { QuizOption, QuizQuestion, QuizStatus } from '../api/client';
import AppIcon from '../components/AppIcon';
import {
  getApiErrorMessage,
  getQuizQuestions,
  getQuizStatus,
  postQuizAnswer,
} from '../api/client';
import { useQuizLive } from '../context/QuizLiveContext';
import { useUserContext } from '../context/UserContext';
import {
  applyAnswerToQuizStatus,
  countAnsweredInCategory,
  findNextQuestion,
  toAnsweredSet,
} from '../lib/quizFlow';
import quizStyles from './Quiz.module.css';

type QuizPageStatus = 'loading' | 'idle' | 'in_progress' | 'finished';

const OPTION_LABELS: Record<QuizOption, string> = {
  a: 'А',
  b: 'Б',
  c: 'В',
  d: 'Г',
};

const OPTIONS: QuizOption[] = ['a', 'b', 'c', 'd'];
const ANSWER_FEEDBACK_MS = 1500;

const QUIZ_RULES = [
  'Каждый участник может пройти квиз только один раз.',
  'Все ответы на вопросы можно найти на стендах партнёров и экспонентов — подходите, общайтесь и знакомьтесь с компаниями.',
  'За призом необходимо обратиться на стойку регистрации после прохождения квиза.',
  'Получение подарков доступно с 12:00 в зоне регистрации.',
  'Состав подарков может меняться, отдельные позиции могут закончиться.',
] as const;

function QuizRules() {
  return (
    <section className={quizStyles.rules} aria-labelledby="quiz-rules-title">
      <h2 id="quiz-rules-title" className={quizStyles.rulesTitle}>
        Основные правила
      </h2>
      <ul className={quizStyles.rulesList}>
        {QUIZ_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </section>
  );
}

function formatPointsLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return 'баллов';
  }
  if (mod10 === 1) {
    return 'балл';
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'балла';
  }
  return 'баллов';
}

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
  const { userId, haptic } = useUserContext();
  const { liveState } = useQuizLive();

  const [status, setStatus] = useState<QuizPageStatus>('loading');
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(() => new Set());
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuizOption>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [correctOptions, setCorrectOptions] = useState<
    Record<string, QuizOption>
  >({});
  const [quizStatus, setQuizStatus] = useState<QuizStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectionHidden, setSectionHidden] = useState(false);
  const [answering, setAnswering] = useState(false);

  const statusRef = useRef(status);
  statusRef.current = status;

  const allQuestionsRef = useRef(allQuestions);
  allQuestionsRef.current = allQuestions;

  const answeredIdsRef = useRef(answeredIds);
  answeredIdsRef.current = answeredIds;

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!userId || !liveState) {
      return;
    }

    let cancelled = false;
    const uid = userId;
    const currentLiveState = liveState;
    const syncKey = `${currentLiveState.revision}|${currentLiveState.sectionVisible}|${currentLiveState.questionsCount}`;

    if (liveSyncKeyRef.current === syncKey && statusRef.current !== 'loading') {
      return;
    }
    liveSyncKeyRef.current = syncKey;

    async function syncQuiz() {
      try {
        if (!currentLiveState.sectionVisible) {
          if (!cancelled) {
            setSectionHidden(true);
            setError(null);
            setStatus('idle');
            setCurrentQuestionId(null);
          }
          return;
        }

        const [statusData, questions] = await Promise.all([
          getQuizStatus(uid),
          getQuizQuestions(),
        ]);

        if (cancelled) {
          return;
        }

        setSectionHidden(false);
        setError(null);

        const answered = toAnsweredSet(statusData.answeredQuestionIds);

        setQuizStatus(statusData);
        setAllQuestions(questions);
        setAnsweredIds(answered);

        if (statusData.isComplete) {
          setStatus('finished');
          setCurrentQuestionId(null);
          return;
        }

        if (statusRef.current === 'in_progress') {
          const nextQuestion = findNextQuestion(questions, answered);
          setCurrentQuestionId((prev) => {
            if (prev && !answered.has(prev)) {
              return prev;
            }
            return nextQuestion?.id ?? null;
          });
          if (!nextQuestion) {
            setStatus('finished');
          }
          return;
        }

        setCurrentQuestionId(null);
        setStatus(questions.length > 0 ? 'idle' : 'finished');
      } catch (loadError) {
        if (!cancelled && statusRef.current !== 'in_progress') {
          setError(getApiErrorMessage(loadError));
          setStatus('idle');
        }
      }
    }

    void syncQuiz().catch((loadError) => {
      if (!cancelled && statusRef.current !== 'in_progress') {
        setError(getApiErrorMessage(loadError));
        setStatus('idle');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId, liveState]);

  function handleStart() {
    const nextQuestion = findNextQuestion(
      allQuestionsRef.current,
      answeredIdsRef.current,
    );
    if (!nextQuestion) {
      setStatus('finished');
      return;
    }

    setCurrentQuestionId(nextQuestion.id);
    setError(null);
    setStatus('in_progress');
  }

  function handleExit() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    setAnswering(false);
    setCurrentQuestionId(null);
    setStatus('idle');
  }

  async function handleAnswer(option: QuizOption) {
    if (answering || !userId) {
      return;
    }

    const question = allQuestions.find((item) => item.id === currentQuestionId);
    if (!question || results[question.id] !== undefined) {
      return;
    }

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

      const nextAnsweredIds = new Set(answeredIdsRef.current);
      nextAnsweredIds.add(question.id);
      setAnsweredIds(nextAnsweredIds);
      answeredIdsRef.current = nextAnsweredIds;

      setQuizStatus((prev) =>
        prev
          ? applyAnswerToQuizStatus(prev, question.id, result.isCorrect)
          : prev,
      );

      haptic('success');

      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }

      advanceTimerRef.current = setTimeout(() => {
        const nextQuestion = findNextQuestion(
          allQuestionsRef.current,
          answeredIdsRef.current,
        );

        if (!nextQuestion) {
          void (async () => {
            try {
              const updatedStatus = await getQuizStatus(userId);
              setQuizStatus(updatedStatus);
              setAnsweredIds(toAnsweredSet(updatedStatus.answeredQuestionIds));
              setStatus(updatedStatus.isComplete ? 'finished' : 'idle');
              setCurrentQuestionId(null);
            } catch {
              setError('Не удалось загрузить результаты');
            } finally {
              setAnswering(false);
            }
          })();
          return;
        }

        setCurrentQuestionId(nextQuestion.id);
        setAnswering(false);
      }, ANSWER_FEEDBACK_MS);
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

  const currentQuestion =
    allQuestions.find((question) => question.id === currentQuestionId) ?? null;
  const answeredBefore = quizStatus?.answeredQuestions ?? answeredIds.size;
  const totalQuestions = quizStatus?.totalQuestions ?? allQuestions.length;
  const questionNumber =
    currentQuestion && totalQuestions > 0
      ? Math.min(
          answeredBefore -
            (results[currentQuestion.id] !== undefined ? 1 : 0) +
            1,
          totalQuestions,
        )
      : 0;
  const progress =
    totalQuestions > 0 ? (answeredBefore / totalQuestions) * 100 : 0;
  const hasProgress = answeredIds.size > 0;
  const categoryProgress = useMemo(() => {
    try {
      return countAnsweredInCategory(allQuestions, answeredIds);
    } catch {
      return [];
    }
  }, [allQuestions, answeredIds]);

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
          {sectionHidden ? (
            <p className="placeholder">Раздел «Квиз» временно недоступен</p>
          ) : allQuestions.length === 0 ? (
            <p className="placeholder">Квиз скоро появится</p>
          ) : (
            <>
              <QuizRules />
              {quizStatus && totalQuestions > 0 ? (
                <p className={quizStyles.progressHint}>
                  {hasProgress
                    ? `Пройдено ${quizStatus.answeredQuestions} из ${totalQuestions} вопросов`
                    : `Вопросов в квизе: ${totalQuestions}`}
                </p>
              ) : null}
              {categoryProgress.length > 0 ? (
                <section
                  className={quizStyles.categoryList}
                  aria-label="Категории квиза"
                >
                  {categoryProgress.map(({ category, total, answered, isComplete }) => (
                    <div
                      key={category}
                      className={
                        isComplete
                          ? `${quizStyles.categoryCard} ${quizStyles.categoryCardComplete}`
                          : quizStyles.categoryCard
                      }
                    >
                      <div className={quizStyles.categoryHeader}>
                        <span className={quizStyles.categoryTitle}>{category}</span>
                        <span className={quizStyles.categoryCount}>
                          {isComplete ? (
                            <span className={quizStyles.categoryCompleteBadge}>
                              Пройдено
                            </span>
                          ) : null}
                          {answered} / {total}
                        </span>
                      </div>
                      <div className={quizStyles.categoryTrack} aria-hidden>
                        <div
                          className={
                            isComplete
                              ? `${quizStyles.categoryFill} ${quizStyles.categoryFillComplete}`
                              : quizStyles.categoryFill
                          }
                          style={{
                            width: `${total > 0 ? (answered / total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </section>
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
          <span className={quizStyles.categoryBadge}>{currentQuestion.category}</span>
          <p className={quizStyles.questionMeta}>
            Вопрос {questionNumber} из {totalQuestions}
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
          <div className={quizStyles.exitActions}>
            <button
              type="button"
              className="btn btnSecondary"
              onClick={handleExit}
              disabled={answering && !(currentQuestion.id in results)}
            >
              Выйти
            </button>
          </div>
        </>
      )}

      {status === 'in_progress' && !currentQuestion && (
        <p className="placeholder">Загрузка вопроса…</p>
      )}

      {status === 'finished' && quizStatus && (
        <section
          className={
            quizStatus.isWinner
              ? `${quizStyles.resultCard} ${quizStyles.resultCardWinner}`
              : quizStyles.resultCard
          }
          role="status"
          aria-live="polite"
        >
          <div className={quizStyles.resultAccentBar} aria-hidden />

          <div className={quizStyles.resultIconWrap}>
            <AppIcon icon={Trophy} size={28} />
          </div>

          <h2 className={quizStyles.resultTitle}>Спасибо за участие!</h2>

          <div className={quizStyles.scoreBlock}>
            <span className={quizStyles.scoreValue}>
              {quizStatus.correctAnswers}
            </span>
            <span className={quizStyles.scoreLabel}>
              {formatPointsLabel(quizStatus.correctAnswers)}
            </span>
          </div>

          <p className={quizStyles.resultMeta}>
            {quizStatus.correctAnswers} из {quizStatus.totalQuestions} правильных
            ответов
          </p>

          <p className={quizStyles.resultPrize}>
            Обратитесь на стойку регистрации за подарком.
          </p>
        </section>
      )}
    </div>
  );
}
