import assert from 'node:assert/strict';
import test from 'node:test';
import { BETTING_BRAND_CATALOG, resolveBettingBrand } from './brandCatalog';

test('resolves exact brand logos for major regional and global betting platforms', () => {
  const cases: Array<[string, string, string]> = [
    ['https://m.sportybet.com/ng/', 'SportyBet', '#E41827'],
    ['sportybet.ng', 'SportyBet', '#E41827'],
    ['web.bet9ja.com', 'Bet9ja', '#107C41'],
    ['betking.com', 'BetKing', '#0B2C5F'],
    ['1xbet.ng', '1xBet', '#1A56DB'],
    ['www.bet365.com', 'Bet365', '#027B5B'],
    ['play.stake.com', 'Stake', '#0F212E'],
    ['betway.co.za', 'Betway', '#111827'],
    ['msport.ng', 'MSport', '#111318'],
    ['betpawa.co.ke', 'betPawa', '#111827'],
    ['draftkings.com', 'DraftKings', '#111827'],
    ['fanduel.com', 'FanDuel', '#1493FF'],
    ['pokerstars.eu', 'PokerStars', '#111111'],
    ['bc.game', 'BC.Game', '#111827'],
  ];

  for (const [input, expectedName, expectedBg] of cases) {
    const resolved = resolveBettingBrand(input);
    assert.equal(resolved.isExactCatalogMatch, true, `Expected exact match for ${input}`);
    assert.equal(resolved.displayName, expectedName);
    assert.equal(resolved.bgColor, expectedBg);
  }
});

test('resolves exact brand when matched from installed app names', () => {
  const sportyApp = resolveBettingBrand('SportyBet App');
  assert.equal(sportyApp.isExactCatalogMatch, true);
  assert.equal(sportyApp.displayName, 'SportyBet');

  const bet9jaApp = resolveBettingBrand('Bet9ja Mobile');
  assert.equal(bet9jaApp.isExactCatalogMatch, true);
  assert.equal(bet9jaApp.displayName, 'Bet9ja');

  for (const [prefix, expectedName] of [
    ['sporty', 'SportyBet'],
    ['1xbe', '1xBet'],
    ['bet9j', 'Bet9ja'],
    ['mspor', 'MSport'],
  ]) {
    const resolved = resolveBettingBrand(prefix);
    assert.equal(resolved.isExactCatalogMatch, true, `Prefix failed: ${prefix}`);
    assert.equal(resolved.displayName, expectedName);
  }
});

test('generates deterministic stylized monogram fallback for niche domains', () => {
  const a = resolveBettingBrand('lucky777casino.xyz');
  const b = resolveBettingBrand('lucky777casino.xyz');
  assert.equal(a.isExactCatalogMatch, false);
  assert.equal(a.monogram, 'LU');
  assert.equal(a.bgColor, b.bgColor);
  assert.equal(BETTING_BRAND_CATALOG.length, 32);
});

test('every catalog brand resolves cleanly via primaryDomain and all aliases', () => {
  const seenIds = new Set<string>();
  for (const brand of BETTING_BRAND_CATALOG) {
    assert.ok(!seenIds.has(brand.id), `Duplicate brand id: ${brand.id}`);
    seenIds.add(brand.id);
    assert.ok(brand.bgColor.startsWith('#'));
    assert.ok(brand.accentColor.startsWith('#'));
    assert.ok(brand.fgColor.startsWith('#'));

    const resolvedPrimary = resolveBettingBrand(brand.primaryDomain);
    assert.equal(resolvedPrimary.isExactCatalogMatch, true);
    assert.equal(resolvedPrimary.brand?.id, brand.id);

    for (const alias of brand.aliases) {
      const resolvedAlias = resolveBettingBrand(`https://m.${alias}/live`);
      assert.equal(resolvedAlias.isExactCatalogMatch, true, `Alias failed: ${alias}`);
      assert.equal(resolvedAlias.brand?.id, brand.id);
    }
  }
});
