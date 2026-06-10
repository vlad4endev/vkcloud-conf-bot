import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import type { Partner } from '../../api/client';
import { partnerLogoScaleFactor } from '../../../../src/shared/partnerLogoScale';
import { measurePartnerLogoBoost } from './partnerLogoBoost';
import styles from './PartnersSection.module.css';

type PartnerLogoSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<PartnerLogoSize, string> = {
  sm: styles.logoImageSm,
  md: styles.logoImageMd,
  lg: styles.logoImageLg,
};

type PartnerLogoProps = {
  partner: Pick<Partner, 'name' | 'logoUrl' | 'logoScale'>;
  size?: PartnerLogoSize;
  variant?: 'default' | 'banner' | 'card';
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
  const isScaled = variant === 'banner' || variant === 'card';
  const manualScale = partnerLogoScaleFactor(partner.logoScale);

  useEffect(() => {
    setLogoBoost(1);
  }, [partner.logoUrl]);

  const applyLogoBoost = useCallback((img: HTMLImageElement) => {
    const boost = measurePartnerLogoBoost(img);
    setLogoBoost((current) => (Math.abs(current - boost) < 0.01 ? current : boost));
  }, []);

  const handleLogoLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      if (!isScaled) return;
      applyLogoBoost(event.currentTarget);
    },
    [applyLogoBoost, isScaled],
  );

  useEffect(() => {
    if (!isScaled) return;
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      applyLogoBoost(img);
    }
  }, [applyLogoBoost, isScaled, partner.logoUrl]);

  const scaledWrapClass =
    variant === 'card'
      ? styles.logoWrapCard
      : variant === 'banner'
        ? styles.logoWrapBanner
        : null;

  const scaledImageClass =
    variant === 'card'
      ? styles.logoImageCard
      : variant === 'banner'
        ? styles.logoImageBanner
        : null;

  const wrapClass = [
    styles.logoWrap,
    scaledWrapClass,
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
            scaledImageClass ?? sizeClass[size],
          ]
            .filter(Boolean)
            .join(' ')}
          style={
            isScaled
              ? {
                  transform: `scale(${manualScale * logoBoost})`,
                }
              : manualScale !== 1
                ? { transform: `scale(${manualScale})` }
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
