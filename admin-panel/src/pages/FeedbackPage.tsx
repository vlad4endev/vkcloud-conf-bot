import { Download } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getFeedback } from '../api/client';
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
            <Download size={16} />
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
            <Card key={item.id}>
              <p className="whitespace-pre-wrap text-white">{item.text}</p>
              <p className="mt-2 text-sm text-slate-400">
                {item.user
                  ? `${item.user.fullName} · ${item.user.email}`
                  : 'Анонимно'}
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
