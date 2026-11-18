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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-2 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div className="flex max-h-[90dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl">
        {/* Compact Pinned Header */}
        <div className="shrink-0 border-b border-[var(--subtle-border)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <BrandGMark className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-semibold text-[var(--accent-ink)]">
                Quick Setup · Optional
              </p>
              <h2 className="mt-0.5 font-display text-base leading-tight font-bold text-[var(--ink)] sm:text-lg">
                Set Up Your Preferences
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Middle Body */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 sm:px-5">
          <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
            Turn on what you want now, or skip and change any setting later.
          </p>

          {/* Optional Personalization */}
          <div>
            <label
              htmlFor="setup-first-name"
              className="mb-1 block text-xs font-semibold text-[var(--ink)]"
            >
              First name <span className="font-normal text-[var(--ink-muted)]">(optional)</span>
            </label>
            <input
              id="setup-first-name"
              type="text"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tunde"
              className="h-10 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />
          </div>

          {/* Option 1 & 2 */}
          <div className="space-y-2">
            <button
              type="button"
              role="switch"
              aria-checked={enableShield}
              onClick={() => setEnableShield((prev) => !prev)}
              data-testid="setup-step-shield"
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors sm:p-3 ${
                enableShield
                  ? 'border-[var(--glass-border)] bg-[var(--muted-fill)]'
                  : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:bg-[var(--muted-fill)]'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                  enableShield
                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                }`}
              >
                1
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--ink)] sm:text-sm">
                  {isIOS ? 'Safari & Site Blocking' : 'Betting Site & App Blocker'}
                </p>
                <p className="text-[11px] leading-snug text-[var(--ink-muted)]">
                  {enableShield
                    ? 'Selected — blocks gambling URLs and sign-in pages'
                    : 'Optional — tap to turn on site blocking'}
                </p>
              </div>
              {enableShield ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
              )}
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={enableAntiTamper || lockDays > 0}
              onClick={() => {
                if (lockDays > 0) return;
                setEnableAntiTamper((prev) => !prev);
              }}
              data-testid="setup-step-tamper"
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors sm:p-3 ${
                enableAntiTamper || lockDays > 0
                  ? 'border-[var(--glass-border)] bg-[var(--muted-fill)]'
                  : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:bg-[var(--muted-fill)]'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                  enableAntiTamper || lockDays > 0
                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                }`}
              >
                2
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--ink)] sm:text-sm">
                  Rule &amp; Uninstall Lock
                </p>
                <p className="text-[11px] leading-snug text-[var(--ink-muted)]">
                  {enableAntiTamper || lockDays > 0
                    ? 'Selected — prevents quick rule changes when tempted'
                    : 'Optional — add friction before rules can be edited'}
                </p>
              </div>
              {enableAntiTamper || lockDays > 0 ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
              )}
            </button>
          </div>

          {/* Option 3: Lock Duration & Baseline */}
          <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--active-fill)] text-[11px] font-bold text-[var(--active-content)]">
                3
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--ink)] sm:text-sm">
                  Lock Timer <span className="font-normal text-[var(--ink-muted)]">(optional)</span>
                </p>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  {lockDays > 0
                    ? `Locks rules for ${formatLockDurationAdjective(lockDays).toLowerCase()}`
                    : 'No timer set — you can lock anytime in Lock settings'}
                </p>
              </div>
              <LockKeyhole className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setLockDays(0)}
                className={`col-span-4 h-8 cursor-pointer rounded-lg border px-2 text-[11px] font-semibold transition-colors ${
                  lockDays === 0
                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                }`}
              >
                Decide Later
              </button>

              {LOCK_DURATION_PRESETS.map((opt) => {
                const selected = lockDays === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setLockDays(opt.days)}
                    className={`h-8 cursor-pointer rounded-lg border px-1.5 text-[11px] font-semibold transition-colors ${
                      selected
                        ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                    }`}
                  >
                    {opt.shortLabel}
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5">
              <p className="mb-1 text-[11px] font-semibold text-[var(--ink-muted)]">
                Typical daily stake (₦)
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {DAILY_SPEND_OPTIONS_NGN.slice(0, 4).map((amt) => {
                  const selected = dailySpendNgn === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDailySpendNgn(amt)}
                      className={`h-8 cursor-pointer rounded-lg border font-mono text-[11px] font-semibold transition-colors ${
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

        {/* Sticky Always-Visible Action Footer */}
        <div className="flex shrink-0 flex-col gap-1.5 border-t border-[var(--subtle-border)] bg-[var(--surface)] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={handleFinalize}
            data-testid="setup-complete-button"
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90 sm:text-sm"
          >
            {lockDays > 0 ? <LockKeyhole className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            <span>
              {lockDays > 0
                ? `Save & Start ${formatLockDurationAdjective(lockDays)} Lock`
                : 'Save & Continue'}
            </span>
          </button>

          <button
            type="button"
            onClick={onSkipSetup}
            data-testid="setup-skip-button"
            className="flex h-9 w-full cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};
