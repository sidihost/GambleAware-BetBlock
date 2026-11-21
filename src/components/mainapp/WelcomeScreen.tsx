import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Download,
  Gauge,
  KeyRound,
  Lock,
  Moon,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Target,
} from 'lucide-react';
import { BrandGMark } from '../AppHeader';
import { GOAL_PRESETS } from '../../utils/goalsEngine';
import { BURST_LIMIT_PRESETS, COOLDOWN_MINUTE_PRESETS } from '../../utils/rateLimiter';
import { formatNaira } from '../../utils/currency';
import { LOCK_DURATION_PRESETS } from '../../utils/lockDurations';

export interface WelcomeCompletionPayload {
  preferredName: string;
  dailyStakeNgn: number;
  selectedGoalPresetId: string;
  maxAttemptsPer10Min: number;
  cooldownMinutes: number;
  lockDays: number;
}

interface WelcomeScreenProps {
  initialName: string;
  initialDailyStake: number;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onComplete: (payload: WelcomeCompletionPayload) => void;
  onSkip: () => void;
  onOpenDownloadPage: () => void;
}

const CORE_PILLARS = [
  {
    icon: KeyRound,
    title: 'Use Any VPN Freely',
    detail: 'Zero-VPN blocking protects Chrome, Brave, Firefox, Opera & social links without breaking ProtonVPN, Mullvad, WARP, or banking apps.',
  },
  {
    icon: ShoppingBag,
    title: 'Play Store & Install Blocker',
    detail: 'Stops betting app downloads inside Play Store and APK installers, and detects installed betting apps immediately.',
  },
  {
    icon: Gauge,
    title: 'Smart Rate Limiting & Cooldowns',
    detail: 'Detects rapid urge bursts, enforces automatic cooldown timers, and tightens filtering during late nights, matchdays, and paydays.',
  },
  {
    icon: Target,
    title: 'Recovery Goals & Full Resources',
    detail: 'Set streak and savings targets in ₦, freeze betting cards via bank guides, and access 24/7 confidential helplines anytime.',
  },
];

const STAKE_OPTIONS = [2500, 5000, 10000, 25000] as const;

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  initialName,
  initialDailyStake,
  isDarkTheme,
  onToggleTheme,
  onComplete,
  onSkip,
  onOpenDownloadPage,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [preferredName, setPreferredName] = useState(initialName);
  const [dailyStakeNgn, setDailyStakeNgn] = useState<number>(initialDailyStake || 5000);
  const [selectedGoalPresetId, setSelectedGoalPresetId] = useState<string>(GOAL_PRESETS[0].id);
  const [maxAttemptsPer10Min, setMaxAttemptsPer10Min] = useState<number>(3);
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(15);
  const [lockDays, setLockDays] = useState<number>(0);

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      preferredName: preferredName.trim(),
      dailyStakeNgn,
      selectedGoalPresetId,
      maxAttemptsPer10Min,
      cooldownMinutes,
      lockDays,
    });
  };

  return (
    <div
      data-testid="welcome-screen"
      className="flex min-h-screen w-full flex-col bg-[var(--canvas)] text-[var(--ink)]"
    >
      {/* Minimal Flat Top Utility Bar */}
      <header className="w-full border-b border-[var(--subtle-border)] bg-[var(--surface)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <BrandGMark className="h-8 w-8 shrink-0" />
            <span className="font-display text-base font-bold tracking-tight text-[var(--ink)]">
              GambleAware
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDownloadPage}
              data-testid="welcome-download-apk-btn"
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3.5 text-xs font-semibold whitespace-nowrap text-[var(--ink)] transition-colors hover:border-[var(--glass-border)]"
            >
              <Download className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
              <span>Android APK</span>
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkTheme ? 'Switch to White theme' : 'Switch to Obsidian theme'}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)] transition-colors hover:border-[var(--glass-border)]"
            >
              {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Welcome Content */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 sm:px-6 sm:py-12">
        {step === 1 ? (
          <div className="grid w-full items-start gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left 6 Cols: Calm Editorial Welcome Hero */}
            <div className="min-w-0 lg:col-span-6">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>100% Free Forever · Private On-Device Blocker</span>
              </div>

              <h1 className="mt-4 max-w-xl font-display text-3xl leading-[1.08] font-bold tracking-tight text-balance text-[var(--ink)] sm:text-5xl">
                Take back calm control before the next urge hits.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
                GambleAware blocks 1,035+ betting sites, Play Store downloads, and betting apps on-device — paired with automatic burst rate limiting, personal savings goals, bank-block checklists, and an unbreakable Commitment Lock.
              </p>

              {/* Step Progress Bar */}
              <div className="mt-6 flex items-center gap-3 font-mono text-xs text-[var(--ink-muted)]">
                <span className="font-semibold text-[var(--accent-ink)]">Step 1 of 2</span>
                <span aria-hidden="true">·</span>
                <span>Overview &amp; Guarantees</span>
              </div>

              {/* Primary & Secondary Actions */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  data-testid="welcome-start-setup-btn"
                  onClick={() => setStep(2)}
                  className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-6 text-sm font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90 sm:w-auto"
                >
                  <span>Personalize Shield &amp; Goals</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </button>

                <button
                  type="button"
                  data-testid="welcome-enter-directly-btn"
                  onClick={onSkip}
                  className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-5 text-sm font-semibold whitespace-nowrap text-[var(--ink)] transition-colors hover:border-[var(--glass-border)] sm:w-auto"
                >
                  <span>Enter Shield Directly</span>
                </button>
              </div>

              {/* Clean Unboxed Proof Strip */}
              <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-[var(--subtle-border)] pt-6">
                <div>
                  <dt className="font-mono text-[11px] text-[var(--ink-muted)] uppercase">
                    Domains Blocked
                  </dt>
                  <dd className="mt-1 font-mono text-2xl font-bold text-[var(--ink)] tabular-nums">
                    1,035+
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] text-[var(--ink-muted)] uppercase">
                    VPN Conflict
                  </dt>
                  <dd className="mt-1 font-mono text-2xl font-bold text-[var(--accent-ink)] tabular-nums">
                    0%
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] text-[var(--ink-muted)] uppercase">
                    Cost Forever
                  </dt>
                  <dd className="mt-1 font-mono text-2xl font-bold text-[var(--ink)] tabular-nums">
                    Free
                  </dd>
                </div>
              </dl>
            </div>

            {/* Right 6 Cols: Crisp Flat Architectural Pillars */}
            <div className="min-w-0 lg:col-span-6">
              <div className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-7">
                <div className="flex items-center justify-between border-b border-[var(--subtle-border)] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--soft-accent-bg)]">
                      <BrandGMark className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-display text-base font-bold text-[var(--ink)]">
                        Engineered for Real Recovery
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        No account required · Everything stays private on your device
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-[var(--subtle-border)]">
                  {CORE_PILLARS.map((pillar) => {
                    const Icon = pillar.icon;
                    return (
                      <div
                        key={pillar.title}
                        className="flex items-start gap-3.5 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--accent-ink)]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-display text-sm font-bold text-[var(--ink)]">
                            {pillar.title}
                          </h2>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                            {pillar.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Personalize Goal, Rate Limiter & Optional Commitment Lock */
          <form
            onSubmit={handleFinish}
            data-testid="welcome-setup-form"
            className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--subtle-border)] pb-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Overview</span>
              </button>
              <span className="font-mono text-xs font-semibold text-[var(--ink-muted)]">
                Step 2 of 2 · Configure Your Shield
              </span>
            </div>

            <div className="mt-5">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
                Set your starting goal &amp; rate limit
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Every setting below is stored locally on your device and can be adjusted later unless locked.
              </p>
            </div>

            <div className="mt-6 space-y-6">
              {/* Name + Daily Stake */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="welcome-name-input"
                    className="block text-xs font-semibold text-[var(--ink)]"
                  >
                    First Name (Optional)
                  </label>
                  <input
                    id="welcome-name-input"
                    data-testid="welcome-name-input"
                    type="text"
                    maxLength={40}
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    placeholder="e.g. Chidi"
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[var(--ink)]">
                    Typical Daily Betting Stake
                  </span>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {STAKE_OPTIONS.map((amount) => {
                      const active = dailyStakeNgn === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setDailyStakeNgn(amount)}
                          className={`h-11 cursor-pointer rounded-xl border font-mono text-xs font-semibold transition-colors ${
                            active
                              ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                              : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)] hover:border-[var(--glass-border)]'
                          }`}
                        >
                          ₦{amount / 1000}k
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Primary Recovery Goal Preset */}
              <div>
                <span className="block text-xs font-semibold text-[var(--ink)]">
                  Choose Your First Recovery Goal
                </span>
                <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                  {GOAL_PRESETS.map((preset) => {
                    const selected = selectedGoalPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        data-testid={`welcome-goal-${preset.id}`}
                        onClick={() => setSelectedGoalPresetId(preset.id)}
                        className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-3.5 text-left transition-colors ${
                          selected
                            ? 'border-[var(--active-fill)] bg-[var(--soft-accent-bg)]'
                            : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:border-[var(--glass-border)]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-bold text-[var(--accent-ink)]">
                              {preset.targetDays} DAYS
                            </span>
                            {selected ? (
                              <Check className="h-4 w-4 text-[var(--accent-ink)]" />
                            ) : null}
                          </div>
                          <p className="mt-1 font-display text-sm font-bold text-[var(--ink)]">
                            {preset.title}
                          </p>
                        </div>
                        <p className="mt-2 font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                          Target {formatNaira(preset.targetAmountNgn)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rate Limiting Defaults */}
              <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-[var(--accent-ink)]" />
                  <h3 className="font-display text-sm font-bold text-[var(--ink)]">
                    Burst Rate Limiter &amp; Cooldown
                  </h3>
                </div>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Automatically locks out rapid repeat attempts to interrupt chasing-loss spirals.
                </p>

                <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-[11px] font-medium text-[var(--ink-muted)]">
                      Max attempts per 10 min
                    </span>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                      {BURST_LIMIT_PRESETS.map((limit) => {
                        const active = maxAttemptsPer10Min === limit;
                        return (
                          <button
                            key={limit}
                            type="button"
                            onClick={() => setMaxAttemptsPer10Min(limit)}
                            className={`h-10 cursor-pointer rounded-xl border font-mono text-xs font-semibold transition-colors ${
                              active
                                ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                                : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)]'
                            }`}
                          >
                            {limit} tries
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-[var(--ink-muted)]">
                      Cooldown duration
                    </span>
                    <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                      {COOLDOWN_MINUTE_PRESETS.map((mins) => {
                        const active = cooldownMinutes === mins;
                        return (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setCooldownMinutes(mins)}
                            className={`h-10 cursor-pointer rounded-xl border font-mono text-xs font-semibold transition-colors ${
                              active
                                ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                                : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)]'
                            }`}
                          >
                            {mins}m
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Commitment Lock */}
              <div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[var(--accent-ink)]" />
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    Commitment Lock Duration (Optional)
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLockDays(0)}
                    className={`h-10 cursor-pointer rounded-xl border px-3 text-xs font-semibold transition-colors ${
                      lockDays === 0
                        ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                    }`}
                  >
                    Decide Later
                  </button>
                  {LOCK_DURATION_PRESETS.slice(0, 5).map((preset) => {
                    const active = lockDays === preset.days;
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setLockDays(preset.days)}
                        className={`h-10 cursor-pointer rounded-xl border px-3 font-mono text-xs font-semibold transition-colors ${
                          active
                            ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                            : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="mt-7 flex flex-col gap-3 border-t border-[var(--subtle-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onSkip}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] px-5 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                Skip &amp; Explore First
              </button>
              <button
                type="submit"
                data-testid="welcome-complete-btn"
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-7 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
              >
                {lockDays > 0 ? <Lock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                <span>
                  {lockDays > 0
                    ? `Arm ${lockDays}-Day Lock & Enter Shield`
                    : 'Enter GambleAware Shield'}
                </span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
