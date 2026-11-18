import { HighRiskScheduleConfig, HighRiskWindowStatus } from '../data/types';

export const DEFAULT_HIGH_RISK_SCHEDULE: HighRiskScheduleConfig = {
  lateNightLockout: true,
  matchdayWeekendGuard: true,
  paydaySurgeGuard: false,
};

export function evaluateHighRiskGuard(
  schedule: HighRiskScheduleConfig,
  nowMs: number = Date.now(),
): HighRiskWindowStatus {
  const date = new Date(nowMs);
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const dayOfMonth = date.getDate();

  const activeLabels: string[] = [];

  if (schedule.lateNightLockout && (hour >= 22 || hour < 5)) {
    activeLabels.push('Late-Night Guard (10PM–5AM)');
  }

  if (
    schedule.matchdayWeekendGuard &&
    (dayOfWeek === 6 || dayOfWeek === 0 || (dayOfWeek === 5 && hour >= 18))
  ) {
    activeLabels.push('Matchday Weekend Shield');
  }

  if (schedule.paydaySurgeGuard && (dayOfMonth >= 25 || dayOfMonth <= 3)) {
    activeLabels.push('Payday Surge Guard');
  }

  const isActive = activeLabels.length > 0;

  let nextWindowHint = 'Turn on a schedule below to tighten filtering during common trigger hours.';
  if (isActive) {
    nextWindowHint = 'Strict keyword and search filters are turned on right now.';
  } else if (schedule.lateNightLockout) {
    nextWindowHint = 'Late-night rules turn on at 10:00 PM tonight.';
  } else if (schedule.matchdayWeekendGuard) {
    nextWindowHint = 'Weekend match rules turn on Friday at 6:00 PM.';
  } else if (schedule.paydaySurgeGuard) {
    nextWindowHint = 'Payday rules run from the 25th through the 3rd.';
  }

  return {
    isActive,
    activeLabels,
    nextWindowHint,
  };
}
