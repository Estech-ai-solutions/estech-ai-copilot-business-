export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function cleanMarkdown(text: string): string {
  if (!text) return '';

  let cleaned = text;

  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  cleaned = cleaned.replace(/\*\*\*(.+?)\*\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/\*(.+?)\*/g, '<em>$1</em>');

  cleaned = cleaned.replace(/^[-•]\s+/gm, '• ');

  cleaned = cleaned.replace(/^\d+\.\s+/gm, (match) => match);

  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ''));

  cleaned = cleaned.replace(/`([^`]+)`/g, '<code>$1</code>');

  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  cleaned = cleaned.replace(/^---$/gm, '');

  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

export function formatResponseText(text: string): string {
  if (!text) return '';

  const cleaned = cleanMarkdown(text);

  const lines = cleaned.split('\n');
  const formatted: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        formatted.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      formatted.push('');
      continue;
    }

    if (trimmed.startsWith('• ')) {
      if (!inList || listType !== 'ul') {
        if (inList) formatted.push(listType === 'ul' ? '</ul>' : '</ol>');
        formatted.push('<ul class="list-disc list-inside space-y-1">');
        inList = true;
        listType = 'ul';
      }
      formatted.push(`<li>${trimmed.slice(2)}</li>`);
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) formatted.push(listType === 'ul' ? '</ul>' : '</ol>');
        formatted.push('<ol class="list-decimal list-inside space-y-1">');
        inList = true;
        listType = 'ol';
      }
      formatted.push(`<li>${orderedMatch[2]}</li>`);
      continue;
    }

    if (inList) {
      formatted.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
      listType = null;
    }

    formatted.push(`<p class="mb-2 last:mb-0">${trimmed}</p>`);
  }

  if (inList) {
    formatted.push(listType === 'ul' ? '</ul>' : '</ol>');
  }

  return formatted.join('\n');
}