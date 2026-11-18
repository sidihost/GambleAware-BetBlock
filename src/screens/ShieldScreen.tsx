import React, { useState } from 'react';
import {
  Anchor,
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
import { ActiveGoalsCard, GoalReminderBanner } from '../components/GoalCardModal';
import { HighRiskGuardCard } from '../components/HighRiskGuardCard';
import {
  LiquidGlassCard,
  LiquidSectionHeader,
  LiquidShieldOrb,
  LiquidStatusButton,
} from '../components/LiquidGlass';
import { RecoveryVaultCard } from '../components/RecoveryVaultCard';
import { PersistedStore } from '../data/storage';
import {
  DerivedMainState,
  HighRiskScheduleConfig,
  RecoveryGoalCategory,
} from '../data/types';
import { usePWAInstall } from '../hooks/usePWAInstall';
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
  const { isInstalled } = usePWAInstall();
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-28 md:px-6 md:pt-6 md:pb-14">
      {/* Personalized Greeting Hero Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-[24px] border border-[var(--subtle-border)] bg-[var(--glass-fill)] px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[11px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
              {isArmed ? 'Protection Active' : 'Protection Paused'}
            </p>
            {state.highRiskStatus.isActive ? (
              <span className="font-mono text-[11px] font-semibold text-[var(--accent-ink)] uppercase">
                · High-Risk Guard Heightened
              </span>
            ) : null}
          </div>

          {editingName ? (
            <form onSubmit={handleSaveName} className="mt-1.5 flex max-w-sm items-center gap-2">
              <input
                type="text"
                maxLength={40}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Enter your first name"
                autoFocus
                className="h-9 min-w-0 flex-1 rounded-[12px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Save first name"
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                aria-label="Cancel name edit"
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-[var(--subtle-border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-[26px]">
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
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <Pencil className="h-3 w-3 text-[var(--accent-ink)]" />
                <span>{state.firstName ? 'Edit name' : 'Add name'}</span>
              </button>
            </div>
          )}

          <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
            {greeting.subline}
          </p>
        </div>

        <div className="flex w-full shrink-0 sm:w-auto">
          <button
            type="button"
            onClick={() => onOpenGoalModal()}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{state.goals.length === 0 ? 'Create Goal' : 'Add Goal'}</span>
          </button>
        </div>
      </div>

      {/* Automatic Goal Creation Reminder Banner when user has no goals */}
      {showGoalReminder ? (
        <GoalReminderBanner
          firstName={state.firstName}
          onCreateGoal={() => onOpenGoalModal()}
          onOpenTemplates={() => onOpenGoalModal()}
          onDismiss={onDismissGoalReminder}
        />
      ) : null}

      {/* Compact Non-Intrusive Download Prompt Banner */}
      {!promptDismissed && !isInstalled ? (
        <div className="flex flex-col gap-3 rounded-[22px] border border-[var(--glass-border)] bg-[var(--muted-fill)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
              <Download className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-sm font-semibold text-[var(--ink)]">
                  Get GambleAware on Your Phone
                </p>
                <button
                  type="button"
                  onClick={() => setPromptDismissed(true)}
                  aria-label="Dismiss download banner"
                  className="-mt-1 -mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] sm:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-[var(--ink-muted)]">
                Install the Android app for full phone-wide blocking or save this page to your home
                screen.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenDownloadPage}
              className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90 sm:w-auto"
            >
              <span>Get the App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPromptDismissed(true)}
              aria-label="Dismiss download banner"
              className="hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] sm:flex"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Top Two-Column Workspace on Desktop, Single Column on Mobile */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: Hero Anchor Chronograph Orb, Metrics & Personalized Goals */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <LiquidGlassCard className="p-5 sm:p-6">
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
                        <Anchor className="h-3.5 w-3.5" />
                      )
                    }
                  />
                )}
              </div>

              <div className="mt-4">
                <LiquidShieldOrb
                  isProtected={isArmed}
                  isLocked={isLocked}
                  onClick={onPrimaryShieldClick}
                  tourKey="shield_orb"
                />
              </div>

              <h2 className="mt-3.5 text-center font-display text-xl font-bold text-[var(--ink)]">
                {statusTitle}
              </h2>
              <p className="mt-1 max-w-md text-center text-xs leading-relaxed text-[var(--ink-muted)]">
                {statusSubtitle}
              </p>

              {isLocked ? (
                <div className="mt-3.5 flex w-full items-center justify-between rounded-[18px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-[var(--accent-ink)]" />
                    <span className="text-xs font-medium text-[var(--ink)]">
                      Uninstall Lock Timer
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-[var(--ink)]">
                    {state.lockCountdownFormatted}
                  </span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={onPrimaryShieldClick}
                className={`mt-4 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] px-5 text-sm font-semibold transition-colors duration-150 ${
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
                  <Anchor className="h-4 w-4" />
                )}
                <span>{primaryBtnLabel}</span>
              </button>
            </div>
          </LiquidGlassCard>

          {/* Responsive Metrics Trio */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <LiquidGlassCard className="rounded-[22px] p-3.5">
              <p className="truncate text-xs font-medium text-[var(--ink-muted)]">Clean Streak</p>
              <p className="mt-1.5 truncate font-mono text-lg font-bold tabular-nums text-[var(--ink)]">
                {cleanMetricValue}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]">
                Next: {state.nextMilestone.label}
              </p>
            </LiquidGlassCard>
            <LiquidGlassCard className="rounded-[22px] p-3.5">
              <p className="truncate text-xs font-medium text-[var(--ink-muted)]">Blocked</p>
              <p className="mt-1.5 truncate font-mono text-lg font-bold tabular-nums text-[var(--ink)]">
                {state.todayBlockedCount}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]">
                {state.totalBlockedCount} total
              </p>
            </LiquidGlassCard>
            <LiquidGlassCard className="col-span-2 rounded-[22px] p-3.5 sm:col-span-1">
              <p className="truncate text-xs font-medium text-[var(--ink-muted)]">Est. Saved</p>
              <p className="mt-1.5 truncate font-mono text-lg font-bold tabular-nums text-[var(--accent-ink)]">
                {savedFormatted}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]">
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
        <div className="flex flex-col gap-4 lg:col-span-7">
          {/* Check or Block a Website */}
          <LiquidGlassCard className="p-4 sm:p-5" tourKey="domain_lookup">
            <LiquidSectionHeader
              title="Check or Block a Website"
              subtitle="Enter a betting website or sign-in link to check or test your block screen"
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (state.domainLookupQuery.trim()) {
                  onTestOrRedirectUrl(state.domainLookupQuery);
                }
              }}
              className="mt-3 flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  value={state.domainLookupQuery}
                  onChange={(e) => onDomainLookupChanged(e.target.value)}
                  placeholder="Enter a website or link to check"
                  className="h-12 w-full rounded-[18px] border border-[var(--subtle-border)] bg-[var(--surface)]/70 pr-10 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                />
                {state.domainLookupQuery ? (
                  <button
                    type="button"
                    onClick={() => onDomainLookupChanged('')}
                    aria-label="Clear site search"
                    className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={!state.domainLookupQuery.trim()}
                className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[18px] bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90 disabled:opacity-50"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Check Site</span>
              </button>
            </form>

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
                        ? `Blocked (${GAMBLING_CATEGORY_META[state.domainLookupResult.category].displayName})`
                        : 'Not Blocked Yet'}
                    </p>
                    <p className="truncate text-xs opacity-85">
                      {state.domainLookupResult.isBlocked
                        ? `${state.domainLookupResult.matchedTarget} • Redirects safely when opened`
                        : 'Tap Block Site to stop this website from opening.'}
                    </p>
                  </div>
                </div>
                {state.domainLookupResult.isBlocked ? (
                  <button
                    type="button"
                    onClick={() => onTestOrRedirectUrl(state.domainLookupQuery)}
                    className="shrink-0 cursor-pointer rounded-full border border-current/25 px-3.5 py-1.5 text-xs font-semibold hover:opacity-85"
                  >
                    Preview Block Screen
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

          {/* Smart High-Risk Schedule Guard */}
          <HighRiskGuardCard
            schedule={state.settings.highRiskSchedule}
            status={state.highRiskStatus}
            onToggleWindow={onToggleHighRiskWindow}
          />

          {showQuickOnboarding ? (
            <LiquidGlassCard className="p-4 sm:p-5">
              <LiquidSectionHeader
                title="3 Simple Steps to Stay Protected"
                subtitle="Set these up once so it stays hard to gamble during an urge"
              />
              <div className="mt-3 flex flex-col gap-2">
                <SetupStepRow
                  step="1"
                  title="Turn On Site & App Blocker"
                  subtitle={
                    state.isAccessibilityEnabled
                      ? 'Active'
                      : 'Blocks betting websites, sign-ins, and betting apps'
                  }
                  done={state.isAccessibilityEnabled}
                  onClick={onEnableAccessibility}
                />
                <SetupStepRow
                  step="2"
                  title="Protect App From Deletion"
                  subtitle={
                    state.isDeviceAdminEnabled
                      ? 'Active'
                      : 'Makes it harder to delete GambleAware when tempted'
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LiquidGlassCard className="p-4 sm:p-5" tourKey="sos_calm_bar">
              <LiquidSectionHeader
                title="Calm & Support Tools"
                subtitle="Quick help whenever an urge hits"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onLaunchCalmReset}
                  className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-2.5 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90"
                >
                  <Wind className="h-3.5 w-3.5 shrink-0" />
                  <span>60s Calm</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenUrgeJournal}
                  className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] px-2.5 text-xs font-medium whitespace-nowrap text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                >
                  <NotebookPen className="h-3.5 w-3.5 shrink-0" />
                  <span>Log Victory</span>
                </button>
              </div>
              <button
                type="button"
                onClick={onOpenSafeSupport}
                className="mt-2.5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] px-4 text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)] sm:text-sm"
              >
                <Heart className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
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

      {/* Clear Everyday Navigation Shortcuts */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <LiquidSectionHeader
            title="Where to Go Next"
            subtitle="Everything you need is one tap away"
          />
        </div>
        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <EngineStatusRow
            icon={<Compass className="h-5 w-5" />}
            title="Blocked Sites & Apps"
            subtitle={`${state.builtInDomainCount}+ sites ready · customize anytime`}
            isReady={isArmed}
            onClick={onNavigateToRules}
          />
          <EngineStatusRow
            icon={<TrendingUp className="h-5 w-5" />}
            title="Progress & Money Saved"
            subtitle="Check your streak, simulator & ₦ saved"
            isReady={state.goals.length > 0}
            onClick={onNavigateToProgress}
          />
          <EngineStatusRow
            icon={<Timer className="h-5 w-5" />}
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
            icon={<Smartphone className="h-5 w-5" />}
            title="Get Phone App"
            subtitle="Install GambleAware on Android or iPhone"
            isReady={false}
            onClick={onOpenDownloadPage}
          />
        </div>
      </LiquidGlassCard>

      {/* Footer */}
      <footer className="py-2 text-center">
        <p className="text-xs font-semibold text-[var(--ink)]">GambleAware</p>
        <p className="text-xs text-[var(--ink-muted)]">
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
    className={`flex w-full cursor-pointer items-center gap-3 rounded-[16px] border border-[var(--subtle-border)] p-3 text-left transition-colors ${
      done ? 'bg-[var(--muted-fill)]' : 'bg-[var(--surface)]/60 hover:bg-[var(--muted-fill)]'
    }`}
  >
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--subtle-border)] text-xs font-bold ${
        done
          ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
          : 'bg-[var(--surface)] text-[var(--ink)]'
      }`}
    >
      {step}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="text-xs text-[var(--ink-muted)]">{subtitle}</p>
    </div>
    {done ? (
      <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
    ) : (
      <Circle className="h-5 w-5 shrink-0 text-[var(--ink-muted)]" />
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
    className={`flex w-full cursor-pointer items-center gap-3 rounded-[18px] border border-[var(--subtle-border)] p-3.5 text-left transition-colors ${
      isReady ? 'bg-[var(--muted-fill)]' : 'bg-[var(--surface)]/55 hover:bg-[var(--muted-fill)]'
    }`}
  >
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
        isReady
          ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
          : 'bg-[var(--surface)] text-[var(--ink)]'
      }`}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="text-xs text-[var(--ink-muted)]">{subtitle}</p>
    </div>
    {isReady ? (
      <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
    ) : (
      <ChevronRight className="h-5 w-5 shrink-0 text-[var(--ink-muted)]" />
    )}
  </button>
);
