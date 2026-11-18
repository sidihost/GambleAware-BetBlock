import test from 'node:test';
import assert from 'node:assert/strict';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import {
  detectClientPlatform,
  formatIosBlocklistText,
  resolveInitialViewMode,
  TOP_BETTING_DOMAINS_FOR_IOS,
} from './platformCompatibility';

test('detectClientPlatform identifies iPhone, iPadOS, Android, and Desktop correctly', () => {
  assert.equal(
    detectClientPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'),
    'ios',
  );
  assert.equal(
    detectClientPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5),
    'ios',
  );
  assert.equal(
    detectClientPlatform('Mozilla/5.0 (Linux; Android 15; Pixel 8)'),
    'android',
  );
  assert.equal(
    detectClientPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0),
    'desktop',
  );
});

test('resolveInitialViewMode opens interactive app in standalone PWA or ?app=1', () => {
  assert.equal(
    resolveInitialViewMode({ isStandalone: true, search: '', hash: '' }),
    'app',
  );
  assert.equal(
    resolveInitialViewMode({ isStandalone: false, search: '?app=1', hash: '' }),
    'app',
  );
  assert.equal(
    resolveInitialViewMode({ isStandalone: false, search: '', hash: '#app' }),
    'app',
  );
  assert.equal(
    resolveInitialViewMode({ isStandalone: false, search: '', hash: '' }),
    'landing',
  );
});

test('TOP_BETTING_DOMAINS_FOR_IOS are all valid built-in gambling domains', () => {
  assert.ok(TOP_BETTING_DOMAINS_FOR_IOS.length >= 15);
  for (const domain of TOP_BETTING_DOMAINS_FOR_IOS) {
    assert.ok(
      GamblingRegistry.domainToCategory.has(domain),
      `Expected ${domain} to exist in GamblingRegistry`,
    );
  }
  const lines = formatIosBlocklistText().split('\n');
  assert.equal(lines.length, TOP_BETTING_DOMAINS_FOR_IOS.length);
});
