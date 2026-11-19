import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWelcomeEmailHtml,
  buildWelcomeEmailSubject,
  buildWelcomePackHtml,
  escapeHtml,
  evaluatePasswordStrength,
  sanitizeFirstName,
  validateRegistrationInput,
} from './welcomePack';

test('evaluatePasswordStrength scores empty, weak, fair, good, and strong passwords accurately', () => {
  assert.equal(evaluatePasswordStrength('').score, 0);
  assert.equal(evaluatePasswordStrength('').label, 'Empty');

  // Short passwords are capped at score 2 (Weak)
  const shortMixed = evaluatePasswordStrength('Aa1!a');
  assert.equal(shortMixed.checks.minLength, false);
  assert.equal(shortMixed.score, 2);
  assert.equal(shortMixed.label, 'Weak');

  // 8+ lowercase only -> score 2
  const lowerOnly = evaluatePasswordStrength('abcdefgh');
  assert.equal(lowerOnly.score, 2);

  // 8+ lowercase + uppercase -> score 3 (Fair)
  const fair = evaluatePasswordStrength('Abcdefgh');
  assert.equal(fair.score, 3);
  assert.equal(fair.label, 'Fair');

  // 8+ lowercase + uppercase + number -> score 4 (Good)
  const good = evaluatePasswordStrength('Abcdefg1');
  assert.equal(good.score, 4);
  assert.equal(good.label, 'Good');

  // 8+ all four character classes -> score 5 (Strong)
  const strong = evaluatePasswordStrength('Shield@2026!');
  assert.equal(strong.score, 5);
  assert.equal(strong.label, 'Strong');
});

test('validateRegistrationInput catches invalid fields and passes valid registrations', () => {
  const invalid = validateRegistrationInput({
    firstName: '',
    email: 'bad-email',
    password: 'short',
    confirmPassword: 'other',
    acceptedTerms: false,
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.firstName);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.password);
  assert.ok(invalid.errors.confirmPassword);
  assert.ok(invalid.errors.acceptedTerms);

  const valid = validateRegistrationInput({
    firstName: 'Jared',
    email: 'jared@example.com',
    password: 'Shield@2026!',
    confirmPassword: 'Shield@2026!',
    acceptedTerms: true,
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('escapeHtml and sanitizeFirstName neutralize XSS payloads safely', () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(sanitizeFirstName('  <Jared>!  '), 'Jared');
  assert.equal(sanitizeFirstName('   '), 'Friend');
});

test('buildWelcomeEmailHtml includes personalized greeting, verification CTA, welcome pack CTA, and zero-VPN steps', () => {
  const subject = buildWelcomeEmailSubject('Jared');
  assert.match(subject, /Welcome to GambleAware, Jared/);

  const html = buildWelcomeEmailHtml({
    firstName: 'Jared <script>',
    email: 'jared@example.com',
    verificationUrl: 'https://gambleaware.app/?verified=1',
    welcomePackUrl: 'https://gambleaware.app/downloads/GambleAware-Welcome-Pack.html',
    apkDownloadUrl: 'https://gambleaware.app/downloads/GambleAware-Nigeria.apk',
    dailyStakeNgn: 5000,
  });

  assert.match(html, /Welcome to GambleAware, Jared script\./);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Download Welcome Pack/);
  assert.match(html, /Confirm Account &amp; Launch Setup/);
  assert.match(html, /100% FREE · ZERO VPN/);
  assert.match(html, /₦150,000/);
});

test('buildWelcomePackHtml produces standalone printable guide with iPhone list and helplines', () => {
  const html = buildWelcomePackHtml({
    firstName: 'Chidi',
    email: 'chidi@example.com',
    generatedDate: 'November 19, 2026',
  });

  assert.match(html, /Recovery &amp; Device Setup Playbook for Chidi/);
  assert.match(html, /sportybet\.com/);
  assert.match(html, /Mentally Aware Nigeria/);
  assert.match(html, /Bank Card Gambling Freeze/);
});
