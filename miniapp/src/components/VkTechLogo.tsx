import type { CSSProperties } from 'react';
import styles from './VkTechLogo.module.css';

type VkTechLogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'header';
  showTech?: boolean;
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
};

const ICON_SIZES = { sm: 22, md: 28, lg: 44, header: 44 } as const;

function VkIcon({ size }: { size: number }) {
  return (
    <svg
      className={styles.iconSvg}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="28" height="28" rx="7" fill="#0077FF" />
      <path
        fill="#fff"
        d="M14.52 19.4s.33-.04.5-.23c.17-.18.33-.57.33-.57s.05-.78.22-1.13c.23-.42.73-.41 1.23-.41.42 0 .55.02 1 .02.53 0 .98-.02 1.32-.21.29-.16.5-.52.37-.55-.16-.04-.53-.09-.72-.29-.25-.28-.22-.71-.22-.71s.04-1.32-.38-1.53c-.39-.2-.9.13-2.04 1.32-.57.61-1.02 1.28-1.13 1.38-.28.26-.4.2-.4-.1 0-.37.03-.99.03-1.63 0-.88-.12-1.24-.56-1.34-.15-.03-.26-.05-.66-.05-.87-.01-1.62.02-2.04.21-.28.14-.49.44-.36.46.16.02.53.1.72.36.25.34.24 1.11.24 1.11s.15 2.13-.34 2.4c-.33.18-.78-.19-1.76-1.87-.5-.86-.88-1.8-.88-1.8s-.07-.18-.2-.28c-.16-.12-.38-.15-.38-.15l-2.33.02s-.35 0-.48.16c-.11.13-.01.41-.01.41s1.82 4.28 3.89 6.44c1.9 1.98 4.05 1.85 4.05 1.85h.97z"
      />
    </svg>
  );
}

export default function VkTechLogo({
  size = 'md',
  showTech = true,
  muted = false,
  className = '',
  style,
}: VkTechLogoProps) {
  const rootClass = [
    styles.root,
    styles[size],
    !showTech ? styles.iconOnly : '',
    muted ? styles.muted : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={rootClass} aria-label="VK tech" style={style}>
      <VkIcon size={ICON_SIZES[size]} />
      {showTech ? <span className={styles.tech} aria-hidden>tech</span> : null}
    </span>
  );
}
