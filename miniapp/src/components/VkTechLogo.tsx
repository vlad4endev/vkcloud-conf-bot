import type { CSSProperties } from 'react';
import styles from './VkTechLogo.module.css';

const VK_ICON_SRC = `${import.meta.env.BASE_URL}vk-tech-icon.png`;

type VkTechLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showTech?: boolean;
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
};

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
      <span className={styles.iconWrap}>
        <img
          src={VK_ICON_SRC}
          alt=""
          className={styles.icon}
          width={44}
          height={44}
          decoding="async"
        />
      </span>
      {showTech ? <span className={styles.tech} aria-hidden>tech</span> : null}
    </span>
  );
}
