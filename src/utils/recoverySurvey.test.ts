import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SURVEY_ANSWERS,
  evaluateRecoverySurvey,
} from './recoverySurvey.ts';

test('evaluateRecoverySurvey classifies low-risk preventative profile cleanly', () => {
  const result = evaluateRecoverySurvey({
    primaryFormat: 'Poker / Virtuals / Fantasy',
    triggers: ['Boredom or Stress'],
    spendBand: 'Under ₦2,500 / day',
    relapseFrequency: 'First time quitting',
    peakWindow: 'Mornings & Work Hours',
    supportReadiness: 'Just want strong blocking',
  });

  assert.equal(result.riskTier, 'MODERATE');
  assert.ok(result.riskScore >= 30 && result.riskScore <= 60);
  assert.equal(result.recommendedDailySpendNgn, 2000);
  assert.ok(result.recommendations.length >= 3);
});

test('evaluateRecoverySurvey escalates critical relapse profile to 365-day lock and support guidance', () => {
  const result = evaluateRecoverySurvey({
    primaryFormat: 'Multiple Platforms',
    triggers: [
      'Matchday & Live Games',
      'Chasing Past Losses',
      'Late-Night Isolation',
      'Payday / Spare Balance',
    ],
    spendBand: 'Above ₦30,000 / day',
    relapseFrequency: 'Daily urges / unable to stop alone',
    peakWindow: 'Late Night (10 PM – 5 AM)',
    supportReadiness: 'Need immediate relapse / crisis help',
  });

  assert.equal(result.riskTier, 'CRITICAL');
  assert.ok(result.riskScore >= 85);
  assert.equal(result.recommendedLockDays, 365);
  assert.equal(result.recommendedDailySpendNgn, 35000);
  assert.equal(result.recommendedHighRiskSchedule.lateNightLockout, true);
  assert.equal(result.recommendedHighRiskSchedule.paydaySurgeGuard, true);
  assert.ok(
    result.recommendations.some((item) => item.actionTarget === 'support'),
    'Expected support action recommendation for critical profile',
  );
});

test('DEFAULT_SURVEY_ANSWERS evaluates cleanly with valid bounds', () => {
  const res = evaluateRecoverySurvey(DEFAULT_SURVEY_ANSWERS);
  assert.ok(res.summary.length > 20 && res.summary.length <= 500);
  assert.ok(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(res.riskTier));
});
