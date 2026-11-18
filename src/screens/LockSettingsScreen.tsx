import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronRight,
  Cloud,
  Download,
  LockKeyhole,
  LockOpen,
  LogIn,
  LogOut,
  RefreshCw,
  Server,
  Timer,
  UserCheck,
} from 'lucide-react';
import { LiquidGlassCard, LiquidSectionHeader, LiquidSwitch } from '../components/LiquidGlass';
import { PWAInstallButton } from '../components/PWAInstallModal';
import { RecoveryVaultCard } from '../components/RecoveryVaultCard';
import { ShieldDiagnosticsCard } from '../components/ShieldDiagnosticsCard';
import { PersistedStore } from '../data/storage';
import { DerivedMainState, THEME_MODE_LABELS, ThemeMode } from '../data/types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DAILY_SPEND_OPTIONS_NGN, formatNaira } from '../utils/currency';
import {
  formatLockDurationAdjective,
  formatLockDurationLong,
  LOCK_DURATION_PRESETS,
} from '../utils/lockDurations';

interface LockSettingsScreenProps {
  store: PersistedStore;
  state: DerivedMainState;
  onSetPreferredName: (name: string) => void;
  onForceSaveVault: () => void;
  onRestoreVault: (rawKeyOrJson: string) => { ok: boolean; error?: string };
  onActivateTimeLock: (days: number, antiTamper: boolean) => void;
  onToggleAntiTamper: (enabled: boolean) => void;
  onSetPin: (pin: string) => void;
  onRemovePin: () => void;
  onToggleDeviceAdmin: () => void;
  onConfigureBuddyCoLock: (partnerName: string) => string;
  onRefreshBuddyChallenge: () => string;
  onClearBuddyCoLock: () => void;
  onVerifyBuddyUnlock: (partnerSalt: string, candidateResponse: string) => boolean;
  onOpenPrivateDnsSettings: () => void;
  onSetDailySpend: (amount: number) => void;
  onSelectTheme: (mode: ThemeMode) => void;
  onResetStreak: () => void;
  onReplayTour: () => void;
  onToggleNotifications: (enabled: boolean) => void;
  onOpenDownloadPage: () => void;
  userEmail?: string | null;
  cloudError?: string | null;
  isSyncingCloud?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const LockSettingsScreen: React.FC<LockSettingsScreenProps> = ({
  store,
  state,
  onSetPreferredName,
  onForceSaveVault,
  onRestoreVault,
  onActivateTimeLock,
  onToggleAntiTamper,
  onSetPin,
  onRemovePin,
  onToggleDeviceAdmin,
  onConfigureBuddyCoLock,
  onRefreshBuddyChallenge,
  onClearBuddyCoLock,
  onVerifyBuddyUnlock,
  onOpenPrivateDnsSettings,
  onSetDailySpend,
  onSelectTheme,
  onResetStreak,
  onReplayTour,
  onToggleNotifications,
  onOpenDownloadPage,
  userEmail,
  cloudError,
  isSyncingCloud,
  onSignIn,
  onSignOut,
}) => {
  const { isIOS } = usePWAInstall();
  const isTimeLocked = state.isTimeLockedNow;
  const [pendingLockDays, setPendingLockDays] = useState(7);
  const [includeAntiTamper, setIncludeAntiTamper] = useState(true);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(state.preferredName);

  const lockExpiryFormatted = useMemo(() => {
    if (state.settings.lockUntilEpochMs <= state.currentTimeMs) return '';
    return new Date(state.settings.lockUntilEpochMs).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [state.settings.lockUntilEpochMs, state.currentTimeMs]);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setPinError('PINs do not match');
      return;
    }
    onSetPin(pinInput);
    setPinInput('');
    setConfirmPinInput('');
    setPinError(null);
    setShowSetPin(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3.5 px-3.5 pt-3.5 pb-24 sm:px-5 md:px-6 md:pt-5 md:pb-12">
      <div className="px-0.5">
        <h1 className="font-display text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl">
          Lock &amp; Settings
        </h1>
        <p className="text-xs text-[var(--ink-muted)]">
          Manage your lock timer, 4-digit PIN, local backup, and theme
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        <div className="flex flex-col gap-3.5 lg:col-span-6">
          {/* Timed Commitment Lock Card */}
          <LiquidGlassCard className="p-3.5 sm:p-4" tourKey="lock_timer">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isTimeLocked
                    ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'bg-[var(--muted-fill)] text-[var(--muted-content)]'
                }`}
              >
                {isTimeLocked ? <LockKeyhole className="h-4 w-4" /> : <Timer className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">
                  {isTimeLocked ? 'Lock Timer Active' : 'Timed Protection Lock'}
                </h2>
                <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
                  {isTimeLocked
                    ? `Uninstalls and settings changes are blocked until ${lockExpiryFormatted}`
                    : 'Lock protection, uninstalls, and blocklists for a set period'}
                </p>
              </div>
            </div>

            {isTimeLocked ? (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {state.lockClockQuad.map((q) => (
                  <div
                    key={q.unit}
                    className="flex flex-col items-center rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] py-2"
                  >
                    <span className="font-mono text-lg font-bold tabular-nums text-[var(--ink)]">
                      {q.digits}
                    </span>
                    <span className="font-mono text-[10px] tracking-wider text-[var(--ink-muted)]">
                      {q.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {LOCK_DURATION_PRESETS.map((d) => {
                const selected = pendingLockDays === d.days;
                return (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => setPendingLockDays(d.days)}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Prevent Uninstalling &amp; Pausing
                </p>
                <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
                  Keeps your blocker turned on and stops app removal until your timer reaches zero
                </p>
              </div>
              <LiquidSwitch
                checked={isTimeLocked ? state.settings.antiTamperLockEnabled : includeAntiTamper}
                onChange={(checked) => {
                  if (isTimeLocked) {
                    onToggleAntiTamper(checked);
                  } else {
                    setIncludeAntiTamper(checked);
                  }
                }}
                ariaLabel="Prevent Uninstalling and Pausing"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmLock(true)}
              className="mt-3.5 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:h-11 sm:text-sm"
            >
              <LockKeyhole className="h-4 w-4" />
              <span>
                {isTimeLocked
                  ? `Extend Lock by ${formatLockDurationLong(pendingLockDays)}`
                  : `Activate ${formatLockDurationAdjective(pendingLockDays)} Lock`}
              </span>
            </button>
          </LiquidGlassCard>

          {/* Real Android Device Admin Uninstall Lock */}
          <LiquidGlassCard className="p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <LockKeyhole className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-semibold text-[var(--ink)]">
                    {isIOS ? 'Anti-Tamper & Rule Lock' : 'Device Admin Uninstall Lock'}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {state.isDeviceAdminEnabled
                      ? 'Active · Prevents app removal and settings tampering until your lock timer ends'
                      : 'Grant Device Administrator access so GambleAware cannot be uninstalled during an urge'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleDeviceAdmin}
                data-testid="device-admin-uninstall-lock-button"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                {state.isDeviceAdminEnabled && (isTimeLocked || state.settings.antiTamperLockEnabled) ? (
                  <>
                    <LockKeyhole className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                    <span>Uninstall Blocked</span>
                  </>
                ) : state.isDeviceAdminEnabled ? (
                  <span>Deactivate</span>
                ) : (
                  <span>Enable Uninstall Lock</span>
                )}
              </button>
            </div>
          </LiquidGlassCard>

          {/* 5-Layer Shield Leak Check + Trusted Buddy Co-Lock */}
          <ShieldDiagnosticsCard
            audit={state.leakAudit}
            buddyPartnerName={state.settings.buddyPartnerName}
            buddyChallengeCode={state.settings.buddyChallengeCode}
            isLockedNow={isTimeLocked}
            onConfigureBuddyCoLock={onConfigureBuddyCoLock}
            onRefreshBuddyChallenge={onRefreshBuddyChallenge}
            onClearBuddyCoLock={onClearBuddyCoLock}
            onVerifyBuddyUnlock={onVerifyBuddyUnlock}
          />

          {/* Accountability PIN Card */}
          <LiquidGlassCard className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {state.hasPin ? (
                  <LockKeyhole className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                ) : (
                  <LockOpen className="h-4 w-4 shrink-0 text-[var(--ink)]" />
                )}
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-semibold text-[var(--ink)]">
                    Accountability PIN
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {state.hasPin
                      ? '4-digit PIN required before disabling protection'
                      : 'Set a 4-digit PIN (or ask a trusted partner to set it)'}
                  </p>
                </div>
              </div>
              {state.hasPin ? (
                <button
                  type="button"
                  onClick={onRemovePin}
                  className="shrink-0 cursor-pointer rounded-full border border-[var(--subtle-border)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPinInput('');
                    setConfirmPinInput('');
                    setPinError(null);
                    setShowSetPin(true);
                  }}
                  className="shrink-0 cursor-pointer rounded-full border border-[var(--subtle-border)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                >
                  Set PIN
                </button>
              )}
            </div>
          </LiquidGlassCard>
        </div>

        <div className="flex flex-col gap-3.5 lg:col-span-6">
          {/* Cloud Lock Persistence & Wipe Recovery */}
          <LiquidGlassCard className="p-3.5 sm:p-4">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
                  <Cloud className="h-4 w-4" />
                </div>
                <LiquidSectionHeader
                  title="Cloud Lock & Wipe Recovery"
                  subtitle={
                    userEmail
                      ? `Signed in as ${userEmail}${isSyncingCloud ? ' · Syncing...' : ' · Active'}`
                      : 'Sign in with Google so your lock timer, PIN, and goals restore if your phone is reset'
                  }
                />
              </div>
              {userEmail && onSignOut ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : onSignIn ? (
                <button
                  type="button"
                  onClick={onSignIn}
                  data-testid="lock-google-signin-button"
                  className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-[var(--active-fill)] px-3.5 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              ) : null}
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              Lock timers and 4-digit PINs back up to Firebase so signing back in after a reset
              restores your remaining time. Advanced users can also set Android Device Owner via ADB.
            </p>
            {cloudError ? (
              <p className="mt-1.5 text-xs font-medium text-[var(--accent-ink)]">{cloudError}</p>
            ) : null}
          </LiquidGlassCard>

          {/* Zero-Loss Recovery Vault */}
          <RecoveryVaultCard
            store={store}
            durableStatus={state.durableStatus}
            onForceSaveVault={onForceSaveVault}
            onRestoreVault={onRestoreVault}
          />

          {/* Recovery & Lock Alerts */}
          <LiquidGlassCard className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Bell className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-semibold text-[var(--ink)]">
                    Recovery &amp; Lock Alerts
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    On-device alerts for streak milestones, Lock activation &amp; Install Guard
                  </p>
                </div>
              </div>
              <LiquidSwitch
                checked={state.settings.notificationsEnabled}
                onChange={onToggleNotifications}
                ariaLabel="Recovery and Lock Alerts"
              />
            </div>
          </LiquidGlassCard>

          {/* Dedicated Download & Install Card */}
          <LiquidGlassCard className="p-3.5 sm:p-4">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
                <Download className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {isIOS ? 'iPhone Screen Time & Home-Screen Guide' : 'Install GambleAware'}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  {isIOS
                    ? 'Copy the 22 betting sites for Safari Screen Time or save GambleAware to your Home Screen'
                    : 'Install the Web App or download the Android APK with browser, ad, and uninstall protection'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <PWAInstallButton variant="header" label="Install Web App" />
              <button
                type="button"
                onClick={onOpenDownloadPage}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3.5 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                <span>{isIOS ? 'Open iPhone Guide' : 'Download Page & APK'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </LiquidGlassCard>

          {/* Optional Advanced Phone Settings */}
          <LiquidGlassCard className="p-3.5 sm:p-4">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Advanced Phone Settings</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Optional network filtering for experienced users
                </p>
              </div>
              <ChevronRight
                className={`h-5 w-5 shrink-0 text-[var(--ink-muted)] transition-transform ${
                  showAdvancedSettings ? 'rotate-90' : ''
                }`}
              />
            </button>
            {showAdvancedSettings ? (
              <button
                type="button"
                onClick={onOpenPrivateDnsSettings}
                className="mt-3 flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3 text-left hover:opacity-90"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface)] text-[var(--ink)]">
                  <Server className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--ink)]">
                    System Private DNS (Optional)
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    {state.privateDnsStatus.isActive
                      ? `Active: ${state.privateDnsStatus.serverHost ?? 'Automatic'}. Tap to adjust.`
                      : 'Configure a private DNS-over-TLS hostname'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
              </button>
            ) : null}
          </LiquidGlassCard>

          {/* Personalization, Daily Spend Baseline & Appearance */}
          <LiquidGlassCard className="p-3.5 sm:p-4">
            <LiquidSectionHeader
              title="First Name Greeting"
              subtitle="Optional name shown on your Home shield"
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSetPreferredName(nameInput);
              }}
              className="mt-2.5 flex gap-2"
            >
              <div className="relative flex-1">
                <UserCheck className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--accent-ink)]" />
                <input
                  type="text"
                  maxLength={40}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your first name"
                  className="h-10 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--canvas)] pr-3 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-10 shrink-0 cursor-pointer rounded-xl bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Save
              </button>
            </form>

            <div className="mt-4">
              <LiquidSectionHeader
                title="Daily Spend Baseline (₦)"
                subtitle="Calculates your Naira savings across every betting-free day"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DAILY_SPEND_OPTIONS_NGN.map((amount) => {
                  const selected = state.settings.dailyBetSpendEstimate === amount;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => onSetDailySpend(amount)}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {formatNaira(amount)}/day
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <LiquidSectionHeader
                title="Appearance Theme"
                subtitle="Crisp White default or Black & Pink liquid glass finish"
              />
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {(Object.values(ThemeMode) as ThemeMode[]).map((mode) => {
                  const selected = state.settings.themeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSelectTheme(mode)}
                      className={`cursor-pointer rounded-xl border px-1.5 py-2 text-center text-xs font-medium transition-colors sm:text-sm ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] font-semibold text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                      }`}
                    >
                      {THEME_MODE_LABELS[mode]}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={onResetStreak}
              className="mt-3.5 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Restart Clean Streak Timer</span>
            </button>

            <button
              type="button"
              onClick={onReplayTour}
              className="mt-2 h-10 w-full cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
            >
              Replay Guided Tour
            </button>
          </LiquidGlassCard>
        </div>
      </div>

      <footer className="py-2 text-center">
        <p className="text-xs font-semibold text-[var(--ink)]">GambleAware</p>
        <p className="text-xs text-[var(--ink-muted)]">A product of Imoogle Technology</p>
      </footer>

      {/* Confirm Time Lock Dialog */}
      {showConfirmLock ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Activate ${formatLockDurationAdjective(pendingLockDays)} Lock?`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90dvh] w-full max-w-[400px] overflow-y-auto rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4 text-[var(--ink)] sm:p-5">
            <h2 className="font-display text-base font-bold sm:text-lg">
              Activate {formatLockDurationAdjective(pendingLockDays)} Lock?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)] sm:text-sm">
              While Commitment Lock is active, GambleAware will not allow uninstalling the app,
              pausing protection, turning off categories, or deleting blocked rules until the timer
              completes.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmLock(false)}
                className="cursor-pointer rounded-full px-4 py-2 text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onActivateTimeLock(pendingLockDays, includeAntiTamper);
                  setShowConfirmLock(false);
                }}
                className="cursor-pointer rounded-full bg-[var(--active-fill)] px-5 py-2 text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:text-sm"
              >
                Lock Now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Set PIN Dialog */}
      {showSetPin ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Set 4-Digit Accountability PIN"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSavePin}
            className="max-h-[90dvh] w-full max-w-[400px] overflow-y-auto rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4 text-[var(--ink)] sm:p-5"
          >
            <h2 className="font-display text-base font-bold sm:text-lg">Set 4-Digit Accountability PIN</h2>
            <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
              Enter a 4-digit PIN required to pause protection or weaken blocklist rules.
            </p>
            <div className="mt-3.5 space-y-2.5">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4-Digit PIN"
                className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Confirm PIN"
                className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
              />
              {pinError ? <p className="text-xs font-medium text-[var(--accent-ink)]">{pinError}</p> : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSetPin(false)}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-[var(--active-fill)] px-5 py-2 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Save PIN
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};
