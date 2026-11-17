import test from 'node:test';
import assert from 'node:assert/strict';
import { BlockFilterConfig, BlocklistMatcher } from './blocklistMatcher';
import { GamblingCategory } from './gamblingCategory';

const defaultConfig: BlockFilterConfig = {
  blockSportsbooks: true,
  blockCasinos: true,
  blockPokerAndBingo: true,
  blockCryptoBetting: true,
  blockFantasyAndLottery: true,
  strictKeywordFilter: true,
  searchGuardEnabled: true,
  customBlockedDomains: new Set(),
  allowlistedDomains: new Set(),
  customBlockedPackages: new Set(),
};

test('blocks major Nigerian betting platforms by default', () => {
  for (const domain of [
    'sportybet.com',
    'bet9ja.com',
    'betking.com',
    '1xbet.ng',
    'msport.ng',
    'nairabet.com',
  ]) {
    const res = BlocklistMatcher.matchDomainOrUrl(domain, defaultConfig);
    assert.equal(res.isBlocked, true, `Expected ${domain} to be blocked`);
    assert.equal(res.category, GamblingCategory.SPORTSBOOK);
  }
});

test('allows safe recovery and health resources', () => {
  for (const domain of ['betterhelp.com', 'mentallyaware.org', 'gamcare.org.uk']) {
    const res = BlocklistMatcher.matchDomainOrUrl(domain, defaultConfig);
    assert.equal(res.isBlocked, false, `Expected ${domain} to remain safe`);
  }
});
