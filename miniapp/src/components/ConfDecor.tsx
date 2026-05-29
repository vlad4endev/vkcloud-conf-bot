import styles from './ConfDecor.module.css';

const ARC_RADII = [118, 168, 218, 268, 318, 368];

/** Декоративный слой в стиле слайдов VK Cloud Conf (сетка, дуги, шевроны). */
export default function ConfDecor() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.gridOverlay} />
      <svg className={styles.geoArcs} viewBox="0 0 480 720" preserveAspectRatio="xMaxYMid slice">
        {ARC_RADII.map((r) => (
          <circle
            key={r}
            cx="480"
            cy="360"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          d="M480 120 L280 360 L480 600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M480 200 L340 360 L480 520"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className={styles.geoRays} />
      <svg className={styles.chevrons} viewBox="0 0 120 80" preserveAspectRatio="xMaxYMax meet">
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
      <div className={styles.frameLeft} />
      <div className={styles.frameRight} />
      <div className={styles.frameTop} />
    </div>
  );
}
