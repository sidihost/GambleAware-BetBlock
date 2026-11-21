import { RecoveryGoalCategory, RecoveryGoalEntity } from '../data/types';

export interface CreateGoalInput {
  title: string;
  category: RecoveryGoalCategory;
  targetDays: number;
  targetAmountNgn: number;
  whyNote: string;
  lockDurationDays?: number;
}

export interface GoalValidationResult {
  valid: boolean;
  error: string | null;
  goal?: RecoveryGoalEntity;
}

export interface GoalProgressMetrics {
  progressPct: number;
  remainingDays: number;
  remainingAmountNgn: number;
  isAchieved: boolean;
  subtitle: string;
}

export const GOAL_PRESETS: Array<{
  id: string;
  title: string;
  category: RecoveryGoalCategory;
  targetDays: number;
  targetAmountNgn: number;
  whyNote: string;
}> = [
  {
    id: 'preset-30d-reset',
    title: '30-Day Clean Reset',
    category: 'streak',
    targetDays: 30,
    targetAmountNgn: 150_000,
    whyNote: 'Break the daily odds-checking habit and rebuild calm focus.',
  },
  {
    id: 'preset-emergency-fund',
    title: 'Emergency Savings Vault',
    category: 'savings',
    targetDays: 60,
    targetAmountNgn: 300_000,
    whyNote: 'Redirect every avoided stake into a protected emergency fund.',
  },
  {
    id: 'preset-90d-rewire',
    title: '90-Day Habit Rewire',
    category: 'milestone',
    targetDays: 90,
    targetAmountNgn: 450_000,
    whyNote: 'Stay completely betting-free through matchdays and paydays.',
  },
];

export function createValidatedGoal(
  input: CreateGoalInput,
  existingGoals: RecoveryGoalEntity[],
  nowMs: number = Date.now(),
): GoalValidationResult {
  const cleanTitle = input.title.trim();
  if (cleanTitle.length < 2) {
    return { valid: false, error: 'Enter a clear goal title (at least 2 characters).' };
  }

  const safeDays = Math.round(Number(input.targetDays));
  if (!Number.isFinite(safeDays) || safeDays < 1 || safeDays > 1825) {
    return { valid: false, error: 'Target days must be between 1 and 1,825 days.' };
  }

  const safeAmount = Math.round(Number(input.targetAmountNgn));
  if (!Number.isFinite(safeAmount) || safeAmount < 0 || safeAmount > 100_000_000) {
    return { valid: false, error: 'Target savings amount must be a valid non-negative number.' };
  }

  if (input.category === 'savings' && safeAmount < 1000) {
    return { valid: false, error: 'Savings goals require a target of at least ₦1,000.' };
  }

  const goal: RecoveryGoalEntity = {
    goalId: `goal_${nowMs}_${Math.random().toString(36).slice(2, 7)}`,
    title: cleanTitle.slice(0, 64),
    category: input.category,
    targetDays: safeDays,
    targetAmountNgn: safeAmount,
    whyNote: input.whyNote.trim().slice(0, 180),
    isPrimary: existingGoals.length === 0,
    isCompleted: false,
    lockDurationDays: Math.max(0, Math.round(input.lockDurationDays ?? 0)),
    createdAtMs: nowMs,
  };

  return { valid: true, error: null, goal };
}

export function computeGoalProgress(
  goal: RecoveryGoalEntity,
  cleanExactDays: number,
  estimatedSavedNgn: number,
): GoalProgressMetrics {
  const safeDays = Math.max(0, cleanExactDays);
  const safeSaved = Math.max(0, estimatedSavedNgn);

  const dayRatio = goal.targetDays > 0 ? safeDays / goal.targetDays : 1;
  const amountRatio = goal.targetAmountNgn > 0 ? safeSaved / goal.targetAmountNgn : dayRatio;

  const rawRatio = goal.category === 'savings' && goal.targetAmountNgn > 0 ? amountRatio : dayRatio;
  const clampedPct = goal.isCompleted ? 100 : Math.min(100, Math.max(0, Math.round(rawRatio * 100)));

  const remainingDays = Math.max(0, Math.ceil(goal.targetDays - safeDays));
  const remainingAmountNgn = Math.max(0, Math.round(goal.targetAmountNgn - safeSaved));
  const isAchieved = goal.isCompleted || clampedPct >= 100;

  const subtitle = isAchieved
    ? 'Goal target reached'
    : goal.category === 'savings' && goal.targetAmountNgn > 0
      ? `₦${remainingAmountNgn.toLocaleString('en-NG')} remaining to target`
      : `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`;

  return {
    progressPct: clampedPct,
    remainingDays,
    remainingAmountNgn,
    isAchieved,
    subtitle,
  };
}

export function setPrimaryGoal(
  goals: RecoveryGoalEntity[],
  goalId: string,
): RecoveryGoalEntity[] {
  return goals.map((g) => ({
    ...g,
    isPrimary: g.goalId === goalId,
  }));
}

export function toggleGoalCompleted(
  goals: RecoveryGoalEntity[],
  goalId: string,
): RecoveryGoalEntity[] {
  return goals.map((g) =>
    g.goalId === goalId ? { ...g, isCompleted: !g.isCompleted } : g,
  );
}

export function removeGoalById(
  goals: RecoveryGoalEntity[],
  goalId: string,
): RecoveryGoalEntity[] {
  const remaining = goals.filter((g) => g.goalId !== goalId);
  if (remaining.length > 0 && !remaining.some((g) => g.isPrimary)) {
    remaining[0] = { ...remaining[0], isPrimary: true };
  }
  return remaining;
}
