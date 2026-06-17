export type MaxProfileName = {
  firstName: string;
  lastName: string;
};

/** Разбирает имя из профиля MAX (обычно «Имя Фамилия» или «Имя Отчество Фамилия»). */
export function parseMaxProfileName(name: string | null | undefined): MaxProfileName {
  const trimmed = name?.trim().replace(/\s+/g, ' ') ?? '';
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const parts = trimmed.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0] ?? '', lastName: '' };
  }

  return {
    firstName: parts[0] ?? '',
    lastName: parts[parts.length - 1] ?? '',
  };
}
