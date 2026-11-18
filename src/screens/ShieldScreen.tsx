import React, { useState } from 'react';
import {
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Compass,
  Download,
  Heart,
  LockKeyhole,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Smartphone,
  Timer,
  TrendingUp,
  Wind,
  X,
} from 'lucide-react';
import { GAMBLING_CATEGORY_META } from '../blocker/gamblingCategory';
import { BrandGIcon } from '../components/AppHeader';
import { BettingBrandLogo } from '../components/BettingBrandLogo';
import { ActiveGoalsCard, GoalReminderBanner } from '../components/GoalCardModal';
import { HighRiskGuardCard } from '../components/HighRiskGuardCard';
import {
  LiquidGlassCard,
  LiquidSectionHeader,
  LiquidShieldOrb,
  LiquidStatusButton,
} from '../components/LiquidGlass';
import { RecoveryVaultCard } from '../components/RecoveryVaultCard';
import { TiltRadarCard } from '../components/TiltRadarCard';
import { PersistedStore } from '../data/storage';
import {
  DerivedMainState,
  HighRiskScheduleConfig,
  RecoveryGoalCategory,
} from '../data/types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  formatAttemptCountLabel,
  formatBlockedTargetDisplay,
  formatBlockedTimestamp,
} from '../utils/blockedLogGrouping';
import { formatNaira } from '../utils/currency';
import { getTimeOfDayGreeting } from '../utils/personalization';

interface ShieldScreenProps {
  store: PersistedStore;
  state: DerivedMainState;
  onSetPreferredName: (name: string) => void;
  onForceSaveVault: () => void;
  onRestoreVault: (rawKeyOrJson: string) => { ok: boolean; error?: string };
  onToggleHighRiskWindow: (key: keyof HighRiskScheduleConfig, enabled: boolean) => void;
  onPrimaryShieldClick: () => void;
  onEnableAccessibility: () => void;
  onRequestDeviceAdmin: () => void;
  onDomainLookupChanged: (query: string) => void;
  onQuickBlockDomain: (domain: string) => void;
  onTestOrRedirectUrl: (rawInput: string) => void;
  onBankUrgeStake: (amountNgn: number) => void;
  showGoalReminder: boolean;
  onDismissGoalReminder: () => void;
  onOpenGoalModal: (prefill?: {
    title: string;
    category: RecoveryGoalCategory;
    targetDays: number;
    targetAmountNgn: number;
    whyNote: string;
  }) => void;
  onSetPrimaryGoal: (goalId: string) => void;
  onToggleGoalComplete: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onNavigateToRules: () => void;
  onNavigateToProgress: () => void;
  onNavigateToLock: () => void;
  onLaunchCalmReset: () => void;
  onOpenUrgeJournal: () => void;
  onOpenSafeSupport: () => void;
  onOpenDownloadPage: () => void;
}

export const ShieldScreen: React.FC<ShieldScreenProps> = ({
  store,
  state,
  onSetPreferredName,
  onForceSaveVault,
  onRestoreVault,
  onToggleHighRiskWindow,
  onPrimaryShieldClick,
  onEnableAccessibility,
  onRequestDeviceAdmin,
  onDomainLookupChanged,
  onQuickBlockDomain,
  onTestOrRedirectUrl,
  onBankUrgeStake,
  showGoalReminder,
  onDismissGoalReminder,
  onOpenGoalModal,
  onSetPrimaryGoal,
  onToggleGoalComplete,
  onDeleteGoal,
  onNavigateToRules,
  onNavigateToProgress,
  onNavigateToLock,
  onLaunchCalmReset,
  onOpenUrgeJournal,
  onOpenSafeSupport,
  onOpenDownloadPage,
}) => {
  const { isInstalled, isIOS } = usePWAInstall();
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.preferredName);

  const greeting = getTimeOfDayGreeting(state.firstName);
  const isArmed = state.isFullyArmed;
  const isLocked = state.isTimeLockedNow;
  const showQuickOnboarding =
    !state.isAccessibilityEnabled || !state.isDeviceAdminEnabled || !isLocked;

  const statusTitle =
    isArmed && state.isDeviceAdminEnabled && isLocked
      ? 'Full Lock & Blocker Active'
      : isArmed && state.isDeviceAdminEnabled
        ? 'Blocker + Delete Lock Active'
        : isArmed
          ? 'Protection Is On'
          : !state.isAccessibilityEnabled
            ? 'Turn On GambleAware'
            : 'Protection Paused';

  const statusSubtitle = isArmed
    ? 'Automatically blocks SportyBet, Bet9ja, Bet365, 1xBet, betting logins, and gambling apps.'
    : !state.isAccessibilityEnabled
      ? 'Turn on GambleAware to block betting sites, sign-in pages, and gambling apps automatically.'
      : 'Tap below whenever you are ready to turn blocking back on.';

  const primaryBtnLabel =
    isArmed && isLocked
      ? 'Locked Until Timer Ends'
      : isArmed
        ? 'Pause Protection'
        : !state.isAccessibilityEnabled
          ? 'Turn On Blocker'
          : 'Turn Blocking Back On';

  const cleanMetricValue =
    state.cleanDays > 0
      ? `${state.cleanDays}d ${state.cleanHoursRemainder}h`
      : `${state.cleanHoursRemainder}h ${state.cleanMinutesRemainder}m`;

  const savedFormatted = formatNaira(state.estimatedSavedAmount);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    onSetPreferredName(nameDraft);
    setEditingName(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3.5 px-3.5 pt-3.5 pb-24 sm:px-5 md:px-6 md:pt-5 md:pb-12">
      {/* Compact Personalized Greeting Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--glass-fill)] px-4 py-3 backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[10px] font-bold tracking-wider text-[var(--accent-ink)] uppercase">
              {isArmed ? 'Protection Active' : 'Protection Paused'}
            </p>
            {state.highRiskStatus.isActive ? (
              <span className="font-mono text-[10px] font-semibold text-[var(--accent-ink)] uppercase">
                · High-Risk Guard On
              </span>
            ) : null}
          </div>

          {editingName ? (
            <form onSubmit={handleSaveName} className="mt-1 flex max-w-xs items-center gap-1.5">
              <input
                type="text"
                maxLength={40}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Enter your first name"
                autoFocus
                className="h-8 min-w-0 flex-1 rounded-lg border border-[var(--subtle-border)] bg-[var(--canvas)] px-2.5 text-xs text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                aria-label="Save first name"
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                aria-label="Cancel name edit"
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--subtle-border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-lg font-bold tracking-tight text-[var(--ink)] sm:text-xl">
                {greeting.headline}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(state.preferredName);
                  setEditingName(true);
                }}
                aria-label="Personalize greeting name"
                title="Personalize greeting name"
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <Pencil className="h-2.5 w-2.5 text-[var(--accent-ink)]" />
                <span>{state.firstName ? 'Edit' : 'Add name'}</span>
              </button>
            </div>
          )}

          <p className="mt-0.5 text-xs leading-snug text-[var(--ink-muted)]">
            {greeting.subline}
          </p>
        </div>

        {state.goals.length > 0 || !showGoalReminder ? (
          <button
            type="button"
            onClick={() => onOpenGoalModal()}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3.5 text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{state.goals.length === 0 ? 'Create Goal' : 'Add Goal'}</span>
          </button>
        ) : null}
      </div>

      {/* Automatic Goal Creation Reminder Banner when user has no goals */}
      {showGoalReminder && state.goals.length === 0 ? (
        <GoalReminderBanner
          firstName={state.firstName}
          onCreateGoal={() => onOpenGoalModal()}
          onOpenTemplates={() => onOpenGoalModal()}
          onDismiss={onDismissGoalReminder}
        />
      ) : null}

      {/* Top Two-Column Workspace on Desktop, Single Column on Mobile */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* Left Column: Hero Anchor Chronograph Orb, Metrics & Personalized Goals */}
        <div className="flex flex-col gap-3.5 lg:col-span-5">
          <LiquidGlassCard className="p-4 sm:p-5">
            <div className="flex flex-col items-center">
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
                  Blocker Status
                </span>
                {isLocked ? (
                  <LiquidStatusButton
                    label="Locked"
                    isActive={true}
                    icon={<LockKeyhole className="h-3.5 w-3.5" />}
                    onClick={onNavigateToLock}
                  />
                ) : (
                  <LiquidStatusButton
                    label={isArmed ? 'On' : 'Setup'}
                    isActive={isArmed}
                    icon={
                      isArmed ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <BrandGIcon className="h-3.5 w-3.5" />
                      )
                    }
                  />
                )}
              </div>

              <div className="mt-3">
                <LiquidShieldOrb
                  isProtected={isArmed}
                  isLocked={isLocked}
                  onClick={onPrimaryShieldClick}
                  tourKey="shield_orb"
                />
              </div>

              <h2 className="mt-3 text-center font-display text-lg font-bold text-[var(--ink)]">
                {statusTitle}
              </h2>
              <p className="mt-1 max-w-md text-center text-xs leading-snug text-[var(--ink-muted)]">
                {statusSubtitle}
              </p>

              {isLocked ? (
                <div className="mt-3 flex w-full items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <LockKeyhole className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                    <span className="text-xs font-medium text-[var(--ink)]">
                      {isIOS ? 'Commitment Lock Timer' : 'Uninstall Lock Timer'}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[var(--ink)] sm:text-sm">
                    {state.lockCountdownFormatted}
                  </span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={onPrimaryShieldClick}
                className={`mt-3.5 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] px-4 text-xs font-semibold transition-colors duration-150 sm:h-11 sm:text-sm ${
                  isArmed
                    ? 'bg-[var(--muted-fill)] text-[var(--muted-content)] hover:opacity-90'
                    : 'bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90'
                }`}
              >
                {isLocked ? (
                  <LockKeyhole className="h-4 w-4" />
                ) : isArmed ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent-ink)]" />
                ) : (
                  <BrandGIcon className="h-4 w-4" />
                )}
                <span>{primaryBtnLabel}</span>
              </button>
            </div>
          </LiquidGlassCard>

          {/* Responsive Metrics Trio */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <LiquidGlassCard className="rounded-2xl p-3">
              <p className="truncate text-[11px] font-medium text-[var(--ink-muted)]">Clean Streak</p>
              <p className="mt-1 truncate font-mono text-base font-bold tabular-nums text-[var(--ink)]">
                {cleanMetricValue}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-[var(--ink-muted)]">
                Next: {state.nextMilestone.label}
              </p>
            </LiquidGlassCard>
            <LiquidGlassCard className="rounded-2xl p-3">
              <p className="truncate text-[11px] font-medium text-[var(--ink-muted)]">Blocked</p>
              <p className="mt-1 truncate font-mono text-base font-bold tabular-nums text-[var(--ink)]">
                {state.todayBlockedCount}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-[var(--ink-muted)]">
                {state.totalBlockedCount} total
              </p>
            </LiquidGlassCard>
            <LiquidGlassCard className="col-span-2 rounded-2xl p-3 sm:col-span-1">
              <p className="truncate text-[11px] font-medium text-[var(--ink-muted)]">Est. Saved</p>
              <p className="mt-1 truncate font-mono text-base font-bold tabular-nums text-[var(--accent-ink)]">
                {savedFormatted}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-[var(--ink-muted)]">
                {state.totalUrgeResistedCount} urges resisted
              </p>
            </LiquidGlassCard>
          </div>

          {/* Personalized Goals List Unlocked for Everyone */}
          <ActiveGoalsCard
            goals={state.goals}
            cleanExactDays={state.cleanExactDays}
            estimatedSavedAmount={state.estimatedSavedAmount}
            onAddGoal={() => onOpenGoalModal()}
            onSetPrimary={onSetPrimaryGoal}
            onToggleComplete={onToggleGoalComplete}
            onDeleteGoal={onDeleteGoal}
          />
        </div>

        {/* Right Column: Site Check, High-Risk Guard, GambleAware AI, Setup, Calm & Vault */}
        <div className="flex flex-col gap-3.5 lg:col-span-7">
          {/* Check or Block a Website */}
          <LiquidGlassCard className="p-3.5 sm:p-4" tourKey="domain_lookup">
            <LiquidSectionHeader
              title="Check or Block a Platform"
              subtitle="Type a betting name (e.g. sporty, bet9j, 1xbe) — blocked as you type"
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (state.domainLookupQuery.trim()) {
                  onTestOrRedirectUrl(state.domainLookupQuery);
                }
              }}
              className="mt-2.5 flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--accent-ink)]" />
                <input
                  type="text"
                  value={state.domainLookupQuery}
                  onChange={(e) => onDomainLookupChanged(e.target.value)}
                  placeholder="Type sporty, bet9j, 1xbe, or betting site"
                  className="h-10 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] pr-9 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                />
                {state.domainLookupQuery ? (
                  <button
                    type="button"
                    onClick={() => onDomainLookupChanged('')}
                    aria-label="Clear site search"
                    className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={!state.domainLookupQuery.trim()}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90 disabled:opacity-50"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Check Site</span>
              </button>
            </form>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[
                { label: 'SportyBet', query: 'sportybet' },
                { label: 'Bet365', query: 'bet365' },
                { label: 'BetterHelp', query: 'betterhelp.com' },
              ].map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => onDomainLookupChanged(sample.query)}
                  className="cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-1 text-[11px] font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {state.domainLookupResult ? (
              <div
                className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[var(--subtle-border)] p-3.5 ${
                  state.domainLookupResult.isBlocked
                    ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'bg-[var(--muted-fill)] text-[var(--muted-content)]'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  {state.domainLookupResult.isBlocked ? (
                    <Ban className="h-5 w-5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {state.domainLookupResult.isBlocked
                        ? `Blocked Immediately (${GAMBLING_CATEGORY_META[state.domainLookupResult.category].displayName})`
                        : 'Allowed (Safe / Non-Gambling)'}
                    </p>
                    <p className="truncate text-xs opacity-85">
                      {state.domainLookupResult.isBlocked
                        ? `${formatBlockedTargetDisplay(state.domainLookupResult.matchedTarget)} • ${state.domainLookupResult.reason}`
                        : 'Tap Block Site if this is a custom betting domain.'}
                    </p>
                  </div>
                </div>
                {state.domainLookupResult.isBlocked ? (
                  <button
                    type="button"
                    onClick={() => onTestOrRedirectUrl(state.domainLookupQuery)}
                    className="shrink-0 cursor-pointer rounded-full border border-current/25 px-3.5 py-1.5 text-xs font-semibold hover:opacity-85"
                  >
                    Block Now
                  </button>
                ) : state.domainLookupQuery.includes('.') ? (
                  <button
                    type="button"
                    onClick={() => {
                      onQuickBlockDomain(state.domainLookupQuery);
                      onDomainLookupChanged('');
                    }}
                    className="shrink-0 cursor-pointer rounded-full bg-[var(--active-fill)] px-3.5 py-1.5 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
                  >
                    Block Site
                  </button>
                ) : null}
              </div>
            ) : null}
          </LiquidGlassCard>

          {/* Blocked Betting Sites & Apps Summary Card (DuckDuckGo-Style List) */}
          <LiquidGlassCard className="p-3.5 sm:p-4">
            <LiquidSectionHeader
              title="Blocked Betting Sites & Apps"
              subtitle={
                state.groupedBlockedSites.length > 0
                  ? `${state.groupedBlockedSites.length} unique ${state.groupedBlockedSites.length === 1 ? 'site or app' : 'sites & apps'} · ${state.totalBlockedCount} total blocks`
                  : `${state.builtInDomainCount}+ betting websites & 130+ betting apps blocked automatically`
              }
            />

            {state.groupedBlockedSites.length > 0 ? (
              <div className="mt-2.5 space-y-1.5" data-testid="shield-blocked-sites-list">
                {state.groupedBlockedSites.slice(0, 6).map((site) => {
                  const timeAgo = formatBlockedTimestamp(site.latestTimestamp, state.currentTimeMs);
                  return (
                    <div
                      key={site.key}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-2"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <BettingBrandLogo target={site.target} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-bold text-[var(--ink)]">
                            {formatBlockedTargetDisplay(site.target)}
                          </p>
                          <p className="truncate text-[11px] text-[var(--ink-muted)]">
                            {site.latestSource} · {site.categoryName} · {timeAgo}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-[var(--accent-ink)] tabular-nums">
                        {formatAttemptCountLabel(site.attemptCount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-2.5">
              <p className="text-[10px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
                Flagship Blocked Platforms ({state.builtInDomainCount}+)
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {[
                  { domain: 'sportybet.com', label: 'SportyBet' },
                  { domain: 'bet9ja.com', label: 'Bet9ja' },
                  { domain: 'betking.com', label: 'BetKing' },
                  { domain: '1xbet.com', label: '1xBet' },
                  { domain: 'bet365.com', label: 'Bet365' },
                  { domain: 'stake.com', label: 'Stake' },
                  { domain: 'betway.com', label: 'Betway' },
                  { domain: 'msport.com', label: 'MSport' },
                ].map((brand) => (
                  <button
                    key={brand.domain}
                    type="button"
                    onClick={() => onTestOrRedirectUrl(brand.domain)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--muted-fill)]"
                  >
                    <BettingBrandLogo target={brand.domain} size="xs" />
                    <span className="truncate text-[11px] font-semibold text-[var(--ink)]">
                      {brand.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {state.recentEvents.length > 0 ? (
                <button
                  type="button"
                  onClick={onNavigateToProgress}
                  className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                >
                  View Full Log ({state.groupedBlockedSites.length})
                </button>
              ) : null}
              <button
                type="button"
                onClick={onNavigateToRules}
                className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                Browse Blocklist
              </button>
            </div>
          </LiquidGlassCard>

          {/* Tilt Velocity Radar & 1-Tap Stake Banking */}
          <TiltRadarCard
            radar={state.tiltRadar}
            dailySpendNgn={state.settings.dailyBetSpendEstimate}
            bankedUrgeSavingsNgn={state.settings.bankedUrgeSavingsNgn}
            bankedUrgeCount={state.settings.bankedUrgeCount}
            lastTestedUrl={state.domainLookupQuery}
            onBankUrgeStake={onBankUrgeStake}
            onLaunchCalmReset={onLaunchCalmReset}
          />

          {/* Smart High-Risk Schedule Guard */}
          <HighRiskGuardCard
            schedule={state.settings.highRiskSchedule}
            status={state.highRiskStatus}
            onToggleWindow={onToggleHighRiskWindow}
          />

          {showQuickOnboarding ? (
            <LiquidGlassCard className="p-3.5 sm:p-4">
              <LiquidSectionHeader
                title="3 Simple Steps to Stay Protected"
                subtitle="Set these up once so it stays hard to gamble during an urge"
              />
              <div className="mt-2.5 flex flex-col gap-1.5">
                <SetupStepRow
                  step="1"
                  title={isIOS ? 'Turn On Safari & Site Shield' : 'Turn On All-Browser & Ad Shield'}
                  subtitle={
                    state.isAccessibilityEnabled
                      ? 'Active'
                      : 'Blocks betting websites, sign-ins, and gambling portals'
                  }
                  done={state.isAccessibilityEnabled}
                  onClick={onEnableAccessibility}
                />
                <SetupStepRow
                  step="2"
                  title={isIOS ? 'Enable Anti-Tamper Lock' : 'Protect Shield Controls'}
                  subtitle={
                    state.isDeviceAdminEnabled
                      ? 'Active'
                      : 'Keeps rules locked against impulsive edits when tempted'
                  }
                  done={state.isDeviceAdminEnabled}
                  onClick={onRequestDeviceAdmin}
                />
                <SetupStepRow
                  step="3"
                  title="Set a Lock Timer"
                  subtitle={
                    isLocked
                      ? `Locked for ${state.lockCountdownFormatted}`
                      : 'Locks your blocker until your countdown finishes'
                  }
                  done={isLocked}
                  onClick={onNavigateToLock}
                />
              </div>
            </LiquidGlassCard>
          ) : null}

          {/* SOS Calm Support + Zero-Loss Recovery Vault */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <LiquidGlassCard className="p-3.5 sm:p-4" tourKey="sos_calm_bar">
              <LiquidSectionHeader
                title="Calm & Support Tools"
                subtitle="Quick help whenever an urge hits"
              />
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onLaunchCalmReset}
                  className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-2.5 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90"
                >
                  <Wind className="h-3.5 w-3.5 shrink-0" />
                  <span>60s Calm</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenUrgeJournal}
                  className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] px-2.5 text-xs font-medium whitespace-nowrap text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                >
                  <NotebookPen className="h-3.5 w-3.5 shrink-0" />
                  <span>Log Victory</span>
                </button>
              </div>
              <button
                type="button"
                onClick={onOpenSafeSupport}
                className="mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] px-4 text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                <Heart className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                <span>Talk to Confidential Support</span>
              </button>
            </LiquidGlassCard>

            <RecoveryVaultCard
              store={store}
              durableStatus={state.durableStatus}
              onForceSaveVault={onForceSaveVault}
              onRestoreVault={onRestoreVault}
            />
          </div>
        </div>
      </div>

      {/* Non-Intrusive Phone App Prompt (Placed below core dashboard so Shield Orb is above the fold) */}
      {!promptDismissed && !isInstalled ? (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--muted-fill)] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
              <Download className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xs font-semibold text-[var(--ink)] sm:text-sm">
                Get GambleAware on Your Phone
              </p>
              <p className="truncate text-[11px] text-[var(--ink-muted)]">
                {isIOS
                  ? 'Safari Share → Add to Home Screen + Screen Time blocker list'
                  : 'Download Android APK for Zero-VPN All-Browser, Ad & Anti-Uninstall Guard'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenDownloadPage}
              className="inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3.5 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90 sm:flex-initial"
            >
              <span>{isIOS ? 'iPhone Guide' : 'Get Android APK'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPromptDismissed(true)}
              aria-label="Dismiss download banner"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Clear Everyday Navigation Shortcuts */}
      <LiquidGlassCard className="p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <LiquidSectionHeader
            title="Where to Go Next"
            subtitle="Everything you need is one tap away"
          />
        </div>
        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <EngineStatusRow
            icon={<Compass className="h-4 w-4" />}
            title="Blocked Sites & Apps"
            subtitle={`${state.builtInDomainCount}+ sites ready · customize anytime`}
            isReady={isArmed}
            onClick={onNavigateToRules}
          />
          <EngineStatusRow
            icon={<TrendingUp className="h-4 w-4" />}
            title="Progress & Money Saved"
            subtitle="Check your streak, savings ledger & ₦ saved"
            isReady={state.goals.length > 0}
            onClick={onNavigateToProgress}
          />
          <EngineStatusRow
            icon={<Timer className="h-4 w-4" />}
            title="Lock Timer & PIN"
            subtitle={
              isLocked
                ? `Locked · ${state.lockCountdownFormatted} left`
                : 'Lock settings for 1 to 90 days'
            }
            isReady={isLocked}
            onClick={onNavigateToLock}
          />
          <EngineStatusRow
            icon={<Smartphone className="h-4 w-4" />}
            title="Get Phone App"
            subtitle="Install GambleAware on Android or iPhone"
            isReady={false}
            onClick={onOpenDownloadPage}
          />
        </div>
      </LiquidGlassCard>

      {/* Footer */}
      <footer className="py-1 text-center">
        <p className="text-xs font-semibold text-[var(--ink)]">GambleAware</p>
        <p className="text-[11px] text-[var(--ink-muted)]">
          A product of Imoogle Technology • Free Forever
        </p>
      </footer>
    </div>
  );
};

const SetupStepRow: React.FC<{
  step: string;
  title: string;
  subtitle: string;
  done: boolean;
  onClick: () => void;
}> = ({ step, title, subtitle, done, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--subtle-border)] p-2.5 text-left transition-colors ${
      done ? 'bg-[var(--muted-fill)]' : 'bg-[var(--control-bg)] hover:bg-[var(--muted-fill)]'
    }`}
  >
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--subtle-border)] text-[11px] font-bold ${
        done
          ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
          : 'bg-[var(--control-bg)] text-[var(--ink)]'
      }`}
    >
      {step}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-[var(--ink)] sm:text-sm">{title}</p>
      <p className="text-[11px] text-[var(--ink-muted)]">{subtitle}</p>
    </div>
    {done ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
    ) : (
      <Circle className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
    )}
  </button>
);

const EngineStatusRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isReady: boolean;
  onClick: () => void;
}> = ({ icon, title, subtitle, isReady, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--subtle-border)] p-3 text-left transition-colors ${
      isReady ? 'bg-[var(--muted-fill)]' : 'bg-[var(--control-bg)] hover:bg-[var(--muted-fill)]'
    }`}
  >
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
        isReady
          ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
          : 'bg-[var(--soft-accent-bg)] text-[var(--accent-ink)]'
      }`}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-semibold text-[var(--ink)] sm:text-sm">{title}</p>
      <p className="truncate text-[11px] text-[var(--ink-muted)]">{subtitle}</p>
    </div>
    {isReady ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
    ) : (
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
    )}
  </button>
);
