import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPartners } from '../../api/client';
import { appIcons } from '../../icons';
import HubAction from '../HubAction';

export default function PartnersEntryButton() {
  const navigate = useNavigate();
  const [hasPartners, setHasPartners] = useState(false);

  useEffect(() => {
    getPartners()
      .then((partners) => setHasPartners(partners.length > 0))
      .catch(() => setHasPartners(false));
  }, []);

  if (!hasPartners) {
    return null;
  }

  return (
    <HubAction icon={appIcons.partners} onClick={() => navigate('/partners')}>
      Партнёры VK Cloud Conf
    </HubAction>
  );
}
