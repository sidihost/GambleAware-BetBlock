import assert from 'node:assert/strict';
import test from 'node:test';
import { buildNotificationPayload } from './notifications.ts';

test('buildNotificationPayload formats milestone, lock, relapse, and test alerts cleanly', () => {
  const milestone = buildNotificationPayload('milestone', {
    cleanDays: 14,
    savedFormatted: '₦70,000',
  });
  assert.equal(milestone.title, '14 Days Betting-Free');
  assert.match(milestone.body, /₦70,000/);

  const lock = buildNotificationPayload('lock', { lockLabel: '6 Months' });
  assert.equal(lock.title, 'Commitment Lock Armed (6 Months)');

  const relapse = buildNotificationPayload('relapse_support');
  assert.equal(relapse.tag, 'gambleaware-relapse-reset');

  const testNotif = buildNotificationPayload('test');
  assert.equal(testNotif.title, 'GambleAware Alerts Working');
});
