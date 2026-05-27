import type { LucideIcon } from 'lucide-react';
import { appIcons } from '../icons';
import AppIcon from './AppIcon';
import IconBox from './IconBox';

type HubActionProps = {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick: () => void;
};

export default function HubAction({ icon, children, onClick }: HubActionProps) {
  return (
    <button type="button" className="hubBtn" onClick={onClick}>
      <IconBox icon={icon} />
      <span className="hubBtnLabel">{children}</span>
      <AppIcon icon={appIcons.forward} size="md" className="hubBtnChevron" />
    </button>
  );
}
