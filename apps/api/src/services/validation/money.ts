const ZERO_DECIMAL = new Set(["JPY", "KRW"]);
const THREE_DECIMAL = new Set(["BHD", "KWD", "OMR"]);

export function minorUnits(currency: string | null | undefined): number {
  const code = currency?.trim().toUpperCase();
  if (!code) return 2;
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  return 2;
}

export function roundCurrency(
  amount: number,
  currency: string | null | undefined,
): number {
  const factor = 10 ** minorUnits(currency);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

export function moneyEquals(
  left: number,
  right: number,
  currency: string | null | undefined,
): boolean {
  return roundCurrency(left, currency) === roundCurrency(right, currency);
}
