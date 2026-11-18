import React, { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { RecoveryGoalCategory } from '../data/types';
import { formatNaira } from '../utils/currency';
import { buildWealthProjection } from '../utils/wealthProjection';
import { LiquidGlassCard, LiquidSectionHeader } from './LiquidGlass';

interface WealthSimulatorCardProps {
  initialDailySpendNgn: number;
  onApplyProjectionAsGoal: (prefill: {
    title: string;
    category: RecoveryGoalCategory;
    targetDays: number;
    targetAmountNgn: number;
    whyNote: string;
  }) => void;
}

export const WealthSimulatorCard: React.FC<WealthSimulatorCardProps> = ({
  initialDailySpendNgn,
  onApplyProjectionAsGoal,
}) => {
  const [simulatedDailyNgn, setSimulatedDailyNgn] = useState(
    Math.max(500, Math.min(50000, initialDailySpendNgn || 5000)),
  );
  const horizons = buildWealthProjection(simulatedDailyNgn);

  return (
    <LiquidGlassCard className="p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
            <Wallet className="h-4 w-4" />
          </div>
          <LiquidSectionHeader
            title="Naira Reclaimed Simulator"
            subtitle="Slide your daily betting stake to see what stays in your pocket"
          />
        </div>
        <span className="shrink-0 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums sm:text-sm">
          {formatNaira(simulatedDailyNgn)}/day
        </span>
      </div>

      <div className="mt-3">
        <label htmlFor="wealth-stake-slider" className="sr-only">
          Simulated daily betting stake in Naira
        </label>
        <input
          id="wealth-stake-slider"
          type="range"
          min={500}
          max={50000}
          step={500}
          value={simulatedDailyNgn}
          onChange={(e) => setSimulatedDailyNgn(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-[var(--active-fill)]"
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--ink-muted)]">
          <span>₦500/day</span>
          <span>₦25,000/day</span>
          <span>₦50,000/day</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {horizons.map((h) => (
          <div
            key={h.days}
            className="flex flex-col justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-2.5"
          >
            <div>
              <p className="font-mono text-[11px] font-semibold text-[var(--ink-muted)]">
                {h.label}
              </p>
              <p className="mt-0.5 truncate font-mono text-sm font-bold text-[var(--accent-ink)] tabular-nums sm:text-base">
                {h.formattedNgn}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-muted)]">
                {h.milestoneIdea}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onApplyProjectionAsGoal({
                  title: `${h.label}: Save ${h.formattedNgn}`,
                  category: 'savings',
                  targetDays: h.days,
                  targetAmountNgn: h.amountNgn,
                  whyNote: h.milestoneIdea,
                })
              }
              className="mt-2 inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-2 text-[11px] font-semibold text-[var(--ink)] hover:border-[var(--active-fill)] hover:text-[var(--accent-ink)]"
            >
              <Plus className="h-3 w-3 shrink-0 text-[var(--accent-ink)]" />
              <span>Set Goal</span>
            </button>
          </div>
        ))}
      </div>
    </LiquidGlassCard>
  );
};
