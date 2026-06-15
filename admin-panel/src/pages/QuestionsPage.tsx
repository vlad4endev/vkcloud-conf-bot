import ActionIcon from '../components/ActionIcon';
import { ListCardActions, ListCardMeta } from '../components/mobileList';
import { useCallback, useEffect, useState } from 'react';
import { deleteSpeakerQuestion, getQuestions } from '../api/client';
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

  async function handleDelete(item: SpeakerQuestion) {
    if (!confirm('Удалить вопрос?')) return;
    try {
      await deleteSpeakerQuestion(item.id);
      toast('Вопрос удалён', 'success');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

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
            <ActionIcon name="download" />
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
            <Card key={item.id} className="space-y-0">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-blue-400">{item.speaker.name}</p>
                  <p className="mt-2 whitespace-pre-wrap text-white">{item.question}</p>
                </div>
                <ListCardActions>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleDelete(item)}
                    aria-label="Удалить"
                  >
                    <ActionIcon name="delete" />
                  </Button>
                </ListCardActions>
              </div>
              <ListCardMeta>
                <span className="text-slate-400">{item.user.fullName}</span>
                <span className="break-all text-slate-500">{item.user.email}</span>
                <span>{formatDateTime(item.createdAt)}</span>
              </ListCardMeta>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
