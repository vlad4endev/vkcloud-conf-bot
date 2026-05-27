import { useLocation, useNavigate } from 'react-router-dom';
import AppIcon from './AppIcon';
import { appIcons } from '../icons';
import styles from './BackButton.module.css';

const MAIN_SECTIONS = ['/', '/schedule-hub', '/quiz', '/feedback'];

type BackButtonProps = {
  backTo?: string;
};

function resolveBackTo(pathname: string): string | undefined {
  if (pathname === '/map') {
    return '/schedule-hub';
  }
  if (/^\/speakers\/[^/]+$/.test(pathname)) {
    return '/speakers';
  }
  if (pathname === '/schedule' || pathname === '/speakers') {
    return '/schedule-hub';
  }
  return undefined;
}

export default function BackButton({ backTo }: BackButtonProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (MAIN_SECTIONS.includes(pathname)) {
    return null;
  }

  const target = backTo ?? resolveBackTo(pathname);

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
