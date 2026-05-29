import type { CSSProperties } from 'react';
import styles from './VkTechLogo.module.css';

const LOGO_SRC = `${import.meta.env.BASE_URL}vk-tech-brand.png`;

type VkTechLogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'header';
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
};

export default function VkTechLogo({
  size = 'md',
  muted = false,
  className = '',
  style,
}: VkTechLogoProps) {
  const rootClass = [styles.root, styles[size], muted ? styles.muted : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={rootClass} style={style}>
      <img src={LOGO_SRC} alt="VK tech" className={styles.img} decoding="async" />
    </span>
  );
}
