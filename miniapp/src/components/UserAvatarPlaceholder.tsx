import AppIcon from './AppIcon';
import { appIcons } from '../icons';
import styles from './UserAvatarPlaceholder.module.css';

type UserAvatarPlaceholderProps = {
  variant?: 'card' | 'detail';
};

export default function UserAvatarPlaceholder({
  variant = 'card',
}: UserAvatarPlaceholderProps) {
  const size = variant === 'detail' ? 'xl' : 'lg';

  return (
    <span
      className={variant === 'detail' ? styles.detail : styles.card}
      aria-hidden
    >
      <AppIcon icon={appIcons.user} size={size} />
    </span>
  );
}
