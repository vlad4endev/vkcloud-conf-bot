import { Calendar, Gamepad2, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HubAction from '../../components/HubAction';

export default function AdminContentHub() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="title">Контент</h1>
      <div className="hubActions">
        <HubAction icon={Mic} onClick={() => navigate('/admin/speakers')}>
          Спикеры
        </HubAction>
        <HubAction icon={Calendar} onClick={() => navigate('/admin/schedule')}>
          Расписание
        </HubAction>
        <HubAction icon={Gamepad2} onClick={() => navigate('/admin/quiz')}>
          Квиз
        </HubAction>
      </div>
    </div>
  );
}
