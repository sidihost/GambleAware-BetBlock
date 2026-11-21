import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeNextCooldownAfterAttempt,
  DEFAULT_RATE_LIMIT_CONFIG,
  evaluateRateLimitStatus,
  formatCooldownDuration,
} from './rateLimiter';
import { BlockedEventEntity, HighRiskScheduleConfig } from '../data/types';

const QUIET_SCHEDULE: HighRiskScheduleConfig = {
  lateNightLockout: false,
  matchdayWeekendGuard: false,
  paydaySurgeGuard: false,
};

function makeEvent(id: number, timestamp: number): BlockedEventEntity {
  return {
    id,
    target: 'sportybet.com',
    source: 'Browser Shield',
    categoryName: 'Sportsbooks',
    timestamp,
  };
}

test('formatCooldownDuration formats mm:ss cleanly', () => {
  assert.equal(formatCooldownDuration(0), '00:00');
  assert.equal(formatCooldownDuration(65_000), '01:05');
  assert.equal(formatCooldownDuration(900_000), '15:00');
});

test('burst rate limit triggers cooldown when 10-minute threshold is met', () => {
  const now = new Date('2026-11-21T14:00:00Z').getTime();
  const events = [
    makeEvent(1, now - 4 * 60_000),
    makeEvent(2, now - 2 * 60_000),
    makeEvent(3, now - 10_000),
  ];

  const result = computeNextCooldownAfterAttempt(
    events,
    { ...DEFAULT_RATE_LIMIT_CONFIG, maxAttemptsPer10Min: 3, cooldownMinutes: 15 },
    QUIET_SCHEDULE,
    0,
    now,
  );

  assert.equal(result.triggered, true);
  assert.equal(result.nextCooldownUntilMs, now + 15 * 60_000);
  assert.ok(result.reason?.includes('Burst rate limit'));
});

test('events older than 10 minutes do not count toward 10-minute burst limit', () => {
  const now = new Date('2026-11-21T14:00:00Z').getTime();
  const events = [
    makeEvent(1, now - 25 * 60_000),
    makeEvent(2, now - 18 * 60_000),
    makeEvent(3, now - 60_000),
  ];

  const status = evaluateRateLimitStatus(
    events,
    { ...DEFAULT_RATE_LIMIT_CONFIG, maxAttemptsPer10Min: 3, dailyAttemptCap: 10 },
    QUIET_SCHEDULE,
    0,
    now,
  );

  assert.equal(status.attemptsLast10Min, 1);
  assert.equal(status.attemptsToday, 3);
  assert.equal(status.severity, 'CALM');
  assert.equal(status.isCooldownActive, false);
});

test('daily attempt cap triggers cooldown even if attempts are spread out', () => {
  const now = new Date('2026-11-21T18:00:00Z').getTime();
  const events = [
    makeEvent(1, now - 5 * 3_600_000),
    makeEvent(2, now - 4 * 3_600_000),
    makeEvent(3, now - 3 * 3_600_000),
    makeEvent(4, now - 2 * 3_600_000),
    makeEvent(5, now - 1_000),
  ];

  const result = computeNextCooldownAfterAttempt(
    events,
    { ...DEFAULT_RATE_LIMIT_CONFIG, maxAttemptsPer10Min: 5, dailyAttemptCap: 5, cooldownMinutes: 30 },
    QUIET_SCHEDULE,
    0,
    now,
  );

  assert.equal(result.triggered, true);
  assert.equal(result.nextCooldownUntilMs, now + 30 * 60_000);
  assert.ok(result.reason?.includes('Daily attempt cap'));
});

test('active cooldown expires once current time passes cooldownUntilMs', () => {
  const now = new Date('2026-11-21T14:00:00Z').getTime();
  const active = evaluateRateLimitStatus(
    [],
    DEFAULT_RATE_LIMIT_CONFIG,
    QUIET_SCHEDULE,
    now + 120_000,
    now,
  );
  assert.equal(active.isCooldownActive, true);
  assert.equal(active.severity, 'COOLDOWN_ACTIVE');
  assert.equal(active.cooldownFormatted, '02:00');

  const expired = evaluateRateLimitStatus(
    [],
    DEFAULT_RATE_LIMIT_CONFIG,
    QUIET_SCHEDULE,
    now - 1_000,
    now,
  );
  assert.equal(expired.isCooldownActive, false);
  assert.equal(expired.severity, 'CALM');
});
