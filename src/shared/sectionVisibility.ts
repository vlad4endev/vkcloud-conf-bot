export const PARTNERS_VISIBLE_CONFIG_KEY = 'partners_visible';
export const QUIZ_VISIBLE_CONFIG_KEY = 'quiz_visible';

export function isSectionVisible(value: string | undefined | null): boolean {
  return value !== 'false';
}
