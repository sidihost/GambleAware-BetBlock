import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronRight,
  Download,
  Lock,
  LockOpen,
  RefreshCw,
  Server,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { LiquidGlassCard, LiquidSectionHeader, LiquidSwitch } from '../components/LiquidGlass';
import { DerivedMainState, THEME_MODE_LABELS, ThemeMode } from '../data/types';
import { DAILY_SPEND_OPTIONS_NGN, formatNaira } from '../utils/currency';

interface LockSettingsScreenProps {
  state: DerivedMainState;
  onActivateTimeLock: (days: number, antiTamper: boolean) => void;
  onToggleAntiTamper: (enabled: boolean) => void;
  onSetPin: (pin: string) => void;
  onRemovePin: () => void;
  onToggleDeviceAdmin: () => void;
  onOpenPrivateDnsSettings: () => void;
  onSetDailySpend: (amount: number) => void;
  onSelectTheme: (mode: ThemeMode) => void;
  onResetStreak: () => void;
  onReplayTour: () => void;
  onToggleNotifications: (enabled: boolean) => void;
  onSendTestNotification: () => void;
  onOpenGetApp: () => void;
}

const LOCK_DURATIONS = [
  { days: 1, label: '24 Hours' },
  { days: 7, label: '7 Days' },
  { days: 30, label: '30 Days' },
  { days: 90, label: '90 Days' },
];

export const LockSettingsScreen: React.FC<LockSettingsScreenProps> = ({
  state,
  onActivateTimeLock,
  onToggleAntiTamper,
  onSetPin,
  onRemovePin,
  onToggleDeviceAdmin,
  onOpenPrivateDnsSettings,
  onSetDailySpend,
  onSelectTheme,
  onResetStreak,
  onReplayTour,
  onToggleNotifications,
  onSendTestNotification,
  onOpenGetApp,
}) => {
  const isTimeLocked = state.isTimeLockedNow;
  const [pendingLockDays, setPendingLockDays] = useState(7);
  const [includeAntiTamper, setIncludeAntiTamper] = useState(true);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

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
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-3.5 px-4 pt-3 pb-28">
      <div className="px-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
          Commitment Lock
        </h1>
        <p className="text-xs text-[var(--ink-muted)]">
          Prevent uninstalling, tampering, or pausing your shield
        </p>
      </div>

      {/* Timed Commitment Lock Card */}
      <LiquidGlassCard className="p-4 sm:p-5" tourKey="lock_timer">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
              isTimeLocked
                ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'bg-[var(--muted-fill)] text-[var(--muted-content)]'
            }`}
          >
            {isTimeLocked ? <Lock className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-semibold text-[var(--ink)]">
              {isTimeLocked ? 'Commitment Lock Active' : 'Timed Commitment Lock'}
            </h2>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
              {isTimeLocked
                ? `Uninstall & tamper blocked until ${lockExpiryFormatted}`
                : 'Lock protection, uninstalls, and blocklists for a chosen recovery period'}
            </p>
          </div>
        </div>

        {isTimeLocked ? (
          <div className="mt-3.5 grid grid-cols-4 gap-2">
            {state.lockClockQuad.map((q) => (
              <div
                key={q.unit}
                className="flex flex-col items-center rounded-[16px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] py-2.5"
              >
                <span className="font-mono text-xl font-bold tabular-nums text-[var(--ink)]">
                  {q.digits}
                </span>
                <span className="font-mono text-[10px] tracking-wider text-[var(--ink-muted)]">
                  {q.unit}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3.5 flex flex-wrap gap-2">
          {LOCK_DURATIONS.map((d) => {
            const selected = pendingLockDays === d.days;
            return (
              <button
                key={d.days}
                type="button"
                onClick={() => setPendingLockDays(d.days)}
                className={`cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                  selected
                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'border-[var(--subtle-border)] bg-[var(--surface)]/65 text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--ink)]">Anti-Uninstall & Tamper Guard</p>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
              Blocks Settings App Info, Package Installer, Play Store uninstall, Accessibility &
              Device Admin removal while locked
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
            ariaLabel="Anti-Uninstall & Tamper Guard"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowConfirmLock(true)}
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
        >
          <Lock className="h-4 w-4" />
          <span>
            {isTimeLocked
              ? `Extend Lock by ${pendingLockDays} Day(s)`
              : `Activate ${pendingLockDays}-Day Lock`}
          </span>
        </button>
      </LiquidGlassCard>

      {/* Device Admin Uninstall Lock */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--ink)]" />
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-[var(--ink)]">
                Uninstall Lock
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                {state.isDeviceAdminEnabled
                  ? 'Active • Prevents uninstalling GambleAware'
                  : 'Enable Device Admin to block impulsive app removal'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleDeviceAdmin}
            className="shrink-0 cursor-pointer rounded-full border border-[var(--subtle-border)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
          >
            {state.isDeviceAdminEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </LiquidGlassCard>

      {/* Accountability PIN Card */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {state.hasPin ? (
              <Lock className="h-5 w-5 shrink-0 text-[var(--ink)]" />
            ) : (
              <LockOpen className="h-5 w-5 shrink-0 text-[var(--ink)]" />
            )}
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-[var(--ink)]">
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

      {/* Recovery & Lock Alerts */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Bell className="h-5 w-5 shrink-0 text-[var(--ink)]" />
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-[var(--ink)]">
                Recovery & Lock Alerts
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                On-device alerts for streak milestones, Lock activation & Install Guard
              </p>
            </div>
          </div>
          <LiquidSwitch
            checked={state.settings.notificationsEnabled}
            onChange={onToggleNotifications}
            ariaLabel="Recovery and Lock Alerts"
          />
        </div>
        <button
          type="button"
          onClick={onSendTestNotification}
          className="mt-3 h-10 w-full cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
        >
          Send Test Alert
        </button>
      </LiquidGlassCard>

      {/* System Private DNS Guide */}
      <LiquidGlassCard className="p-4 sm:p-5" onClick={onOpenPrivateDnsSettings}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--muted-fill)] text-[var(--ink)]">
            <Server className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--ink)]">
              System Private DNS (Zero-VPN)
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              {state.privateDnsStatus.isActive
                ? `Active: ${state.privateDnsStatus.serverHost ?? 'Automatic'}. Tap to adjust.`
                : 'Optional: Set Private DNS (e.g. family.adguard-dns.com) for OS-level DNS blocking with zero VPN.'}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--ink-muted)]" />
        </div>
      </LiquidGlassCard>

      {/* Download Android App / Install Web App */}
      <LiquidGlassCard className="p-4 sm:p-5" onClick={onOpenGetApp}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--ink)]">
              Download Android App (.apk) &amp; Install
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              Get the native Nigeria Android APK or add GambleAware to your home screen
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
        </div>
      </LiquidGlassCard>

      {/* Daily Spend Baseline & Appearance */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <LiquidSectionHeader
          title="Daily Spend Baseline (₦)"
          subtitle="Used to estimate Nigerian Naira saved during your clean streak"
        />
        <div className="mt-2.5 flex flex-wrap gap-2">
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
                    : 'border-[var(--subtle-border)] bg-[var(--surface)]/65 text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {formatNaira(amount)}/day
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <LiquidSectionHeader
            title="Black & Pink Theme"
            subtitle="Signature obsidian black & pink liquid glass finish"
          />
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {(Object.values(ThemeMode) as ThemeMode[]).map((mode) => {
              const selected = state.settings.themeMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSelectTheme(mode)}
                  className={`cursor-pointer rounded-[16px] border py-3 text-center text-sm font-medium transition-colors ${
                    selected
                      ? 'border-[var(--active-fill)] bg-[var(--active-fill)] font-semibold text-[var(--active-content)]'
                      : 'border-[var(--subtle-border)] bg-[var(--surface)]/65 text-[var(--ink)] hover:bg-[var(--muted-fill)]'
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
          className="mt-4 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Restart Clean Streak Timer</span>
        </button>

        <button
          type="button"
          onClick={onReplayTour}
          className="mt-2 h-11 w-full cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
        >
          Replay Guided Tour
        </button>
      </LiquidGlassCard>

      <footer className="py-2 text-center">
        <p className="text-xs font-semibold text-[var(--ink)]">GambleAware</p>
        <p className="text-xs text-[var(--ink-muted)]">A product of Imoogle Technology</p>
      </footer>

      {/* Confirm Time Lock Dialog */}
      {showConfirmLock ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Activate ${pendingLockDays}-Day Lock?`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-[400px] rounded-[26px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)]">
            <h2 className="font-display text-lg font-bold">
              Activate {pendingLockDays}-Day Lock?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              While Commitment Lock is active, GambleAware will not allow uninstalling the app,
              pausing protection, turning off categories, or deleting blocked rules until the timer
              completes.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmLock(false)}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onActivateTimeLock(pendingLockDays, includeAntiTamper);
                  setShowConfirmLock(false);
                }}
                className="cursor-pointer rounded-full bg-[var(--active-fill)] px-5 py-2 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
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
            className="w-full max-w-[400px] rounded-[26px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)]"
          >
            <h2 className="font-display text-lg font-bold">Set 4-Digit Accountability PIN</h2>
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
                className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Confirm PIN"
                className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              />
              {pinError ? <p className="text-xs font-medium text-[var(--ink)]">{pinError}</p> : null}
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
