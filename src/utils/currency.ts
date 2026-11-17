export const DAILY_SPEND_OPTIONS_NGN = [1000, 2500, 5000, 10000, 25000] as const;

export const DEFAULT_DAILY_SPEND_NGN = 5000;

export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `₦${safe.toLocaleString('en-US')}`;
}
