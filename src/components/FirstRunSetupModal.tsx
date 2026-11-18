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
  onCompleteSetup: (params: {
    preferredName: string;
    lockDays: number;
    dailySpendNgn: number;
    enableShield: boolean;
    enableAntiTamper: boolean;
  }) => void;
  onSkipSetup: () => void;
}

export const FirstRunSetupModal: React.FC<FirstRunSetupModalProps> = ({
  initialName,
  initialDailySpend,
  isIOS = false,
  isShieldEnabled,
  isDeviceAdminEnabled,
  onCompleteSetup,
  onSkipSetup,
}) => {
  const [name, setName] = useState(initialName);
  const [enableShield, setEnableShield] = useState<boolean>(isShieldEnabled || true);
  const [enableAntiTamper, setEnableAntiTamper] = useState<boolean>(isDeviceAdminEnabled);
  const [lockDays, setLockDays] = useState<number>(0);
  const [dailySpendNgn, setDailySpendNgn] = useState(initialDailySpend || 5000);

  const handleFinalize = () => {
    onCompleteSetup({
      preferredName: name.trim(),
      lockDays,
      dailySpendNgn,
      enableShield,
      enableAntiTamper: enableAntiTamper || lockDays > 0,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Personalize Your Protection Setup"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <div className="max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-[28px] border border-[var(--glass-border)] bg-[var(--surface)] p-5 text-[var(--ink)] shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BrandGMark className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center rounded-full bg-[var(--soft-accent-bg)] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--accent-ink)] uppercase">
              Quick Setup · Optional
            </span>
            <h2 className="mt-1 font-display text-xl leading-tight font-bold text-[var(--ink)] sm:text-2xl">
              Choose Your Protection Setup
            </h2>
          </div>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink-muted)]">
          Every layer is your decision. Pick what you want enabled now, or skip to explore the app
          first and decide later.
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

        {/* User-Controlled Setup Choices */}
        <div className="mt-4 space-y-2.5">
          {/* Option 1: Enable Web & App Shield */}
          <button
            type="button"
            role="switch"
            aria-checked={enableShield}
            onClick={() => setEnableShield((prev) => !prev)}
            data-testid="setup-step-shield"
            className={`flex w-full cursor-pointer items-center gap-3 rounded-[16px] border p-3.5 text-left transition-colors ${
              enableShield
                ? 'border-[var(--glass-border)] bg-[var(--muted-fill)]'
                : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:bg-[var(--muted-fill)]'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                enableShield
                  ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
              }`}
            >
              1
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--ink)]">
                {isIOS ? 'Safari & Betting Site Shield' : 'Real-Time Betting Site Shield'}
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                {enableShield
                  ? 'Selected — blocks gambling URLs, logins & searches immediately'
                  : 'Optional — tap to enable instant site & keyword guard'}
              </p>
            </div>
            {enableShield ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-[var(--ink-muted)]" />
            )}
          </button>

          {/* Option 2: Anti-Tamper Protection */}
          <button
            type="button"
            role="switch"
            aria-checked={enableAntiTamper || lockDays > 0}
            onClick={() => {
              if (lockDays > 0) return;
              setEnableAntiTamper((prev) => !prev);
            }}
            data-testid="setup-step-tamper"
            className={`flex w-full cursor-pointer items-center gap-3 rounded-[16px] border p-3.5 text-left transition-colors ${
              enableAntiTamper || lockDays > 0
                ? 'border-[var(--glass-border)] bg-[var(--muted-fill)]'
                : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:bg-[var(--muted-fill)]'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                enableAntiTamper || lockDays > 0
                  ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
              }`}
            >
              2
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--ink)]">
                {isIOS ? 'Anti-Tamper & Alerts Guard' : 'Anti-Tamper Rule Guard'}
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                {enableAntiTamper || lockDays > 0
                  ? 'Selected — guards blocklist rules against quick changes'
                  : 'Optional — enable only if you want extra friction'}
              </p>
            </div>
            {enableAntiTamper || lockDays > 0 ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-[var(--ink-muted)]" />
            )}
          </button>

          {/* Option 3: Optional Commitment Lock Duration */}
          <div className="rounded-[16px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--active-fill)] text-xs font-bold text-[var(--active-content)]">
                3
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--ink)]">
                  Commitment Lock Timer <span className="font-normal text-[var(--ink-muted)]">(Optional)</span>
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {lockDays > 0
                    ? `Locks weakening rules for ${formatLockDurationAdjective(lockDays).toLowerCase()} after saving`
                    : 'No lock armed — you can set a timer later inside Lock settings'}
                </p>
              </div>
              <LockKeyhole className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setLockDays(0)}
                className={`col-span-2 h-9 cursor-pointer rounded-[12px] border px-2.5 text-xs font-semibold transition-colors sm:col-span-3 ${
                  lockDays === 0
                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                }`}
              >
                No Lock Timer (Decide Later)
              </button>

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
                    {opt.label}
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

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleFinalize}
            data-testid="setup-complete-button"
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
          >
            {lockDays > 0 ? <LockKeyhole className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            <span>
              {lockDays > 0
                ? `Save & Arm ${formatLockDurationAdjective(lockDays)} Lock`
                : 'Save Preferences & Enter App'}
            </span>
          </button>

          <button
            type="button"
            onClick={onSkipSetup}
            data-testid="setup-skip-button"
            className="flex h-10 w-full cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
          >
            Skip for Now — Explore App First
          </button>
        </div>
      </div>
    </div>
  );
};
