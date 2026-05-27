import { useNavigate } from 'react-router-dom';
import HubAction from '../components/HubAction';
import { appIcons } from '../icons';

export default function ScheduleHub() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="title">Программа, карта, спикеры</h1>

      <div className="hubActions">
        <HubAction icon={appIcons.map} onClick={() => navigate('/map')}>
          Карта
        </HubAction>
        <HubAction icon={appIcons.program} onClick={() => navigate('/schedule')}>
          Программа
        </HubAction>
        <HubAction icon={appIcons.speakers} onClick={() => navigate('/speakers')}>
          Спикеры
        </HubAction>
      </div>
    </div>
  );
}
