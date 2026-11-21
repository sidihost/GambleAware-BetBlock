import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Ban,
  BookOpen,
  Clock,
  Edit3,
  Gauge,
  Lock,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Wind,
} from 'lucide-react';
import {
  BlockFilterConfig,
  BlocklistMatcher,
  BlockMatchResult,
} from '../../blocker/blocklistMatcher';
import { BettingBrandLogo } from '../BettingBrandLogo';
import { LiquidShieldOrb } from '../LiquidGlass';
import { BlockedEventEntity, RecoveryGoalEntity } from '../../data/types';
import { computeGoalProgress } from '../../utils/goalsEngine';
import { RateLimitStatus } from '../../utils/rateLimiter';
import { formatNaira } from '../../utils/currency';
import {
  formatBlockedTargetDisplay,
  groupBlockedEvents,
} from '../../utils/blockedLogGrouping';

interface ShieldTabProps {
  preferredName: string;
  isProtected: boolean;
  isLocked: boolean;
  lockCountdownFormatted: string;
  cleanDays: number;
  cleanExactDays: number;
  cleanHours: number;
  cleanMinutes: number;
  estimatedSavedNgn: number;
  dailyStakeNgn: number;
  totalBlockedCount: number;
  todayBlockedCount: number;
  totalUrgeResistedCount: number;
  activeGuardsCount: number;
  totalGuardsCount: number;
  builtInDomainCount: number;
  primaryGoal: RecoveryGoalEntity | null;
  rateLimitStatus: RateLimitStatus;
  recentEvents: BlockedEventEntity[];
  filterConfig: BlockFilterConfig;
  onToggleShield: () => void;
  onSimulateBlockedAttempt: (domain: string) => void;
  onOpenCalmReset: () => void;
  onOpenUrgeJournal: () => void;
  onBankStake: () => void;
  onNavigate: (tab: 'rules' | 'goals' | 'resources' | 'lock') => void;
}

const SAMPLE_TEST_DOMAINS = [
  'sportybet.com',
  'bet9ja.com',
  'betking.com',
  '1xbet.com',
  'bet365.com',
  'stake.com',
  'betway.com',
  'msport.com',
] as const;

export const ShieldTab: React.FC<ShieldTabProps> = ({
  preferredName,
  isProtected,
  isLocked,
  lockCountdownFormatted,
  cleanDays,
  cleanExactDays,
  cleanHours,
  cleanMinutes,
  estimatedSavedNgn,
  dailyStakeNgn,
  totalBlockedCount,
  todayBlockedCount,
  totalUrgeResistedCount,
  activeGuardsCount,
  totalGuardsCount,
  builtInDomainCount,
  primaryGoal,
  rateLimitStatus,
  recentEvents,
  filterConfig,
  onToggleShield,
  onSimulateBlockedAttempt,
  onOpenCalmReset,
  onOpenUrgeJournal,
  onBankStake,
  onNavigate,
}) => {
  const [query, setQuery] = useState('sportybet.com');

  const testResult: BlockMatchResult | null = useMemo(() => {
    if (!query.trim()) return null;
    return BlocklistMatcher.matchTypedBrowserInput(query.trim(), filterConfig);
  }, [query, filterConfig]);

  const groupedSites = useMemo(
    () => groupBlockedEvents(recentEvents).slice(0, 5),
    [recentEvents],
  );

  const goalProgress = useMemo(
    () => (primaryGoal ? computeGoalProgress(primaryGoal, cleanExactDays, estimatedSavedNgn) : null),
    [primaryGoal, cleanExactDays, estimatedSavedNgn],
  );

  const firstName = preferredName.trim().split(/\s+/)[0] || '';

  return (
    <div data-testid="mainapp-tab-shield" className="space-y-6">
      {/* Top Hero Row: Shield Core + Live Rate Limit & Active Goal */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Shield Command Card */}
        <section className="flex flex-col justify-between rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
                Zero-VPN All-Browser &amp; App Shield
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
                {firstName ? `Welcome back, ${firstName}` : 'Device Shield Command'}
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)] sm:text-sm">
                {isProtected
                  ? `${activeGuardsCount}/${totalGuardsCount} guards armed · Blocking ${builtInDomainCount.toLocaleString()}+ sites while other VPNs run freely.`
                  : 'Shield is paused. Tap the orb below to resume real-time protection.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('lock')}
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 font-mono text-xs font-semibold text-[var(--accent-ink)] hover:underline"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{isLocked ? 'Lock Active' : 'Set Lock'}</span>
            </button>
          </div>

          <div className="my-5 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            <LiquidShieldOrb
              isProtected={isProtected}
              isLocked={isLocked}
              onClick={onToggleShield}
              sizeClass="h-[132px] w-[132px] shrink-0"
            />
            <div className="w-full min-w-0 flex-1 space-y-3 text-center sm:text-left">
              <div>
                <p
                  data-testid="shield-armed-status"
                  className="font-display text-lg font-bold text-[var(--ink)]"
                >
                  {isProtected
                    ? isLocked
                      ? 'Shield Armed & Commitment Locked'
                      : 'Shield Active & Watching'
                    : 'Protection Paused'}
                </p>
                {isLocked ? (
                  <p className="mt-0.5 font-mono text-xs text-[var(--accent-ink)] tabular-nums">
                    Lock countdown: {lockCountdownFormatted}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                    Tap the GambleAware emblem to toggle shield state.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  data-testid="shield-simulate-attempt-btn"
                  onClick={() => onSimulateBlockedAttempt('sportybet.com')}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90"
                >
                  <Ban className="h-3.5 w-3.5 shrink-0" />
                  <span>Simulate Blocked Attempt</span>
                </button>
                <button
                  type="button"
                  data-testid="shield-open-calm-btn"
                  onClick={onOpenCalmReset}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--ink)] hover:border-[var(--glass-border)]"
                >
                  <Wind className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                  <span>60s Calm Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3-Column Metrics Strip */}
          <dl className="grid grid-cols-3 gap-2.5 border-t border-[var(--subtle-border)] pt-4">
            <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3">
              <dt className="text-[11px] font-medium text-[var(--ink-muted)]">Clean Streak</dt>
              <dd className="mt-1 font-mono text-base font-bold text-[var(--ink)] tabular-nums sm:text-lg">
                {cleanDays > 0 ? `${cleanDays}d ${cleanHours}h` : `${cleanHours}h ${cleanMinutes}m`}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3">
              <dt className="text-[11px] font-medium text-[var(--ink-muted)]">Blocked</dt>
              <dd
                data-testid="shield-blocked-count"
                className="mt-1 font-mono text-base font-bold text-[var(--accent-ink)] tabular-nums sm:text-lg"
              >
                {totalBlockedCount}
              </dd>
              <p className="font-mono text-[10px] text-[var(--ink-muted)] tabular-nums">
                {todayBlockedCount} today
              </p>
            </div>
            <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3">
              <dt className="text-[11px] font-medium text-[var(--ink-muted)]">Est. Saved</dt>
              <dd className="mt-1 truncate font-mono text-base font-bold text-[var(--ink)] tabular-nums sm:text-lg">
                {formatNaira(estimatedSavedNgn)}
              </dd>
              <p className="font-mono text-[10px] text-[var(--ink-muted)] tabular-nums">
                {totalUrgeResistedCount} resisted
              </p>
            </div>
          </dl>
        </section>

        {/* Right 5 Cols: Rate Limiting Status + Active Goal */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          {/* Live Rate Limiter Card */}
          <section
            data-testid="shield-rate-limit-card"
            className={`rounded-3xl border p-5 ${
              rateLimitStatus.isCooldownActive
                ? 'border-[var(--active-fill)] bg-[var(--soft-accent-bg)]'
                : 'border-[var(--subtle-border)] bg-[var(--surface)]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-[var(--accent-ink)]" />
                <h2 className="font-display text-base font-bold text-[var(--ink)]">
                  Rate Limiter &amp; Cooldown
                </h2>
              </div>
              <span
                data-testid="shield-rate-limit-state"
                className="font-mono text-[11px] font-bold text-[var(--accent-ink)] uppercase tabular-nums"
              >
                {rateLimitStatus.isCooldownActive
                  ? `LOCKED ${rateLimitStatus.cooldownFormatted}`
                  : rateLimitStatus.enabled
                    ? 'ARMED'
                    : 'PAUSED'}
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              {rateLimitStatus.summary}
            </p>

            {/* Burst Progress Bar */}
            <div className="mt-4 space-y-2.5">
              <div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[var(--ink-muted)]">10-Minute Burst Window</span>
                  <span
                    data-testid="shield-burst-meter"
                    className="font-semibold text-[var(--ink)] tabular-nums"
                  >
                    {rateLimitStatus.attemptsLast10Min} / {rateLimitStatus.effectiveBurstLimit}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--subtle-border)]">
                  <div
                    className="h-full bg-[var(--active-fill)] transition-all duration-200"
                    style={{ width: `${rateLimitStatus.burstUtilizationPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[var(--ink-muted)]">Daily Attempt Cap</span>
                  <span className="font-semibold text-[var(--ink)] tabular-nums">
                    {rateLimitStatus.attemptsToday} / {rateLimitStatus.dailyCap}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--subtle-border)]">
                  <div
                    className="h-full bg-[var(--ink)] transition-all duration-200"
                    style={{ width: `${rateLimitStatus.dailyUtilizationPct}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('goals')}
              className="mt-4 inline-flex min-h-[40px] w-full cursor-pointer items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
            >
              <span>Configure Limits &amp; Risk Schedules</span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
            </button>
          </section>

          {/* Primary Recovery Goal Card */}
          <section
            data-testid="shield-goal-card"
            className="flex flex-1 flex-col justify-between rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[var(--accent-ink)]" />
                  <h2 className="font-display text-base font-bold text-[var(--ink)]">
                    Active Recovery Goal
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('goals')}
                  className="cursor-pointer font-mono text-[11px] font-semibold text-[var(--accent-ink)] hover:underline"
                >
                  Manage
                </button>
              </div>

              {primaryGoal && goalProgress ? (
                <div className="mt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-display text-sm font-bold text-[var(--ink)]">
                      {primaryGoal.title}
                    </p>
                    <span className="shrink-0 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                      {goalProgress.progressPct}%
                    </span>
                  </div>
                  {primaryGoal.whyNote ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--ink-muted)]">
                      “{primaryGoal.whyNote}”
                    </p>
                  ) : null}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--subtle-border)]">
                    <div
                      className="h-full bg-[var(--active-fill)] transition-all duration-200"
                      style={{ width: `${Math.max(4, goalProgress.progressPct)}%` }}
                    />
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                    {goalProgress.subtitle} · Target {primaryGoal.targetDays}d
                    {primaryGoal.targetAmountNgn > 0
                      ? ` · ${formatNaira(primaryGoal.targetAmountNgn)}`
                      : ''}
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
                    No active goal yet. Set a streak or savings target in ₦ to anchor your recovery.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('goals')}
                    className="mt-3 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)]"
                  >
                    <span>Create Your First Goal</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Live On-Device Filter Tester + Quick Recovery Toolkit */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Live Filter Tester */}
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[var(--ink)]">
                Live While-Typing Blocker Check
              </h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Verify any betting website, booking code, or safe site against your active rules.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('rules')}
              className="cursor-pointer font-mono text-xs font-semibold text-[var(--accent-ink)] hover:underline"
            >
              Edit Rules →
            </button>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              aria-label="Test any domain or betting keyword"
              data-testid="shield-filter-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type sportybet, bet9ja.com, stake, or bbc.com..."
              className="h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] pr-4 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />
          </div>

          {testResult ? (
            <div
              data-testid="shield-filter-verdict"
              className={`mt-3 flex items-center justify-between gap-3 rounded-2xl border p-3.5 ${
                testResult.isBlocked
                  ? 'border-[var(--block-border)] bg-[var(--block-bg)]'
                  : 'border-[var(--subtle-border)] bg-[var(--control-bg)]'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <BettingBrandLogo target={testResult.matchedTarget || query} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-[var(--ink)]">
                    {testResult.isBlocked ? 'Blocked Instantly' : 'Allowed — Safe Destination'}
                  </p>
                  <p className="truncate font-mono text-[11px] text-[var(--ink-muted)]">
                    {testResult.reason}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 font-mono text-xs font-bold uppercase ${
                  testResult.isBlocked ? 'text-[var(--block-ink)]' : 'text-[var(--ink)]'
                }`}
              >
                {testResult.isBlocked ? 'BLOCKED' : 'SAFE'}
              </span>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
              Tap a Covered Brand to Test
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SAMPLE_TEST_DOMAINS.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setQuery(domain)}
                  className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-2 text-left transition-colors hover:border-[var(--glass-border)]"
                >
                  <BettingBrandLogo target={domain} size="xs" />
                  <span className="truncate text-xs font-semibold text-[var(--ink)]">
                    {domain.split('.')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right 5 Cols: Quick Recovery Actions + Recent Intercepts */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5">
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Immediate Urge Toolkit
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              Fast tools when a craving strikes — always 1 tap away.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onBankStake}
                data-testid="shield-bank-stake-btn"
                className="flex min-h-[56px] cursor-pointer flex-col items-start justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] px-3.5 py-2.5 text-left transition-opacity hover:opacity-90"
              >
                <TrendingUp className="h-4 w-4 text-[var(--accent-ink)]" />
                <span className="mt-1.5 text-xs font-bold text-[var(--ink)]">
                  Bank {formatNaira(dailyStakeNgn)}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenUrgeJournal}
                data-testid="shield-log-urge-btn"
                className="flex min-h-[56px] cursor-pointer flex-col items-start justify-center rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 py-2.5 text-left hover:border-[var(--glass-border)]"
              >
                <Edit3 className="h-4 w-4 text-[var(--accent-ink)]" />
                <span className="mt-1.5 text-xs font-bold text-[var(--ink)]">
                  Log Resisted Urge
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('resources')}
                data-testid="shield-open-resources-btn"
                className="flex min-h-[56px] cursor-pointer flex-col items-start justify-center rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 py-2.5 text-left hover:border-[var(--glass-border)]"
              >
                <BookOpen className="h-4 w-4 text-[var(--accent-ink)]" />
                <span className="mt-1.5 text-xs font-bold text-[var(--ink)]">
                  Recovery Resources
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('lock')}
                className="flex min-h-[56px] cursor-pointer flex-col items-start justify-center rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 py-2.5 text-left hover:border-[var(--glass-border)]"
              >
                <Clock className="h-4 w-4 text-[var(--accent-ink)]" />
                <span className="mt-1.5 text-xs font-bold text-[var(--ink)]">
                  Commitment Lock
                </span>
              </button>
            </div>
          </section>

          {/* Recent Blocked Targets */}
          <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[var(--ink)]">
                Recent Intercepts
              </h2>
              <span className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
                {totalBlockedCount} total
              </span>
            </div>

            {groupedSites.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4 text-center">
                <ShieldCheck className="mx-auto h-5 w-5 text-[var(--accent-ink)]" />
                <p className="mt-1.5 text-xs font-semibold text-[var(--ink)]">All quiet today</p>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  Blocked betting websites, apps, and Play Store downloads appear here.
                </p>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-[var(--subtle-border)]">
                {groupedSites.map((site) => (
                  <div
                    key={site.key}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <BettingBrandLogo target={site.target} size="xs" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[var(--ink)]">
                          {formatBlockedTargetDisplay(site.target)}
                        </p>
                        <p className="truncate text-[11px] text-[var(--ink-muted)]">
                          {site.latestSource} · {site.categoryName}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                      {site.attemptCount}×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
