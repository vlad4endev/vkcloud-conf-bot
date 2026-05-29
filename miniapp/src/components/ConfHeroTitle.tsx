import styles from './ConfHeroTitle.module.css';

type ConfHeroTitleProps = {
  className?: string;
};

export default function ConfHeroTitle({ className = '' }: ConfHeroTitleProps) {
  return (
    <svg
      className={[styles.svg, className].filter(Boolean).join(' ')}
      viewBox="0 0 360 148"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <path id="conf-hero-line-1" d="M 4 54 Q 180 24 356 54" />
        <path id="conf-hero-line-2" d="M 8 112 Q 180 142 352 112" />
      </defs>
      <text className={styles.line1}>
        <textPath href="#conf-hero-line-1" startOffset="50%" textAnchor="middle">
          VK cloud
        </textPath>
      </text>
      <text className={styles.line2}>
        <textPath href="#conf-hero-line-2" startOffset="50%" textAnchor="middle">
          Conf'26
        </textPath>
      </text>
    </svg>
  );
}
