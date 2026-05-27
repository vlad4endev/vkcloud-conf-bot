import type { ReactNode } from 'react';
import styles from './BottomNavShell.module.css';

type BottomNavShellProps = {
  ariaLabel: string;
  children: ReactNode;
};

export default function BottomNavShell({ ariaLabel, children }: BottomNavShellProps) {
  return (
    <nav className={styles.nav} aria-label={ariaLabel}>
      <div className={styles.navBar}>{children}</div>
      <div className={styles.navSafe} aria-hidden />
    </nav>
  );
}
