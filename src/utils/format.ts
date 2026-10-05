export function formatNumber(value: number): string {
  return value.toLocaleString('en-PH');
}

export function formatPeso(value: number): string {
  return `₱${value.toLocaleString('en-PH')}`;
}

export function stars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  return error instanceof Error ? error.message : fallback;
}

