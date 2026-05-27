import { useNavigate } from 'react-router-dom';
import HubAction from '../../components/HubAction';
import { appIcons } from '../../icons';

export default function AdminContentHub() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="title">Контент</h1>
      <div className="hubActions">
        <HubAction icon={appIcons.speakers} onClick={() => navigate('/admin/speakers')}>
          Спикеры
        </HubAction>
        <HubAction icon={appIcons.schedule} onClick={() => navigate('/admin/schedule')}>
          Расписание
        </HubAction>
        <HubAction icon={appIcons.quiz} onClick={() => navigate('/admin/quiz')}>
          Квиз
        </HubAction>
      </div>
    </div>
  );
}
