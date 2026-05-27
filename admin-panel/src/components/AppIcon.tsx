import type { LucideIcon } from 'lucide-react';
import { iconTokens, type IconSize } from '../icons/tokens';

type AppIconProps = {
  icon: LucideIcon;
  size?: IconSize | number;
  active?: boolean;
  className?: string;
};

export default function AppIcon({
  icon: Icon,
  size = 'md',
  active = false,
  className,
}: AppIconProps) {
  const pixelSize = typeof size === 'number' ? size : iconTokens.size[size];
  const strokeWidth = active ? iconTokens.strokeActive : iconTokens.stroke;

  return (
    <Icon
      size={pixelSize}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden
    />
  );
}
