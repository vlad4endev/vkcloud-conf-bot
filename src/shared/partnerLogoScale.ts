export const DEFAULT_PARTNER_LOGO_SCALE = 100;
export const MIN_PARTNER_LOGO_SCALE = 50;
export const MAX_PARTNER_LOGO_SCALE = 200;

export function clampPartnerLogoScale(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return DEFAULT_PARTNER_LOGO_SCALE;
  }

  return Math.min(
    MAX_PARTNER_LOGO_SCALE,
    Math.max(MIN_PARTNER_LOGO_SCALE, Math.round(value)),
  );
}

export function partnerLogoScaleFactor(scale: number | null | undefined): number {
  return clampPartnerLogoScale(scale) / 100;
}
