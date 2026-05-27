import {
  HelpCircle,
  LogOut,
  Megaphone,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HubAction from '../../components/HubAction';
import { useAdmin } from '../../context/AdminContext';

export default function AdminMore() {
  const navigate = useNavigate();
  const { exitAdminMode } = useAdmin();

  return (
    <div className="page">
      <h1 className="title">Ещё</h1>
      <div className="hubActions">
        <HubAction icon={HelpCircle} onClick={() => navigate('/admin/questions')}>
          Вопросы участников
        </HubAction>
        <HubAction icon={MessageSquare} onClick={() => navigate('/admin/feedback')}>
          Отзывы
        </HubAction>
        <HubAction icon={Megaphone} onClick={() => navigate('/admin/notify')}>
          Рассылка
        </HubAction>
        <HubAction icon={Settings} onClick={() => navigate('/admin/settings')}>
          Настройки
        </HubAction>
        <HubAction
          icon={LogOut}
          onClick={() => {
            exitAdminMode();
            navigate('/');
          }}
        >
          Выйти из админ-режима
        </HubAction>
      </div>
    </div>
  );
}
