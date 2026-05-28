import type { ReactNode } from 'react';
import { ReorderControls } from './ReorderControls';

export function ListCardActions({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 gap-1">{children}</div>;
}

export function ListCardReorderFooter({
  onUp,
  onDown,
  disableUp,
  disableDown,
  label = 'Порядок в списке',
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2">
      <span className="text-xs text-slate-500">{label}</span>
      <ReorderControls
        onUp={onUp}
        onDown={onDown}
        disableUp={disableUp}
        disableDown={disableDown}
      />
    </div>
  );
}

export function ListCardMeta({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--color-border)] pt-2 text-xs text-slate-500">
      {children}
    </div>
  );
}
