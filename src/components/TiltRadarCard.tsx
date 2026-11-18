import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Calculator, PiggyBank, ShieldCheck, TrendingUp } from 'lucide-react';
import { formatNaira } from '../utils/currency';
import { analyzePromoAndExpectedLoss, TiltRadarEvaluation } from '../utils/tiltRadar';
import { LiquidGlassCard, LiquidSectionHeader } from './LiquidGlass';

interface TiltRadarCardProps {
  radar: TiltRadarEvaluation;
  dailySpendNgn: number;
  bankedUrgeSavingsNgn: number;
  bankedUrgeCount: number;
  lastTestedUrl?: string;
  onBankUrgeStake: (amountNgn: number) => void;
  onLaunchCalmReset: () => void;
}

export const TiltRadarCard: React.FC<TiltRadarCardProps> = ({
  radar,
  dailySpendNgn,
  bankedUrgeSavingsNgn,
  bankedUrgeCount,
  lastTestedUrl,
  onBankUrgeStake,
  onLaunchCalmReset,
}) => {
  const [showPromoTester, setShowPromoTester] = useState(false);
  const [promoInput, setPromoInput] = useState(
    lastTestedUrl || 'SportyBet slip code BC894K2',
  );
  const stakeAmount = Math.max(500, dailySpendNgn || 5000);

  const promoReport = useMemo(
    () => analyzePromoAndExpectedLoss(promoInput, stakeAmount),
    [promoInput, stakeAmount],
  );

  const isElevated = radar.level !== 'CALM';
  const levelLabel =
    radar.level === 'CRITICAL'
      ? 'CRITICAL SPIKE'
      : radar.level === 'ELEVATED'
        ? 'ELEVATED VELOCITY'
        : 'BASELINE CALM';

  return (
    <LiquidGlassCard className="p-3.5 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <LiquidSectionHeader
          title="Tilt Velocity Radar & Stake Bank"
          subtitle="Detects rapid chasing-loss attempts & turns urges into saved cash"
        />
        <span
          className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold tracking-wider uppercase ${
            radar.level === 'CRITICAL'
              ? 'text-[var(--accent-ink)]'
              : radar.level === 'ELEVATED'
                ? 'text-[var(--ink)]'
                : 'text-[var(--ink-muted)]'
          }`}
        >
          {radar.level === 'CRITICAL' ? (
            <AlertTriangle className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
          ) : radar.level === 'ELEVATED' ? (
            <TrendingUp className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
          ) : (
            <Activity className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
          )}
          <span>{levelLabel}</span>
        </span>
      </div>

      {/* Velocity Metrics */}
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-2">
          <p className="truncate text-[10px] font-medium text-[var(--ink-muted)]">10m Tries</p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-[var(--ink)] sm:text-base">
            {radar.attemptsLast10Min}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-2">
          <p className="truncate text-[10px] font-medium text-[var(--ink-muted)]">60m Tries</p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-[var(--ink)] sm:text-base">
            {radar.attemptsLast60Min}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] px-2.5 py-2">
          <p className="truncate text-[10px] font-medium text-[var(--ink-muted)]">Urge Banked</p>
          <p className="mt-0.5 truncate font-mono text-sm font-bold tabular-nums text-[var(--accent-ink)]">
            {formatNaira(bankedUrgeSavingsNgn)}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
        <span className="font-semibold text-[var(--ink)]">{radar.headline}:</span> {radar.guidance}
      </p>

      {/* Primary Action Strip */}
      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onBankUrgeStake(stakeAmount)}
          data-testid="bank-urge-stake-button"
          className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3.5 text-xs font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
        >
          <PiggyBank className="h-4 w-4 shrink-0" />
          <span>Bank {formatNaira(stakeAmount)} Stake Instead</span>
        </button>

        {isElevated ? (
          <button
            type="button"
            onClick={onLaunchCalmReset}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
            <span>{radar.cooldownSuggestedSec}s Cooldown</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setShowPromoTester((v) => !v)}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
        >
          <Calculator className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
          <span>{showPromoTester ? 'Hide Slip Math' : 'Slip & Margin Math'}</span>
        </button>
      </div>

      {bankedUrgeCount > 0 ? (
        <p className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
          {bankedUrgeCount} resisted bet{bankedUrgeCount === 1 ? '' : 's'} diverted into your
          personal vault (+{formatNaira(bankedUrgeSavingsNgn)} saved)
        </p>
      ) : null}

      {/* Expandable Promo & House-Margin Reality Check */}
      {showPromoTester ? (
        <div className="mt-2.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3">
          <p className="text-xs font-semibold text-[var(--ink)]">
            Promo / Booking-Code Neutralizer &amp; House-Edge Check
          </p>
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="Paste bet slip link or booking code"
            className="mt-2 h-9 w-full rounded-lg border border-[var(--subtle-border)] bg-[var(--surface)] px-3 font-mono text-xs text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
          />
          <div className="mt-2 space-y-1 text-xs">
            {promoReport.detectedCodes.length > 0 ? (
              <p className="font-mono text-[11px] font-semibold text-[var(--accent-ink)]">
                Stripped Booking Code{promoReport.detectedCodes.length > 1 ? 's' : ''}:{' '}
                {promoReport.detectedCodes.join(', ')}
              </p>
            ) : null}
            <p className="leading-relaxed text-[var(--ink-muted)]">{promoReport.summary}</p>
          </div>
        </div>
      ) : null}
    </LiquidGlassCard>
  );
};
