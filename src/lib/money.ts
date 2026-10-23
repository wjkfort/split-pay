const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Parse a user-entered dollar string into integer cents. Never returns NaN or a negative value. */
export function parseMoney(value: string): number {
  if (value.trim().startsWith('-')) return 0;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  const normalised =
    firstDot === -1
      ? cleaned
      : `${cleaned.slice(0, firstDot)}.${cleaned.slice(firstDot + 1).replace(/\./g, '')}`;
  const amount = Number.parseFloat(normalised);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

/** Parse a percentage string into hundredths of a percent (basis points). */
export function parsePercent(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

/** Keep a money input friendly while typing: digits, one dot, at most two decimals. */
export function sanitiseMoneyInput(value: string): string {
  let next = value.replace(/[^0-9.]/g, '');
  const firstDot = next.indexOf('.');
  if (firstDot !== -1) {
    next = `${next.slice(0, firstDot + 1)}${next.slice(firstDot + 1).replace(/\./g, '')}`;
  }
  const [whole = '', decimals] = next.split('.');
  const trimmedWhole = whole.replace(/^0+(?=\d)/, '').slice(0, 7);
  return decimals === undefined ? trimmedWhole : `${trimmedWhole}.${decimals.slice(0, 2)}`;
}

export function normaliseMoneyInput(value: string): string {
  if (value.trim() === '') return '';
  return (parseMoney(value) / 100).toFixed(2);
}

/** Keep a percentage input friendly while typing. */
export function sanitisePercentInput(value: string): string {
  let next = value.replace(/[^0-9.]/g, '');
  const firstDot = next.indexOf('.');
  if (firstDot !== -1) {
    next = `${next.slice(0, firstDot + 1)}${next.slice(firstDot + 1).replace(/\./g, '')}`;
  }
  const [whole = '', decimals] = next.split('.');
  const trimmedWhole = whole.replace(/^0+(?=\d)/, '').slice(0, 3);
  return decimals === undefined ? trimmedWhole : `${trimmedWhole}.${decimals.slice(0, 2)}`;
}

export function formatMoney(cents: number): string {
  return usd.format(Math.round(cents) / 100);
}

/** Split an integer total into integer parts. Any remainder goes to the earliest people. */
export function allocateEvenly(total: number, count: number): number[] {
  if (count <= 0) return [];
  const safeTotal = Math.max(0, Math.round(total));
  const base = Math.floor(safeTotal / count);
  const remainder = safeTotal - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

/** Distribute an integer total proportionally to integer weights without losing a cent. */
export function allocateProportionally(total: number, weights: number[]): number[] {
  const safeTotal = Math.max(0, Math.round(total));
  const safeWeights = weights.map((weight) => Math.max(0, Math.round(weight)));
  const weightTotal = safeWeights.reduce((sum, weight) => sum + weight, 0);
  if (weightTotal <= 0) return safeWeights.map(() => 0);

  const exact = safeWeights.map((weight) => (safeTotal * weight) / weightTotal);
  const parts = exact.map(Math.floor);
  let remaining = safeTotal - parts.reduce((sum, part) => sum + part, 0);

  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; i < order.length && remaining > 0; i += 1) {
    parts[order[i].index] += 1;
    remaining -= 1;
  }
  return parts;
}

export function percentToLabel(basisPoints: number): string {
  return (basisPoints / 100).toFixed(2).replace(/\.?0+$/, '');
}
