const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatSessionDate(date: Date): string {
  const formatted = dateFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatSessionTime(date: Date): string {
  return timeFormatter.format(date);
}

export function chunkText(text: string, maxLength = 3800): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let current = '';

  for (const line of text.split('\n')) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > maxLength) {
      if (current) {
        chunks.push(current);
      }
      current = line;
    } else {
      current = next;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
