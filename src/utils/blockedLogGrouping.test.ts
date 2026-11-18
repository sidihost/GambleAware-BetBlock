import assert from 'node:assert/strict';
import test from 'node:test';
import { BlockedEventEntity } from '../data/types';
import {
  formatAttemptCountLabel,
  formatBlockedTimestamp,
  groupBlockedEvents,
  normalizeBlockedTarget,
} from './blockedLogGrouping';

test('normalizeBlockedTarget strips protocol, www, paths, and keeps domain or app label clean', () => {
  assert.equal(normalizeBlockedTarget('https://www.SportyBet.com/ng/m/login?ref=1'), 'sportybet.com');
  assert.equal(normalizeBlockedTarget('m.bet9ja.com/mobile'), 'm.bet9ja.com');
  assert.equal(normalizeBlockedTarget('SportyBet App'), 'SportyBet App');
  assert.equal(normalizeBlockedTarget('1xbet.ng:443'), '1xbet.ng');
  assert.equal(normalizeBlockedTarget('com.sportybet.android'), 'SportyBet');
  assert.equal(normalizeBlockedTarget('ng.bet9ja.app'), 'Bet9ja Mobile');
  assert.equal(normalizeBlockedTarget('team.opay.pay'), 'OPay');
});

test('groupBlockedEvents aggregates repeated attempts by site and sorts newest first', () => {
  const events: BlockedEventEntity[] = [
    {
      id: 1,
      target: 'https://www.sportybet.com/ng/',
      source: 'Web Shield',
      categoryName: 'Sportsbook',
      timestamp: 1_000,
    },
    {
      id: 2,
      target: 'bet9ja.com',
      source: 'DNS Shield',
      categoryName: 'Sportsbook',
      timestamp: 2_000,
    },
    {
      id: 3,
      target: 'sportybet.com',
      source: 'DNS Shield',
      categoryName: 'Sportsbook',
      timestamp: 3_000,
    },
    {
      id: 4,
      target: 'SportyBet App',
      source: 'App Shield',
      categoryName: 'Sportsbook',
      timestamp: 4_000,
    },
  ];

  const grouped = groupBlockedEvents(events);
  assert.equal(grouped.length, 3);

  assert.equal(grouped[0].target, 'SportyBet App');
  assert.equal(grouped[0].attemptCount, 1);
  assert.equal(grouped[0].isApp, true);

  assert.equal(grouped[1].target, 'sportybet.com');
  assert.equal(grouped[1].attemptCount, 2);
  assert.equal(grouped[1].latestSource, 'DNS Shield');
  assert.deepEqual(grouped[1].sources.sort(), ['DNS Shield', 'Web Shield']);
  assert.equal(grouped[1].isApp, false);

  assert.equal(grouped[2].target, 'bet9ja.com');
  assert.equal(grouped[2].attemptCount, 1);
});

test('formatAttemptCountLabel and formatBlockedTimestamp format clearly', () => {
  assert.equal(formatAttemptCountLabel(1), '1 blocked');
  assert.equal(formatAttemptCountLabel(5), '5 blocked');

  const now = 1_700_000_000_000;
  assert.equal(formatBlockedTimestamp(now - 10_000, now), 'Just now');
  assert.equal(formatBlockedTimestamp(now - 5 * 60_000, now), '5m ago');
  assert.equal(formatBlockedTimestamp(now - 3 * 3_600_000, now), '3h ago');
});
