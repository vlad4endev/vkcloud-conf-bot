import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import type { Partner } from '../../api/client';
import { measurePartnerLogoBoost } from './partnerLogoBoost';
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
  variant?: 'default' | 'banner';
  className?: string;
};

export default function PartnerLogo({
  partner,
  size = 'md',
  variant = 'default',
  className,
}: PartnerLogoProps) {
  const [logoBoost, setLogoBoost] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const isBanner = variant === 'banner';

  useEffect(() => {
    setLogoBoost(1);
  }, [partner.logoUrl]);

  const applyLogoBoost = useCallback((img: HTMLImageElement) => {
    const boost = measurePartnerLogoBoost(img);
    setLogoBoost((current) => (Math.abs(current - boost) < 0.01 ? current : boost));
  }, []);

  const handleLogoLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      if (!isBanner) return;
      applyLogoBoost(event.currentTarget);
    },
    [applyLogoBoost, isBanner],
  );

  useEffect(() => {
    if (!isBanner) return;
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      applyLogoBoost(img);
    }
  }, [applyLogoBoost, isBanner, partner.logoUrl]);

  const wrapClass = [
    styles.logoWrap,
    isBanner ? styles.logoWrapBanner : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (partner.logoUrl) {
    return (
      <span className={wrapClass}>
        <img
          ref={imgRef}
          src={partner.logoUrl}
          alt={partner.name}
          className={[
            styles.logoImage,
            isBanner ? styles.logoImageBanner : sizeClass[size],
          ]
            .filter(Boolean)
            .join(' ')}
          style={
            isBanner && logoBoost > 1
              ? { transform: `scale(${logoBoost})` }
              : undefined
          }
          loading="lazy"
          decoding="async"
          onLoad={handleLogoLoad}
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
