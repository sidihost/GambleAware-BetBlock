import { BlockMatchResult } from '../blocker/blocklistMatcher';
import { GamblingCategory } from '../blocker/gamblingCategory';

export enum ThemeMode {
  SYSTEM = 'SYSTEM',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  [ThemeMode.SYSTEM]: 'System',
  [ThemeMode.LIGHT]: 'White',
  [ThemeMode.DARK]: 'Black & Pink',
};

export type RecoveryGoalCategory = 'savings' | 'streak' | 'milestone';

export interface RecoveryGoalEntity {
  goalId: string;
  title: string;
  category: RecoveryGoalCategory;
  targetDays: number;
  targetAmountNgn: number;
  whyNote: string;
  isPrimary: boolean;
  isCompleted: boolean;
  lockDurationDays: number;
  createdAtMs: number;
}

export interface HighRiskScheduleConfig {
  lateNightLockout: boolean;
  matchdayWeekendGuard: boolean;
  paydaySurgeGuard: boolean;
}

export interface HighRiskWindowStatus {
  isActive: boolean;
  activeLabels: string[];
  nextWindowHint: string;
}

export interface DurableStorageStatus {
  localSaved: boolean;
  indexedDbSaved: boolean;
  cacheVaultSaved: boolean;
  persistentGranted: boolean | null;
  lastSavedAtMs: number;
}

export interface ProtectionSettingsState {
  isProtectionEnabled: boolean;
  blockSportsbooks: boolean;
  blockCasinos: boolean;
  blockPokerAndBingo: boolean;
  blockCryptoBetting: boolean;
  blockFantasyAndLottery: boolean;
  strictKeywordFilter: boolean;
  browserShieldEnabled: boolean;
  appShieldEnabled: boolean;
  searchGuardEnabled: boolean;
  antiTamperLockEnabled: boolean;
  lockUntilEpochMs: number;
  pinHash: string | null;
  protectionStartedAtMs: number;
  dailyBetSpendEstimate: number;
  themeMode: ThemeMode;
  hasCompletedTour: boolean;
  hasCompletedInitialSetup: boolean;
  notificationsEnabled: boolean;
  lastNotifiedMilestoneDay: number;
  goalReminderEnabled: boolean;
  highRiskSchedule: HighRiskScheduleConfig;
}

export interface BlockedDomainEntity {
  domain: string;
  isAllowlisted: boolean;
  categoryName: string;
  addedAt: number;
}

export interface BlockedEventEntity {
  id: number;
  target: string;
  source: string;
  categoryName: string;
  timestamp: number;
}

export interface BlockedAppEntity {
  packageName: string;
  appLabel: string;
  addedAt: number;
}

export interface UrgeLogEntity {
  id: number;
  triggerTag: string;
  note: string;
  timestamp: number;
}

export interface InstalledAppInfo {
  packageName: string;
  label: string;
}

export interface PrivateDnsStatus {
  isActive: boolean;
  serverHost: string | null;
}

export interface DailyBlockStat {
  dayLabel: string;
  count: number;
}

export interface CategoryBreakdown {
  category: GamblingCategory;
  count: number;
}

export interface TriggerBreakdown {
  triggerTag: string;
  count: number;
}

export interface RecoveryMilestone {
  days: number;
  label: string;
  title: string;
}

export const RECOVERY_MILESTONES: RecoveryMilestone[] = [
  { days: 1, label: '1d', title: 'First 24h' },
  { days: 3, label: '3d', title: 'Urge Peak' },
  { days: 7, label: '7d', title: 'One Week' },
  { days: 14, label: '14d', title: 'Two Weeks' },
  { days: 30, label: '30d', title: 'One Month' },
  { days: 90, label: '90d', title: 'Rewired' },
  { days: 180, label: '180d', title: 'Half Year' },
  { days: 365, label: '365d', title: 'One Year' },
];

export type AnchorRoute = 'shield' | 'blocklist' | 'activity' | 'lock' | 'download';

export interface InterventionPayload {
  target: string;
  source: string;
  category: string;
  isAntiTamper: boolean;
  autoStartBreathing: boolean;
  isLoginRedirect?: boolean;
}

export interface DerivedMainState {
  settings: ProtectionSettingsState;
  preferredName: string;
  firstName: string;
  isAccessibilityEnabled: boolean;
  isDeviceAdminEnabled: boolean;
  privateDnsStatus: PrivateDnsStatus;
  goals: RecoveryGoalEntity[];
  primaryGoal: RecoveryGoalEntity | null;
  customBlockedDomains: BlockedDomainEntity[];
  allowlistedDomains: BlockedDomainEntity[];
  customBlockedApps: BlockedAppEntity[];
  recentEvents: BlockedEventEntity[];
  recentUrgeLogs: UrgeLogEntity[];
  totalBlockedCount: number;
  todayBlockedCount: number;
  totalUrgeResistedCount: number;
  sevenDayStats: DailyBlockStat[];
  categoryBreakdown: CategoryBreakdown[];
  triggerBreakdown: TriggerBreakdown[];
  domainLookupQuery: string;
  domainLookupResult: BlockMatchResult | null;
  statusBannerMessage: string | null;
  builtInDomainCount: number;
  currentTimeMs: number;
  isFullyArmed: boolean;
  isTimeLockedNow: boolean;
  isAnyLockActive: boolean;
  hasPin: boolean;
  remainingLockMsNow: number;
  lockCountdownFormatted: string;
  lockClockQuad: Array<{ digits: string; unit: string }>;
  cleanElapsedMs: number;
  cleanExactDays: number;
  cleanDays: number;
  cleanHoursRemainder: number;
  cleanMinutesRemainder: number;
  cleanSecondsRemainder: number;
  nextMilestone: RecoveryMilestone;
  milestoneProgressFraction: number;
  estimatedSavedAmount: number;
  highRiskStatus: HighRiskWindowStatus;
  durableStatus: DurableStorageStatus;
}
