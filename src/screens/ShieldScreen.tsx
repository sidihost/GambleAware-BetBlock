import React, { useState } from 'react';
import {
  Anchor,
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  Circle,
  Compass,
  Download,
  Globe,
  Heart,
  LockKeyhole,
  NotebookPen,
  Search,
  Server,
  Smartphone,
  Timer,
  Wind,
  X,
} from 'lucide-react';
import { GAMBLING_CATEGORY_META } from '../blocker/gamblingCategory';
import { CloudSyncCard } from '../components/CloudSyncCard';
import {
  LiquidGlassCard,
  LiquidSectionHeader,
  LiquidShieldOrb,
  LiquidStatusButton,
} from '../components/LiquidGlass';
import { CloudAccountInfo, CloudSyncStatus, DerivedMainState } from '../data/types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { formatNaira } from '../utils/currency';

interface ShieldScreenProps {
  state: DerivedMainState;
  cloudUser: CloudAccountInfo | null;
  cloudSyncStatus: CloudSyncStatus;
  lastSyncedAtMs: number | null;
  cloudErrorMsg: string | null;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onForceSync: () => void;
  onPrimaryShieldClick: () => void;
  onEnableAccessibility: () => void;
  onRequestDeviceAdmin: () => void;
  onOpenPrivateDnsSettings: () => void;
  onDomainLookupChanged: (query: string) => void;
  onQuickBlockDomain: (domain: string) => void;
  onNavigateToRules: () => void;
  onNavigateToLock: () => void;
  onLaunchCalmReset: () => void;
  onOpenUrgeJournal: () => void;
  onOpenSafeSupport: () => void;
  onOpenDownloadPage: () => void;
}

export const ShieldScreen: React.FC<ShieldScreenProps> = ({
  state,
  cloudUser,
  cloudSyncStatus,
  lastSyncedAtMs,
  cloudErrorMsg,
  onSignInGoogle,
  onSignOut,
  onForceSync,
  onPrimaryShieldClick,
  onEnableAccessibility,
  onRequestDeviceAdmin,
  onOpenPrivateDnsSettings,
  onDomainLookupChanged,
  onQuickBlockDomain,
  onNavigateToRules,
  onNavigateToLock,
  onLaunchCalmReset,
  onOpenUrgeJournal,
  onOpenSafeSupport,
  onOpenDownloadPage,
}) => {
  const { isInstalled } = usePWAInstall();
  const [promptDismissed, setPromptDismissed] = useState(false);

  const isArmed = state.isFullyArmed;
  const isLocked = state.isTimeLockedNow;
  const showQuickOnboarding =
    !state.isAccessibilityEnabled || !state.isDeviceAdminEnabled || !isLocked;

  const statusTitle =
    isArmed && state.isDeviceAdminEnabled && isLocked
      ? 'Maximum Lock & Guard Active'
      : isArmed && state.isDeviceAdminEnabled
        ? 'Full Guard + Uninstall Lock'
        : isArmed
          ? 'Web & App Guard Active'
          : !state.isAccessibilityEnabled
            ? 'Activate GambleAware Guard'
            : 'Protection Paused';

  const statusSubtitle = isArmed
    ? 'Blocking SportyBet, Bet9ja, Bet365, 1xBet, Stake, search queries, WebViews & betting apps in real time.'
    : !state.isAccessibilityEnabled
      ? 'Enable GambleAware Guard to block browsers, WebViews, betting apps, and impulsive uninstalls.'
      : 'Tap below to resume real-time gambling site and app interception.';

  const primaryBtnLabel =
    isArmed && isLocked
      ? 'Protected (Locked Until Timer Ends)'
      : isArmed
        ? 'Pause Guard'
        : !state.isAccessibilityEnabled
          ? 'Enable Web & App Guard'
          : 'Resume Guard';

  const cleanMetricValue =
    state.cleanDays > 0
      ? `${state.cleanDays}d ${state.cleanHoursRemainder}h`
      : `${state.cleanHoursRemainder}h ${state.cleanMinutesRemainder}m`;

  const savedFormatted = formatNaira(state.estimatedSavedAmount);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-28 md:px-6 md:pt-6 md:pb-14">
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
                  Get GambleAware for Android &amp; Desktop
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
                Download the Zero-VPN Android app (.apk) or install this dashboard to your home screen.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenDownloadPage}
              className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90 sm:w-auto"
            >
              <span>Download App</span>
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
        {/* Left Column: Hero Anchor Chronograph Orb & Metrics */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <LiquidGlassCard className="p-5 sm:p-6">
            <div className="flex flex-col items-center">
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
                  Zero-VPN Protection
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
                    label={isArmed ? 'Armed' : 'Setup'}
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

              <h1 className="mt-3.5 text-center font-display text-xl font-bold text-[var(--ink)]">
                {statusTitle}
              </h1>
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

          {/* Metrics Trio */}
          <div className="grid grid-cols-3 gap-2.5">
            <LiquidGlassCard className="rounded-[22px] p-3.5">
              <p className="truncate text-xs font-medium text-[var(--ink-muted)]">Clean Streak</p>
              <p className="mt-1.5 truncate font-mono text-lg font-bold tabular-nums text-[var(--ink)]">
                {cleanMetricValue}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]">
                Goal: {state.nextMilestone.label}
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
            <LiquidGlassCard className="rounded-[22px] p-3.5">
              <p className="truncate text-xs font-medium text-[var(--ink-muted)]">Est. Saved</p>
              <p className="mt-1.5 truncate font-mono text-lg font-bold tabular-nums text-[var(--accent-ink)]">
                {savedFormatted}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]">
                {state.totalUrgeResistedCount} resisted
              </p>
            </LiquidGlassCard>
          </div>
        </div>

        {/* Right Column: Live Tester, SOS Toolkit, Protection Stack & Free Cloud Sync */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {showQuickOnboarding ? (
            <LiquidGlassCard className="p-4 sm:p-5">
              <LiquidSectionHeader
                title="Complete Lock & Guard Setup"
                subtitle="Enable all 3 layers to prevent uninstalling until your timer ends"
              />
              <div className="mt-3 flex flex-col gap-2">
                <SetupStepRow
                  step="1"
                  title="Enable Web & App Guard"
                  subtitle={
                    state.isAccessibilityEnabled
                      ? 'Active'
                      : 'Required to block sites, WebViews & apps'
                  }
                  done={state.isAccessibilityEnabled}
                  onClick={onEnableAccessibility}
                />
                <SetupStepRow
                  step="2"
                  title="Enable Uninstall Lock (Device Admin)"
                  subtitle={
                    state.isDeviceAdminEnabled
                      ? 'Active'
                      : 'Prevents direct uninstall of GambleAware'
                  }
                  done={state.isDeviceAdminEnabled}
                  onClick={onRequestDeviceAdmin}
                />
                <SetupStepRow
                  step="3"
                  title="Set Commitment Lock Duration"
                  subtitle={
                    isLocked
                      ? `Active (${state.lockCountdownFormatted})`
                      : 'Locks uninstall & tamper controls until timer reaches 0'
                  }
                  done={isLocked}
                  onClick={onNavigateToLock}
                />
              </div>
            </LiquidGlassCard>
          ) : null}

          {/* Instant Domain Rule Lookup & Quick Block */}
          <LiquidGlassCard className="p-4 sm:p-5" tourKey="domain_lookup">
            <LiquidSectionHeader
              title="Domain Rule Lookup"
              subtitle="Check if a site is covered or add a custom domain straight to your blocklist"
            />
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={state.domainLookupQuery}
                onChange={(e) => onDomainLookupChanged(e.target.value)}
                placeholder="Enter domain or URL (e.g. mybookie.ag)"
                className="h-12 w-full rounded-[18px] border border-[var(--subtle-border)] bg-[var(--surface)]/70 pr-10 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
              />
              {state.domainLookupQuery ? (
                <button
                  type="button"
                  onClick={() => onDomainLookupChanged('')}
                  aria-label="Clear domain query"
                  className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
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
                        ? `Blocked (${GAMBLING_CATEGORY_META[state.domainLookupResult.category].displayName})`
                        : 'Allowed — Not on Blocklist'}
                    </p>
                    <p className="truncate text-xs opacity-85">
                      {state.domainLookupResult.isBlocked
                        ? `${state.domainLookupResult.matchedTarget} • ${state.domainLookupResult.reason}`
                        : 'Add this domain to block it across browsers and search results.'}
                    </p>
                  </div>
                </div>
                {state.domainLookupResult.isBlocked ? (
                  <button
                    type="button"
                    onClick={onNavigateToRules}
                    className="shrink-0 cursor-pointer rounded-full border border-current/25 px-3 py-1.5 text-xs font-semibold hover:opacity-85"
                  >
                    Manage Rules
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
                    Block Domain
                  </button>
                ) : null}
              </div>
            ) : null}
          </LiquidGlassCard>

          {/* SOS Recovery Toolkit + Free Cloud Sync Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LiquidGlassCard className="p-4 sm:p-5" tourKey="sos_calm_bar">
              <LiquidSectionHeader
                title="Urge & Recovery Toolkit"
                subtitle="Immediate tools when an urge hits"
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
                <Heart className="h-4 w-4 shrink-0" />
                <span>Confidential Recovery Support</span>
              </button>
            </LiquidGlassCard>

            <CloudSyncCard
              cloudUser={cloudUser}
              cloudSyncStatus={cloudSyncStatus}
              lastSyncedAtMs={lastSyncedAtMs}
              cloudErrorMsg={cloudErrorMsg}
              onSignInGoogle={onSignInGoogle}
              onSignOut={onSignOut}
              onForceSync={onForceSync}
            />
          </div>
        </div>
      </div>

      {/* 3-Layer Non-VPN Protection Stack */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <LiquidSectionHeader
            title="Protection Stack"
            subtitle="No VPN required • Zero battery drain • Works on Wi-Fi & mobile data"
          />
        </div>
        <div className="mt-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-3">
          <EngineStatusRow
            icon={<Compass className="h-5 w-5" />}
            title="Web, Search & App Guard"
            subtitle={
              state.isAccessibilityEnabled
                ? 'Active • Browsers, WebViews & 130+ apps'
                : 'Tap to enable GambleAware Guard'
            }
            isReady={state.isAccessibilityEnabled}
            onClick={onEnableAccessibility}
          />
          <EngineStatusRow
            icon={<LockKeyhole className="h-5 w-5" />}
            title="Uninstall Lock (Device Admin)"
            subtitle={
              state.isDeviceAdminEnabled
                ? 'Active • Blocks impulsive removal'
                : 'Tap to lock app removal during urges'
            }
            isReady={state.isDeviceAdminEnabled}
            onClick={onRequestDeviceAdmin}
          />
          <EngineStatusRow
            icon={<Server className="h-5 w-5" />}
            title="System Private DNS (DoT)"
            subtitle={
              state.privateDnsStatus.isActive
                ? `Active • ${state.privateDnsStatus.serverHost ?? 'System Auto'}`
                : 'Optional • Native DNS-over-TLS'
            }
            isReady={state.privateDnsStatus.isActive}
            onClick={onOpenPrivateDnsSettings}
          />
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2">
          <LiquidStatusButton
            label={`${state.builtInDomainCount}+ Domains`}
            isActive={isArmed}
            icon={<Globe className="h-3.5 w-3.5" />}
          />
          <LiquidStatusButton
            label="Search Guard"
            isActive={isArmed && state.settings.searchGuardEnabled}
            icon={<Search className="h-3.5 w-3.5" />}
          />
          <LiquidStatusButton
            label={isLocked ? 'Tamper Locked' : 'Timer Lock'}
            isActive={isLocked && state.settings.antiTamperLockEnabled && state.isAccessibilityEnabled}
            icon={
              isLocked ? <LockKeyhole className="h-3.5 w-3.5" /> : <Timer className="h-3.5 w-3.5" />
            }
            onClick={onNavigateToLock}
          />
          <LiquidStatusButton
            label="Android APK"
            isActive={false}
            icon={<Smartphone className="h-3.5 w-3.5" />}
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
