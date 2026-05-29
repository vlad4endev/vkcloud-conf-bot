import type { CSSProperties } from 'react';
import styles from './ConfHeroTitle.module.css';

type ConfHeroTitleProps = {
  className?: string;
};

type WarpedCharStyle = CSSProperties & {
  '--ry'?: string;
  '--s'?: number;
  '--sx'?: number;
  '--ty'?: string;
  '--tx'?: string;
  '--skew'?: string;
};

function warpChar(
  index: number,
  total: number,
  variant: 'top' | 'bottom',
): WarpedCharStyle {
  const mid = (total - 1) / 2;
  const t = mid === 0 ? 0 : (index - mid) / mid;
  const absT = Math.abs(t);
  const arc = 1 - t * t;

  const rotateY = t * 52;
  const scale = 1.14 - absT * 0.34;
  const scaleX = 0.92 + absT * 0.28;
  const translateY = (variant === 'top' ? -1 : 1) * arc * 18;
  const translateX = t * (8 + absT * 22);
  const skewX = t * 8;

  return {
    '--ry': `${rotateY}deg`,
    '--s': scale,
    '--sx': scaleX,
    '--ty': `${translateY}px`,
    '--tx': `${translateX}px`,
    '--skew': `${skewX}deg`,
  };
}

function WarpedLine({
  text,
  variant,
  lineClass,
}: {
  text: string;
  variant: 'top' | 'bottom';
  lineClass: string;
}) {
  const chars = [...text];

  return (
    <span className={lineClass} aria-hidden>
      {chars.map((char, index) => (
        <span
          key={`${variant}-${index}-${char}`}
          className={styles.char}
          style={warpChar(index, chars.length, variant)}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

export default function ConfHeroTitle({ className = '' }: ConfHeroTitleProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} aria-hidden>
      <div className={styles.stage}>
        <WarpedLine text="VK cloud" variant="top" lineClass={styles.lineTop} />
        <WarpedLine text="Conf'26" variant="bottom" lineClass={styles.lineBottom} />
      </div>
    </div>
  );
}
