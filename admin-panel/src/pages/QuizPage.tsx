import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createQuizQuestion,
  deleteQuizParticipant,
  deleteQuizQuestion,
  getQuizQuestions,
  getQuizResults,
  updateQuizQuestion,
} from '../api/client';
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

type QuizForm = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'a' | 'b' | 'c' | 'd';
};

const emptyForm: QuizForm = {
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
      setQuestions(q);
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

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setModal('create');
  }

  function openEdit(q: QuizQuestion) {
    setForm({
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
              <Plus size={16} />
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
                <Download size={16} />
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
                <Download size={16} />
                Победители
              </Button>
            </>
          )
        }
      />

      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === 'questions' ? 'primary' : 'secondary'}
          onClick={() => setTab('questions')}
        >
          Вопросы ({questions.length})
        </Button>
        <Button
          variant={tab === 'results' ? 'primary' : 'secondary'}
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
          <div className="space-y-3">
            {questions.map((q, index) => (
              <Card key={q.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">#{index + 1}</p>
                    <p className="mt-1 font-medium text-white">{q.question}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      A: {q.optionA} · B: {q.optionB} · C: {q.optionC} · D:{' '}
                      {q.optionD}
                    </p>
                    <div className="mt-2">
                      <Badge tone="success">
                        Верный: {optionLabels[q.correctOption]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleDelete(q)}>
                      <Trash2 size={16} className="text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : results && results.results.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] text-slate-400">
              <tr>
                <th className="px-4 py-3 w-16">Место</th>
                <th className="px-4 py-3">Участник</th>
                <th className="px-4 py-3">Email</th>
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
                      {row.correctAnswers} / {row.totalQuestions}
                    </td>
                    <td className="px-4 py-3">
                      {row.medal ? (
                        <Badge tone="success">
                          {row.rank} место
                          {row.isPerfect ? ' · 100%' : ''}
                        </Badge>
                      ) : row.isPerfect ? (
                        <Badge tone="success">100%</Badge>
                      ) : (
                        <Badge>Участник</Badge>
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
                        <Trash2 size={16} className="text-red-400" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="Пока никто не проходил квиз" />
      )}

      {modal ? (
        <Modal
          title={modal === 'create' ? 'Новый вопрос' : 'Редактировать вопрос'}
          onClose={() => setModal(null)}
          wide
        >
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
          <div className="flex justify-end gap-2">
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
