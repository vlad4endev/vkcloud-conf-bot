import styles from './ConfDecor.module.css';

/** Декоративный фон VK Cloud Conf — перспективная сетка с формулами. */
export default function ConfDecor() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.bgImage} />
      <div className={styles.scrimTop} />
      <div className={styles.scrimBottom} />
      <div className={styles.glowAccent} />
      <div className={styles.vignette} />
      <div className={styles.frameLeft} />
      <div className={styles.frameRight} />
      <div className={styles.frameTop} />
    </div>
  );
}
