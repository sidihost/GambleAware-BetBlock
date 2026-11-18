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

test('blocks betting sites immediately while typing before pressing Enter or typing .com', () => {
  const customConfig: BlockFilterConfig = {
    ...defaultConfig,
    customBlockedDomains: new Set(['mycustombet.io']),
    allowlistedDomains: new Set(['allowbet.com']),
  };

  for (const typed of [
    'sportybet',
    'sportyb',
    'bet9ja',
    '1xbet',
    'betking',
    'msport',
    'bet365',
    'stake.c',
    'sportybet.n',
    'stake casino',
    'mycustombet',
  ]) {
    const res = BlocklistMatcher.matchTypedBrowserInput(typed, customConfig);
    assert.equal(res.isBlocked, true, `Expected immediate while-typing block for "${typed}"`);
  }

  for (const safe of [
    'betterhelp',
    'bethesda',
    'alphabet',
    'diabetes',
    'stakeholder',
    'allowbet',
    'gamblers anonymous',
    'how to quit betting',
    'chrome://newtab',
    'Search or type web address',
    'bet',
    'sta',
  ]) {
    const res = BlocklistMatcher.matchTypedBrowserInput(safe, customConfig);
    assert.equal(res.isBlocked, false, `Expected safe input NOT blocked while typing: "${safe}"`);
  }
});

test('unwraps social redirect links and catches Cyrillic homoglyph spoofing while sparing normal fintechs', () => {
  const igRedirect = BlocklistMatcher.matchDomainOrUrl(
    'https://l.instagram.com/?u=https%3A%2F%2Fsportybet.com%2Fng%2Fshare%3Fcode%3DABC123',
    defaultConfig,
  );
  assert.equal(igRedirect.isBlocked, true);
  assert.match(igRedirect.reason, /redirect/i);

  const homoglyphSpoof = BlocklistMatcher.matchDomainOrUrl('https://sp\u043ertybet.com', defaultConfig);
  assert.equal(homoglyphSpoof.isBlocked, true);

  const cashierSubdomain = BlocklistMatcher.matchDomainOrUrl('https://pay.sportybet.com/deposit', defaultConfig);
  assert.equal(cashierSubdomain.isBlocked, true);

  for (const safeFintech of ['paystack.com', 'flutterwave.com', 'opayweb.com', 'kuda.com']) {
    const res = BlocklistMatcher.matchDomainOrUrl(safeFintech, defaultConfig);
    assert.equal(res.isBlocked, false, `Expected fintech ${safeFintech} to stay safe`);
  }
});

