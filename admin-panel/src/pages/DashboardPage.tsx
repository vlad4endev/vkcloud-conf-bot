import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../api/client';
import type { DashboardStats } from '../api/types';
import { Card, LoadingBlock, PageHeader } from '../components/ui';
import { getErrorMessage } from '../lib/format';
import { useToast } from '../context/ToastContext';

const statLinks: Array<{
  key: keyof DashboardStats;
  label: string;
  to: string;
  suffix?: string;
}> = [
  { key: 'usersTotal', label: 'Участников', to: '/users' },
  { key: 'usersVerified', label: 'Подтверждённых', to: '/users' },
  { key: 'speakers', label: 'Спикеров', to: '/speakers' },
  { key: 'scheduleSessions', label: 'Сессий в программе', to: '/schedule' },
  { key: 'quizQuestions', label: 'Вопросов квиза', to: '/quiz' },
  { key: 'questions', label: 'Вопросов спикерам', to: '/questions' },
  { key: 'feedback', label: 'Отзывов', to: '/feedback' },
  {
    key: 'notificationsPending',
    label: 'Ожидают отправки',
    to: '/notifications',
  },
];

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((error) => toast(getErrorMessage(error), 'error'));
  }, [toast]);

  if (!stats) {
    return <LoadingBlock />;
  }

  return (
    <div>
      <PageHeader
        title="Обзор"
        description="Сводка по конференции и быстрые переходы"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statLinks.map(({ key, label, to }) => (
          <Link key={key} to={to}>
            <Card className="transition hover:border-blue-500/50 hover:bg-slate-900/80">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats[key]}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-semibold text-white">Быстрые действия</h2>
        <ul className="mt-3 space-y-2 text-sm text-blue-300">
          <li>
            <Link to="/users" className="hover:underline">
              Редактировать участников
            </Link>
          </li>
          <li>
            <Link to="/notifications" className="hover:underline">
              Отправить рассылку в MAX
            </Link>
          </li>
          <li>
            <Link to="/settings" className="hover:underline">
              Тексты, ссылки и карта
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
