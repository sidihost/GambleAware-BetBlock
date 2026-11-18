import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateMlRecoveryRisk } from './mlRiskModel';
import { evaluateRecoverySurvey } from './recoverySurvey';

const BASE_NOW = Date.UTC(2026, 10, 18, 14, 0, 0); // 14:00 afternoon

test('calibrates higher relapse risk during attempt bursts and recent relapse than calm streak', () => {
  const calm = evaluateMlRecoveryRisk({
    blockedEvents: [],
    urgeLogs: [
      { id: 1, triggerTag: 'Matchday / Live Odds', note: 'Walked away', timestamp: BASE_NOW - 3_600_000 },
      { id: 2, triggerTag: 'Stress or Boredom', note: 'Breathed 60s', timestamp: BASE_NOW - 86_400_000 },
    ],
    relapseLogs: [],
    latestSurvey: null,
    cleanExactDays: 45,
    highRiskSchedule: { lateNightLockout: true, matchdayWeekendGuard: true, paydaySurgeGuard: true },
    isTimeLockedNow: true,
    depositGuardEnabled: true,
    strictKeywordFilter: true,
    bankedUrgeCount: 4,
    nowMs: BASE_NOW,
  });

  const highRisk = evaluateMlRecoveryRisk({
    blockedEvents: Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      target: 'sportybet.com/cashier',
      source: 'Web Shield',
      categoryName: 'Sportsbook',
      timestamp: BASE_NOW - i * 60_000,
    })),
    urgeLogs: [],
    relapseLogs: [{ id: 9, trigger: 'Chasing losses', note: '', timestamp: BASE_NOW - 86_400_000 }],
    latestSurvey: null,
    cleanExactDays: 1,
    highRiskSchedule: { lateNightLockout: false, matchdayWeekendGuard: false, paydaySurgeGuard: false },
    isTimeLockedNow: false,
    depositGuardEnabled: false,
    strictKeywordFilter: false,
    bankedUrgeCount: 0,
    nowMs: BASE_NOW,
  });

  assert.equal(calm.riskRegime, 'LOW');
  assert.ok(calm.relapseProbabilityPct < 25, `Expected calm risk <25, got ${calm.relapseProbabilityPct}`);
  assert.ok(
    highRisk.relapseProbabilityPct >= 72,
    `Expected high risk >=72, got ${highRisk.relapseProbabilityPct}`,
  );
  assert.equal(highRisk.riskRegime, 'CRITICAL');
  assert.equal(highRisk.needsHardening, true);
});

test('recovery survey calibration boosts model confidence and adjusts peak window prediction', () => {
  const survey = evaluateRecoverySurvey({
    primaryFormat: 'Crash / Aviator / Crypto',
    triggers: ['Late-Night Isolation', 'Chasing Past Losses', 'Payday / Spare Balance'],
    spendBand: 'Above ₦30,000 / day',
    relapseFrequency: 'Weekly slips',
    peakWindow: 'Late Night (10 PM – 5 AM)',
    supportReadiness: 'Want blockers + financial freeze',
  });

  const uncalibrated = evaluateMlRecoveryRisk({
    blockedEvents: [],
    urgeLogs: [],
    relapseLogs: [],
    latestSurvey: null,
    cleanExactDays: 2,
    highRiskSchedule: { lateNightLockout: false, matchdayWeekendGuard: false, paydaySurgeGuard: false },
    isTimeLockedNow: false,
    depositGuardEnabled: true,
    strictKeywordFilter: true,
    bankedUrgeCount: 0,
    nowMs: BASE_NOW,
  });

  const calibrated = evaluateMlRecoveryRisk({
    blockedEvents: [],
    urgeLogs: [],
    relapseLogs: [],
    latestSurvey: survey,
    cleanExactDays: 2,
    highRiskSchedule: { lateNightLockout: false, matchdayWeekendGuard: false, paydaySurgeGuard: false },
    isTimeLockedNow: false,
    depositGuardEnabled: true,
    strictKeywordFilter: true,
    bankedUrgeCount: 0,
    nowMs: BASE_NOW,
  });

  assert.equal(uncalibrated.isSurveyCalibrated, false);
  assert.equal(calibrated.isSurveyCalibrated, true);
  assert.ok(calibrated.confidencePct > uncalibrated.confidencePct);
  assert.ok(calibrated.relapseProbabilityPct > uncalibrated.relapseProbabilityPct);
  assert.match(calibrated.predictedPeakWindow, /10:00 PM/);
  assert.equal(calibrated.recommendedSchedule.lateNightLockout, true);
  assert.ok(calibrated.factors.length >= 2);
});

test('outputs bounded finite scores across extreme inputs', () => {
  const extreme = evaluateMlRecoveryRisk({
    blockedEvents: Array.from({ length: 120 }, (_, i) => ({
      id: i,
      target: 'bet9ja.com',
      source: 'Browser Shield',
      categoryName: 'Sportsbook',
      timestamp: BASE_NOW - i * 1000,
    })),
    urgeLogs: [],
    relapseLogs: Array.from({ length: 10 }, (_, i) => ({
      id: i,
      trigger: 'Impulse',
      note: '',
      timestamp: BASE_NOW - i * 3_600_000,
    })),
    latestSurvey: null,
    cleanExactDays: 0,
    highRiskSchedule: { lateNightLockout: false, matchdayWeekendGuard: false, paydaySurgeGuard: false },
    isTimeLockedNow: false,
    depositGuardEnabled: false,
    strictKeywordFilter: false,
    bankedUrgeCount: 0,
    nowMs: BASE_NOW,
  });

  assert.ok(extreme.relapseProbabilityPct <= 97 && extreme.relapseProbabilityPct >= 3);
  assert.ok(extreme.confidencePct <= 98 && extreme.confidencePct >= 48);
  assert.ok(extreme.factors.every((f) => Number.isFinite(f.impactPct) && f.impactPct > 0));
});
