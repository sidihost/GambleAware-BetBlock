import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzePromoAndExpectedLoss,
  computeExpectedBuddyResponse,
  evaluateTiltRadar,
  generateBuddyChallengeCode,
  verifyBuddyUnlockCode,
} from './tiltRadar';
import { BlockedEventEntity } from '../data/types';

function makeEvent(id: number, offsetMs: number, now: number): BlockedEventEntity {
  return {
    id,
    target: 'sportybet.com',
    source: 'Web Shield',
    categoryName: 'Sportsbook',
    timestamp: now - offsetMs,
  };
}

test('evaluates Tilt Velocity Radar across CALM, ELEVATED, and CRITICAL thresholds', () => {
  const now = 1_700_000_000_000;

  assert.equal(evaluateTiltRadar([], now).level, 'CALM');

  const elevatedEvents = [
    makeEvent(1, 30_000, now),
    makeEvent(2, 90_000, now),
  ];
  const elevated = evaluateTiltRadar(elevatedEvents, now);
  assert.equal(elevated.level, 'ELEVATED');
  assert.equal(elevated.attemptsLast10Min, 2);

  const criticalEvents = [
    makeEvent(1, 10_000, now),
    makeEvent(2, 20_000, now),
    makeEvent(3, 30_000, now),
    makeEvent(4, 40_000, now),
    makeEvent(5, 50_000, now),
  ];
  const critical = evaluateTiltRadar(criticalEvents, now);
  assert.equal(critical.level, 'CRITICAL');
  assert.equal(critical.cooldownSuggestedSec, 300);
});

test('neutralizes booking codes and deposit gateways with mathematical house-edge loss', () => {
  const report = analyzePromoAndExpectedLoss('https://sportybet.com/ng/share?code=BC89X2A&deposit=1', 5000);
  assert.equal(report.hasPromoOrBookingCode, true);
  assert.deepEqual(report.detectedCodes, ['BC89X2A']);
  assert.equal(report.depositRedirectDetected, true);
  assert.ok(report.expectedLossAfter30BetsNgn > 10_000);
});

test('generates and verifies Trusted Buddy Co-Lock offline 6-digit approval tokens', () => {
  const challenge = generateBuddyChallengeCode(1_700_000_000_000);
  assert.match(challenge, /^\d{3}-\d{3}$/);

  const partnerName = 'Tunde';
  const expectedToken = computeExpectedBuddyResponse(challenge, partnerName);
  assert.match(expectedToken, /^\d{6}$/);

  assert.equal(verifyBuddyUnlockCode(challenge, partnerName, expectedToken), true);
  assert.equal(verifyBuddyUnlockCode(challenge, partnerName, '000000'), expectedToken === '000000');
  assert.equal(verifyBuddyUnlockCode(challenge, 'WrongPartner', expectedToken), false);

  for (let i = 0; i < 500; i++) {
    const c = generateBuddyChallengeCode(1_700_000_000_000 + i * 13_337);
    const tok = computeExpectedBuddyResponse(c, `salt_${i}`);
    assert.match(tok, /^\d{6}$/);
    assert.equal(verifyBuddyUnlockCode(c, `salt_${i}`, tok), true);
  }
});
