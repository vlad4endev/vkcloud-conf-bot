import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../../api/adminClient';

export default function AdminHub() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => setStats(null));
  }, []);

  const items = [
    { label: 'Участники', path: '/admin/users', stat: stats?.usersTotal },
    { label: 'Спикеры', path: '/admin/speakers', stat: stats?.speakers },
    { label: 'Расписание', path: '/admin/schedule', stat: stats?.scheduleSessions },
    { label: 'Квиз', path: '/admin/quiz', stat: stats?.quizQuestions },
    { label: 'Вопросы спикерам', path: '/admin/questions', stat: stats?.questions },
    { label: 'Отзывы', path: '/admin/feedback', stat: stats?.feedback },
    { label: 'Рассылка', path: '/admin/notify' },
    { label: 'Настройки', path: '/admin/settings' },
  ];

  return (
    <div className="page">
      <h1 className="title">Панель организатора</h1>
      <p className="text">Управление конференцией в MAX</p>

      <div className="adminMenuGrid" style={{ marginTop: 16 }}>
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            className="hubBtn"
            onClick={() => navigate(item.path)}
          >
            {item.label}
            {item.stat !== undefined ? ` · ${item.stat}` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
