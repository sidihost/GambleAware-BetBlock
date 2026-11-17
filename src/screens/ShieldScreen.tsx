import React from 'react';
import {
  Ban,
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  Globe,
  Heart,
  Lock,
  NotebookPen,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Smartphone,
  Timer,
  Wind,
  X,
} from 'lucide-react';
import { GAMBLING_CATEGORY_META } from '../blocker/gamblingCategory';
import {
  LiquidGlassCard,
  LiquidSectionHeader,
  LiquidShieldOrb,
  LiquidStatusButton,
} from '../components/LiquidGlass';
import { DerivedMainState } from '../data/types';
import { formatNaira } from '../utils/currency';

interface ShieldScreenProps {
  state: DerivedMainState;
  onPrimaryShieldClick: () => void;
  onEnableAccessibility: () => void;
  onRequestDeviceAdmin: () => void;
  onOpenPrivateDnsSettings: () => void;
  onTestQueryChanged: (query: string) => void;
  onSimulateIntercept: (target: string, categoryDisplayName: string) => void;
  onNavigateToLock: () => void;
  onLaunchCalmReset: () => void;
  onOpenUrgeJournal: () => void;
  onOpenSafeSupport: () => void;
  onOpenGetApp: () => void;
}

export const ShieldScreen: React.FC<ShieldScreenProps> = ({
  state,
  onPrimaryShieldClick,
  onEnableAccessibility,
  onRequestDeviceAdmin,
  onOpenPrivateDnsSettings,
  onTestQueryChanged,
  onSimulateIntercept,
  onNavigateToLock,
  onLaunchCalmReset,
  onOpenUrgeJournal,
  onOpenSafeSupport,
  onOpenGetApp,
}) => {
  const isArmed = state.isFullyArmed;
  const isLocked = state.isTimeLockedNow;
  const showQuickOnboarding =
    !state.isAccessibilityEnabled || !state.isDeviceAdminEnabled || !isLocked;

  const statusTitle =
    isArmed && state.isDeviceAdminEnabled && isLocked
      ? 'Maximum Lock & Shield Active'
      : isArmed && state.isDeviceAdminEnabled
        ? 'Full Shield + Uninstall Guard'
        : isArmed
          ? 'Web & App Shield Active'
          : !state.isAccessibilityEnabled
            ? 'Activate GambleAware Shield'
            : 'Protection Paused';

  const statusSubtitle = isArmed
    ? 'Blocking SportyBet, Bet9ja, Bet365, 1xBet, Stake, search queries, WebViews & betting apps in real time.'
    : !state.isAccessibilityEnabled
      ? 'Enable GambleAware Shield to block browsers, WebViews, betting apps, and impulsive uninstalls.'
      : 'Tap below to resume real-time gambling site and app interception.';

  const primaryBtnLabel =
    isArmed && isLocked
      ? 'Protected (Locked Until Timer Ends)'
      : isArmed
        ? 'Pause Shield'
        : !state.isAccessibilityEnabled
          ? 'Enable Web & App Shield'
          : 'Resume Shield';

  const cleanMetricValue =
    state.cleanDays > 0
      ? `${state.cleanDays}d ${state.cleanHoursRemainder}h`
      : `${state.cleanHoursRemainder}h ${state.cleanMinutesRemainder}m`;

  const savedFormatted = formatNaira(state.estimatedSavedAmount);

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-3.5 px-4 pt-3 pb-28">
      {/* Hero Black & Pink Liquid Glass Shield Card */}
      <LiquidGlassCard className="p-5 sm:p-6">
        <div className="flex flex-col items-center">
          <div className="flex w-full items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
                GambleAware
              </h1>
              <p className="text-xs text-[var(--ink-muted)]">
                Zero-VPN • Browser, WebView &amp; App Shield
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenGetApp}
                aria-label="Download Android APK or Install App"
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--muted-fill)] px-2.5 py-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Get APK</span>
              </button>
              {isLocked ? (
                <LiquidStatusButton
                  label="Locked"
                  isActive={true}
                  icon={<Lock className="h-3.5 w-3.5" />}
                  onClick={onNavigateToLock}
                />
              ) : (
                <LiquidStatusButton
                  label={isArmed ? 'Armed' : 'Setup'}
                  isActive={isArmed}
                  icon={
                    isArmed ? (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ) : (
                      <Shield className="h-3.5 w-3.5" />
                    )
                  }
                />
              )}
            </div>
          </div>

          <div className="mt-4">
            <LiquidShieldOrb
              isProtected={isArmed}
              isLocked={isLocked}
              onClick={onPrimaryShieldClick}
              tourKey="shield_orb"
            />
          </div>

          <h2 className="mt-3.5 text-center font-display text-lg font-semibold text-[var(--ink)]">
            {statusTitle}
          </h2>
          <p className="mt-1 max-w-md text-center text-xs leading-relaxed text-[var(--ink-muted)]">
            {statusSubtitle}
          </p>

          {isLocked ? (
            <div className="mt-3.5 flex w-full items-center justify-between rounded-[18px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3.5 py-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[var(--ink)]" />
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
            className={`mt-4 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] px-5 text-sm font-semibold transition-colors duration-150 ${
              isArmed
                ? 'bg-[var(--muted-fill)] text-[var(--muted-content)] hover:opacity-90'
                : 'bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90'
            }`}
          >
            {isArmed ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            <span>{primaryBtnLabel}</span>
          </button>
        </div>
      </LiquidGlassCard>

      {/* Quick 3-Step Protection & Anti-Uninstall Setup Banner */}
      {showQuickOnboarding ? (
        <LiquidGlassCard className="p-4 sm:p-5">
          <LiquidSectionHeader
            title="Complete Lock & Shield Setup"
            subtitle="Enable all 3 layers to prevent uninstalling until your timer ends"
          />
          <div className="mt-3 flex flex-col gap-2">
            <SetupStepRow
              step="1"
              title="Enable Web & App Shield"
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

      {/* SOS Recovery Toolkit */}
      <LiquidGlassCard className="p-4 sm:p-5" tourKey="sos_calm_bar">
        <LiquidSectionHeader
          title="Urge & Recovery Toolkit"
          subtitle="Immediate tools when an urge hits"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onLaunchCalmReset}
            className="flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
          >
            <Wind className="h-4 w-4 shrink-0" />
            <span className="truncate">60s SOS Calm</span>
          </button>
          <button
            type="button"
            onClick={onOpenUrgeJournal}
            className="flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] px-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
          >
            <NotebookPen className="h-4 w-4 shrink-0" />
            <span className="truncate">Log Victory</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenSafeSupport}
          className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] px-4 text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
        >
          <Heart className="h-4 w-4 shrink-0" />
          <span>Confidential Support & Helplines</span>
        </button>
      </LiquidGlassCard>

      {/* 3-Layer Non-VPN Protection Stack */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <LiquidSectionHeader
          title="Protection Stack"
          subtitle="No VPN required • Zero battery drain • Works on Wi-Fi & mobile data"
        />
        <div className="mt-3.5 flex flex-col gap-2.5">
          <EngineStatusRow
            icon={<Smartphone className="h-5 w-5" />}
            title="Web, Search & App Shield"
            subtitle={
              state.isAccessibilityEnabled
                ? 'Active • Browsers, Search Guard, WebViews & 130+ betting apps'
                : 'Tap to enable GambleAware Shield'
            }
            isReady={state.isAccessibilityEnabled}
            onClick={onEnableAccessibility}
          />
          <EngineStatusRow
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Uninstall Lock (Device Admin)"
            subtitle={
              state.isDeviceAdminEnabled
                ? 'Active • Blocks impulsive removal of GambleAware'
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
                ? `Active • ${state.privateDnsStatus.serverHost ?? 'System Automatic'}`
                : 'Optional • Configure native DNS-over-TLS without a VPN'
            }
            isReady={state.privateDnsStatus.isActive}
            onClick={onOpenPrivateDnsSettings}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
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
            icon={isLocked ? <Lock className="h-3.5 w-3.5" /> : <Timer className="h-3.5 w-3.5" />}
            onClick={onNavigateToLock}
          />
        </div>
      </LiquidGlassCard>

      {/* Live Domain & URL Filter Tester */}
      <LiquidGlassCard className="p-4 sm:p-5" tourKey="filter_tester">
        <LiquidSectionHeader
          title="Verify Filter Live"
          subtitle="Test SportyBet, Bet9ja, Stake, or any URL against active rules"
        />
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            value={state.testQueryInput}
            onChange={(e) => onTestQueryChanged(e.target.value)}
            placeholder="Try sportybet.com, bet9ja.com, or stake.com"
            className="h-12 w-full rounded-[18px] border border-[var(--subtle-border)] bg-[var(--surface)]/70 pr-10 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
          />
          {state.testQueryInput ? (
            <button
              type="button"
              onClick={() => onTestQueryChanged('')}
              aria-label="Clear filter query"
              className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {['sportybet.com', 'bet365.com', 'betterhelp.com'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => onTestQueryChanged(sample)}
              className="cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--surface)]/70 px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
            >
              {sample}
            </button>
          ))}
        </div>

        {state.testMatchResult ? (
          <div
            className={`mt-3 flex items-center justify-between gap-3 rounded-[16px] border border-[var(--subtle-border)] p-3.5 ${
              state.testMatchResult.isBlocked
                ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'bg-[var(--muted-fill)] text-[var(--muted-content)]'
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {state.testMatchResult.isBlocked ? (
                <Ban className="h-5 w-5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {state.testMatchResult.isBlocked
                    ? `Blocked (${GAMBLING_CATEGORY_META[state.testMatchResult.category].displayName})`
                    : 'Allowed (Safe / Non-Gambling)'}
                </p>
                {state.testMatchResult.isBlocked ? (
                  <p className="truncate text-xs opacity-85">
                    {state.testMatchResult.matchedTarget} • {state.testMatchResult.reason}
                  </p>
                ) : null}
              </div>
            </div>
            {state.testMatchResult.isBlocked ? (
              <button
                type="button"
                onClick={() =>
                  onSimulateIntercept(
                    state.testMatchResult!.matchedTarget || state.testQueryInput,
                    GAMBLING_CATEGORY_META[state.testMatchResult!.category].displayName,
                  )
                }
                className="shrink-0 cursor-pointer rounded-full border border-current/25 px-3 py-1.5 text-xs font-semibold hover:opacity-85"
              >
                Preview Block
              </button>
            ) : null}
          </div>
        ) : null}
      </LiquidGlassCard>

      {/* Footer */}
      <footer className="py-2 text-center">
        <p className="text-xs font-semibold text-[var(--ink)]">GambleAware</p>
        <p className="text-xs text-[var(--ink-muted)]">A product of Imoogle Technology</p>
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
