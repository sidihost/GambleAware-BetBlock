import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { DAILY_SPEND_OPTIONS_NGN, formatNaira } from '../utils/currency';
import { BrandAnchorMark } from './AppHeader';

interface FirstRunSetupModalProps {
  initialName: string;
  initialDailySpend: number;
  onActivateAdminAndShield: () => void;
  onCompleteLockedSetup: (params: {
    preferredName: string;
    lockDays: number;
    dailySpendNgn: number;
  }) => void;
}

const SETUP_LOCK_OPTIONS = [
  { days: 1, label: '24 Hours' },
  { days: 7, label: '7 Days (Default)' },
  { days: 30, label: '30 Days' },
  { days: 90, label: '90 Days' },
];

export const FirstRunSetupModal: React.FC<FirstRunSetupModalProps> = ({
  initialName,
  initialDailySpend,
  onActivateAdminAndShield,
  onCompleteLockedSetup,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [lockDays, setLockDays] = useState(7);
  const [dailySpendNgn, setDailySpendNgn] = useState(initialDailySpend || 5000);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = name.trim();
    if (!cleaned) {
      setNameError('Enter your first name, or choose "Continue without name" below.');
      return;
    }
    setNameError(null);
    setStep(2);
  };

  const handleArmAdminLock = () => {
    onActivateAdminAndShield();
    setStep(3);
  };

  const handleFinalizeLockIn = () => {
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
      aria-label="GambleAware First-Install Lock-In Setup"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
    >
      <div className="max-h-[92dvh] w-full max-w-[480px] overflow-y-auto rounded-[28px] border border-[var(--glass-border)] bg-[var(--surface)] p-5 text-[var(--ink)] shadow-2xl sm:p-6">
        {/* Header Crest + Progress Dots */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandAnchorMark className="h-9 w-9 shrink-0" />
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-widest text-[var(--accent-ink)] uppercase">
                Step {step} of 3 · Guided Lock-In
              </p>
              <p className="font-display text-sm font-bold text-[var(--ink)]">GambleAware Setup</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === step
                    ? 'w-6 bg-[var(--active-fill)]'
                    : idx < step
                      ? 'w-2.5 bg-[var(--accent-ink)]'
                      : 'w-2.5 bg-[var(--subtle-border)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Name Prompt */}
        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="mt-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--muted-fill)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-ink)]">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Zero Account · Stored Offline on Device</span>
            </div>

            <h2 className="mt-3 font-display text-2xl leading-tight font-bold text-[var(--ink)]">
              Who are we protecting today?
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              Enter your first name so your clean streak, Naira savings, and block screen stay
              personal to you. Next, we will automatically lock in Admin &amp; Uninstall Protection.
            </p>

            <label
              htmlFor="setup-first-name"
              className="mt-4 mb-1.5 block text-xs font-semibold text-[var(--ink)]"
            >
              Your First Name
            </label>
            <input
              id="setup-first-name"
              type="text"
              maxLength={40}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="Enter your first name (e.g. Tunde)"
              autoFocus
              className="h-12 w-full rounded-[16px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-4 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />
            {nameError ? (
              <p className="mt-2 text-xs font-medium text-[var(--accent-ink)]">{nameError}</p>
            ) : null}

            <button
              type="submit"
              className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              <span>Continue to Admin Lock</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setName('');
                setNameError(null);
                setStep(2);
              }}
              className="mt-2.5 flex h-10 w-full cursor-pointer items-center justify-center rounded-full text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
            >
              Continue without name
            </button>
          </form>
        ) : null}

        {/* STEP 2: Automatic Admin & Shield Arming */}
        {step === 2 ? (
          <div className="mt-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--muted-fill)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-ink)]">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Required Before Entering App</span>
            </div>

            <h2 className="mt-3 font-display text-2xl leading-tight font-bold text-[var(--ink)]">
              {name.trim()
                ? `${name.trim().split(/\s+/)[0]}, arm your Admin Lock`
                : 'Arm Admin & Delete Protection'}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              GambleAware enables Uninstall &amp; Admin protection right now by default so an urge
              later cannot undo your setup or delete the blocker.
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                {
                  title: 'Device Admin Delete Lock',
                  desc: 'Prevents impulsive uninstallation on Android while your timer is active.',
                },
                {
                  title: '639+ Betting Sites & 130+ Apps Blocked',
                  desc: 'Sportsbooks, casinos, login pages, search queries, and social in-app links.',
                },
                {
                  title: 'Anti-Tamper Settings Guard',
                  desc: 'Blocks backing out or weakening rules once your lock is active.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-2.5 rounded-[16px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--ink)]">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-muted)]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleArmAdminLock}
              className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Activate Admin &amp; Shield Lock</span>
            </button>
          </div>
        ) : null}

        {/* STEP 3: Default Lock Duration — No Turning Back */}
        {step === 3 ? (
          <div className="mt-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--muted-fill)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-ink)]">
              <LockKeyhole className="h-3.5 w-3.5" />
              <span>Admin Lock Armed · Final Step</span>
            </div>

            <h2 className="mt-3 font-display text-2xl leading-tight font-bold text-[var(--ink)]">
              Lock it in so you cannot go back
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              Choose your initial lock timer. Once confirmed, Admin &amp; Uninstall Lock cannot be
              switched off until this countdown hits zero.
            </p>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-[var(--ink)]">Default Lock Duration</p>
              <div className="grid grid-cols-2 gap-2">
                {SETUP_LOCK_OPTIONS.map((opt) => {
                  const selected = lockDays === opt.days;
                  return (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setLockDays(opt.days)}
                      className={`h-11 cursor-pointer rounded-[14px] border px-3 text-xs font-semibold transition-colors ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-[var(--ink)]">
                Daily Betting Spend Saved (₦)
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {DAILY_SPEND_OPTIONS_NGN.slice(0, 4).map((amt) => {
                  const selected = dailySpendNgn === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDailySpendNgn(amt)}
                      className={`h-10 cursor-pointer rounded-[12px] border font-mono text-xs font-semibold transition-colors ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                      }`}
                    >
                      {formatNaira(amt)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinalizeLockIn}
              className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              <LockKeyhole className="h-4 w-4" />
              <span>Lock In {lockDays}-Day Protection Now</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
