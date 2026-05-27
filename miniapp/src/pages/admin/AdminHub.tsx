import {
  Calendar,
  Gamepad2,
  HelpCircle,
  Megaphone,
  MessageSquare,
  Mic,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HubAction from '../../components/HubAction';
import { getStats } from '../../api/adminClient';

type HubItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  stat?: number;
};

export default function AdminHub() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => setStats(null));
  }, []);

  const items: HubItem[] = [
    { label: 'Участники', path: '/admin/users', icon: Users, stat: stats?.usersTotal },
    { label: 'Спикеры', path: '/admin/speakers', icon: Mic, stat: stats?.speakers },
    {
      label: 'Расписание',
      path: '/admin/schedule',
      icon: Calendar,
      stat: stats?.scheduleSessions,
    },
    { label: 'Квиз', path: '/admin/quiz', icon: Gamepad2, stat: stats?.quizQuestions },
    {
      label: 'Вопросы спикерам',
      path: '/admin/questions',
      icon: HelpCircle,
      stat: stats?.questions,
    },
    {
      label: 'Отзывы',
      path: '/admin/feedback',
      icon: MessageSquare,
      stat: stats?.feedback,
    },
    { label: 'Рассылка', path: '/admin/notify', icon: Megaphone },
    { label: 'Настройки', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="page">
      <h1 className="title">Панель организатора</h1>
      <p className="text">Управление конференцией в MAX</p>

      <div className="adminMenuGrid" style={{ marginTop: 16 }}>
        {items.map((item) => (
          <HubAction
            key={item.path}
            icon={item.icon}
            onClick={() => navigate(item.path)}
          >
            {item.label}
            {item.stat !== undefined ? ` · ${item.stat}` : ''}
          </HubAction>
        ))}
      </div>
    </div>
  );
}
