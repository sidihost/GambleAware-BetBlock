import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { DAILY_SPEND_OPTIONS_NGN, formatNaira } from '../utils/currency';
import { formatLockDurationAdjective, LOCK_DURATION_PRESETS } from '../utils/lockDurations';
import { BrandGMark } from './AppHeader';

interface FirstRunSetupModalProps {
  initialName: string;
  initialDailySpend: number;
  isIOS?: boolean;
  isShieldEnabled: boolean;
  isDeviceAdminEnabled: boolean;
  onEnableShield: () => void;
  onEnableDeviceAdmin: () => void;
  onCompleteLockedSetup: (params: {
    preferredName: string;
    lockDays: number;
    dailySpendNgn: number;
  }) => void;
}

export const FirstRunSetupModal: React.FC<FirstRunSetupModalProps> = ({
  initialName,
  initialDailySpend,
  isIOS = false,
  isShieldEnabled,
  isDeviceAdminEnabled,
  onEnableShield,
  onEnableDeviceAdmin,
  onCompleteLockedSetup,
}) => {
  const [name, setName] = useState(initialName);
  const [lockDays, setLockDays] = useState(7);
  const [dailySpendNgn, setDailySpendNgn] = useState(initialDailySpend || 5000);
  const [stepError, setStepError] = useState<string | null>(null);

  const canFinish = isShieldEnabled && isDeviceAdminEnabled;

  const handleFinalize = () => {
    if (!isShieldEnabled || !isDeviceAdminEnabled) {
      setStepError(
        'Please activate Step 1 (Web & App Shield) and Step 2 (Uninstall Lock) above to continue.',
      );
      return;
    }
    setStepError(null);
    onCompleteLockedSetup({
      preferredName: name.trim(),
      lockDays,
      dailySpendNgn,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Complete Mandatory 3-Step Protection Setup"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <div className="max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-[28px] border border-[var(--glass-border)] bg-[var(--surface)] p-5 text-[var(--ink)] shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BrandGMark className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center rounded-full bg-[var(--active-fill)] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--active-content)] uppercase">
              Mandatory First-Launch Setup
            </span>
            <h2 className="mt-1 font-display text-xl leading-tight font-bold text-[var(--ink)] sm:text-2xl">
              Complete Lock &amp; Shield Setup
            </h2>
          </div>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink-muted)]">
          Enable all 3 layers right now so GambleAware immediately blocks betting sites while you
          type and prevents impulsive uninstalls until your timer ends.
        </p>

        {/* Optional Personalization */}
        <div className="mt-4">
          <label
            htmlFor="setup-first-name"
            className="mb-1 block text-xs font-semibold text-[var(--ink)]"
          >
            Your First Name <span className="font-normal text-[var(--ink-muted)]">(Optional)</span>
          </label>
          <input
            id="setup-first-name"
            type="text"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter first name (e.g. Tunde)"
            className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
          />
        </div>

        {/* Mandatory 3 Steps */}
        <div className="mt-4 space-y-2.5">
          {/* Step 1: Enable Web & App Shield */}
          <button
            type="button"
            onClick={() => {
              setStepError(null);
              onEnableShield();
            }}
            data-testid="mandatory-step-1"
            className={`flex w-full cursor-pointer items-center gap-3 rounded-[16px] border p-3.5 text-left transition-colors ${
              isShieldEnabled
                ? 'border-[var(--glass-border)] bg-[var(--muted-fill)]'
                : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:bg-[var(--muted-fill)]'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                isShieldEnabled
                  ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
              }`}
            >
              1
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--ink)]">
                {isIOS ? 'Enable GambleAware Safari & Site Shield' : 'Enable DNS & Site Shield'}
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                {isShieldEnabled
                  ? 'Active • Instant typing, login & betting website shield ready'
                  : isIOS
                    ? 'Required — tap to arm instant betting-site check & Screen Time domain blocklist'
                    : 'Required — tap to arm real-time site & betting link guard'}
              </p>
            </div>
            {isShieldEnabled ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-[var(--ink-muted)]" />
            )}
          </button>

          {/* Step 2: Enable Lock & Tamper Protection */}
          <button
            type="button"
            onClick={() => {
              setStepError(null);
              onEnableDeviceAdmin();
            }}
            data-testid="mandatory-step-2"
            className={`flex w-full cursor-pointer items-center gap-3 rounded-[16px] border p-3.5 text-left transition-colors ${
              isDeviceAdminEnabled
                ? 'border-[var(--glass-border)] bg-[var(--muted-fill)]'
                : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:bg-[var(--muted-fill)]'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                isDeviceAdminEnabled
                  ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
              }`}
            >
              2
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--ink)]">
                {isIOS ? 'Enable Anti-Tamper Lock & Alerts' : 'Enable Anti-Tamper Commitment Lock'}
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                {isDeviceAdminEnabled
                  ? 'Active • Prevents impulsive changes until your timer ends'
                  : 'Required — tap to lock protection rules until your timer completes'}
              </p>
            </div>
            {isDeviceAdminEnabled ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-[var(--ink-muted)]" />
            )}
          </button>

          {/* Step 3: Set Commitment Lock Duration */}
          <div className="rounded-[16px] border border-[var(--glass-border)] bg-[var(--muted-fill)] p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--active-fill)] text-xs font-bold text-[var(--active-content)]">
                3
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--ink)]">
                  Set Commitment Lock Duration
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Locks uninstall &amp; tamper controls until timer reaches 0
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {LOCK_DURATION_PRESETS.map((opt) => {
                const selected = lockDays === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setLockDays(opt.days)}
                    className={`h-9 cursor-pointer rounded-[12px] border px-2.5 text-xs font-semibold transition-colors ${
                      selected
                        ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                    }`}
                  >
                    {opt.days === 7 ? '7 Days (Default)' : opt.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold text-[var(--ink-muted)]">
                Daily Betting Spend Baseline (₦)
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {DAILY_SPEND_OPTIONS_NGN.slice(0, 4).map((amt) => {
                  const selected = dailySpendNgn === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDailySpendNgn(amt)}
                      className={`h-8 cursor-pointer rounded-[10px] border font-mono text-[11px] font-semibold transition-colors ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                      }`}
                    >
                      {formatNaira(amt)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {stepError ? (
          <p className="mt-3 text-xs font-semibold text-[var(--accent-ink)]">{stepError}</p>
        ) : null}

        <button
          type="button"
          onClick={handleFinalize}
          data-testid="mandatory-complete-button"
          className={`mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition-opacity ${
            canFinish
              ? 'bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90'
              : 'border border-[var(--subtle-border)] bg-[var(--muted-fill)] text-[var(--ink-muted)]'
          }`}
        >
          {canFinish ? <LockKeyhole className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          <span>
            {canFinish
              ? `Activate ${formatLockDurationAdjective(lockDays)} Lock & Enter`
              : 'Complete Steps 1 & 2 Above First'}
          </span>
        </button>
      </div>
    </div>
  );
};

