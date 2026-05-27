import { useNavigate } from 'react-router-dom';
import HubAction from '../../components/HubAction';
import { useAdmin } from '../../context/AdminContext';
import { appIcons } from '../../icons';

export default function AdminMore() {
  const navigate = useNavigate();
  const { exitAdminMode } = useAdmin();

  return (
    <div className="page">
      <h1 className="title">Ещё</h1>
      <div className="hubActions">
        <HubAction icon={appIcons.questions} onClick={() => navigate('/admin/questions')}>
          Вопросы участников
        </HubAction>
        <HubAction icon={appIcons.reviews} onClick={() => navigate('/admin/feedback')}>
          Отзывы
        </HubAction>
        <HubAction icon={appIcons.notify} onClick={() => navigate('/admin/notify')}>
          Рассылка
        </HubAction>
        <HubAction icon={appIcons.settings} onClick={() => navigate('/admin/settings')}>
          Настройки
        </HubAction>
        <HubAction
          icon={appIcons.logout}
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
