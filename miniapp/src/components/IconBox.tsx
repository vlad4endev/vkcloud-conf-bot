import type { LucideIcon } from 'lucide-react';
import AppIcon from './AppIcon';

type IconBoxProps = {
  icon: LucideIcon;
};

/** Иконка в квадратном контейнере для кнопок-хабов и списков действий */
export default function IconBox({ icon }: IconBoxProps) {
  return (
    <span className="iconBox" aria-hidden>
      <AppIcon icon={icon} size="hub" />
    </span>
  );
}
