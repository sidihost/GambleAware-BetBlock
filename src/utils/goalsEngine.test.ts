import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeGoalProgress,
  createValidatedGoal,
  removeGoalById,
  setPrimaryGoal,
  toggleGoalCompleted,
} from './goalsEngine';

test('createValidatedGoal rejects empty title and invalid savings amounts', () => {
  const blank = createValidatedGoal(
    { title: ' ', category: 'streak', targetDays: 30, targetAmountNgn: 0, whyNote: '' },
    [],
  );
  assert.equal(blank.valid, false);
  assert.ok(blank.error);

  const lowSavings = createValidatedGoal(
    { title: 'Rent Vault', category: 'savings', targetDays: 30, targetAmountNgn: 500, whyNote: '' },
    [],
  );
  assert.equal(lowSavings.valid, false);
});

test('createValidatedGoal marks first goal primary and computes progress accurately', () => {
  const created = createValidatedGoal(
    {
      title: 'Emergency Fund',
      category: 'savings',
      targetDays: 30,
      targetAmountNgn: 100_000,
      whyNote: 'Protect my paycheck',
    },
    [],
    1_700_000_000_000,
  );
  assert.equal(created.valid, true);
  assert.ok(created.goal);
  assert.equal(created.goal.isPrimary, true);

  const progress = computeGoalProgress(created.goal, 10, 50_000);
  assert.equal(progress.progressPct, 50);
  assert.equal(progress.remainingAmountNgn, 50_000);
  assert.equal(progress.isAchieved, false);
});

test('setPrimaryGoal, toggleGoalCompleted, and removeGoalById maintain a single primary goal', () => {
  const g1 = createValidatedGoal(
    { title: 'Goal One', category: 'streak', targetDays: 14, targetAmountNgn: 70_000, whyNote: '' },
    [],
    1000,
  ).goal!;
  const g2 = createValidatedGoal(
    { title: 'Goal Two', category: 'streak', targetDays: 30, targetAmountNgn: 150_000, whyNote: '' },
    [g1],
    2000,
  ).goal!;

  const switched = setPrimaryGoal([g1, g2], g2.goalId);
  assert.equal(switched[0].isPrimary, false);
  assert.equal(switched[1].isPrimary, true);

  const completed = toggleGoalCompleted(switched, g2.goalId);
  assert.equal(completed[1].isCompleted, true);
  assert.equal(computeGoalProgress(completed[1], 1, 0).progressPct, 100);

  const afterRemove = removeGoalById(completed, g2.goalId);
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0].goalId, g1.goalId);
  assert.equal(afterRemove[0].isPrimary, true);
});
