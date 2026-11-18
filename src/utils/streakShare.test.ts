import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCleanStreakSharePayload,
  shareCleanStreakStats,
} from './streakShare';

test('buildCleanStreakSharePayload handles singular and plural days cleanly', () => {
  const oneDay = buildCleanStreakSharePayload({
    cleanDays: 1,
    cleanHoursRemainder: 4,
    cleanMinutesRemainder: 9,
    cleanSecondsRemainder: 2,
    estimatedSavedAmount: 5000,
    totalUrgeResistedCount: 2,
    totalBlockedCount: 11,
    nextMilestoneTitle: 'First Week',
    nextMilestoneDays: 7,
    shareUrl: 'https://gambleaware.example',
  });

  assert.equal(oneDay.title, 'GambleAware Clean Streak: 1 day betting-free');
  assert.match(oneDay.text, /1 day \(04h 09m 02s\) betting-free/);
  assert.match(oneDay.text, /₦5,000/);
  assert.match(oneDay.text, /Urges resisted: 2 \| Betting sites blocked: 11/);
  assert.match(oneDay.combinedText, /https:\/\/gambleaware\.example$/);

  const zeroDays = buildCleanStreakSharePayload({
    cleanDays: 0,
    cleanHoursRemainder: 0,
    cleanMinutesRemainder: 30,
    cleanSecondsRemainder: 5,
    estimatedSavedAmount: 0,
    totalUrgeResistedCount: 0,
    totalBlockedCount: 0,
    nextMilestoneTitle: 'First 24h',
    nextMilestoneDays: 1,
  });

  assert.equal(zeroDays.title, 'GambleAware Clean Streak: 0 days betting-free');
  assert.match(zeroDays.text, /0 days \(00h 30m 05s\)/);
});

test('shareCleanStreakStats uses native share API when available', async () => {
  let received: { title?: string; text?: string; url?: string } | null = null;
  const result = await shareCleanStreakStats(
    {
      cleanDays: 14,
      cleanHoursRemainder: 6,
      cleanMinutesRemainder: 12,
      cleanSecondsRemainder: 0,
      estimatedSavedAmount: 70000,
      totalUrgeResistedCount: 5,
      totalBlockedCount: 24,
      nextMilestoneTitle: 'One Month',
      nextMilestoneDays: 30,
    },
    {
      share: async (data) => {
        received = data;
      },
      copyText: async () => {
        throw new Error('Should not fall back to clipboard on native share success');
      },
    },
  );

  assert.deepEqual(result, { status: 'shared', method: 'native' });
  assert.ok(received);
  assert.match((received as { title: string }).title, /14 days/);
});

test('shareCleanStreakStats treats native AbortError as silent cancellation', async () => {
  const result = await shareCleanStreakStats(
    {
      cleanDays: 3,
      cleanHoursRemainder: 1,
      cleanMinutesRemainder: 2,
      cleanSecondsRemainder: 3,
      estimatedSavedAmount: 15000,
      totalUrgeResistedCount: 1,
      totalBlockedCount: 4,
      nextMilestoneTitle: 'First Week',
      nextMilestoneDays: 7,
    },
    {
      share: async () => {
        const err = new Error('User cancelled');
        err.name = 'AbortError';
        throw err;
      },
      copyText: async () => {
        throw new Error('Should not copy when user explicitly cancelled native share');
      },
    },
  );

  assert.deepEqual(result, { status: 'cancelled' });
});

test('shareCleanStreakStats falls back to clipboard when native share throws non-abort or is absent', async () => {
  let copied = '';
  const result = await shareCleanStreakStats(
    {
      cleanDays: 7,
      cleanHoursRemainder: 12,
      cleanMinutesRemainder: 0,
      cleanSecondsRemainder: 45,
      estimatedSavedAmount: 35000,
      totalUrgeResistedCount: 3,
      totalBlockedCount: 19,
      nextMilestoneTitle: 'Two Weeks',
      nextMilestoneDays: 14,
    },
    {
      copyText: async (text) => {
        copied = text;
      },
    },
  );

  assert.deepEqual(result, { status: 'copied', method: 'clipboard' });
  assert.match(copied, /7 days/);
  assert.match(copied, /₦35,000/);
});
