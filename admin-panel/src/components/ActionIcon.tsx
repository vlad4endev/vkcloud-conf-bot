import type { LucideIcon } from 'lucide-react';
import AppIcon from './AppIcon';
import { panelIcons } from '../icons';

type PanelIconName = keyof typeof panelIcons;

type ActionIconProps = {
  name: PanelIconName;
  icon?: never;
} | {
  name?: never;
  icon: LucideIcon;
};

/** Иконка действия в кнопках (16px, stroke 1.75) */
export default function ActionIcon({ name, icon }: ActionIconProps) {
  const resolved = name ? panelIcons[name] : icon!;
  return <AppIcon icon={resolved} size="sm" />;
}
