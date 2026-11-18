import React, { useEffect, useState } from 'react';
import { LockKeyhole, PiggyBank, Target, Wind } from 'lucide-react';
import { InterventionPayload, RecoveryGoalEntity } from '../data/types';
import { formatNaira } from '../utils/currency';
import { calculateGoalProgress } from '../utils/personalization';
import { analyzePromoAndExpectedLoss } from '../utils/tiltRadar';
import { BrandGMark } from './AppHeader';
import { BettingBrandLogo } from './BettingBrandLogo';
import { LiquidGlassBackdrop, LiquidGlassCard } from './LiquidGlass';

export const BlockedInterventionModal: React.FC<{
  payload: InterventionPayload;
  cleanDays: number;
  cleanExactDays?: number;
  estimatedSavedAmount?: number;
  dailySpendNgn?: number;
  primaryGoal?: RecoveryGoalEntity | null;
  onBankUrgeStake?: (amountNgn: number) => void;
  onCreateGoal?: () => void;
  onClose: () => void;
}> = ({
  payload,
  cleanDays,
  cleanExactDays = cleanDays,
  estimatedSavedAmount = 0,
  dailySpendNgn = 5000,
  primaryGoal = null,
  onBankUrgeStake,
  onCreateGoal,
  onClose,
}) => {
  const [isBreathingActive, setIsBreathingActive] = useState(payload.autoStartBreathing);
  const [calmSecondsLeft, setCalmSecondsLeft] = useState(60);
  const [bankedStakeDone, setBankedStakeDone] = useState(false);

  useEffect(() => {
    if (!isBreathingActive) return;
    if (calmSecondsLeft <= 0) {
      setIsBreathingActive(false);
      return;
    }
    const id = window.setTimeout(() => {
      setCalmSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [isBreathingActive, calmSecondsLeft]);

  const cycleSecond = (60 - calmSecondsLeft) % 12;
  const phaseLabel =
    !isBreathingActive && calmSecondsLeft === 0
      ? 'Reset Complete'
      : !isBreathingActive
        ? '60s Calm Reset'
        : cycleSecond < 4
          ? 'Inhale'
          : cycleSecond < 8
            ? 'Hold'
            : 'Exhale';

  const ringScale = !isBreathingActive
    ? 0.56
    : cycleSecond < 4
      ? 0.94
      : cycleSecond < 8
        ? 0.94
        : 0.52;

  const toggleBreathing = () => {
    if (calmSecondsLeft === 0) {
      setCalmSecondsLeft(60);
      setIsBreathingActive(true);
    } else {
      setIsBreathingActive((prev) => !prev);
    }
  };

  const goalProgress = primaryGoal
    ? calculateGoalProgress(primaryGoal, cleanExactDays, estimatedSavedAmount)
    : null;

  const isCalmResetTool = payload.source === 'Calm Reset';
  const stakeToBank = Math.max(500, dailySpendNgn || 5000);
  const promoInsight = !payload.isAntiTamper && !isCalmResetTool
    ? analyzePromoAndExpectedLoss(payload.target, stakeToBank)
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GambleAware Protection Redirect"
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <LiquidGlassBackdrop isProtected={true}>
        <div className="flex min-h-screen items-center justify-center px-5 py-6">
          <LiquidGlassCard className="w-full max-w-[460px] p-6">
            <div className="flex flex-col items-center text-center">
              <span className="text-xs font-semibold text-[var(--ink-muted)]">
                GambleAware · Redirected Safely
              </span>

              {payload.isAntiTamper ? (
                <div className="mt-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--active-fill)] text-[var(--active-content)]">
                  <LockKeyhole className="h-8 w-8" />
                </div>
              ) : isCalmResetTool ? (
                <BrandGMark className="mt-4 h-[72px] w-[72px]" />
              ) : (
                <BettingBrandLogo target={payload.target} size="xl" className="mt-4" />
              )}

              <h2 className="mt-4 font-display text-2xl font-bold text-[var(--ink)]">
                {payload.isAntiTamper
                  ? 'Uninstall & Tamper Locked'
                  : payload.isLoginRedirect
                    ? 'Betting Login Blocked & Redirected'
                    : isCalmResetTool
                      ? 'Pause & Breathe'
                      : 'Betting Platform Blocked'}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                {payload.isAntiTamper
                  ? 'Your GambleAware Device Admin & Commitment Lock prevents uninstalling the app or weakening rules until your timer completes.'
                  : payload.isLoginRedirect
                    ? 'GambleAware intercepted this gambling sign-in attempt and redirected you back to safety before you could place a bet.'
                    : 'GambleAware intercepted this platform before it could pull you back in. Urges fade within minutes.'}
              </p>

              {/* Intercept summary */}
              <div className="mt-5 flex w-full items-center justify-between rounded-[18px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-4 py-3.5 text-left">
                <div className="flex min-w-0 flex-1 items-center gap-3 pr-3">
                  {!payload.isAntiTamper && !isCalmResetTool ? (
                    <BettingBrandLogo target={payload.target} size="md" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] font-bold tracking-wide text-[var(--accent-ink)] uppercase">
                      {payload.isAntiTamper
                        ? 'Uninstall Blocked'
                        : payload.source.toLowerCase().includes('app') ||
                            payload.source.toLowerCase().includes('install')
                          ? 'Betting App Blocked'
                          : isCalmResetTool
                            ? '60s Urge Reset'
                            : 'Betting Site Blocked'}
                    </p>
                    <p className="mt-0.5 truncate text-base font-bold text-[var(--ink)]">
                      {payload.target}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[var(--ink-muted)]">
                      {payload.source} · {payload.category}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-lg font-bold tabular-nums text-[var(--accent-ink)]">
                    {cleanDays} d
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)]">Streak</p>
                </div>
              </div>

              {promoInsight ? (
                <div className="mt-3 w-full rounded-[16px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 py-2.5 text-left">
                  <p className="font-mono text-[10px] font-bold tracking-wide text-[var(--accent-ink)] uppercase">
                    House-Edge Reality Check
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                    {promoInsight.summary}
                  </p>
                </div>
              ) : null}

              {!payload.isAntiTamper && onBankUrgeStake ? (
                <button
                  type="button"
                  disabled={bankedStakeDone}
                  onClick={() => {
                    onBankUrgeStake(stakeToBank);
                    setBankedStakeDone(true);
                  }}
                  data-testid="modal-bank-stake-button"
                  className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] px-4 text-xs font-semibold text-[var(--accent-ink)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-70"
                >
                  <PiggyBank className="h-4 w-4 shrink-0" />
                  <span>
                    {bankedStakeDone
                      ? `Banked ${formatNaira(stakeToBank)} Into Your Vault`
                      : `Bank ${formatNaira(stakeToBank)} Stake Into Vault Instead`}
                  </span>
                </button>
              ) : null}

              {/* Personal Goal Anchor Reminder */}
              {primaryGoal && goalProgress ? (
                <div className="mt-3 w-full rounded-[18px] border border-[var(--glass-border)] bg-[var(--control-bg)] p-3.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-ink)]">
                      <Target className="h-3.5 w-3.5" />
                      <span>Remember Your Goal</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-[var(--ink)]">
                      {goalProgress.percent}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[var(--ink)]">{primaryGoal.title}</p>
                  {primaryGoal.whyNote ? (
                    <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                      &ldquo;{primaryGoal.whyNote}&rdquo;
                    </p>
                  ) : null}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted-fill)]">
                    <div
                      className="h-full rounded-full bg-[var(--active-fill)]"
                      style={{ width: `${Math.max(5, goalProgress.percent)}%` }}
                    />
                  </div>
                </div>
              ) : onCreateGoal ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateGoal();
                  }}
                  className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-[18px] border border-[var(--glass-border)] bg-[var(--control-bg)] px-4 py-3 text-left hover:bg-[var(--muted-fill)]"
                >
                  <div className="flex items-center gap-2.5">
                    <Target className="h-4 w-4 text-[var(--accent-ink)]" />
                    <div>
                      <p className="text-xs font-bold text-[var(--ink)]">
                        Create a recovery goal to stay locked in
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Tap to set your Naira savings or clean-days target
                      </p>
                    </div>
                  </div>
                </button>
              ) : null}

              {/* Interactive 60s Calm Reset Card */}
              <button
                type="button"
                onClick={toggleBreathing}
                className="mt-3.5 w-full cursor-pointer rounded-[20px] border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5 text-left transition-colors hover:bg-[var(--muted-fill)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-[var(--ink)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">60s Calm Reset</span>
                  </div>
                  <span className="font-mono text-xs text-[var(--ink-muted)]">
                    {isBreathingActive
                      ? `${calmSecondsLeft}s • Tap to pause`
                      : calmSecondsLeft === 0
                        ? 'Completed • Restart'
                        : 'Tap to begin'}
                  </span>
                </div>

                {isBreathingActive || calmSecondsLeft < 60 ? (
                  <div className="mt-3 flex flex-col items-center pb-1">
                    <div className="relative flex h-[108px] w-[108px] items-center justify-center">
                      <svg viewBox="0 0 108 108" className="h-full w-full">
                        <circle
                          cx="54"
                          cy="54"
                          r="48"
                          fill="none"
                          stroke="currentColor"
                          strokeOpacity={0.14}
                          strokeWidth="1"
                        />
                        <circle
                          cx="54"
                          cy="54"
                          r={50 * ringScale}
                          fill="var(--active-fill)"
                          fillOpacity={0.16}
                          stroke="var(--active-fill)"
                          strokeWidth="1.85"
                          style={{ transition: 'r 950ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold text-[var(--ink)]">{phaseLabel}</span>
                        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                          {calmSecondsLeft}s
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-5 h-12 w-full cursor-pointer rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Return Safely Home
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-2.5 h-12 w-full cursor-pointer rounded-full border border-[var(--subtle-border)] text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                Back to GambleAware Guard
              </button>

              <p className="mt-3.5 text-xs text-[var(--ink-muted)]">
                A product of Imoogle Technology
              </p>
            </div>
          </LiquidGlassCard>
        </div>
      </LiquidGlassBackdrop>
    </div>
  );
};
