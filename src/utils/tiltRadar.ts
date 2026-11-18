import { BlockedEventEntity } from '../data/types';

export type TiltRiskLevel = 'CALM' | 'ELEVATED' | 'CRITICAL';

export interface TiltRadarEvaluation {
  level: TiltRiskLevel;
  attemptsLast10Min: number;
  attemptsLast60Min: number;
  cooldownSuggestedSec: number;
  headline: string;
  guidance: string;
}

export function evaluateTiltRadar(
  events: BlockedEventEntity[],
  nowMs: number = Date.now(),
): TiltRadarEvaluation {
  const tenMinAgo = nowMs - 10 * 60_000;
  const hourAgo = nowMs - 60 * 60_000;

  let attemptsLast10Min = 0;
  let attemptsLast60Min = 0;

  for (const ev of events) {
    if (ev.timestamp >= hourAgo) {
      attemptsLast60Min += 1;
      if (ev.timestamp >= tenMinAgo) {
        attemptsLast10Min += 1;
      }
    }
  }

  if (attemptsLast10Min >= 5 || attemptsLast60Min >= 8) {
    return {
      level: 'CRITICAL',
      attemptsLast10Min,
      attemptsLast60Min,
      cooldownSuggestedSec: 300,
      headline: 'Chasing-Loss Spike Detected',
      guidance: `${attemptsLast10Min} rapid attempts in 10 min. Lock your Commitment Timer and bank this stake instead of chasing.`,
    };
  }

  if (attemptsLast10Min >= 2 || attemptsLast60Min >= 4) {
    return {
      level: 'ELEVATED',
      attemptsLast10Min,
      attemptsLast60Min,
      cooldownSuggestedSec: 90,
      headline: 'Impulse Velocity Rising',
      guidance: `${attemptsLast60Min} blocked attempts this hour. Pause for 60s breathing before opening any browser.`,
    };
  }

  return {
    level: 'CALM',
    attemptsLast10Min,
    attemptsLast60Min,
    cooldownSuggestedSec: 0,
    headline: 'Baseline Calm',
    guidance: 'Zero impulse spikes in the last hour. Your shields are holding steady.',
  };
}

export interface PromoNeutralizationReport {
  hasPromoOrBookingCode: boolean;
  detectedCodes: string[];
  depositRedirectDetected: boolean;
  assumedStakeNgn: number;
  houseEdgePercent: number;
  expectedLossAfter30BetsNgn: number;
  summary: string;
}

const BOOKING_CODE_REGEX = /\b(?:code|booking|slip|share)[=: ]+([A-Z0-9]{5,12})\b/gi;
const DEPOSIT_KEYWORDS = ['deposit', 'cashier', 'topup', 'fund', 'wallet', 'pay.', 'checkout'];

export function analyzePromoAndExpectedLoss(
  rawInput: string,
  assumedStakeNgn: number = 5000,
): PromoNeutralizationReport {
  const cleanStake = Math.max(100, Math.min(10_000_000, Math.round(assumedStakeNgn || 5000)));
  const lower = rawInput.toLowerCase();

  const detectedCodes: string[] = [];
  BOOKING_CODE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BOOKING_CODE_REGEX.exec(rawInput)) !== null) {
    const code = match[1].toUpperCase();
    if (!detectedCodes.includes(code)) detectedCodes.push(code);
  }

  const depositRedirectDetected = DEPOSIT_KEYWORDS.some((kw) => lower.includes(kw));
  const hasPromoOrBookingCode =
    detectedCodes.length > 0 ||
    lower.includes('bonus') ||
    lower.includes('promo') ||
    lower.includes('freebet') ||
    lower.includes('aviator');

  // Sportsbooks take ~6-9% vig on multi-leg slips; slots/crash carry ~4-6% edge per turnover
  const houseEdgePercent = lower.includes('aviator') || lower.includes('casino') || lower.includes('slot') ? 5.5 : 7.5;
  const expectedLossAfter30BetsNgn = Math.round(cleanStake * 30 * (houseEdgePercent / 100));

  const summary = depositRedirectDetected
    ? `Deposit gateway neutralized. At ${houseEdgePercent}% bookmaker margin, 30 repeated stakes average ₦${expectedLossAfter30BetsNgn.toLocaleString('en-NG')} lost to house edge.`
    : hasPromoOrBookingCode
      ? `Promo/booking slip neutralized (${detectedCodes.join(', ') || 'bonus lure'}). "Risk-free" bonuses lock you into high-margin rollover traps.`
      : `At typical ${houseEdgePercent}% house margin, 30 bets of ₦${cleanStake.toLocaleString('en-NG')} statistically drain ₦${expectedLossAfter30BetsNgn.toLocaleString('en-NG')}.`;

  return {
    hasPromoOrBookingCode,
    detectedCodes,
    depositRedirectDetected,
    assumedStakeNgn: cleanStake,
    houseEdgePercent,
    expectedLossAfter30BetsNgn,
    summary,
  };
}

/**
 * Trusted Buddy Co-Lock:
 * Deterministic offline challenge-response pair (no server needed).
 * User gives Buddy the Challenge Key + Secret Salt out-of-band (WhatsApp/SMS);
 * Buddy reads back the 6-digit Approval Token computed deterministically.
 */
export function generateBuddyChallengeCode(nowMs: number = Date.now()): string {
  const bucket = Math.floor(nowMs / 1000) % 900_000;
  const num = (100_000 + bucket).toString();
  return `${num.slice(0, 3)}-${num.slice(3, 6)}`;
}

export function computeExpectedBuddyResponse(
  challengeCode: string,
  partnerSalt: string,
): string {
  const cleanChallenge = challengeCode.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  const cleanSalt = partnerSalt.trim().toLowerCase() || 'gambleaware';
  const combined = `${cleanChallenge}:${cleanSalt}:buddy_unlock_v1`;

  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + i * 17;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const sixDigit = (((h1 ^ h2) >>> 0) % 1_000_000);
  return String(sixDigit).padStart(6, '0');
}

export function verifyBuddyUnlockCode(
  challengeCode: string,
  partnerSalt: string,
  candidateResponse: string,
): boolean {
  const normalized = candidateResponse.replace(/\D/g, '');
  if (normalized.length !== 6) return false;
  const expected = computeExpectedBuddyResponse(challengeCode, partnerSalt);
  let diff = 0;
  for (let i = 0; i < 6; i++) {
    diff |= normalized.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
