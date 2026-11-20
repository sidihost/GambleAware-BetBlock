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
    'sporty',
    'sportybet',
    'sportyb',
    'bet9j',
    'bet9ja',
    '1xbe',
    '1xbet',
    'betki',
    'betking',
    'mspor',
    'msport',
    'betpa',
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
    'sport',
    'sports',
  ]) {
    const res = BlocklistMatcher.matchTypedBrowserInput(safe, customConfig);
    assert.equal(res.isBlocked, false, `Expected safe input NOT blocked while typing: "${safe}"`);
  }
});

test('blocks gambling ad networks, popunders, and affiliate links when adBlockerEnabled is true', () => {
  for (const adUrl of [
    'https://popads.net/pop.js',
    'https://adsterra.com/banner',
    'https://1xpartners.com/signup',
    'https://news-example.org/sports?btag=99123_promo',
  ]) {
    const res = BlocklistMatcher.matchDomainOrUrl(adUrl, defaultConfig);
    assert.equal(res.isBlocked, true, `Expected ad/affiliate URL ${adUrl} to be blocked`);
  }

  const typedAd = BlocklistMatcher.matchTypedBrowserInput('adsterra', defaultConfig);
  assert.equal(typedAd.isBlocked, true);

  const disabledConfig: BlockFilterConfig = {
    ...defaultConfig,
    adBlockerEnabled: false,
  };
  assert.equal(BlocklistMatcher.matchDomainOrUrl('https://popads.net/pop.js', disabledConfig).isBlocked, false);
  assert.equal(
    BlocklistMatcher.matchDomainOrUrl('https://news-example.org/sports?btag=99123_promo', disabledConfig).isBlocked,
    false,
  );
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

test('blocks Play Store searches and APK sideloads for betting apps while allowing VPNs and everyday apps', () => {
  const config: BlockFilterConfig = {
    ...defaultConfig,
    playStoreGuardEnabled: true,
    customBlockedAppNames: new Set(['LuckySpinPro']),
  };

  assert.equal(
    BlocklistMatcher.matchAppStoreOrInstaller(false, ['SportyBet'], ['SportyBet', 'Install'], config).isBlocked,
    true,
  );
  assert.equal(
    BlocklistMatcher.matchAppStoreOrInstaller(true, [], ['Do you want to install this app?', '1xBet', 'Install'], config).isBlocked,
    true,
  );
  assert.equal(
    BlocklistMatcher.matchAppStoreOrInstaller(false, ['LuckySpinPro'], ['LuckySpinPro', 'Install'], config).isBlocked,
    true,
  );

  // Third-party VPNs and everyday apps must stay allowed
  assert.equal(
    BlocklistMatcher.matchAppStoreOrInstaller(false, ['ProtonVPN'], ['Proton VPN: Fast & Secure', 'Install'], config).isBlocked,
    false,
  );
  assert.equal(
    BlocklistMatcher.matchAppStoreOrInstaller(false, ['WhatsApp'], ['WhatsApp Messenger', 'Install'], config).isBlocked,
    false,
  );
});

test('allows third-party VPN packages and everyday apps in App Shield while blocking betting and custom apps', () => {
  const config: BlockFilterConfig = {
    ...defaultConfig,
    customBlockedPackages: new Set(['com.custom.triggerapp']),
  };

  for (const safePkg of [
    'ch.protonvpn.android',
    'net.mullvad.mullvadvpn',
    'com.nordvpn.android',
    'com.cloudflare.onedotonedotonedotone',
    'com.whatsapp',
    'com.android.vending',
  ]) {
    assert.equal(
      BlocklistMatcher.matchAppPackage(safePkg, config).isBlocked,
      false,
      `Expected ${safePkg} to remain untouched`,
    );
  }

  assert.equal(BlocklistMatcher.matchAppPackage('com.sportybet.android', config, 'SportyBet').isBlocked, true);
  assert.equal(BlocklistMatcher.matchAppPackage('com.custom.triggerapp', config, 'Trigger App').isBlocked, true);
});


