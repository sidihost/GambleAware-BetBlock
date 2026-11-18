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

  let nextWindowHint = 'Enable any window below to heighten strict filtering automatically.';
  if (isActive) {
    nextWindowHint = 'Strict keyword & search filtering are actively enforced right now.';
  } else if (schedule.lateNightLockout) {
    nextWindowHint = 'Late-Night Guard arms automatically at 10:00 PM tonight.';
  } else if (schedule.matchdayWeekendGuard) {
    nextWindowHint = 'Matchday Shield arms automatically Friday at 6:00 PM.';
  } else if (schedule.paydaySurgeGuard) {
    nextWindowHint = 'Payday Surge Guard arms on the 25th through the 3rd.';
  }

  return {
    isActive,
    activeLabels,
    nextWindowHint,
  };
}
