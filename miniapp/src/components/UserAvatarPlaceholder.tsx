import { User } from 'lucide-react';
import styles from './UserAvatarPlaceholder.module.css';

type UserAvatarPlaceholderProps = {
  variant?: 'card' | 'detail';
};

export default function UserAvatarPlaceholder({
  variant = 'card',
}: UserAvatarPlaceholderProps) {
  const iconSize = variant === 'detail' ? 40 : 24;

  return (
    <span
      className={
        variant === 'detail' ? styles.detail : styles.card
      }
      aria-hidden
    >
      <User size={iconSize} strokeWidth={1.5} />
    </span>
  );
}
