import React, { useMemo, useState } from 'react';
import {
  Ban,
  CalendarClock,
  Check,
  Edit3,
  Gauge,
  Plus,
  RotateCcw,
  Star,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  DailyBlockStat,
  HighRiskScheduleConfig,
  RECOVERY_MILESTONES,
  RecoveryGoalCategory,
  RecoveryGoalEntity,
  TriggerBreakdown,
} from '../../data/types';
import { formatNaira } from '../../utils/currency';
import { computeGoalProgress, GOAL_PRESETS } from '../../utils/goalsEngine';
import {
  BURST_LIMIT_PRESETS,
  COOLDOWN_MINUTE_PRESETS,
  DAILY_CAP_PRESETS,
  RateLimitConfig,
  RateLimitStatus,
} from '../../utils/rateLimiter';
import { LiquidSwitch } from '../LiquidGlass';

interface GoalsAndLimitsTabProps {
  rateLimitConfig: RateLimitConfig;
  rateLimitStatus: RateLimitStatus;
  highRiskSchedule: HighRiskScheduleConfig;
  isLocked: boolean;
  goals: RecoveryGoalEntity[];
  cleanDays: number;
  cleanExactDays: number;
  estimatedSavedNgn: number;
  dailyStakeNgn: number;
  sevenDayStats: DailyBlockStat[];
  triggerBreakdown: TriggerBreakdown[];
  onUpdateRateLimitConfig: (patch: Partial<RateLimitConfig>) => void;
  onUpdateHighRiskSchedule: (patch: Partial<HighRiskScheduleConfig>) => void;
  onTestBurstLimit: () => void;
  onResetCooldown: () => void;
  onCreateGoal: (input: {
    title: string;
    category: RecoveryGoalCategory;
    targetDays: number;
    targetAmountNgn: number;
    whyNote: string;
  }) => { valid: boolean; error: string | null };
  onSetPrimaryGoal: (goalId: string) => void;
  onToggleGoalCompleted: (goalId: string) => void;
  onRemoveGoal: (goalId: string) => void;
  onUpdateDailyStake: (stakeNgn: number) => void;
  onOpenUrgeJournal: () => void;
}

const STAKE_PRESETS = [1000, 2500, 5000, 10000, 25000] as const;

const GOAL_CATEGORIES: Array<{ id: RecoveryGoalCategory; label: string }> = [
  { id: 'streak', label: 'Clean Streak' },
  { id: 'savings', label: 'Savings Target' },
  { id: 'milestone', label: 'Life Milestone' },
];

export const GoalsAndLimitsTab: React.FC<GoalsAndLimitsTabProps> = ({
  rateLimitConfig,
  rateLimitStatus,
  highRiskSchedule,
  isLocked,
  goals,
  cleanDays,
  cleanExactDays,
  estimatedSavedNgn,
  dailyStakeNgn,
  sevenDayStats,
  triggerBreakdown,
  onUpdateRateLimitConfig,
  onUpdateHighRiskSchedule,
  onTestBurstLimit,
  onResetCooldown,
  onCreateGoal,
  onSetPrimaryGoal,
  onToggleGoalCompleted,
  onRemoveGoal,
  onUpdateDailyStake,
  onOpenUrgeJournal,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RecoveryGoalCategory>('streak');
  const [targetDays, setTargetDays] = useState('30');
  const [targetAmountNgn, setTargetAmountNgn] = useState('150000');
  const [whyNote, setWhyNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const maxWeeklyCount = useMemo(
    () => Math.max(1, ...sevenDayStats.map((d) => d.count)),
    [sevenDayStats],
  );

  const projectedAnnualNgn = dailyStakeNgn * 365;

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onCreateGoal({
      title,
      category,
      targetDays: Number(targetDays),
      targetAmountNgn: Number(targetAmountNgn || 0),
      whyNote,
    });
    if (!res.valid) {
      setFormError(res.error || 'Please review your goal details.');
      return;
    }
    setFormError(null);
    setTitle('');
    setWhyNote('');
  };

  const applyPreset = (presetId: string) => {
    const preset = GOAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setTitle(preset.title);
    setCategory(preset.category);
    setTargetDays(String(preset.targetDays));
    setTargetAmountNgn(String(preset.targetAmountNgn));
    setWhyNote(preset.whyNote);
    setFormError(null);
  };

  return (
    <div data-testid="mainapp-tab-goals" className="space-y-6">
      <div>
        <p className="font-mono text-[11px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
          Rate Limiting, Goals &amp; Savings
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
          Goals &amp; Smart Rate Limits
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Stop rapid tilt bursts automatically with sliding-window cooldowns and track personal recovery milestones.
        </p>
      </div>

      {/* Section 1: Rate Limiting & Cooldown Control Center */}
      <section
        data-testid="rate-limit-panel"
        className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6"
      >
        <div className="border-b border-[var(--subtle-border)] pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Gauge className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              <h2 className="truncate font-display text-base font-bold text-[var(--ink)] sm:text-lg">
                Burst Rate Limiter
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="font-mono text-xs font-semibold text-[var(--ink-muted)]">
                {rateLimitConfig.enabled ? 'Enabled' : 'Paused'}
              </span>
              <LiquidSwitch
                checked={rateLimitConfig.enabled}
                onChange={(next) => onUpdateRateLimitConfig({ enabled: next })}
                ariaLabel="Enable burst rate limiting"
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
            Tracks rapid betting attempts in a rolling 10-minute window and daily cap. Reaching a limit locks out rapid retries with an automatic cooldown.
          </p>
        </div>

        {/* Live Cooldown Lockout Banner */}
        {rateLimitStatus.isCooldownActive ? (
          <div
            data-testid="rate-limit-cooldown-banner"
            className="mt-4 flex flex-col gap-3 rounded-2xl border border-[var(--active-fill)] bg-[var(--soft-accent-bg)] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-mono text-xs font-bold text-[var(--accent-ink)] uppercase tabular-nums">
                Cooldown Lockout Active · {rateLimitStatus.cooldownFormatted} Remaining
              </p>
              <p className="mt-1 text-xs text-[var(--ink)]">
                {rateLimitStatus.summary}
              </p>
            </div>
            {!isLocked ? (
              <button
                type="button"
                data-testid="reset-cooldown-btn"
                onClick={onResetCooldown}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear Cooldown</span>
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Live Usage Meters + Test Simulator */}
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className="space-y-4 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[var(--ink-muted)]">10-Minute Burst Window</span>
                <span
                  data-testid="goals-burst-count"
                  className="font-bold text-[var(--ink)] tabular-nums"
                >
                  {rateLimitStatus.attemptsLast10Min} / {rateLimitStatus.effectiveBurstLimit}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--subtle-border)]">
                <div
                  className="h-full bg-[var(--active-fill)] transition-all duration-200"
                  style={{ width: `${rateLimitStatus.burstUtilizationPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[var(--ink-muted)]">Daily Attempt Cap</span>
                <span
                  data-testid="goals-daily-count"
                  className="font-bold text-[var(--ink)] tabular-nums"
                >
                  {rateLimitStatus.attemptsToday} / {rateLimitStatus.dailyCap}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--subtle-border)]">
                <div
                  className="h-full bg-[var(--ink)] transition-all duration-200"
                  style={{ width: `${rateLimitStatus.dailyUtilizationPct}%` }}
                />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
              {rateLimitStatus.summary}
            </p>

            <button
              type="button"
              data-testid="test-burst-limit-btn"
              onClick={onTestBurstLimit}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Test Burst Rate Limit (+1 Attempt)</span>
            </button>
          </div>

          {/* Threshold Presets + High-Risk Schedules */}
          <div className="space-y-4 lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className="block text-xs font-semibold text-[var(--ink)]">
                  Max Burst (10 min)
                </span>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {BURST_LIMIT_PRESETS.map((val) => {
                    const active = rateLimitConfig.maxAttemptsPer10Min === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        data-testid={`burst-preset-${val}`}
                        onClick={() => onUpdateRateLimitConfig({ maxAttemptsPer10Min: val })}
                        className={`h-10 cursor-pointer rounded-xl border font-mono text-xs font-semibold transition-colors ${
                          active
                            ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                            : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[var(--ink)]">
                  Daily Attempt Cap
                </span>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {DAILY_CAP_PRESETS.map((val) => {
                    const active = rateLimitConfig.dailyAttemptCap === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        data-testid={`daily-cap-preset-${val}`}
                        onClick={() => onUpdateRateLimitConfig({ dailyAttemptCap: val })}
                        className={`h-10 cursor-pointer rounded-xl border font-mono text-xs font-semibold transition-colors ${
                          active
                            ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                            : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[var(--ink)]">
                  Cooldown Duration
                </span>
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {COOLDOWN_MINUTE_PRESETS.map((mins) => {
                    const active = rateLimitConfig.cooldownMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        data-testid={`cooldown-preset-${mins}`}
                        onClick={() => onUpdateRateLimitConfig({ cooldownMinutes: mins })}
                        className={`h-10 cursor-pointer rounded-xl border font-mono text-xs font-semibold transition-colors ${
                          active
                            ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                            : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* High-Risk Schedule Strictness */}
            <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-[var(--accent-ink)]" />
                <h3 className="font-display text-sm font-bold text-[var(--ink)]">
                  High-Risk Schedule Strictness
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Automatically tightens your 10-minute burst limit during vulnerable betting hours.
              </p>

              <div className="mt-3 divide-y divide-[var(--subtle-border)]">
                <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--ink)]">
                      Late-Night Lockout (10:00 PM – 5:00 AM)
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Stops midnight live-casino and in-play chasing.
                    </p>
                  </div>
                  <LiquidSwitch
                    checked={highRiskSchedule.lateNightLockout}
                    onChange={(next) => onUpdateHighRiskSchedule({ lateNightLockout: next })}
                    ariaLabel="Toggle Late-Night Lockout"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--ink)]">
                      Matchday Weekend Guard (Fri Eve – Sun Night)
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Stricter threshold during weekend football fixtures.
                    </p>
                  </div>
                  <LiquidSwitch
                    checked={highRiskSchedule.matchdayWeekendGuard}
                    onChange={(next) => onUpdateHighRiskSchedule({ matchdayWeekendGuard: next })}
                    ariaLabel="Toggle Matchday Weekend Guard"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--ink)]">
                      Payday Surge Guard (25th – 3rd of Month)
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Extra friction when salary or income arrives.
                    </p>
                  </div>
                  <LiquidSwitch
                    checked={highRiskSchedule.paydaySurgeGuard}
                    onChange={(next) => onUpdateHighRiskSchedule({ paydaySurgeGuard: next })}
                    ariaLabel="Toggle Payday Surge Guard"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Recovery Goal Setting (Create + List) */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Create Goal Form */}
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--accent-ink)]" />
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">
              Create Recovery Goal
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Give your clean streak a real target and personal reason to stay firm.
          </p>

          {/* Quick Presets */}
          <div className="mt-4">
            <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
              Quick Goal Presets
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="h-9 cursor-pointer rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGoalSubmit} className="mt-4 space-y-3.5" data-testid="create-goal-form">
            <div>
              <label htmlFor="goal-title-input" className="block text-xs font-semibold text-[var(--ink)]">
                Goal Title
              </label>
              <input
                id="goal-title-input"
                data-testid="goal-title-input"
                type="text"
                maxLength={64}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setFormError(null);
                }}
                placeholder="e.g. Debt-Free 60 Days"
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-[var(--ink)]">Category</span>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {GOAL_CATEGORIES.map((item) => {
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`h-10 cursor-pointer rounded-xl border text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="goal-days-input" className="block text-xs font-semibold text-[var(--ink)]">
                  Target Days
                </label>
                <input
                  id="goal-days-input"
                  data-testid="goal-days-input"
                  type="number"
                  min={1}
                  max={1825}
                  value={targetDays}
                  onChange={(e) => setTargetDays(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 font-mono text-sm text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="goal-amount-input" className="block text-xs font-semibold text-[var(--ink)]">
                  Target Savings (₦)
                </label>
                <input
                  id="goal-amount-input"
                  data-testid="goal-amount-input"
                  type="number"
                  min={0}
                  step={1000}
                  value={targetAmountNgn}
                  onChange={(e) => setTargetAmountNgn(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 font-mono text-sm text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="goal-why-input" className="block text-xs font-semibold text-[var(--ink)]">
                Your Personal “Why” (Optional)
              </label>
              <input
                id="goal-why-input"
                data-testid="goal-why-input"
                type="text"
                maxLength={180}
                value={whyNote}
                onChange={(e) => setWhyNote(e.target.value)}
                placeholder="e.g. Save for family & sleep peacefully"
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
              />
            </div>

            {formError ? (
              <p role="alert" className="text-xs font-semibold text-[var(--accent-ink)]">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              data-testid="create-goal-submit-btn"
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>Save Recovery Goal</span>
            </button>
          </form>
        </section>

        {/* Active Goals List */}
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--ink)]">
                Your Recovery Goals ({goals.length})
              </h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Pin a primary goal to display it directly on your Shield home screen.
              </p>
            </div>
          </div>

          {goals.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-6 text-center">
              <Target className="mx-auto h-6 w-6 text-[var(--accent-ink)]" />
              <p className="mt-2 font-display text-sm font-bold text-[var(--ink)]">
                No recovery goals created yet
              </p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                Pick a preset or enter your own streak or ₦ savings goal on the left.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3" data-testid="goals-list">
              {goals.map((goal) => {
                const progress = computeGoalProgress(goal, cleanExactDays, estimatedSavedNgn);
                return (
                  <article
                    key={goal.goalId}
                    data-testid={`goal-card-${goal.goalId}`}
                    className={`rounded-2xl border p-4 ${
                      goal.isPrimary
                        ? 'border-[var(--active-fill)] bg-[var(--soft-accent-bg)]'
                        : 'border-[var(--subtle-border)] bg-[var(--control-bg)]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-[var(--accent-ink)] uppercase">
                          <span>{goal.category}</span>
                          {goal.isPrimary ? <span>· PRIMARY</span> : null}
                          {goal.isCompleted ? <span>· COMPLETED</span> : null}
                        </div>
                        <h3 className="mt-1 font-display text-base font-bold text-[var(--ink)]">
                          {goal.title}
                        </h3>
                        {goal.whyNote ? (
                          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                            “{goal.whyNote}”
                          </p>
                        ) : null}
                      </div>
                      <span className="font-mono text-sm font-bold text-[var(--accent-ink)] tabular-nums">
                        {progress.progressPct}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--subtle-border)]">
                      <div
                        className="h-full bg-[var(--active-fill)] transition-all duration-200"
                        style={{ width: `${Math.max(3, progress.progressPct)}%` }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                        {progress.subtitle} · {goal.targetDays}d
                        {goal.targetAmountNgn > 0 ? ` · ${formatNaira(goal.targetAmountNgn)}` : ''}
                      </p>

                      <div className="flex items-center gap-1.5">
                        {!goal.isPrimary ? (
                          <button
                            type="button"
                            onClick={() => onSetPrimaryGoal(goal.goalId)}
                            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 text-[11px] font-semibold text-[var(--ink)]"
                          >
                            <Star className="h-3 w-3 text-[var(--accent-ink)]" />
                            <span>Primary</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onToggleGoalCompleted(goal.goalId)}
                          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 text-[11px] font-semibold text-[var(--ink)]"
                        >
                          <Check className="h-3 w-3 text-[var(--accent-ink)]" />
                          <span>{goal.isCompleted ? 'Reopen' : 'Complete'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveGoal(goal.goalId)}
                          aria-label={`Delete goal ${goal.title}`}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Section 3: Savings Baseline, 7-Day Activity & Milestones */}
      <div className="grid gap-5 lg:grid-cols-12">
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6 lg:col-span-6">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[var(--ink)]">
                Money Kept Safe
              </h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Based on your clean time plus banked urge stakes.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[var(--accent-ink)] tabular-nums">
              <TrendingUp className="h-3.5 w-3.5" />
              {formatNaira(projectedAnnualNgn)}/yr
            </span>
          </div>

          <p className="mt-3 font-mono text-3xl font-bold text-[var(--ink)] tabular-nums">
            {formatNaira(estimatedSavedNgn)}
          </p>

          <div className="mt-4">
            <span className="block text-xs font-semibold text-[var(--ink)]">
              Typical Daily Betting Stake
            </span>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {STAKE_PRESETS.map((amount) => {
                const active = dailyStakeNgn === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => onUpdateDailyStake(amount)}
                    className={`h-10 cursor-pointer rounded-xl border font-mono text-xs font-semibold transition-colors ${
                      active
                        ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                    }`}
                  >
                    ₦{amount >= 1000 ? `${amount / 1000}k` : amount}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7-Day Blocked Attempts Chart */}
          <div className="mt-5 border-t border-[var(--subtle-border)] pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--ink)]">7-Day Intercept Activity</span>
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">Last 7 days</span>
            </div>
            <div className="mt-3 grid h-20 grid-cols-7 items-end gap-2">
              {sevenDayStats.map((day, idx) => (
                <div key={`${day.dayLabel}-${idx}`} className="flex h-full flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-t-md bg-[var(--active-fill)] transition-all"
                    style={{
                      height: `${day.count === 0 ? 10 : Math.max(18, Math.round((day.count / maxWeeklyCount) * 100))}%`,
                      opacity: day.count === 0 ? 0.2 : 1,
                    }}
                  />
                  <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                    {day.dayLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recovery Milestones & Urge Triggers */}
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6 lg:col-span-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Clean Streak Milestones
            </h2>
            <button
              type="button"
              onClick={onOpenUrgeJournal}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
            >
              <Edit3 className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
              <span>Log Urge</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {RECOVERY_MILESTONES.map((milestone) => {
              const reached = cleanDays >= milestone.days;
              return (
                <div
                  key={milestone.days}
                  className={`rounded-xl border p-2.5 ${
                    reached
                      ? 'border-[var(--active-fill)] bg-[var(--soft-accent-bg)]'
                      : 'border-[var(--subtle-border)] bg-[var(--control-bg)]'
                  }`}
                >
                  <p className="font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                    {milestone.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-[var(--ink)]">
                    {milestone.title}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-[var(--subtle-border)] pt-4">
            <h3 className="text-xs font-semibold text-[var(--ink)]">Top Resisted Triggers</h3>
            {triggerBreakdown.length === 0 ? (
              <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
                Log a resisted urge to discover which times and moods trigger cravings most.
              </p>
            ) : (
              <div className="mt-2.5 divide-y divide-[var(--subtle-border)]">
                {triggerBreakdown.slice(0, 4).map((item) => (
                  <div
                    key={item.triggerTag}
                    className="flex items-center justify-between py-2 text-xs first:pt-0 last:pb-0"
                  >
                    <span className="font-medium text-[var(--ink)]">{item.triggerTag}</span>
                    <span className="font-mono font-bold text-[var(--accent-ink)] tabular-nums">
                      {item.count}×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
