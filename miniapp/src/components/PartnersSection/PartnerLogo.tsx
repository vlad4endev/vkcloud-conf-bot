import type { Partner } from '../../api/client';
import styles from './PartnersSection.module.css';

type PartnerLogoSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<PartnerLogoSize, string> = {
  sm: styles.logoImageSm,
  md: styles.logoImageMd,
  lg: styles.logoImageLg,
};

type PartnerLogoProps = {
  partner: Pick<Partner, 'name' | 'logoUrl'>;
  size?: PartnerLogoSize;
  className?: string;
  fullWidth?: boolean;
};

export default function PartnerLogo({
  partner,
  size = 'md',
  className,
  fullWidth = false,
}: PartnerLogoProps) {
  const wrapClass = [
    styles.logoWrap,
    fullWidth ? styles.logoWrapFull : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (partner.logoUrl) {
    return (
      <span className={wrapClass}>
        <img
          src={partner.logoUrl}
          alt={partner.name}
          className={`${styles.logoImage} ${sizeClass[size]}`}
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  return (
    <span className={`${wrapClass} ${styles.logoFallback}`.trim()} aria-hidden>
      {partner.name.slice(0, 3)}
    </span>
  );
}
