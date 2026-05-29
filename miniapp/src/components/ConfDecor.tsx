import styles from './ConfDecor.module.css';

/** Декоративный слой в стиле слайдов VK Cloud Conf (сетка, шевроны, дуги). */
export default function ConfDecor() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.gridOverlay} />
      <svg className={styles.chevrons} viewBox="0 0 120 80" preserveAspectRatio="xMaxYMin meet">
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 6 - row }, (_, col) => (
            <path
              key={`${row}-${col}`}
              d="M0 0 L14 8 L0 16 Z"
              transform={`translate(${col * 18 + row * 9} ${row * 14})`}
              fill="currentColor"
            />
          )),
        )}
      </svg>
      <svg className={styles.arcs} viewBox="0 0 200 400" preserveAspectRatio="xMaxYMid slice">
        <path
          d="M200 40 C120 80 80 160 80 240 S120 360 200 380"
          fill="none"
          stroke="currentColor"
          strokeWidth="28"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M200 80 C140 110 110 170 110 240 S140 330 200 350"
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.2"
        />
      </svg>
      <div className={styles.frameLeft} />
      <div className={styles.frameRight} />
    </div>
  );
}
