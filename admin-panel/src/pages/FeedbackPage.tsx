import ActionIcon from '../components/ActionIcon';
import { ListCardActions, ListCardMeta } from '../components/mobileList';
import { useCallback, useEffect, useState } from 'react';
import { deleteFeedback, getFeedback } from '../api/client';
import type { FeedbackItem } from '../api/types';
import {
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { downloadAdminExport } from '../lib/download';
import { formatDateTime, getErrorMessage } from '../lib/format';

export default function FeedbackPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getFeedback());
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(item: FeedbackItem) {
    if (!confirm('Удалить отзыв?')) return;
    try {
      await deleteFeedback(item.id);
      toast('Отзыв удалён', 'success');
      await load();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Отзывы"
        description="Обратная связь от участников"
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              void downloadAdminExport('/admin/feedback/export', 'feedback.xlsx').catch(
                (e) => toast(getErrorMessage(e), 'error'),
              )
            }
          >
            <ActionIcon name="download" />
            Excel
          </Button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState message="Отзывов пока нет" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="space-y-0">
              <div className="flex items-start gap-3">
                <p className="min-w-0 flex-1 whitespace-pre-wrap text-white">{item.text}</p>
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
                {item.user ? (
                  <>
                    <span className="text-slate-400">{item.user.fullName}</span>
                    <span className="break-all text-slate-500">{item.user.email}</span>
                  </>
                ) : (
                  <span className="text-slate-400">Анонимно</span>
                )}
                <span>{formatDateTime(item.createdAt)}</span>
              </ListCardMeta>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
