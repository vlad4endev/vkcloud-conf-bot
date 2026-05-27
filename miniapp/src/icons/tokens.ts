/** Единый стиль Lucide по всему miniapp */
export const iconTokens = {
  stroke: 1.75,
  strokeActive: 2,
  size: {
    xs: 14,
    sm: 16,
    md: 18,
    hub: 20,
    nav: 22,
    lg: 24,
    xl: 40,
  },
} as const;

export type IconSize = keyof typeof iconTokens.size;
