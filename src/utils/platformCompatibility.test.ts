import test from 'node:test';
import assert from 'node:assert/strict';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import {
  ANDROID_APK_DOWNLOAD_URL,
  ANDROID_APK_GITHUB_URL,
  APK_DOWNLOAD_FILENAME,
  buildApkShareUrl,
  detectClientPlatform,
  formatIosBlocklistText,
  getDefaultInstallGuideTarget,
  getOrderedPlatformCards,
  shouldSkipPreloader,
  TOP_BETTING_DOMAINS_FOR_IOS,
} from './platformCompatibility';

test('APK download constants point to same-origin binary stream and GitHub backup mirror', () => {
  assert.equal(APK_DOWNLOAD_FILENAME, 'GambleAware-Nigeria.apk');
  assert.equal(ANDROID_APK_DOWNLOAD_URL, '/downloads/GambleAware-Nigeria.apk');
  assert.ok(ANDROID_APK_GITHUB_URL.startsWith('https://github.com/'));
  assert.ok(ANDROID_APK_GITHUB_URL.endsWith('/GambleAware-Nigeria.apk'));
});

test('shouldSkipPreloader returns true only for autostart=1 or autostart=true', () => {
  assert.equal(shouldSkipPreloader('?autostart=1'), true);
  assert.equal(shouldSkipPreloader('?foo=bar&autostart=true'), true);
  assert.equal(shouldSkipPreloader('?app=1'), false);
  assert.equal(shouldSkipPreloader(''), false);
});

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

test('getDefaultInstallGuideTarget and getOrderedPlatformCards adapt automatically per device', () => {
  assert.equal(getDefaultInstallGuideTarget('ios'), 'ios');
  assert.equal(getDefaultInstallGuideTarget('android'), 'android');
  assert.equal(getDefaultInstallGuideTarget('desktop'), 'android');
  assert.deepEqual(getOrderedPlatformCards('ios'), ['ios', 'android']);
  assert.deepEqual(getOrderedPlatformCards('android'), ['android', 'ios']);
  assert.deepEqual(getOrderedPlatformCards('desktop'), ['android', 'ios']);
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

test('buildApkShareUrl creates full HTTP APK link or falls back to GitHub mirror', () => {
  assert.equal(
    buildApkShareUrl('https://gbb.sidihost.sbs/'),
    'https://gbb.sidihost.sbs/downloads/GambleAware-Nigeria.apk',
  );
  assert.equal(buildApkShareUrl(''), ANDROID_APK_GITHUB_URL);
});
