export function formatNumber(value: number): string {
  return value.toLocaleString('en-PH');
}

export function formatPeso(value: number): string {
  return `₱${value.toLocaleString('en-PH')}`;
}

/** "Mika Santos" → "Mika" */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** "Mika Santos" → "MS" */
export function initialsOf(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  return error instanceof Error ? error.message : fallback;
}
