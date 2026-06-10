import ActionIcon from '../components/ActionIcon';
import QuizPublicationSettings from '../components/QuizPublicationSettings';
import { ListCardActions, ListCardMeta } from '../components/mobileList';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createQuizQuestion,
  deleteQuizParticipant,
  deleteQuizQuestion,
  getQuizQuestions,
  getQuizResults,
  updateQuizQuestion,
} from '../api/client';
import type { QuizVisibilityInfo } from '../api/client';
import type { QuizQuestion, QuizResultsResponse } from '../api/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { downloadAdminExport } from '../lib/download';
import { getErrorMessage } from '../lib/format';
import { QUIZ_RANK_ROW_CLASS, rankQuizResults } from '../lib/quizRank';
import { groupQuizQuestionsByCategory } from '../lib/quizCategory';

type QuizForm = {
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'a' | 'b' | 'c' | 'd';
};

const emptyForm: QuizForm = {
  category: '',
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'a',
};

const optionLabels = { a: 'A', b: 'B', c: 'C', d: 'D' } as const;

export default function QuizPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'questions' | 'results'>('questions');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [visibility, setVisibility] = useState<QuizVisibilityInfo>({
    manuallyEnabled: true,
    startAt: null,
    sectionVisible: true,
    awaitingSchedule: false,
  });
  const [results, setResults] = useState<QuizResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<QuizQuestion | null>(null);
  const [form, setForm] = useState<QuizForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, r] = await Promise.all([getQuizQuestions(), getQuizResults()]);
      setQuestions(q.questions);
      setVisibility({
        manuallyEnabled: q.manuallyEnabled,
        startAt: q.startAt,
        sectionVisible: q.sectionVisible,
        awaitingSchedule: q.awaitingSchedule,
      });
      setResults(r);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const rankedResults = useMemo(
    () => (results ? rankQuizResults(results.results) : []),
    [results],
  );

  const groupedQuestions = useMemo(
    () => groupQuizQuestionsByCategory(questions),
    [questions],
  );

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setModal('create');
  }

  function openEdit(q: QuizQuestion) {
    setForm({
      category: q.category,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
    });
    setEditing(q);
    setModal('edit');
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (modal === 'create') {
        await createQuizQuestion(form);
        toast('Вопрос добавлен', 'success');
      } else if (editing) {
        await updateQuizQuestion(editing.id, form);
        toast('Вопрос обновлён', 'success');
      }
      setModal(null);
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(q: QuizQuestion) {
    if (!confirm('Удалить вопрос?')) return;
    try {
      await deleteQuizQuestion(q.id);
      toast('Вопрос удалён', 'success');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  async function handleDeleteParticipant(userId: string, fullName: string) {
    const label = fullName.trim() || 'участника';
    if (!confirm(`Удалить результаты квиза для «${label}»? Участник сможет пройти квиз заново.`)) {
      return;
    }
    try {
      await deleteQuizParticipant(userId);
      toast('Результаты участника удалены', 'success');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Квиз"
        description="Вопросы, ответы и результаты участников"
        actions={
          tab === 'questions' ? (
            <Button onClick={openCreate}>
              <ActionIcon name="add" />
              Вопрос
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() =>
                  void downloadAdminExport(
                    '/admin/quiz/results/export',
                    'quiz-results.xlsx',
                  ).catch((e) => toast(getErrorMessage(e), 'error'))
                }
              >
                <ActionIcon name="download" />
                Все результаты
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  void downloadAdminExport(
                    '/admin/quiz/winners/export',
                    'quiz-winners.xlsx',
                  ).catch((e) => toast(getErrorMessage(e), 'error'))
                }
              >
                <ActionIcon name="download" />
                Победители
              </Button>
            </>
          )
        }
      />

      <QuizPublicationSettings
        hasQuestions={questions.length > 0}
        visibility={visibility}
        onUpdated={setVisibility}
        onError={(message) => toast(message, 'error')}
        onSuccess={(message) => toast(message, 'success')}
        onScheduleElapsed={() => void load()}
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button
          variant={tab === 'questions' ? 'primary' : 'secondary'}
          className="w-full"
          onClick={() => setTab('questions')}
        >
          Вопросы ({questions.length})
        </Button>
        <Button
          variant={tab === 'results' ? 'primary' : 'secondary'}
          className="w-full"
          onClick={() => setTab('results')}
        >
          Результаты
          {results ? ` (${results.results.length})` : ''}
        </Button>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : tab === 'questions' ? (
        questions.length === 0 ? (
          <EmptyState message="Вопросов квиза нет" />
        ) : (
          <div className="space-y-6">
            {groupedQuestions.map((group) => (
              <section key={group.category} className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {group.category}
                  <span className="ml-2 font-normal normal-case text-slate-500">
                    ({group.questions.length})
                  </span>
                </h2>
                {group.questions.map((q, index) => (
                  <Card key={q.id} className="space-y-0">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">Вопрос #{index + 1}</p>
                        <p className="mt-1 font-medium text-white">{q.question}</p>
                        <div className="mt-2 hidden sm:block">
                          <p className="text-sm text-slate-400">
                            A: {q.optionA} · B: {q.optionB} · C: {q.optionC} · D:{' '}
                            {q.optionD}
                          </p>
                        </div>
                      </div>
                      <ListCardActions>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                          <ActionIcon name="edit" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(q)}>
                          <span className="text-red-400">
                            <ActionIcon name="delete" />
                          </span>
                        </Button>
                      </ListCardActions>
                    </div>
                    <ListCardMeta>
                      <Badge tone="success">Верный: {optionLabels[q.correctOption]}</Badge>
                    </ListCardMeta>
                  </Card>
                ))}
              </section>
            ))}
          </div>
        )
      ) : results && results.results.length > 0 ? (
        <>
        <div className="space-y-3 md:hidden">
          {rankedResults.map((row) => {
            const rowHighlight = QUIZ_RANK_ROW_CLASS[row.rank] ?? '';
            return (
              <Card key={row.userId} className={rowHighlight}>
                <div className="flex items-start gap-3">
                  <div className="w-8 shrink-0 text-center">
                    {row.medal ? (
                      <span className="text-2xl leading-none" aria-label={`${row.rank} место`}>
                        {row.medal}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">{row.rank}.</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">{row.fullName}</h3>
                    <p className="mt-0.5 break-all text-sm text-slate-400">{row.email}</p>
                  </div>
                  <ListCardActions>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Удалить из результатов"
                      onClick={() => void handleDeleteParticipant(row.userId, row.fullName)}
                    >
                      <span className="text-red-400">
                        <ActionIcon name="delete" />
                      </span>
                    </Button>
                  </ListCardActions>
                </div>
                <ListCardMeta>
                  <span>
                    {row.answeredQuestions} / {row.totalQuestions} отвечено ·{' '}
                    {row.correctAnswers} правильно
                  </span>
                  {row.isWinner ? (
                    <Badge tone="success">
                      {row.medal ? `${row.rank} место · ` : ''}Победитель
                    </Badge>
                  ) : row.isComplete ? (
                    <Badge>Завершён</Badge>
                  ) : (
                    <Badge tone="warning">В процессе</Badge>
                  )}
                </ListCardMeta>
              </Card>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto rounded-2xl border border-[var(--color-border)] md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] text-slate-400">
              <tr>
                <th className="px-4 py-3 w-16">Место</th>
                <th className="px-4 py-3">Участник</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Отвечено</th>
                <th className="px-4 py-3">Правильно</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {rankedResults.map((row) => {
                const rowHighlight = QUIZ_RANK_ROW_CLASS[row.rank] ?? '';
                return (
                  <tr
                    key={row.userId}
                    className={`border-t border-[var(--color-border)] ${rowHighlight}`}
                  >
                    <td className="px-4 py-3">
                      {row.medal ? (
                        <span
                          className="text-2xl leading-none"
                          title={`${row.rank} место`}
                          aria-label={`${row.rank} место`}
                        >
                          {row.medal}
                        </span>
                      ) : (
                        <span className="text-slate-500" title={`${row.rank} место`}>
                          {row.rank}.
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{row.fullName}</td>
                    <td className="px-4 py-3 text-slate-300">{row.email}</td>
                    <td className="px-4 py-3">
                      {row.answeredQuestions} / {row.totalQuestions}
                    </td>
                    <td className="px-4 py-3">
                      {row.correctAnswers} / {row.totalQuestions}
                    </td>
                    <td className="px-4 py-3">
                      {row.isWinner ? (
                        <Badge tone="success">
                          {row.medal ? `${row.rank} место · ` : ''}Победитель
                        </Badge>
                      ) : row.isComplete ? (
                        <Badge>Завершён</Badge>
                      ) : (
                        <Badge tone="warning">В процессе</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Удалить из результатов"
                        onClick={() =>
                          void handleDeleteParticipant(row.userId, row.fullName)
                        }
                      >
                        <span className="text-red-400">
                        <ActionIcon name="delete" />
                      </span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <EmptyState message="Пока никто не проходил квиз" />
      )}

      {modal ? (
        <Modal
          title={modal === 'create' ? 'Новый вопрос' : 'Редактировать вопрос'}
          onClose={() => setModal(null)}
          wide
        >
          <Input
            label="Категория"
            placeholder="Например: VK Cloud"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <Textarea
            label="Вопрос"
            rows={2}
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
          />
          <Input
            label="Вариант A"
            value={form.optionA}
            onChange={(e) => setForm((f) => ({ ...f, optionA: e.target.value }))}
          />
          <Input
            label="Вариант B"
            value={form.optionB}
            onChange={(e) => setForm((f) => ({ ...f, optionB: e.target.value }))}
          />
          <Input
            label="Вариант C"
            value={form.optionC}
            onChange={(e) => setForm((f) => ({ ...f, optionC: e.target.value }))}
          />
          <Input
            label="Вариант D"
            value={form.optionD}
            onChange={(e) => setForm((f) => ({ ...f, optionD: e.target.value }))}
          />
          <Select
            label="Правильный ответ"
            value={form.correctOption}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                correctOption: e.target.value as QuizForm['correctOption'],
              }))
            }
          >
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
            <option value="d">D</option>
          </Select>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Отмена
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
