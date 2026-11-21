import { BlockedEventEntity, HighRiskScheduleConfig } from '../data/types';
import { evaluateHighRiskGuard } from './highRiskGuard';

export interface RateLimitConfig {
  enabled: boolean;
  maxAttemptsPer10Min: number;
  dailyAttemptCap: number;
  cooldownMinutes: number;
  pinMaxRetries: number;
  pinLockoutSeconds: number;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: true,
  maxAttemptsPer10Min: 3,
  dailyAttemptCap: 10,
  cooldownMinutes: 15,
  pinMaxRetries: 5,
  pinLockoutSeconds: 60,
};

export const BURST_LIMIT_PRESETS = [2, 3, 5] as const;
export const DAILY_CAP_PRESETS = [5, 10, 20] as const;
export const COOLDOWN_MINUTE_PRESETS = [5, 15, 30, 60] as const;

export type RateLimitSeverity = 'CALM' | 'WARNING' | 'COOLDOWN_ACTIVE';

export interface RateLimitStatus {
  enabled: boolean;
  severity: RateLimitSeverity;
  attemptsLast10Min: number;
  effectiveBurstLimit: number;
  attemptsToday: number;
  dailyCap: number;
  burstUtilizationPct: number;
  dailyUtilizationPct: number;
  isCooldownActive: boolean;
  cooldownRemainingMs: number;
  cooldownFormatted: string;
  isHighRiskTightened: boolean;
  activeRiskWindows: string[];
  summary: string;
}

export function formatCooldownDuration(remainingMs: number): string {
  const safeSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function evaluateRateLimitStatus(
  events: BlockedEventEntity[],
  config: RateLimitConfig,
  highRiskSchedule: HighRiskScheduleConfig,
  cooldownUntilMs: number,
  nowMs: number = Date.now(),
): RateLimitStatus {
  const tenMinAgo = nowMs - 10 * 60_000;
  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  let attemptsLast10Min = 0;
  let attemptsToday = 0;

  for (const ev of events) {
    if (ev.timestamp >= startOfTodayMs) {
      attemptsToday += 1;
    }
    if (ev.timestamp >= tenMinAgo) {
      attemptsLast10Min += 1;
    }
  }

  const highRisk = evaluateHighRiskGuard(highRiskSchedule, nowMs);
  const baseBurst = Math.max(1, config.maxAttemptsPer10Min);
  // During active high-risk windows (Late Night / Matchday / Payday), tighten burst limit by 1 (min 2)
  const effectiveBurstLimit =
    config.enabled && highRisk.isActive && baseBurst > 2 ? baseBurst - 1 : baseBurst;
  const dailyCap = Math.max(1, config.dailyAttemptCap);

  const cooldownRemainingMs = config.enabled ? Math.max(0, cooldownUntilMs - nowMs) : 0;
  const isCooldownActive = cooldownRemainingMs > 0;

  const burstUtilizationPct = Math.min(100, Math.round((attemptsLast10Min / effectiveBurstLimit) * 100));
  const dailyUtilizationPct = Math.min(100, Math.round((attemptsToday / dailyCap) * 100));

  let severity: RateLimitSeverity = 'CALM';
  let summary = 'Rate limiter armed — zero burst attempts in the last 10 minutes.';

  if (!config.enabled) {
    severity = 'CALM';
    summary = 'Rate limiting paused. Turn on to enforce automatic burst cooldowns.';
  } else if (isCooldownActive) {
    severity = 'COOLDOWN_ACTIVE';
    summary = `Cooldown active for ${formatCooldownDuration(cooldownRemainingMs)} — rapid attempts locked out to stop tilt chasing.`;
  } else if (attemptsLast10Min >= effectiveBurstLimit || attemptsToday >= dailyCap) {
    severity = 'COOLDOWN_ACTIVE';
    summary = `Threshold reached (${attemptsLast10Min}/${effectiveBurstLimit} in 10m). Triggering ${config.cooldownMinutes}m cooldown.`;
  } else if (attemptsLast10Min >= effectiveBurstLimit - 1 || attemptsToday >= Math.ceil(dailyCap * 0.75)) {
    severity = 'WARNING';
    summary = `Approaching limit (${attemptsLast10Min}/${effectiveBurstLimit} in 10m · ${attemptsToday}/${dailyCap} today).`;
  } else if (highRisk.isActive) {
    summary = `High-risk schedule active (${highRisk.activeLabels[0]}): burst limit tightened to ${effectiveBurstLimit} per 10m.`;
  }

  return {
    enabled: config.enabled,
    severity,
    attemptsLast10Min,
    effectiveBurstLimit,
    attemptsToday,
    dailyCap,
    burstUtilizationPct,
    dailyUtilizationPct,
    isCooldownActive,
    cooldownRemainingMs,
    cooldownFormatted: formatCooldownDuration(cooldownRemainingMs),
    isHighRiskTightened: config.enabled && highRisk.isActive && effectiveBurstLimit < baseBurst,
    activeRiskWindows: highRisk.activeLabels,
    summary,
  };
}

/**
 * Computes the next cooldown expiry timestamp after a newly blocked attempt.
 * If the attempt pushes 10-minute bursts or daily attempts to/above their threshold,
 * extends the cooldown by `config.cooldownMinutes`.
 */
export function computeNextCooldownAfterAttempt(
  eventsIncludingNew: BlockedEventEntity[],
  config: RateLimitConfig,
  highRiskSchedule: HighRiskScheduleConfig,
  currentCooldownUntilMs: number,
  nowMs: number = Date.now(),
): {
  triggered: boolean;
  nextCooldownUntilMs: number;
  reason: string | null;
} {
  if (!config.enabled) {
    return { triggered: false, nextCooldownUntilMs: currentCooldownUntilMs, reason: null };
  }

  const status = evaluateRateLimitStatus(
    eventsIncludingNew,
    config,
    highRiskSchedule,
    currentCooldownUntilMs,
    nowMs,
  );

  const hitBurst = status.attemptsLast10Min >= status.effectiveBurstLimit;
  const hitDaily = status.attemptsToday >= status.dailyCap;

  if (!hitBurst && !hitDaily) {
    return { triggered: false, nextCooldownUntilMs: currentCooldownUntilMs, reason: null };
  }

  const durationMs = Math.max(1, config.cooldownMinutes) * 60_000;
  const nextCooldownUntilMs = Math.max(currentCooldownUntilMs, nowMs + durationMs);
  const reason = hitBurst
    ? `Burst rate limit reached (${status.attemptsLast10Min}/${status.effectiveBurstLimit} attempts in 10 min) — ${config.cooldownMinutes}m cooldown armed.`
    : `Daily attempt cap reached (${status.attemptsToday}/${status.dailyCap} today) — ${config.cooldownMinutes}m cooldown armed.`;

  return {
    triggered: true,
    nextCooldownUntilMs,
    reason,
  };
}
