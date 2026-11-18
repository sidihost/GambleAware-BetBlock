import assert from 'node:assert/strict';
import test from 'node:test';
import { BlockFilterConfig } from '../blocker/blocklistMatcher.ts';
import { RecoveryGoalEntity } from '../data/types.ts';
import {
  calculateGoalProgress,
  detectGamblingLoginOrSite,
  extractFirstName,
  getTimeOfDayGreeting,
  shouldRemindToCreateGoal,
} from './personalization.ts';

const DEFAULT_CONFIG: BlockFilterConfig = {
  blockSportsbooks: true,
  blockCasinos: true,
  blockPokerAndBingo: true,
  blockCryptoBetting: true,
  blockFantasyAndLottery: true,
  strictKeywordFilter: true,
  searchGuardEnabled: true,
  customBlockedDomains: new Set(),
  allowlistedDomains: new Set(),
  customBlockedPackages: new Set(),
};

test('extractFirstName prioritizes preferredName, then displayName, then email local part', () => {
  assert.equal(extractFirstName('Tunde Adeyemi', 'Someone Else', 'tunde@mail.com'), 'Tunde');
  assert.equal(extractFirstName('', 'Chinedu Okonkwo', 'chinedu@gmail.com'), 'Chinedu');
  assert.equal(extractFirstName('', 'GambleAware Member', 'amaka.bello@gmail.com'), 'Amaka');
  assert.equal(extractFirstName('', '', ''), '');
});

test('getTimeOfDayGreeting returns Good morning / afternoon / evening with user name', () => {
  const morning = getTimeOfDayGreeting('Tunde', new Date(2026, 0, 1, 9, 15));
  assert.equal(morning.headline, 'Good morning, Tunde');
  assert.equal(morning.salutation, 'Good morning');

  const afternoon = getTimeOfDayGreeting('Amaka', new Date(2026, 0, 1, 14, 0));
  assert.equal(afternoon.headline, 'Good afternoon, Amaka');

  const evening = getTimeOfDayGreeting('', new Date(2026, 0, 1, 20, 30));
  assert.equal(evening.headline, 'Good evening');
});

test('calculateGoalProgress tracks Naira savings and clean-day milestones accurately', () => {
  const savingsGoal: RecoveryGoalEntity = {
    goalId: 'goal_1',
    title: 'Save ₦100,000 for Rent',
    category: 'savings',
    targetDays: 20,
    targetAmountNgn: 100000,
    whyNote: 'Keep family secure',
    isPrimary: true,
    isCompleted: false,
    lockDurationDays: 7,
    createdAtMs: Date.now(),
  };

  const mid = calculateGoalProgress(savingsGoal, 5, 25000);
  assert.equal(mid.percent, 25);
  assert.equal(mid.isCompleted, false);
  assert.match(mid.remainingLabel, /75,000/);

  const done = calculateGoalProgress(savingsGoal, 25, 120000);
  assert.equal(done.percent, 100);
  assert.equal(done.isCompleted, true);
});

test('detectGamblingLoginOrSite flags SportyBet / Bet9ja login URLs for immediate redirect', () => {
  const res1 = detectGamblingLoginOrSite('https://www.sportybet.com/ng/login', DEFAULT_CONFIG);
  assert.equal(res1.isBlocked, true);
  assert.equal(res1.isGamblingLogin, true);

  const res2 = detectGamblingLoginOrSite('https://m.bet9ja.com/signin', DEFAULT_CONFIG);
  assert.equal(res2.isBlocked, true);
  assert.equal(res2.isGamblingLogin, true);

  const safe = detectGamblingLoginOrSite('https://www.google.com', DEFAULT_CONFIG);
  assert.equal(safe.isBlocked, false);
  assert.equal(safe.isGamblingLogin, false);
});

test('shouldRemindToCreateGoal reminds users who have zero goals unless muted', () => {
  assert.equal(
    shouldRemindToCreateGoal({
      goalsCount: 0,
      goalReminderEnabled: true,
      reminderDismissedSession: false,
    }),
    true,
  );
  assert.equal(
    shouldRemindToCreateGoal({
      goalsCount: 1,
      goalReminderEnabled: true,
      reminderDismissedSession: false,
    }),
    false,
  );
  assert.equal(
    shouldRemindToCreateGoal({
      goalsCount: 0,
      goalReminderEnabled: false,
      reminderDismissedSession: false,
    }),
    false,
  );
});
