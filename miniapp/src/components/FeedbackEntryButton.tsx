import { useNavigate } from 'react-router-dom';
import { appIcons } from '../icons';
import AppIcon from './AppIcon';
import IconBox from './IconBox';
import styles from './FeedbackEntryButton.module.css';

export default function FeedbackEntryButton() {
  const navigate = useNavigate();

  return (
    <section className={styles.wrap} aria-label="Оставить отзыв">
      <button
        type="button"
        className="hubBtn"
        onClick={() => navigate('/feedback')}
      >
        <IconBox icon={appIcons.feedback} />
        <span className="hubBtnLabel">Оставить отзыв</span>
        <AppIcon icon={appIcons.forward} size="md" className="hubBtnChevron" />
      </button>
    </section>
  );
}
