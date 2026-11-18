import React, { useState } from 'react';
import {
  CheckCircle2,
  Compass,
  LockKeyhole,
  Plus,
  Star,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { RecoveryGoalCategory, RecoveryGoalEntity } from '../data/types';
import { formatNaira } from '../utils/currency';
import { calculateGoalProgress } from '../utils/personalization';
import { LiquidGlassCard, LiquidSectionHeader } from './LiquidGlass';

interface GoalModalProps {
  initialTitle?: string;
  initialCategory?: RecoveryGoalCategory;
  initialDays?: number;
  initialAmountNgn?: number;
  initialWhy?: string;
  onSave: (input: {
    title: string;
    category: RecoveryGoalCategory;
    targetDays: number;
    targetAmountNgn: number;
    whyNote: string;
    lockDurationDays: number;
  }) => void;
  onClose: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  initialTitle = '',
  initialCategory = 'savings',
  initialDays,
  initialAmountNgn,
  initialWhy = '',
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState<RecoveryGoalCategory>(initialCategory);
  const [targetDays, setTargetDays] = useState(initialDays ? String(initialDays) : '');
  const [targetAmountNgn, setTargetAmountNgn] = useState(
    initialAmountNgn !== undefined && initialAmountNgn > 0 ? String(initialAmountNgn) : '',
  );
  const [whyNote, setWhyNote] = useState(initialWhy);
  const [lockDurationDays, setLockDurationDays] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDays = Math.max(1, Math.min(3650, parseInt(targetDays, 10) || 1));
    const parsedAmount = Math.max(0, Math.min(100_000_000, parseInt(targetAmountNgn, 10) || 0));
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      category,
      targetDays: parsedDays,
      targetAmountNgn: parsedAmount,
      whyNote: whyNote.trim(),
      lockDurationDays,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create Personalized Recovery Goal"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[90dvh] w-full max-w-[460px] overflow-y-auto rounded-t-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4 text-[var(--ink)] sm:rounded-2xl sm:p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
              <Target className="h-4 w-4" />
            </div>
            <h2 className="font-display text-base font-bold">New Goal</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close goal modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
          Pick something concrete you want your saved money or clean days to go toward. It will
          appear whenever a betting site is blocked.
        </p>

        {/* 1-Tap Quick Templates */}
        <div className="mt-3.5">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
            Quick Templates
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              {
                label: '30d · Save ₦150k',
                title: '30 Days Betting-Free Savings',
                cat: 'savings' as RecoveryGoalCategory,
                days: '30',
                amount: '150000',
                why: 'Keep my hard-earned money for rent and family.',
              },
              {
                label: '7d · Weekend Shield',
                title: 'Matchday Weekend Clean Streak',
                cat: 'streak' as RecoveryGoalCategory,
                days: '7',
                amount: '35000',
                why: 'No football slip regrets this week.',
              },
              {
                label: '90d · Full Reset',
                title: '90-Day Debt & Habit Reset',
                cat: 'milestone' as RecoveryGoalCategory,
                days: '90',
                amount: '450000',
                why: 'Rebuild peace of mind and trust.',
              },
            ].map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => {
                  setTitle(tpl.title);
                  setCategory(tpl.cat);
                  setTargetDays(tpl.days);
                  setTargetAmountNgn(tpl.amount);
                  setWhyNote(tpl.why);
                }}
                className="cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--active-fill)]"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          <div>
            <label htmlFor="goal-title" className="mb-1 block text-xs font-semibold text-[var(--ink)]">
              Goal Title
            </label>
            <input
              id="goal-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you saving or staying clean for?"
              className="h-10 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['savings', 'streak', 'milestone'] as RecoveryGoalCategory[]).map((cat) => {
              const selected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`h-9 cursor-pointer rounded-xl border text-xs font-semibold capitalize transition-colors ${
                    selected
                      ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label
                htmlFor="goal-days"
                className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              >
                Target Clean Days
              </label>
              <input
                id="goal-days"
                type="number"
                required
                min={1}
                max={3650}
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                placeholder="Number of days"
                className="h-10 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--canvas)] px-3 font-mono text-sm text-[var(--ink)] placeholder:font-sans placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="goal-amount"
                className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              >
                Target Savings (₦)
              </label>
              <input
                id="goal-amount"
                type="number"
                min={0}
                max={100000000}
                step={500}
                value={targetAmountNgn}
                onChange={(e) => setTargetAmountNgn(e.target.value)}
                placeholder="Optional Naira amount"
                className="h-10 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--canvas)] px-3 font-mono text-sm text-[var(--ink)] placeholder:font-sans placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="goal-why" className="mb-1 block text-xs font-semibold text-[var(--ink)]">
              Personal &ldquo;Why&rdquo; (shown when a site is blocked)
            </label>
            <input
              id="goal-why"
              type="text"
              maxLength={280}
              value={whyNote}
              onChange={(e) => setWhyNote(e.target.value)}
              placeholder="Write a personal reminder to stay betting-free"
              className="h-10 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
              <LockKeyhole className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
              <span>Optional: Pair with Commitment Lock</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[0, 7, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setLockDurationDays(d)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${
                    lockDurationDays === d
                      ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink-muted)]'
                  }`}
                >
                  {d === 0 ? 'No Lock' : `${d}-Day Lock`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 h-10 w-full cursor-pointer rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:text-sm"
        >
          Save Personalized Goal
        </button>
      </form>
    </div>
  );
};

export const GoalReminderBanner: React.FC<{
  firstName: string;
  onCreateGoal: () => void;
  onOpenTemplates: () => void;
  onDismiss: () => void;
}> = ({ firstName, onCreateGoal, onOpenTemplates, onDismiss }) => (
  <LiquidGlassCard className="p-3 sm:px-4 sm:py-3">
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
          <Target className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-display text-xs font-bold text-[var(--ink)] sm:text-sm">
              {firstName
                ? `${firstName}, add a savings or clean-day goal`
                : 'Add a savings or clean-day goal'}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss goal reminder"
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] sm:hidden"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="truncate text-[11px] text-[var(--ink-muted)]">
            Give yourself a clear target for what your saved money goes toward.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onCreateGoal}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full bg-[var(--active-fill)] px-3 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Goal</span>
        </button>
        <button
          type="button"
          onClick={onOpenTemplates}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
        >
          <Compass className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
          <span>Presets</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss goal reminder"
          className="hidden h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] sm:flex"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </LiquidGlassCard>
);

export const ActiveGoalsCard: React.FC<{
  goals: RecoveryGoalEntity[];
  cleanExactDays: number;
  estimatedSavedAmount: number;
  onAddGoal: () => void;
  onSetPrimary: (goalId: string) => void;
  onToggleComplete: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
}> = ({
  goals,
  cleanExactDays,
  estimatedSavedAmount,
  onAddGoal,
  onSetPrimary,
  onToggleComplete,
  onDeleteGoal,
}) => {
  if (goals.length === 0) return null;

  return (
    <LiquidGlassCard className="p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-2.5">
        <LiquidSectionHeader
          title="Goals"
          subtitle="Updated automatically from your clean days and estimated savings"
        />
        <button
          type="button"
          onClick={onAddGoal}
          className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-[var(--active-fill)] px-3 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {goals.map((goal) => {
          const progress = calculateGoalProgress(goal, cleanExactDays, estimatedSavedAmount);
          return (
            <div
              key={goal.goalId}
              className="rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-sm font-bold text-[var(--ink)]">
                      {goal.title}
                    </p>
                    {goal.isPrimary ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-ink)]">
                        <Star className="h-3 w-3 fill-current" />
                        <span>Primary</span>
                      </span>
                    ) : null}
                  </div>
                  {goal.whyNote ? (
                    <p className="mt-0.5 text-xs text-[var(--ink-muted)]">&ldquo;{goal.whyNote}&rdquo;</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!goal.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(goal.goalId)}
                      title="Make primary goal"
                      aria-label={`Set ${goal.title} as primary goal`}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--accent-ink)]"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onToggleComplete(goal.goalId)}
                    title="Mark completed"
                    aria-label={`Toggle completion for ${goal.title}`}
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--surface)] ${
                      progress.isCompleted ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal.goalId)}
                    title="Delete goal"
                    aria-label={`Delete ${goal.title}`}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full border border-[var(--subtle-border)] bg-[var(--surface)]">
                <div
                  className="h-full rounded-full bg-[var(--active-fill)] transition-all duration-300"
                  style={{ width: `${Math.max(4, progress.percent)}%` }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {progress.percent}% · {progress.remainingLabel}
                </span>
                <span>
                  {goal.category === 'savings' && goal.targetAmountNgn > 0
                    ? `Target: ${formatNaira(goal.targetAmountNgn)}`
                    : `Target: ${goal.targetDays} days`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </LiquidGlassCard>
  );
};
