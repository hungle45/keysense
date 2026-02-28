export function calculateCents(detectedFreq: number, noteFreq: number): number {
  return Math.round(1200 * Math.log2(detectedFreq / noteFreq));
}

export function getCentsColor(cents: number): string {
  const absCents = Math.abs(cents);
  if (absCents <= 5) {
    return '#22c55e';
  }
  return cents > 0 ? '#ef4444' : '#3b82f6';
}

export function formatCents(cents: number): string {
  const sign = cents > 0 ? '+' : '';
  return `${sign}${cents} cents`;
}
