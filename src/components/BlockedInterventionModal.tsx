import React, { useEffect, useState } from 'react';
import { LockKeyhole, PiggyBank, Target, Wind } from 'lucide-react';
import { InterventionPayload, RecoveryGoalEntity } from '../data/types';
import { formatBlockedTargetDisplay } from '../utils/blockedLogGrouping';
import { formatNaira } from '../utils/currency';
import { calculateGoalProgress } from '../utils/personalization';
import { analyzePromoAndExpectedLoss } from '../utils/tiltRadar';
import { BrandGMark } from './AppHeader';
import { BettingBrandLogo } from './BettingBrandLogo';

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
  const displayTarget =
    payload.isAntiTamper || isCalmResetTool
      ? payload.target
      : formatBlockedTargetDisplay(payload.target);
  const stakeToBank = Math.max(500, dailySpendNgn || 5000);
  const promoInsight = !payload.isAntiTamper && !isCalmResetTool
    ? analyzePromoAndExpectedLoss(payload.target, stakeToBank)
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GambleAware Protection Redirect"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-4"
    >
      <div className="flex max-h-[90dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl">
        {/* Compact Pinned Header */}
        <div className="shrink-0 border-b border-[var(--subtle-border)] px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2.5">
            {payload.isAntiTamper ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
                <LockKeyhole className="h-5 w-5" />
              </div>
            ) : isCalmResetTool ? (
              <BrandGMark className="h-10 w-10 shrink-0" />
            ) : (
              <BettingBrandLogo target={payload.target} size="md" />
            )}
            <div className="min-w-0 text-left">
              <p className="font-mono text-[11px] font-semibold text-[var(--accent-ink)]">
                GambleAware
              </p>
              <h2 className="font-display text-base leading-tight font-bold text-[var(--ink)] sm:text-lg">
                {payload.isAntiTamper
                  ? 'Uninstall & Settings Locked'
                  : payload.isLoginRedirect
                    ? 'Betting Login Blocked'
                    : isCalmResetTool
                      ? 'Pause & Breathe'
                      : 'Betting Platform Blocked'}
              </h2>
            </div>
          </div>
          <p className="mt-1.5 text-left text-xs leading-snug text-[var(--ink-muted)]">
            {payload.isAntiTamper
              ? 'Device Admin and your lock timer prevent uninstalling the app or changing rules until the countdown finishes.'
              : payload.isLoginRedirect
                ? 'Blocked before the sign-in page could open.'
                : 'Blocked before the page could load. Most betting urges pass within a few minutes.'}
          </p>
        </div>

        {/* Scrollable Middle Body */}
        <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
          {/* Intercept summary */}
          <div className="flex w-full items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3.5 py-2.5 text-left">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
              {!payload.isAntiTamper && !isCalmResetTool ? (
                <BettingBrandLogo target={payload.target} size="sm" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] font-semibold text-[var(--accent-ink)]">
                  {payload.isAntiTamper
                    ? 'Lock timer active'
                    : payload.source.toLowerCase().includes('app') ||
                        payload.source.toLowerCase().includes('install')
                      ? 'Betting app blocked'
                      : isCalmResetTool
                        ? '60s urge reset'
                        : 'Betting site blocked'}
                </p>
                <p className="mt-0.5 truncate font-display text-sm font-bold text-[var(--ink)]">
                  {displayTarget}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--ink-muted)]">
                  {payload.source} · {payload.category}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-base font-bold tabular-nums text-[var(--accent-ink)]">
                {cleanDays}d
              </p>
              <p className="text-[10px] text-[var(--ink-muted)]">Streak</p>
            </div>
          </div>

          {promoInsight ? (
            <div className="w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-2 text-left">
              <p className="font-mono text-[10px] font-semibold text-[var(--accent-ink)]">
                Odds &amp; House Margin
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
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
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] px-4 text-xs font-semibold text-[var(--accent-ink)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-70"
            >
              <PiggyBank className="h-4 w-4 shrink-0" />
              <span>
                {bankedStakeDone
                  ? `Added ${formatNaira(stakeToBank)} to Savings`
                  : `Save ${formatNaira(stakeToBank)} Instead`}
              </span>
            </button>
          ) : null}

          {/* Personal Goal Anchor Reminder */}
          {primaryGoal && goalProgress ? (
            <div className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--control-bg)] p-3 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-ink)]">
                  <Target className="h-3.5 w-3.5" />
                  <span>Remember Your Goal</span>
                </span>
                <span className="font-mono text-xs font-bold tabular-nums text-[var(--ink)]">
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
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--control-bg)] px-3.5 py-2.5 text-left hover:bg-[var(--muted-fill)]"
            >
              <div className="flex items-center gap-2.5">
                <Target className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                <div>
                  <p className="text-xs font-bold text-[var(--ink)]">
                    Add a savings goal to keep focus
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    Set a Naira or clean-days target
                  </p>
                </div>
              </div>
            </button>
          ) : null}

          {/* Interactive 60s Calm Reset Card */}
          <button
            type="button"
            onClick={toggleBreathing}
            className="w-full cursor-pointer rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3 text-left transition-colors hover:bg-[var(--muted-fill)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-[var(--ink)]" />
                <span className="text-xs font-semibold text-[var(--ink)] sm:text-sm">
                  60s Breathing Reset
                </span>
              </div>
              <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                {isBreathingActive
                  ? `${calmSecondsLeft}s · Tap to pause`
                  : calmSecondsLeft === 0
                    ? 'Completed · Restart'
                    : 'Tap to begin'}
              </span>
            </div>

            {isBreathingActive || calmSecondsLeft < 60 ? (
              <div className="mt-2 flex flex-col items-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
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
                    <span className="text-[11px] font-semibold text-[var(--ink)]">{phaseLabel}</span>
                    <span className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                      {calmSecondsLeft}s
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </button>
        </div>

        {/* Pinned Always-Visible Bottom CTA Footer */}
        <div className="shrink-0 border-t border-[var(--subtle-border)] bg-[var(--surface)] px-4 py-3 text-center">
          <button
            type="button"
            onClick={onClose}
            data-testid="modal-return-home-button"
            className="h-10 w-full cursor-pointer rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:text-sm"
          >
            Back to GambleAware
          </button>
          <p className="mt-1.5 text-[10px] text-[var(--ink-muted)]">Imoogle Technology</p>
        </div>
      </div>
    </div>
  );
};
