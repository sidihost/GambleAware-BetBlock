import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateHighRiskGuard } from './highRiskGuard.ts';

test('evaluateHighRiskGuard detects late-night hours (22:00 - 05:00)', () => {
  const lateNight = new Date(2026, 4, 12, 23, 30).getTime(); // Tuesday 11:30 PM
  const res = evaluateHighRiskGuard(
    { lateNightLockout: true, matchdayWeekendGuard: false, paydaySurgeGuard: false },
    lateNight,
  );
  assert.equal(res.isActive, true);
  assert.ok(res.activeLabels.some((l) => l.includes('Late-Night')));

  const midday = new Date(2026, 4, 12, 13, 0).getTime(); // Tuesday 1:00 PM
  const resDay = evaluateHighRiskGuard(
    { lateNightLockout: true, matchdayWeekendGuard: false, paydaySurgeGuard: false },
    midday,
  );
  assert.equal(resDay.isActive, false);
});

test('evaluateHighRiskGuard detects matchday weekends and payday windows', () => {
  const saturdayAfternoon = new Date(2026, 4, 16, 15, 0).getTime(); // Sat May 16, 2026
  const matchRes = evaluateHighRiskGuard(
    { lateNightLockout: false, matchdayWeekendGuard: true, paydaySurgeGuard: false },
    saturdayAfternoon,
  );
  assert.equal(matchRes.isActive, true);
  assert.ok(matchRes.activeLabels.some((l) => l.includes('Matchday')));

  const payday = new Date(2026, 4, 28, 12, 0).getTime(); // 28th of month
  const payRes = evaluateHighRiskGuard(
    { lateNightLockout: false, matchdayWeekendGuard: false, paydaySurgeGuard: true },
    payday,
  );
  assert.equal(payRes.isActive, true);
  assert.ok(payRes.activeLabels.some((l) => l.includes('Payday')));
});
