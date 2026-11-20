import assert from 'node:assert/strict';
import test from 'node:test';
import { GamblingCategory } from '../blocker/gamblingCategory';
import {
  DEFAULT_SANDBOX_CONFIG,
  evaluateSandboxQuery,
  filterCoveredBrands,
  getRegistryMetrics,
} from './interactiveDemo';

test('evaluateSandboxQuery returns IDLE for blank input', () => {
  const res = evaluateSandboxQuery('   ');
  assert.equal(res.status, 'IDLE');
  assert.equal(res.brandIdentity, null);
});

test('evaluateSandboxQuery catches instant keystroke prefix "sporty"', () => {
  const res = evaluateSandboxQuery('sporty');
  assert.equal(res.status, 'BLOCKED');
  assert.equal(res.detectionLayer, 'Keystroke Prefix Engine');
  assert.equal(res.brandIdentity?.displayName, 'SportyBet');
});

test('evaluateSandboxQuery catches cashier deposit URL with booking code and computes expected loss', () => {
  const res = evaluateSandboxQuery('bet9ja.com/deposit?code=AB99X', DEFAULT_SANDBOX_CONFIG, 5000);
  assert.equal(res.status, 'BLOCKED');
  assert.equal(res.brandIdentity?.displayName, 'Bet9ja');
  assert.equal(res.promoReport?.depositRedirectDetected, true);
  assert.deepEqual(res.promoReport?.detectedCodes, ['AB99X']);
  assert.ok((res.promoReport?.expectedLossAfter30BetsNgn ?? 0) > 0);
});

test('evaluateSandboxQuery blocks gambling popunder ad trackers', () => {
  const res = evaluateSandboxQuery('popads.net');
  assert.equal(res.status, 'BLOCKED');
  assert.equal(res.detectionLayer, 'Ad & Popunder Shield');
});

test('evaluateSandboxQuery protects safe recovery helplines from being blocked', () => {
  const res = evaluateSandboxQuery('gamcare.org.uk');
  assert.equal(res.status, 'ALLOWED');
  assert.equal(res.isSafeSupportAllowlisted, true);
  assert.equal(res.detectionLayer, 'Safe-Support Guard');
});

test('evaluateSandboxQuery respects disabled category toggles', () => {
  const customConfig = {
    ...DEFAULT_SANDBOX_CONFIG,
    blockCryptoBetting: false,
    strictKeywordFilter: false,
  };
  const res = evaluateSandboxQuery('rollbit.com', customConfig);
  assert.equal(res.status, 'ALLOWED');
});

test('filterCoveredBrands filters by category and search query across domains and aliases', () => {
  const crypto = filterCoveredBrands(GamblingCategory.CRYPTO_BETTING, '');
  assert.ok(crypto.length >= 4);
  assert.ok(crypto.every((b) => b.category === GamblingCategory.CRYPTO_BETTING));

  const nigeriaMatch = filterCoveredBrands('ALL', 'bet9ja.ng');
  assert.equal(nigeriaMatch.length, 1);
  assert.equal(nigeriaMatch[0].id, 'bet9ja');

  const emptyMatch = filterCoveredBrands('ALL', 'nonexistent-operator-xyz');
  assert.equal(emptyMatch.length, 0);
});

test('getRegistryMetrics returns truthful non-zero counts from GamblingRegistry', () => {
  const metrics = getRegistryMetrics();
  assert.ok(metrics.domainCount >= 500);
  assert.ok(metrics.appCount >= 100);
  assert.ok(metrics.adTrackerCount >= 40);
  assert.ok(metrics.brandCount >= 30);
});

test('evaluateSandboxQuery blocks Play Store & APK betting downloads while allowing VPNs', () => {
  const playStoreBet = evaluateSandboxQuery('playstore: SportyBet');
  assert.equal(playStoreBet.status, 'BLOCKED');
  assert.equal(playStoreBet.detectionLayer, 'Play Store Download Guard');
  assert.equal(playStoreBet.brandIdentity?.displayName, 'SportyBet');

  const apkBet = evaluateSandboxQuery('apk: 1xBet');
  assert.equal(apkBet.status, 'BLOCKED');
  assert.equal(apkBet.detectionLayer, 'APK Install Guard');

  const playStoreVpn = evaluateSandboxQuery('playstore: ProtonVPN');
  assert.equal(playStoreVpn.status, 'ALLOWED');
  assert.equal(playStoreVpn.detectionLayer, 'VPN Coexistence Pass');

  const vpnDomain = evaluateSandboxQuery('protonvpn.com');
  assert.equal(vpnDomain.status, 'ALLOWED');
  assert.equal(vpnDomain.detectionLayer, 'VPN Coexistence Pass');
});

