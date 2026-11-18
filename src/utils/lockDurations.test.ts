import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLockCountdownQuad,
  clampLockDays,
  formatLockDurationAdjective,
  formatLockDurationLong,
  LOCK_DURATION_PRESETS,
  MAX_LOCK_DAYS,
} from './lockDurations.ts';

test('LOCK_DURATION_PRESETS includes 6 Months (180d), 1 Year (365d), and 2 Years (730d)', () => {
  const byDays = new Map(LOCK_DURATION_PRESETS.map((p) => [p.days, p]));
  assert.equal(byDays.get(180)?.label, '6 Months');
  assert.equal(byDays.get(365)?.label, '1 Year');
  assert.equal(byDays.get(730)?.label, '2 Years');
  assert.equal(MAX_LOCK_DAYS, 730);
});

test('clampLockDays preserves 180, 365, and 730 days while bounding out-of-range inputs', () => {
  assert.equal(clampLockDays(180), 180);
  assert.equal(clampLockDays(365), 365);
  assert.equal(clampLockDays(730), 730);
  assert.equal(clampLockDays(0), 1);
  assert.equal(clampLockDays(-10), 1);
  assert.equal(clampLockDays(1000), 730);
  assert.equal(clampLockDays(Number.NaN), 7);
});

test('formatLockDurationLong and formatLockDurationAdjective format multi-month and multi-year spans cleanly', () => {
  assert.equal(formatLockDurationLong(1), '24 Hours');
  assert.equal(formatLockDurationLong(7), '7 Days');
  assert.equal(formatLockDurationLong(180), '6 Months');
  assert.equal(formatLockDurationLong(365), '1 Year');
  assert.equal(formatLockDurationLong(730), '2 Years');

  assert.equal(formatLockDurationAdjective(180), '6-Month');
  assert.equal(formatLockDurationAdjective(365), '1-Year');
  assert.equal(formatLockDurationAdjective(730), '2-Year');
});

test('buildLockCountdownQuad formats 3-digit day counts cleanly for 6m, 1y, and 2y locks', () => {
  const twoYearAlmostMs = (729 * 86400 + 23 * 3600 + 59 * 60 + 12) * 1000;
  const quad = buildLockCountdownQuad(twoYearAlmostMs);
  assert.deepEqual(quad, [
    { digits: '729', unit: 'DAYS' },
    { digits: '23', unit: 'HRS' },
    { digits: '59', unit: 'MIN' },
    { digits: '12', unit: 'SEC' },
  ]);
});
