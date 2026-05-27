/** Единый стиль Lucide — совпадает с miniapp */
export const iconTokens = {
  stroke: 1.75,
  strokeActive: 2,
  size: {
    xs: 14,
    sm: 16,
    md: 18,
    nav: 20,
    lg: 22,
  },
} as const;

export type IconSize = keyof typeof iconTokens.size;
