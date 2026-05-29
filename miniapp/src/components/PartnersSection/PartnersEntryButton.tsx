import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPartners } from '../../api/client';
import { appIcons } from '../../icons';
import AppIcon from '../AppIcon';
import IconBox from '../IconBox';
import styles from './PartnersEntryButton.module.css';

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
    <section className={styles.wrap} aria-label="Партнёры">
      <button
        type="button"
        className="hubBtn"
        onClick={() => navigate('/partners')}
      >
        <IconBox icon={appIcons.partners} />
        <span className="hubBtnLabel">Партнёры VK Cloud Conf</span>
        <AppIcon icon={appIcons.forward} size="md" className="hubBtnChevron" />
      </button>
    </section>
  );
}
