import React, { useEffect, useState } from 'react';
import { Check, ShieldAlert, ShieldCheck, Wind, X } from 'lucide-react';
import { BettingBrandLogo } from '../BettingBrandLogo';
import { formatNaira } from '../../utils/currency';

const URGE_TRIGGERS = [
  'Matchday',
  'Boredom',
  'Stress',
  'Promo Ad',
  'Late Night',
  'Payday',
] as const;

interface CalmResetModalProps {
  open: boolean;
  blockedTarget?: string | null;
  blockedSource?: string | null;
  cooldownActive?: boolean;
  cooldownFormatted?: string;
  dailyStakeNgn: number;
  onClose: () => void;
  onBankStake: () => void;
  onOpenResources: () => void;
}

export const CalmResetModal: React.FC<CalmResetModalProps> = ({
  open,
  blockedTarget,
  blockedSource,
  cooldownActive = false,
  cooldownFormatted,
  dailyStakeNgn,
  onClose,
  onBankStake,
  onOpenResources,
}) => {
  const [running, setRunning] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [banked, setBanked] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(60);
    setRunning(true);
    setBanked(false);
  }, [open, blockedTarget]);

  useEffect(() => {
    if (!open || !running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, running]);

  if (!open) return null;

  const cycleSecond = (60 - secondsLeft) % 12;
  const phase =
    secondsLeft === 0
      ? 'Reset Complete'
      : !running
        ? 'Paused'
        : cycleSecond < 4
          ? 'Inhale steadily (4s)'
          : cycleSecond < 8
            ? 'Hold calmly (4s)'
            : 'Exhale slowly (4s)';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="60-second Calm Reset"
      data-testid="calm-reset-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div className="w-full max-w-md rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--accent-ink)] uppercase">
            {blockedTarget ? (
              <ShieldAlert className="h-4 w-4 shrink-0" />
            ) : (
              <Wind className="h-4 w-4 shrink-0" />
            )}
            <span>{blockedTarget ? 'Attempt Intercepted' : '60s SOS Calm Reset'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Calm Reset"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {blockedTarget ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5">
            <BettingBrandLogo target={blockedTarget} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-[var(--ink)]">
                {blockedTarget}
              </p>
              <p className="truncate text-xs text-[var(--ink-muted)]">
                Blocked by {blockedSource || 'GambleAware Shield'}
              </p>
            </div>
          </div>
        ) : null}

        {cooldownActive && cooldownFormatted ? (
          <div className="mt-3 rounded-xl border border-[var(--block-border)] bg-[var(--block-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--block-ink)]">
            Burst rate limit triggered — Cooldown Lockout active ({cooldownFormatted} remaining).
          </div>
        ) : null}

        {/* Breathing Progress Box */}
        <div className="mt-4 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-5 text-center">
          <p className="font-mono text-4xl font-bold text-[var(--ink)] tabular-nums">
            {secondsLeft}s
          </p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--accent-ink)]">{phase}</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--subtle-border)]">
            <div
              className="h-full bg-[var(--active-fill)] transition-all duration-300"
              style={{ width: `${((60 - secondsLeft) / 60) * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (secondsLeft === 0) {
                setSecondsLeft(60);
                setRunning(true);
              } else {
                setRunning((r) => !r);
              }
            }}
            className="mt-4 h-10 cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)]"
          >
            {secondsLeft === 0 ? 'Restart 60s Reset' : running ? 'Pause Timer' : 'Resume Timer'}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            data-testid="modal-bank-stake-btn"
            onClick={() => {
              if (!banked) {
                onBankStake();
                setBanked(true);
              }
            }}
            className={`flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-xs font-semibold transition-opacity ${
              banked
                ? 'border border-[var(--safe-border)] bg-[var(--safe-bg)] text-[var(--safe-ink)]'
                : 'bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90'
            }`}
          >
            {banked ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            <span>
              {banked
                ? `Banked ${formatNaira(dailyStakeNgn)} to Savings`
                : `Bank ${formatNaira(dailyStakeNgn)} Stake Instead`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenResources();
            }}
            className="h-11 w-full cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
          >
            Open Helplines &amp; Bank-Freeze Resources
          </button>
        </div>
      </div>
    </div>
  );
};

interface UrgeJournalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (trigger: string, note: string) => void;
}

export const UrgeJournalModal: React.FC<UrgeJournalModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [trigger, setTrigger] = useState<string>(URGE_TRIGGERS[0]);
  const [note, setNote] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(trigger, note.trim());
    setNote('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log Resisted Urge"
      data-testid="urge-journal-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-[var(--ink)]">
            Log a Resisted Urge
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Urge Journal"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Recording what sparked the craving helps tighten your high-risk rate limits.
        </p>

        <div className="mt-4">
          <span className="block text-xs font-semibold text-[var(--ink)]">
            What triggered the urge?
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {URGE_TRIGGERS.map((item) => {
              const selected = trigger === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTrigger(item)}
                  className={`h-10 cursor-pointer rounded-xl border text-xs font-semibold transition-colors ${
                    selected
                      ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="urge-note-field" className="block text-xs font-semibold text-[var(--ink)]">
            Quick Note (Optional)
          </label>
          <input
            id="urge-note-field"
            type="text"
            maxLength={140}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Closed browser during halftime"
            className="mt-1.5 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          data-testid="save-urge-btn"
          className="mt-5 h-11 w-full cursor-pointer rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
        >
          Save Resisted Victory
        </button>
      </form>
    </div>
  );
};
