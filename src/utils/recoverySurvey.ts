import { HighRiskScheduleConfig } from '../data/types';

export type SurveyRiskTier = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type SurveyPrimaryFormat =
  | 'Sports & Live Odds'
  | 'Online Slots & Casino'
  | 'Crash / Aviator / Crypto'
  | 'Poker / Virtuals / Fantasy'
  | 'Multiple Platforms';

export type SurveySpendBand =
  | 'Under ₦2,500 / day'
  | '₦2,500 – ₦10,000 / day'
  | '₦10,000 – ₦30,000 / day'
  | 'Above ₦30,000 / day';

export type SurveyRelapseFrequency =
  | 'First time quitting'
  | '1–2 slips per month'
  | 'Weekly slips'
  | 'Daily urges / unable to stop alone';

export type SurveyPeakWindow =
  | 'Mornings & Work Hours'
  | 'Evenings & Matchdays'
  | 'Late Night (10 PM – 5 AM)'
  | 'Payday & Weekends';

export type SurveySupportReadiness =
  | 'Just want strong blocking'
  | 'Want blockers + financial freeze'
  | 'Ready for long lock + accountability buddy'
  | 'Need immediate relapse / crisis help';

export interface RecoverySurveyAnswers {
  primaryFormat: SurveyPrimaryFormat;
  triggers: string[];
  spendBand: SurveySpendBand;
  relapseFrequency: SurveyRelapseFrequency;
  peakWindow: SurveyPeakWindow;
  supportReadiness: SurveySupportReadiness;
}

export interface SurveyRecommendationItem {
  id: string;
  priority: 'ESSENTIAL' | 'HIGH' | 'RECOMMENDED';
  title: string;
  description: string;
  actionLabel: string;
  actionTarget: 'apply_preset' | 'lock' | 'blocklist' | 'resources_bank' | 'resources_relapse' | 'support';
}

export interface EvaluatedSurveyProfile {
  answers: RecoverySurveyAnswers;
  riskScore: number;
  riskTier: SurveyRiskTier;
  recommendedLockDays: number;
  recommendedDailySpendNgn: number;
  recommendedHighRiskSchedule: HighRiskScheduleConfig;
  recommendedStrictKeywords: boolean;
  recommendedDepositGuard: boolean;
  summary: string;
  recommendations: SurveyRecommendationItem[];
  completedAtMs: number;
}

export const SURVEY_TRIGGER_OPTIONS = [
  'Matchday & Live Games',
  'Chasing Past Losses',
  'Late-Night Isolation',
  'Payday / Spare Balance',
  'Boredom or Stress',
  'Promo SMS & Social Tips',
] as const;

export const DEFAULT_SURVEY_ANSWERS: RecoverySurveyAnswers = {
  primaryFormat: 'Sports & Live Odds',
  triggers: ['Matchday & Live Games', 'Chasing Past Losses'],
  spendBand: '₦2,500 – ₦10,000 / day',
  relapseFrequency: '1–2 slips per month',
  peakWindow: 'Evenings & Matchdays',
  supportReadiness: 'Want blockers + financial freeze',
};

export function evaluateRecoverySurvey(
  rawAnswers: RecoverySurveyAnswers,
  nowMs: number = Date.now(),
): EvaluatedSurveyProfile {
  const safeTriggers =
    rawAnswers.triggers.length > 0 ? rawAnswers.triggers.slice(0, 6) : ['General'];
  const answers: RecoverySurveyAnswers = {
    ...rawAnswers,
    triggers: safeTriggers,
  };

  let score = 14;

  // Gambling format risk weighting
  switch (answers.primaryFormat) {
    case 'Multiple Platforms':
      score += 20;
      break;
    case 'Crash / Aviator / Crypto':
    case 'Online Slots & Casino':
      score += 18;
      break;
    case 'Sports & Live Odds':
      score += 14;
      break;
    case 'Poker / Virtuals / Fantasy':
      score += 12;
      break;
  }

  // Spend intensity
  let recommendedDailySpendNgn = 5000;
  switch (answers.spendBand) {
    case 'Under ₦2,500 / day':
      score += 6;
      recommendedDailySpendNgn = 2000;
      break;
    case '₦2,500 – ₦10,000 / day':
      score += 14;
      recommendedDailySpendNgn = 5000;
      break;
    case '₦10,000 – ₦30,000 / day':
      score += 20;
      recommendedDailySpendNgn = 15000;
      break;
    case 'Above ₦30,000 / day':
      score += 26;
      recommendedDailySpendNgn = 35000;
      break;
  }

  // Relapse frequency
  switch (answers.relapseFrequency) {
    case 'First time quitting':
      score += 6;
      break;
    case '1–2 slips per month':
      score += 14;
      break;
    case 'Weekly slips':
      score += 22;
      break;
    case 'Daily urges / unable to stop alone':
      score += 28;
      break;
  }

  // Trigger count & chasing losses weighting
  score += Math.min(14, answers.triggers.length * 3);
  if (answers.triggers.includes('Chasing Past Losses')) {
    score += 6;
  }

  // Clamp 0..100
  const riskScore = Math.max(10, Math.min(100, score));

  const riskTier: SurveyRiskTier =
    riskScore >= 78
      ? 'CRITICAL'
      : riskScore >= 56
        ? 'HIGH'
        : riskScore >= 34
          ? 'MODERATE'
          : 'LOW';

  const recommendedLockDays =
    riskTier === 'CRITICAL'
      ? 365
      : riskTier === 'HIGH'
        ? 180
        : riskTier === 'MODERATE'
          ? 90
          : 30;

  const recommendedHighRiskSchedule: HighRiskScheduleConfig = {
    lateNightLockout:
      answers.peakWindow === 'Late Night (10 PM – 5 AM)' ||
      answers.triggers.includes('Late-Night Isolation') ||
      riskTier === 'HIGH' ||
      riskTier === 'CRITICAL',
    matchdayWeekendGuard:
      answers.peakWindow === 'Evenings & Matchdays' ||
      answers.peakWindow === 'Payday & Weekends' ||
      answers.primaryFormat === 'Sports & Live Odds' ||
      answers.triggers.includes('Matchday & Live Games'),
    paydaySurgeGuard:
      answers.peakWindow === 'Payday & Weekends' ||
      answers.triggers.includes('Payday / Spare Balance') ||
      riskTier !== 'LOW',
  };

  const recommendedStrictKeywords = true;
  const recommendedDepositGuard = true;

  const recommendations: SurveyRecommendationItem[] = [
    {
      id: 'preset_shield',
      priority: 'ESSENTIAL',
      title: `Arm ${recommendedLockDays}-Day Commitment Lock & Strict Guards`,
      description: `Matches your ${riskTier.toLowerCase()} risk profile by locking Categories, Cashier/Booking-Code Firewall, and High-Risk schedules around ${answers.peakWindow.toLowerCase()}.`,
      actionLabel: 'Apply Recommended Preset',
      actionTarget: 'apply_preset',
    },
    {
      id: 'bank_card_block',
      priority: riskTier === 'CRITICAL' || riskTier === 'HIGH' ? 'ESSENTIAL' : 'HIGH',
      title: 'Enable Bank Gambling Card & Transfer Friction',
      description:
        'Blocking websites stops impulse taps, while bank merchant freezes or secondary savings vaults stop deposits during late-night or payday urges.',
      actionLabel: 'Open Bank Block Guides',
      actionTarget: 'resources_bank',
    },
  ];

  if (
    answers.supportReadiness === 'Ready for long lock + accountability buddy' ||
    riskTier === 'CRITICAL' ||
    riskTier === 'HIGH'
  ) {
    recommendations.push({
      id: 'buddy_colock',
      priority: 'HIGH',
      title: 'Pair Device Admin Lock with Trusted Buddy Co-Lock',
      description:
        'Prevent impulsive uninstalls on Android and require a trusted partner verification code before any early lock changes.',
      actionLabel: 'Configure Lock & Buddy',
      actionTarget: 'lock',
    });
  }

  if (
    answers.relapseFrequency === 'Weekly slips' ||
    answers.relapseFrequency === 'Daily urges / unable to stop alone' ||
    answers.supportReadiness === 'Need immediate relapse / crisis help'
  ) {
    recommendations.push({
      id: 'relapse_protocol',
      priority: 'ESSENTIAL',
      title: 'Use the 48-Hour Post-Relapse Reset Protocol & Support Desk',
      description:
        'Break the shame-to-chase cycle immediately: pause new deposits, review the exact slip trigger, and message our confidential support team if you need guidance.',
      actionLabel: 'Open Support Desk',
      actionTarget: 'support',
    });
  } else {
    recommendations.push({
      id: 'app_guard_social',
      priority: 'RECOMMENDED',
      title: 'Block Social & Secondary Browsers Used to Open Slip Links',
      description:
        'Most relapses happen through forwarded X, Telegram, or Chrome links. Add your most-tempted browsers and social viewers to App Guard.',
      actionLabel: 'Open App & Site Blocklist',
      actionTarget: 'blocklist',
    });
  }

  const tierHeadline =
    riskTier === 'CRITICAL'
      ? 'Critical Protection Needed'
      : riskTier === 'HIGH'
        ? 'High-Friction Multi-Layer Plan'
        : riskTier === 'MODERATE'
          ? 'Structured Daily Shield Plan'
          : 'Preventative Foundation Plan';

  const summary = `${tierHeadline}: Focused on ${answers.primaryFormat} with ${answers.peakWindow.toLowerCase()} risk hardening, a recommended ${recommendedLockDays}-day Commitment Lock, and ₦${recommendedDailySpendNgn.toLocaleString('en-NG')}/day savings tracking.`;

  return {
    answers,
    riskScore,
    riskTier,
    recommendedLockDays,
    recommendedDailySpendNgn,
    recommendedHighRiskSchedule,
    recommendedStrictKeywords,
    recommendedDepositGuard,
    summary,
    recommendations,
    completedAtMs: nowMs,
  };
}
