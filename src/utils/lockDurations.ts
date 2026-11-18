export interface LockDurationPreset {
  days: number;
  label: string;
  shortLabel: string;
}

export const MIN_LOCK_DAYS = 1;
export const MAX_LOCK_DAYS = 730;

export const LOCK_DURATION_PRESETS: readonly LockDurationPreset[] = [
  { days: 1, label: '24 Hours', shortLabel: '24h' },
  { days: 7, label: '7 Days', shortLabel: '7d' },
  { days: 30, label: '30 Days', shortLabel: '30d' },
  { days: 90, label: '90 Days', shortLabel: '90d' },
  { days: 180, label: '6 Months', shortLabel: '6m' },
  { days: 365, label: '1 Year', shortLabel: '1y' },
  { days: 730, label: '2 Years', shortLabel: '2y' },
] as const;

export function clampLockDays(days: number): number {
  if (!Number.isFinite(days)) return 7;
  return Math.max(MIN_LOCK_DAYS, Math.min(MAX_LOCK_DAYS, Math.round(days)));
}

export function formatLockDurationLong(days: number): string {
  const safe = clampLockDays(days);
  switch (safe) {
    case 1:
      return '24 Hours';
    case 180:
      return '6 Months';
    case 365:
      return '1 Year';
    case 730:
      return '2 Years';
    default:
      return `${safe} Days`;
  }
}

export function formatLockDurationAdjective(days: number): string {
  const safe = clampLockDays(days);
  switch (safe) {
    case 1:
      return '24-Hour';
    case 180:
      return '6-Month';
    case 365:
      return '1-Year';
    case 730:
      return '2-Year';
    default:
      return `${safe}-Day`;
  }
}

export function buildLockCountdownQuad(
  remainingMs: number,
): Array<{ digits: string; unit: string }> {
  const safeSec = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(safeSec / 86400);
  const hours = Math.floor((safeSec % 86400) / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return [
    { digits: pad(days), unit: 'DAYS' },
    { digits: pad(hours), unit: 'HRS' },
    { digits: pad(minutes), unit: 'MIN' },
    { digits: pad(seconds), unit: 'SEC' },
  ];
}
