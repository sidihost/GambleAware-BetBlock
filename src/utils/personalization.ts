import { BlockFilterConfig, BlocklistMatcher, BlockMatchResult } from '../blocker/blocklistMatcher';
import { GamblingCategory } from '../blocker/gamblingCategory';
import { RecoveryGoalEntity } from '../data/types';

export interface LoginAttemptDetection {
  isGamblingLogin: boolean;
  isBlocked: boolean;
  match: BlockMatchResult;
  normalizedHost: string;
}

export interface GoalProgressSummary {
  percent: number;
  remainingLabel: string;
  isCompleted: boolean;
  daysDone: number;
  amountSavedNgn: number;
}

const LOGIN_PATH_OR_QUERY_KEYWORDS = [
  '/login',
  '/signin',
  '/sign-in',
  '/auth',
  '/account',
  '/register',
  '/signup',
  '/deposit',
  '/cashier',
  'login',
  'signin',
  'sign in',
];

export function extractFirstName(
  preferredName?: string | null,
  displayName?: string | null,
  email?: string | null,
): string {
  const pref = preferredName?.trim();
  if (pref) {
    return pref.split(/\s+/)[0].slice(0, 30);
  }
  const disp = displayName?.trim();
  if (disp && disp !== 'GambleAware Member') {
    return disp.split(/\s+/)[0].slice(0, 30);
  }
  const mail = email?.trim();
  if (mail && mail.includes('@')) {
    const localPart = mail.split('@')[0].replace(/[._-]+/g, ' ').trim();
    if (localPart) {
      const token = localPart.split(/\s+/)[0];
      return token.charAt(0).toUpperCase() + token.slice(1, 28);
    }
  }
  return '';
}

export function getTimeOfDayGreeting(firstName?: string | null, date: Date = new Date()): {
  headline: string;
  salutation: string;
  subline: string;
} {
  const hour = date.getHours();
  const salutation =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const cleanName = firstName?.trim();
  const headline = cleanName ? `${salutation}, ${cleanName}` : `${salutation}`;
  const subline =
    hour < 12
      ? 'Your blocker and goals are active for the day.'
      : hour < 17
        ? 'Every betting-free day keeps money where it belongs.'
        : 'Evening protection is active. Step back for a minute if an urge shows up.';
  return { headline, salutation, subline };
}

export function calculateGoalProgress(
  goal: RecoveryGoalEntity,
  cleanExactDays: number,
  estimatedSavedAmount: number,
): GoalProgressSummary {
  const safeCleanDays = Math.max(0, cleanExactDays);
  const safeSaved = Math.max(0, estimatedSavedAmount);

  if (goal.category === 'savings' && goal.targetAmountNgn > 0) {
    const ratio = Math.min(1, safeSaved / goal.targetAmountNgn);
    const percent = Math.round(ratio * 100);
    const remainingNgn = Math.max(0, Math.round(goal.targetAmountNgn - safeSaved));
    const isCompleted = goal.isCompleted || ratio >= 1;
    return {
      percent: isCompleted ? 100 : percent,
      remainingLabel: isCompleted
        ? 'Goal reached!'
        : `₦${remainingNgn.toLocaleString('en-NG')} left to save`,
      isCompleted,
      daysDone: Math.floor(safeCleanDays),
      amountSavedNgn: Math.round(safeSaved),
    };
  }

  const targetDays = Math.max(1, goal.targetDays);
  const ratio = Math.min(1, safeCleanDays / targetDays);
  const percent = Math.round(ratio * 100);
  const remainingDays = Math.max(0, Math.ceil(targetDays - safeCleanDays));
  const isCompleted = goal.isCompleted || ratio >= 1;
  return {
    percent: isCompleted ? 100 : percent,
    remainingLabel: isCompleted
      ? 'Milestone complete!'
      : `${remainingDays} clean day${remainingDays === 1 ? '' : 's'} remaining`,
    isCompleted,
    daysDone: Math.floor(safeCleanDays),
    amountSavedNgn: Math.round(safeSaved),
  };
}

export function detectGamblingLoginOrSite(
  rawInput: string,
  config: BlockFilterConfig,
): LoginAttemptDetection {
  const trimmed = rawInput.trim();
  const lower = trimmed.toLowerCase();
  const match = BlocklistMatcher.matchBrowserAddressText(trimmed, config);
  const normalizedHost = BlocklistMatcher.normalizeDomain(trimmed);
  const hasLoginCue = LOGIN_PATH_OR_QUERY_KEYWORDS.some((kw) => lower.includes(kw));
  const typedMatch = match.isBlocked
    ? match
    : BlocklistMatcher.matchDomainOrUrl(trimmed, config);
  const directMatch = typedMatch.isBlocked
    ? typedMatch
    : BlocklistMatcher.matchTypedBrowserInput(trimmed, config);

  return {
    isGamblingLogin: directMatch.isBlocked && hasLoginCue,
    isBlocked: directMatch.isBlocked,
    match: directMatch.isBlocked
      ? directMatch
      : {
          isBlocked: false,
          matchedTarget: normalizedHost || trimmed,
          category: GamblingCategory.CUSTOM,
          reason: '',
        },
    normalizedHost,
  };
}

export function shouldRemindToCreateGoal(params: {
  goalsCount: number;
  goalReminderEnabled: boolean;
  reminderDismissedSession: boolean;
}): boolean {
  if (!params.goalReminderEnabled) return false;
  if (params.reminderDismissedSession) return false;
  return params.goalsCount === 0;
}
