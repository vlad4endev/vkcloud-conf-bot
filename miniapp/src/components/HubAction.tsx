import { ChevronRight, type LucideIcon } from 'lucide-react';

type HubActionProps = {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick: () => void;
};

export default function HubAction({ icon: Icon, children, onClick }: HubActionProps) {
  return (
    <button type="button" className="hubBtn" onClick={onClick}>
      <span className="hubBtnIcon" aria-hidden>
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <span className="hubBtnLabel">{children}</span>
      <ChevronRight className="hubBtnChevron" size={18} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
