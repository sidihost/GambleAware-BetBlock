import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  BLUEPRINT_LIMITS,
  isValidFirestoreDocId,
  sanitizeDomainForBlueprint,
  sanitizeEventTarget,
  sanitizePackageForBlueprint,
  sanitizeUrgeFields,
  toSafeFirestoreDocId,
} from './src/firebaseValidation.ts';

const rulesSource = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('firestore.rules enforces all Eight Pillars and default-deny net', () => {
  assert.match(rulesSource, /rules_version\s*=\s*'2';/);
  assert.match(
    rulesSource,
    /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/,
    'Default-deny catch-all must appear first',
  );
  assert.match(rulesSource, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesSource, /function isValidId\(id\)/);
  assert.match(rulesSource, /function hasUserAnchor\(userId\)/);
  assert.match(rulesSource, /data\.planTier == 'free'/);
  assert.match(rulesSource, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesSource, /incoming\(\)\.updatedAt == request\.time/);
  assert.match(rulesSource, /allow list: if isOwner\(userId\) && existing\(\)\.ownerId == request\.auth\.uid;/);
  assert.match(rulesSource, /match \/test\/connection\s*\{\s*allow get: if true;/);
});

test('blueprint constants match firestore.rules regex and size limits', () => {
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.domainMaxLength)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.urgeNoteMaxLength)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.triggerTagMaxLength)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.maxDailyBetSpendNgn)));
});

test('Dirty Dozen payload guards reject unsafe IDs, domains, and truncate overlong strings', () => {
  assert.equal(isValidFirestoreDocId('user_123-abc'), true);
  assert.equal(isValidFirestoreDocId('bad.id.with.dots'), false);
  assert.equal(isValidFirestoreDocId('a'.repeat(129)), false);
  assert.equal(isValidFirestoreDocId('bad/slash'), false);

  const safeDomainId = toSafeFirestoreDocId('sportybet.com');
  assert.equal(safeDomainId, 'sportybet_com');
  assert.equal(isValidFirestoreDocId(safeDomainId), true);

  const safePkgId = toSafeFirestoreDocId('com.sportybet.android');
  assert.equal(safePkgId, 'com_sportybet_android');
  assert.equal(isValidFirestoreDocId(safePkgId), true);

  const validDomain = sanitizeDomainForBlueprint('  BET9JA.COM  ');
  assert.equal(validDomain, 'bet9ja.com');
  assert.equal(BLUEPRINT_LIMITS.domainPattern.test(validDomain), true);
  assert.equal(BLUEPRINT_LIMITS.domainPattern.test('<script>alert(1)</script>'), false);

  const sanitizedUrge = sanitizeUrgeFields('X'.repeat(80), 'Y'.repeat(500));
  assert.equal(sanitizedUrge.triggerTag.length, BLUEPRINT_LIMITS.triggerTagMaxLength);
  assert.equal(sanitizedUrge.note.length, BLUEPRINT_LIMITS.urgeNoteMaxLength);

  assert.equal(sanitizePackageForBlueprint('com.test.<script>'), 'com.test.script');
  assert.equal(sanitizeEventTarget('a'.repeat(400)).length, BLUEPRINT_LIMITS.targetMaxLength);
});
