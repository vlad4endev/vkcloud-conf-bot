import type { LucideIcon } from 'lucide-react';

type AppIconProps = {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export default function AppIcon({
  icon: Icon,
  size = 22,
  strokeWidth = 1.75,
  className,
}: AppIconProps) {
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden
    />
  );
}
