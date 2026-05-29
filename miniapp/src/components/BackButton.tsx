import { useLocation, useNavigate } from 'react-router-dom';
import AppIcon from './AppIcon';
import { appIcons } from '../icons';
import styles from './BackButton.module.css';

const MAIN_SECTIONS = ['/', '/schedule', '/quiz', '/speakers'];

type BackButtonProps = {
  backTo?: string;
};

type LocationState = {
  from?: 'schedule';
};

function resolveBackTo(pathname: string, state: LocationState | null): string | undefined {
  if (pathname === '/map' || pathname === '/feedback') {
    return '/';
  }
  if (/^\/speakers\/[^/]+$/.test(pathname)) {
    return state?.from === 'schedule' ? '/schedule' : '/speakers';
  }
  if (pathname === '/partners') {
    return '/';
  }
  return undefined;
}

export default function BackButton({ backTo }: BackButtonProps) {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();

  if (MAIN_SECTIONS.includes(pathname)) {
    return null;
  }

  const target = backTo ?? resolveBackTo(pathname, state as LocationState | null);

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => (target ? navigate(target) : navigate(-1))}
    >
      <AppIcon icon={appIcons.back} size="sm" />
      <span>Назад</span>
    </button>
  );
}
