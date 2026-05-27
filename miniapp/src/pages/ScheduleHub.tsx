import { Calendar, Map, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HubAction from '../components/HubAction';

export default function ScheduleHub() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="title">Программа, карта, спикеры</h1>

      <div className="hubActions">
        <HubAction icon={Map} onClick={() => navigate('/map')}>
          Карта
        </HubAction>
        <HubAction icon={Calendar} onClick={() => navigate('/schedule')}>
          Программа
        </HubAction>
        <HubAction icon={Mic} onClick={() => navigate('/speakers')}>
          Спикеры
        </HubAction>
      </div>
    </div>
  );
}
