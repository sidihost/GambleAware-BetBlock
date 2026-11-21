import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Download,
  KeyRound,
  Lock,
  Moon,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';
import { ProtectionSettingsState, ThemeMode } from '../../data/types';
import {
  clearPinAttemptState,
  getPinLockoutRemainingSec,
  recordFailedPinAttempt,
  verifyPinHashSync,
} from '../../data/storage';
import {
  buildLockCountdownQuad,
  formatLockDurationLong,
  LOCK_DURATION_PRESETS,
} from '../../utils/lockDurations';
import {
  computeExpectedBuddyResponse,
  generateBuddyChallengeCode,
  verifyBuddyUnlockCode,
} from '../../utils/tiltRadar';
import { LiquidSwitch } from '../LiquidGlass';

interface LockTabProps {
  settings: ProtectionSettingsState;
  isLocked: boolean;
  remainingLockMs: number;
  currentTimeMs: number;
  isDarkTheme: boolean;
  onActivateLock: (days: number) => void;
  onToggleAntiTamper: (enabled: boolean) => void;
  onSetPin: (pin: string) => void;
  onClearPin: () => void;
  onSaveBuddyConfig: (partnerName: string, challengeCode: string) => void;
  onEmergencyBuddyUnlock: () => void;
  onUpdateTheme: (mode: ThemeMode) => void;
  onReplayWelcome: () => void;
  onResetStreak: () => void;
  onOpenDownloadPage: () => void;
}

export const LockTab: React.FC<LockTabProps> = ({
  settings,
  isLocked,
  remainingLockMs,
  currentTimeMs,
  isDarkTheme,
  onActivateLock,
  onToggleAntiTamper,
  onSetPin,
  onClearPin,
  onSaveBuddyConfig,
  onEmergencyBuddyUnlock,
  onUpdateTheme,
  onReplayWelcome,
  onResetStreak,
  onOpenDownloadPage,
}) => {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [pinInput, setPinInput] = useState('');
  const [pinVerifyInput, setPinVerifyInput] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const [buddyName, setBuddyName] = useState(settings.buddyPartnerName || '');
  const [buddyVerifyCode, setBuddyVerifyCode] = useState('');
  const [buddyStatus, setBuddyStatus] = useState<string | null>(null);

  const countdownQuad = useMemo(
    () => buildLockCountdownQuad(remainingLockMs),
    [remainingLockMs],
  );

  const pinLockoutSec = getPinLockoutRemainingSec(currentTimeMs);
  const hasPin = Boolean(settings.pinHash);
  const activeChallenge = settings.buddyChallengeCode || '';
  const previewExpectedCode = useMemo(
    () => (activeChallenge && buddyName.trim() ? computeExpectedBuddyResponse(activeChallenge, buddyName) : ''),
    [activeChallenge, buddyName],
  );

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pinInput)) {
      setPinMessage('Enter a 4-digit numeric PIN.');
      return;
    }
    onSetPin(pinInput);
    setPinInput('');
    setPinMessage('Accountability PIN armed.');
  };

  const handleVerifyOrRemovePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinLockoutSec > 0) {
      setPinMessage(`Too many failed attempts. Wait ${pinLockoutSec}s before trying again.`);
      return;
    }
    if (!/^\d{4}$/.test(pinVerifyInput)) {
      setPinMessage('Enter your current 4-digit PIN.');
      return;
    }
    if (verifyPinHashSync(pinVerifyInput, settings.pinHash)) {
      clearPinAttemptState();
      onClearPin();
      setPinVerifyInput('');
      setPinMessage('PIN verified and removed.');
    } else {
      const attempt = recordFailedPinAttempt();
      setPinVerifyInput('');
      setPinMessage(
        attempt.lockedForSec > 0
          ? `PIN retry rate limit reached — locked for ${attempt.lockedForSec}s.`
          : `Incorrect PIN. ${attempt.attemptsLeft} attempt${attempt.attemptsLeft === 1 ? '' : 's'} remaining before lockout.`,
      );
    }
  };

  const handleGenerateBuddyChallenge = () => {
    const cleanName = buddyName.trim();
    if (cleanName.length < 2) {
      setBuddyStatus('Enter your trusted partner’s name first.');
      return;
    }
    const code = generateBuddyChallengeCode();
    onSaveBuddyConfig(cleanName, code);
    setBuddyStatus(`Challenge ${code} generated for ${cleanName}.`);
  };

  const handleVerifyBuddyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge || !buddyName.trim()) {
      setBuddyStatus('Set up a buddy challenge code first.');
      return;
    }
    if (verifyBuddyUnlockCode(activeChallenge, buddyName, buddyVerifyCode)) {
      setBuddyVerifyCode('');
      setBuddyStatus('Partner approval verified — Commitment Lock cleared.');
      onEmergencyBuddyUnlock();
    } else {
      setBuddyStatus('Approval token did not match. Ask your partner to verify the 6-digit code.');
    }
  };

  return (
    <div data-testid="mainapp-tab-lock" className="space-y-6">
      <div>
        <p className="font-mono text-[11px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
          Commitment Lock, PIN Rate Limit &amp; Settings
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
          Unbreakable Commitment Lock
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Lock protection so impulsive urges cannot pause the shield, weaken blocklist rules, or uninstall the app.
        </p>
      </div>

      {/* Section 1: Commitment Lock Timer */}
      <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--accent-ink)]" />
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">
              {isLocked ? 'Active Lock Countdown' : 'Arm Commitment Lock'}
            </h2>
          </div>
          <span className="font-mono text-xs font-bold text-[var(--accent-ink)] uppercase">
            {isLocked ? 'TAMPER-PROOF ACTIVE' : 'UNLOCKED'}
          </span>
        </div>

        {/* 4-Unit Countdown Quad */}
        <div
          data-testid="lock-countdown-quad"
          className="mt-4 grid grid-cols-4 gap-2.5 sm:max-w-md"
        >
          {countdownQuad.map((cell) => (
            <div
              key={cell.unit}
              className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] py-3 text-center"
            >
              <p className="font-mono text-xl font-bold text-[var(--ink)] tabular-nums sm:text-2xl">
                {isLocked ? cell.digits : '00'}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-[var(--ink-muted)]">{cell.unit}</p>
            </div>
          ))}
        </div>

        {/* Duration Selector */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-[var(--ink)]">
            Select Duration ({formatLockDurationLong(selectedDays)})
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {LOCK_DURATION_PRESETS.map((preset) => {
              const active = selectedDays === preset.days;
              return (
                <button
                  key={preset.days}
                  type="button"
                  data-testid={`lock-preset-${preset.days}`}
                  onClick={() => setSelectedDays(preset.days)}
                  className={`h-10 cursor-pointer rounded-xl border font-mono text-xs font-semibold transition-colors ${
                    active
                      ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                  }`}
                >
                  {preset.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--subtle-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LiquidSwitch
              checked={settings.antiTamperLockEnabled}
              onChange={onToggleAntiTamper}
              ariaLabel="Toggle Anti-Tamper and Settings Guard"
            />
            <div>
              <p className="text-xs font-semibold text-[var(--ink)]">
                Anti-Tamper &amp; Clock Jump Guard
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Blocks Force Stop, Date/Time tampering, and App Info uninstalls on Android.
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="activate-lock-btn"
            onClick={() => onActivateLock(selectedDays)}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-6 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>
              {isLocked
                ? `Extend Lock to ${formatLockDurationLong(selectedDays)}`
                : `Activate ${formatLockDurationLong(selectedDays)} Lock`}
            </span>
          </button>
        </div>
      </section>

      {/* Section 2: Accountability PIN + Trusted Buddy Co-Lock */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--accent-ink)]" />
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Accountability PIN &amp; Retry Rate Limit
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Protected by a 5-attempt rate limit with automatic 60-second lockout to stop brute-force guessing.
          </p>

          {pinLockoutSec > 0 ? (
            <div className="mt-3 rounded-xl border border-[var(--block-border)] bg-[var(--block-bg)] px-3 py-2 text-xs font-semibold text-[var(--block-ink)]">
              PIN retry rate limit active — try again in {pinLockoutSec}s.
            </div>
          ) : null}

          {!hasPin ? (
            <form onSubmit={handleSavePin} className="mt-4 flex gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4-digit PIN"
                aria-label="New 4-digit PIN"
                className="h-11 flex-1 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 font-mono text-sm tracking-widest text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)]"
              >
                <Check className="h-4 w-4" />
                <span>Set PIN</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOrRemovePin} className="mt-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-ink)]">
                <ShieldCheck className="h-4 w-4" />
                <span>4-Digit Accountability PIN Armed</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinVerifyInput}
                  onChange={(e) => setPinVerifyInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter PIN to remove"
                  aria-label="Verify current PIN"
                  className="h-11 flex-1 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 font-mono text-sm tracking-widest text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-11 cursor-pointer rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
                >
                  Remove PIN
                </button>
              </div>
            </form>
          )}

          {pinMessage ? (
            <p className="mt-2.5 text-xs font-medium text-[var(--accent-ink)]">{pinMessage}</p>
          ) : null}
        </section>

        {/* Trusted Buddy Co-Lock */}
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--accent-ink)]" />
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Trusted Buddy Co-Lock (Offline)
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Share your challenge code with a trusted friend or family member so emergency unlocks require a second person.
          </p>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              maxLength={40}
              value={buddyName}
              onChange={(e) => setBuddyName(e.target.value)}
              placeholder="Partner name (e.g. Tunde)"
              aria-label="Trusted partner name"
              className="h-11 flex-1 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleGenerateBuddyChallenge}
              className="h-11 shrink-0 cursor-pointer rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
            >
              Generate Key
            </button>
          </div>

          {activeChallenge ? (
            <div className="mt-3 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[var(--ink-muted)]">Challenge Key</span>
                <span className="font-bold text-[var(--accent-ink)]">{activeChallenge}</span>
              </div>
              {previewExpectedCode ? (
                <p className="mt-1 font-mono text-[11px] text-[var(--ink-muted)]">
                  Partner approval code: {previewExpectedCode}
                </p>
              ) : null}
              <form onSubmit={handleVerifyBuddyUnlock} className="mt-3 flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={buddyVerifyCode}
                  onChange={(e) => setBuddyVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit approval"
                  className="h-10 flex-1 rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 font-mono text-xs text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-10 cursor-pointer rounded-xl bg-[var(--active-fill)] px-3.5 text-xs font-semibold text-[var(--active-content)]"
                >
                  Verify Unlock
                </button>
              </form>
            </div>
          ) : null}

          {buddyStatus ? (
            <p className="mt-2.5 text-xs font-medium text-[var(--accent-ink)]">{buddyStatus}</p>
          ) : null}
        </section>
      </div>

      {/* Section 3: Appearance, Welcome Replay & Android APK */}
      <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          App Preferences &amp; Device Protection
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => onUpdateTheme(isDarkTheme ? ThemeMode.LIGHT : ThemeMode.DARK)}
            className="flex min-h-[52px] cursor-pointer items-center justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
          >
            <span>Theme: {isDarkTheme ? 'Obsidian' : 'White'}</span>
            {isDarkTheme ? (
              <Sun className="h-4 w-4 text-[var(--accent-ink)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--accent-ink)]" />
            )}
          </button>

          <button
            type="button"
            data-testid="replay-welcome-btn"
            onClick={onReplayWelcome}
            className="flex min-h-[52px] cursor-pointer items-center justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
          >
            <span>Replay Welcome Setup</span>
            <RefreshCw className="h-4 w-4 text-[var(--accent-ink)]" />
          </button>

          <button
            type="button"
            onClick={onResetStreak}
            className="flex min-h-[52px] cursor-pointer items-center justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
          >
            <span>Restart Clean Streak</span>
            <RotateCcw className="h-4 w-4 text-[var(--accent-ink)]" />
          </button>

          <button
            type="button"
            data-testid="lock-download-apk-btn"
            onClick={onOpenDownloadPage}
            className="flex min-h-[52px] cursor-pointer items-center justify-between rounded-2xl border border-[var(--active-fill)] bg-[var(--soft-accent-bg)] px-4 text-xs font-semibold text-[var(--accent-ink)]"
          >
            <span>Download Android APK</span>
            <Download className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
