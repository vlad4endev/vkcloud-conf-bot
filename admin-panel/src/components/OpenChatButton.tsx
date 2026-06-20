import { getChatUrlForUser } from '../lib/userChatUrl';
import type { User } from '../api/types';

type OpenChatButtonProps = {
  user: User;
  className?: string;
};

export default function OpenChatButton({ user, className = '' }: OpenChatButtonProps) {
  const chatUrl = getChatUrlForUser(user);
  if (!chatUrl) {
    return null;
  }

  return (
    <button
      type="button"
      className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800 ${className}`}
      onClick={() => window.open(chatUrl, '_blank')}
    >
      💬 Открыть чат
    </button>
  );
}
