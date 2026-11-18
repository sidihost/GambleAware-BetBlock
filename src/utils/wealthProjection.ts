import { formatNaira } from './currency';

export interface WealthMilestoneHorizon {
  days: number;
  label: string;
  amountNgn: number;
  formattedNgn: string;
  milestoneIdea: string;
}

const HORIZONS = [
  { days: 7, label: '7 Days', idea: 'Groceries & data buffer' },
  { days: 30, label: '30 Days', idea: 'Monthly utility & savings boost' },
  { days: 90, label: '90 Days', idea: 'Phone upgrade or rent reserve' },
  { days: 365, label: '1 Year', idea: 'Emergency fund or business capital' },
] as const;

export function buildWealthProjection(dailySpendNgn: number): WealthMilestoneHorizon[] {
  const safeDaily = Number.isFinite(dailySpendNgn)
    ? Math.max(500, Math.min(10_000_000, Math.round(dailySpendNgn)))
    : 5000;

  return HORIZONS.map((h) => {
    const amountNgn = safeDaily * h.days;
    return {
      days: h.days,
      label: h.label,
      amountNgn,
      formattedNgn: formatNaira(amountNgn),
      milestoneIdea: h.idea,
    };
  });
}
