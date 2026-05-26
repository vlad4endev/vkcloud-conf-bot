import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui';

export function ReorderControls({
  onUp,
  onDown,
  disableUp,
  disableDown,
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={onUp}
        disabled={disableUp}
        className="!px-1.5 !py-1"
        aria-label="Выше"
      >
        <ChevronUp size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDown}
        disabled={disableDown}
        className="!px-1.5 !py-1"
        aria-label="Ниже"
      >
        <ChevronDown size={16} />
      </Button>
    </div>
  );
}
