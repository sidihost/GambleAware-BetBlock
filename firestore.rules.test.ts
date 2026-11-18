import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  BLUEPRINT_LIMITS,
  BOOTSTRAPPED_ADMIN_EMAIL,
  isAdminEmail,
  isValidFirestoreDocId,
  sanitizeDomainForBlueprint,
  sanitizeEventTarget,
  sanitizeGoalFields,
  sanitizePackageForBlueprint,
  sanitizePreferredName,
  sanitizeSupportTicketInput,
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

test('firestore.rules enforces verified delete, commitment lock immutability, admin, surveys, and support tickets', () => {
  const deleteLines = rulesSource.match(/allow delete:[\s\S]*?;/g) ?? [];
  assert.ok(deleteLines.length >= 10, 'Expected delete rules for all user & platform collections');
  for (const rule of deleteLines) {
    if (rule.includes('if false')) continue;
    assert.ok(
      rule.includes('isVerifiedUser()') || rule.includes('isAdmin()'),
      `Every delete rule must require verified email or admin: ${rule}`,
    );
  }
  assert.match(rulesSource, /incoming\(\)\.lockUntilEpochMs >= existing\(\)\.lockUntilEpochMs/);
  assert.match(rulesSource, /incoming\(\)\.isProtectionEnabled == true/);
  assert.match(rulesSource, /incoming\(\)\.antiTamperLockEnabled == true/);
  assert.match(rulesSource, /existing\(\)\.pinHash == '' \|\| incoming\(\)\.pinHash == existing\(\)\.pinHash/);
  assert.match(rulesSource, /match \/recoveryProfiles\/\{userId\}/);
  assert.match(rulesSource, /match \/supportTickets\/\{ticketId\}/);
  assert.match(rulesSource, /match \/surveys\/\{surveyId\}/);
  assert.match(rulesSource, /imoogletechnology@gmail\.com/);
  assert.match(rulesSource, /jaredkiu@gmail\.com/);
});

test('blueprint constants match firestore.rules regex and size limits', () => {
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.domainMaxLength)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.urgeNoteMaxLength)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.triggerTagMaxLength)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.maxDailyBetSpendNgn)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.goalTitleMaxLength)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.goalMaxAmountNgn)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.preferredNameMaxLength)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.ticketMessageMaxLength)));
  assert.ok(rulesSource.includes(String(BLUEPRINT_LIMITS.surveySummaryMaxLength)));
});

test('Dirty Dozen payload guards & admin checks reject unsafe IDs, domains, and truncate overlong strings', () => {
  assert.equal(isAdminEmail(BOOTSTRAPPED_ADMIN_EMAIL), true);
  assert.equal(isAdminEmail('IMOOGLETECHNOLOGY@GMAIL.COM'), true);
  assert.equal(isAdminEmail('JAREDKIU@GMAIL.COM'), true);
  assert.equal(isAdminEmail('random@example.com'), false);

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

  assert.equal(sanitizePreferredName('   Adaeze   Okafor   '), 'Adaeze Okafor');
  assert.equal(sanitizePreferredName('A'.repeat(100)).length, BLUEPRINT_LIMITS.preferredNameMaxLength);

  const goal = sanitizeGoalFields({
    title: '  Save for Rent  ',
    category: 'invalid',
    targetDays: 99999,
    targetAmountNgn: -50,
    whyNote: 'W'.repeat(400),
    lockDurationDays: 500,
  });
  assert.equal(goal.title, 'Save for Rent');
  assert.equal(goal.category, 'streak');
  assert.equal(goal.targetDays, BLUEPRINT_LIMITS.goalMaxTargetDays);
  assert.equal(goal.targetAmountNgn, 0);
  assert.equal(goal.whyNote.length, BLUEPRINT_LIMITS.goalWhyMaxLength);
  assert.equal(goal.lockDurationDays, 365);

  const ticket = sanitizeSupportTicketInput({
    category: 'INVALID',
    urgency: 'URGENT',
    subject: '   Need bank block steps   ',
    message: 'M'.repeat(3000),
  });
  assert.equal(ticket.category, 'RECOVERY_HELP');
  assert.equal(ticket.urgency, 'URGENT');
  assert.equal(ticket.subject, 'Need bank block steps');
  assert.equal(ticket.message.length, BLUEPRINT_LIMITS.ticketMessageMaxLength);

  assert.equal(sanitizePackageForBlueprint('com.test.<script>'), 'com.test.script');
  assert.equal(sanitizeEventTarget('a'.repeat(400)).length, BLUEPRINT_LIMITS.targetMaxLength);
});
