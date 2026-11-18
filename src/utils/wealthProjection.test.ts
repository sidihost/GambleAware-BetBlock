import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWealthProjection } from './wealthProjection.ts';

test('buildWealthProjection computes accurate Naira milestones for 7d, 30d, 90d, and 365d', () => {
  const milestones = buildWealthProjection(5000);
  assert.equal(milestones.length, 4);
  assert.equal(milestones[0].days, 7);
  assert.equal(milestones[0].amountNgn, 35000);
  assert.equal(milestones[1].days, 30);
  assert.equal(milestones[1].amountNgn, 150000);
  assert.equal(milestones[2].days, 90);
  assert.equal(milestones[2].amountNgn, 450000);
  assert.equal(milestones[3].days, 365);
  assert.equal(milestones[3].amountNgn, 1825000);
});
