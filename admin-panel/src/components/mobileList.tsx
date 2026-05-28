import { useEffect, useState, type ReactNode } from 'react';
import ActionIcon from './ActionIcon';
import { Button } from './ui';

export function ListCardActions({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 gap-1">{children}</div>;
}

export function MoveToPositionButton({
  itemLabel,
  currentPosition,
  totalItems,
  onMoveToPosition,
}: {
  itemLabel: string;
  currentPosition: number;
  totalItems: number;
  onMoveToPosition: (nextPosition: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(String(currentPosition));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  function openSheet() {
    setPosition(String(currentPosition));
    setError('');
    setOpen(true);
  }

  function closeSheet() {
    setOpen(false);
  }

  function submitMove() {
    const nextPosition = Number.parseInt(position, 10);
    if (Number.isNaN(nextPosition) || nextPosition < 1 || nextPosition > totalItems) {
      setError(`Введите число от 1 до ${totalItems}.`);
      return;
    }
    if (nextPosition === currentPosition) {
      closeSheet();
      return;
    }
    onMoveToPosition(nextPosition);
    closeSheet();
  }

  return (
    <>
      <Button variant="ghost" size="sm" title="Переместить" onClick={openSheet}>
        <ActionIcon name="move" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="w-full rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl sm:max-w-sm sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">Переместить элемент</p>
              <button
                type="button"
                onClick={closeSheet}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Закрыть"
              >
                <ActionIcon name="close" />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              {itemLabel}
              <br />
              Текущая позиция: {currentPosition} из {totalItems}
            </p>
            <label className="block space-y-1.5">
              <span className="text-sm text-slate-300">Новая позиция</span>
              <input
                type="number"
                min={1}
                max={totalItems}
                value={position}
                onChange={(e) => {
                  setPosition(e.target.value);
                  setError('');
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-white"
              />
            </label>
            {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={closeSheet}>
                Отмена
              </Button>
              <Button size="sm" onClick={submitMove}>
                Переместить
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ListCardMeta({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--color-border)] pt-2 text-xs text-slate-500">
      {children}
    </div>
  );
}
