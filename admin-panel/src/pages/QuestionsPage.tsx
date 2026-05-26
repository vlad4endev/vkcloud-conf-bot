import { Download } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getQuestions } from '../api/client';
import type { SpeakerQuestion } from '../api/types';
import {
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  SearchInput,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { downloadAdminExport } from '../lib/download';
import { formatDateTime, getErrorMessage } from '../lib/format';

export default function QuestionsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<SpeakerQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getQuestions());
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = items.filter((item) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      item.question.toLowerCase().includes(q) ||
      item.user.fullName.toLowerCase().includes(q) ||
      item.speaker.name.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Вопросы спикерам"
        description="Вопросы от участников через мини-приложение"
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              void downloadAdminExport('/admin/questions/export', 'questions.xlsx').catch(
                (e) => toast(getErrorMessage(e), 'error'),
              )
            }
          >
            <Download size={16} />
            Excel
          </Button>
        }
      />

      <Card className="mb-4">
        <SearchInput
          value={filter}
          onChange={setFilter}
          placeholder="Поиск по тексту, участнику, спикеру…"
        />
      </Card>

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState message="Вопросов нет" />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <p className="text-xs text-blue-400">{item.speaker.name}</p>
              <p className="mt-2 text-white">{item.question}</p>
              <p className="mt-2 text-sm text-slate-400">
                {item.user.fullName} · {item.user.email}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDateTime(item.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
