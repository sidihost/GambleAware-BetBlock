import {
  BlockedEventEntity,
  HighRiskScheduleConfig,
  RelapseLogEntity,
  UrgeLogEntity,
} from '../data/types';
import { EvaluatedSurveyProfile } from './recoverySurvey';

export type MlRiskRegime = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface MlFeatureFactor {
  id: string;
  label: string;
  impactPct: number;
  direction: 'risk' | 'protective';
  detail: string;
}

export interface MlRiskEvaluation {
  relapseProbabilityPct: number;
  confidencePct: number;
  riskRegime: MlRiskRegime;
  isSurveyCalibrated: boolean;
  predictedPeakWindow: string;
  headline: string;
  summary: string;
  factors: MlFeatureFactor[];
  recommendedSchedule: HighRiskScheduleConfig;
  recommendedLockDays: number;
  needsHardening: boolean;
  recommendedActionLabel: string;
}

export interface MlRiskInput {
  blockedEvents: BlockedEventEntity[];
  urgeLogs: UrgeLogEntity[];
  relapseLogs: RelapseLogEntity[];
  latestSurvey: EvaluatedSurveyProfile | null;
  cleanExactDays: number;
  highRiskSchedule: HighRiskScheduleConfig;
  isTimeLockedNow: boolean;
  depositGuardEnabled: boolean;
  strictKeywordFilter: boolean;
  bankedUrgeCount: number;
  nowMs?: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function evaluateMlRecoveryRisk(input: MlRiskInput): MlRiskEvaluation {
  const nowMs = input.nowMs ?? Date.now();
  const events = input.blockedEvents;
  const urges = input.urgeLogs;
  const relapses = input.relapseLogs;
  const survey = input.latestSurvey;

  // 1. Exponentially decayed attempt burst intensity (10m, 60m, 24h)
  let tenMinCount = 0;
  let sixtyMinCount = 0;
  let dayCount = 0;
  let lateNightSignals = 0;
  let weekendSignals = 0;
  let cashierOrChaseSignals = 0;

  for (const ev of events) {
    const ageMs = Math.max(0, nowMs - ev.timestamp);
    if (ageMs <= 10 * 60_000) tenMinCount += 1;
    if (ageMs <= 60 * 60_000) sixtyMinCount += 1;
    if (ageMs <= 86_400_000) dayCount += 1;

    if (ageMs <= 14 * 86_400_000) {
      const d = new Date(ev.timestamp);
      const hr = d.getHours();
      const dow = d.getDay();
      if (hr >= 22 || hr < 5) lateNightSignals += 1;
      if (dow === 0 || dow === 5 || dow === 6) weekendSignals += 1;
      const lower = `${ev.target} ${ev.source}`.toLowerCase();
      if (
        lower.includes('deposit') ||
        lower.includes('cashier') ||
        lower.includes('wallet') ||
        lower.includes('aviator')
      ) {
        cashierOrChaseSignals += 1;
      }
    }
  }

  for (const u of urges) {
    const ageMs = Math.max(0, nowMs - u.timestamp);
    if (ageMs <= 14 * 86_400_000) {
      const d = new Date(u.timestamp);
      const hr = d.getHours();
      const dow = d.getDay();
      if (hr >= 22 || hr < 5) lateNightSignals += 1;
      if (dow === 0 || dow === 5 || dow === 6) weekendSignals += 1;
      const tagLower = u.triggerTag.toLowerCase();
      if (tagLower.includes('chase') || tagLower.includes('payday')) {
        cashierOrChaseSignals += 1;
      }
    }
  }

  const nowDate = new Date(nowMs);
  const currentHour = nowDate.getHours();
  const currentDayOfMonth = nowDate.getDate();
  const currentDow = nowDate.getDay();
  const isNowLateNight = currentHour >= 22 || currentHour < 5;
  const isNowWeekend = currentDow === 0 || currentDow === 5 || currentDow === 6;
  const isNowPayday = currentDayOfMonth >= 25 || currentDayOfMonth <= 5;

  const attemptBurstFeature = clamp01(
    tenMinCount * 0.24 + sixtyMinCount * 0.12 + dayCount * 0.05,
  );

  const recentSignalTotal = Math.max(1, events.length + urges.length);
  const lateNightShare = lateNightSignals / recentSignalTotal;
  const lateNightFeature = clamp01(
    lateNightShare * 0.72 +
      (isNowLateNight ? 0.30 : 0) +
      (survey?.answers.peakWindow === 'Late Night (10 PM – 5 AM)' ? 0.22 : 0),
  );

  const weekendShare = weekendSignals / recentSignalTotal;
  const matchdayFeature = clamp01(
    weekendShare * 0.65 +
      (isNowWeekend ? 0.25 : 0) +
      (survey?.answers.peakWindow === 'Evenings & Matchdays' ? 0.25 : 0),
  );

  // 4. Exponential recency decay over relapse logs (half-life ~14 days)
  let relapseDecaySum = 0;
  for (const r of relapses) {
    const ageDays = Math.max(0, (nowMs - r.timestamp) / 86_400_000);
    relapseDecaySum += Math.exp(-ageDays / 14);
  }
  const relapseRecencyFeature = clamp01(relapseDecaySum * 0.58);

  // 5. Survey Baseline Risk Prior (neutral 0.38 if user hasn't taken survey yet)
  const surveyPriorFeature = survey ? clamp01(survey.riskScore / 100) : 0.38;

  // 6. Chasing-losses / trigger density
  const surveyTriggersCount = survey?.answers.triggers.length ?? 2;
  const hasChasingTrigger = Boolean(
    survey?.answers.triggers.some((t) => t.toLowerCase().includes('chasing')),
  );
  const triggerLoadFeature = clamp01(
    (surveyTriggersCount / 6) * 0.45 +
      (hasChasingTrigger ? 0.25 : 0) +
      Math.min(0.4, cashierOrChaseSignals * 0.12),
  );

  // 7. Protective: Resisted urges + urge-banked stakes
  const recentUrgeWins = urges.filter((u) => nowMs - u.timestamp <= 30 * 86_400_000).length;
  const urgeResistanceFeature = clamp01(
    recentUrgeWins * 0.14 + (input.bankedUrgeCount || 0) * 0.12,
  );

  // 8. Protective: Clean streak logarithmic neuro-adaptation (peaks near 90 days)
  const safeCleanDays = Math.max(0, input.cleanExactDays);
  const cleanStreakFeature = clamp01(Math.log1p(safeCleanDays) / Math.log1p(90));

  // 9. Protective: Active Shield Lock & Guard Barriers
  const lockBarrierFeature = clamp01(
    (input.isTimeLockedNow ? 0.45 : 0) +
      (input.depositGuardEnabled ? 0.22 : 0) +
      (input.strictKeywordFilter ? 0.18 : 0) +
      (input.highRiskSchedule.lateNightLockout ? 0.08 : 0) +
      (input.highRiskSchedule.matchdayWeekendGuard ? 0.07 : 0),
  );

  // Calibrated Logistic Regression weights
  const intercept = -0.58;
  const weightedTerms = [
    {
      id: 'relapse_recency',
      label: 'Recent slip',
      weight: 2.05,
      value: relapseRecencyFeature,
      direction: 'risk' as const,
      detail:
        relapses.length > 0
          ? `${relapses.length} slip reset${relapses.length === 1 ? '' : 's'} logged — stay extra cautious`
          : 'No slips recorded',
    },
    {
      id: 'attempt_burst',
      label: 'Repeated attempts',
      weight: 1.85,
      value: attemptBurstFeature,
      direction: 'risk' as const,
      detail:
        sixtyMinCount > 0 || tenMinCount > 0
          ? `${tenMinCount} blocked in 10 min · ${sixtyMinCount} in 60 min`
          : `${dayCount} blocked attempts in 24 hours`,
    },
    {
      id: 'survey_prior',
      label: survey ? 'Check-in baseline' : 'Default baseline',
      weight: 1.35,
      value: surveyPriorFeature,
      direction: 'risk' as const,
      detail: survey
        ? `${survey.answers.primaryFormat} · ${survey.riskScore}/100 check-in score`
        : 'Answer the 6 questions to match your habits',
    },
    {
      id: 'late_night',
      label: 'Late-night hours',
      weight: 1.15,
      value: lateNightFeature,
      direction: 'risk' as const,
      detail: isNowLateNight
        ? 'Inside 10 PM – 5 AM late-night hours'
        : `${lateNightSignals} late-night attempt${lateNightSignals === 1 ? '' : 's'} logged`,
    },
    {
      id: 'matchday_cluster',
      label: 'Weekend matches',
      weight: 0.90,
      value: matchdayFeature,
      direction: 'risk' as const,
      detail: isNowWeekend
        ? 'Weekend match window active'
        : `${weekendSignals} Fri–Sun attempt${weekendSignals === 1 ? '' : 's'}`,
    },
    {
      id: 'trigger_load',
      label: 'Reported triggers',
      weight: 0.85,
      value: triggerLoadFeature,
      direction: 'risk' as const,
      detail: hasChasingTrigger
        ? 'Chasing past losses flagged'
        : `${surveyTriggersCount} triggers tracked`,
    },
    {
      id: 'clean_streak',
      label: 'Clean streak',
      weight: -1.75,
      value: cleanStreakFeature,
      direction: 'protective' as const,
      detail:
        safeCleanDays >= 1
          ? `${Math.floor(safeCleanDays)} days without betting builds steadiness`
          : 'First 72 hours set the tone',
    },
    {
      id: 'urge_resistance',
      label: 'Resisted urges',
      weight: -1.15,
      value: urgeResistanceFeature,
      direction: 'protective' as const,
      detail:
        recentUrgeWins + (input.bankedUrgeCount || 0) > 0
          ? `${recentUrgeWins} urge${recentUrgeWins === 1 ? '' : 's'} logged · ${input.bankedUrgeCount} stakes saved`
          : 'Log urges or save avoided stakes to lower risk',
    },
    {
      id: 'lock_barrier',
      label: 'Active locks',
      weight: -0.95,
      value: lockBarrierFeature,
      direction: 'protective' as const,
      detail: input.isTimeLockedNow
        ? 'Lock timer and strict filters active'
        : 'Set a lock timer to make disabling harder',
    },
  ];

  let logit = intercept;
  let totalAbsContribution = 0;
  const contributions = weightedTerms.map((term) => {
    const c = term.weight * term.value;
    logit += c;
    totalAbsContribution += Math.abs(c);
    return { ...term, contribution: c };
  });

  const rawProb = sigmoid(logit) * 100;
  const relapseProbabilityPct = Math.max(3, Math.min(97, Math.round(rawProb)));

  const riskRegime: MlRiskRegime =
    relapseProbabilityPct >= 72
      ? 'CRITICAL'
      : relapseProbabilityPct >= 50
        ? 'HIGH'
        : relapseProbabilityPct >= 28
          ? 'MODERATE'
          : 'LOW';

  // Model confidence grows with survey completion + telemetry samples
  const telemetrySamples = events.length + urges.length + relapses.length + (input.bankedUrgeCount || 0);
  const confidencePct = Math.max(
    48,
    Math.min(
      98,
      Math.round(
        50 +
          (survey ? 26 : 0) +
          Math.min(18, telemetrySamples * 3) +
          (safeCleanDays >= 3 ? 4 : 0),
      ),
    ),
  );

  // Predict Peak Vulnerability Window
  let predictedPeakWindow = 'Steady across the day';
  if (lateNightFeature >= 0.48 || survey?.answers.peakWindow === 'Late Night (10 PM – 5 AM)') {
    predictedPeakWindow = 'Tonight, 10:00 PM – 5:00 AM';
  } else if (
    isNowPayday ||
    survey?.answers.peakWindow === 'Payday & Weekends' ||
    survey?.answers.triggers.includes('Payday / Spare Balance')
  ) {
    predictedPeakWindow = 'Paydays & Weekends (25th–5th)';
  } else if (
    matchdayFeature >= 0.45 ||
    survey?.answers.peakWindow === 'Evenings & Matchdays' ||
    survey?.answers.primaryFormat === 'Sports & Live Odds'
  ) {
    predictedPeakWindow = 'Matchdays & Evening Kickoffs';
  } else if (attemptBurstFeature >= 0.35) {
    predictedPeakWindow = 'Next 60 minutes (recent attempts)';
  }

  // Top 4 normalized feature factors (show impactful drivers even when calm)
  const denom = Math.max(0.25, totalAbsContribution);
  const factors: MlFeatureFactor[] = contributions
    .filter((f) => Math.abs(f.contribution) >= 0.04)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 4)
    .map((f) => ({
      id: f.id,
      label: f.label,
      impactPct: Math.max(4, Math.min(68, Math.round((Math.abs(f.contribution) / denom) * 100))),
      direction: f.direction,
      detail: f.detail,
    }));

  const recommendedSchedule: HighRiskScheduleConfig = {
    lateNightLockout:
      input.highRiskSchedule.lateNightLockout ||
      lateNightFeature >= 0.40 ||
      Boolean(survey?.recommendedHighRiskSchedule.lateNightLockout) ||
      riskRegime === 'HIGH' ||
      riskRegime === 'CRITICAL',
    matchdayWeekendGuard:
      input.highRiskSchedule.matchdayWeekendGuard ||
      matchdayFeature >= 0.38 ||
      Boolean(survey?.recommendedHighRiskSchedule.matchdayWeekendGuard) ||
      riskRegime === 'HIGH' ||
      riskRegime === 'CRITICAL',
    paydaySurgeGuard:
      input.highRiskSchedule.paydaySurgeGuard ||
      isNowPayday ||
      Boolean(survey?.recommendedHighRiskSchedule.paydaySurgeGuard) ||
      riskRegime !== 'LOW',
  };

  const recommendedLockDays =
    riskRegime === 'CRITICAL'
      ? 365
      : riskRegime === 'HIGH'
        ? 180
        : riskRegime === 'MODERATE'
          ? 90
          : 30;

  const scheduleMissing =
    (recommendedSchedule.lateNightLockout && !input.highRiskSchedule.lateNightLockout) ||
    (recommendedSchedule.matchdayWeekendGuard && !input.highRiskSchedule.matchdayWeekendGuard) ||
    (recommendedSchedule.paydaySurgeGuard && !input.highRiskSchedule.paydaySurgeGuard);

  const needsHardening =
    !input.depositGuardEnabled ||
    !input.strictKeywordFilter ||
    !input.isTimeLockedNow ||
    scheduleMissing;

  const headline =
    riskRegime === 'CRITICAL'
      ? 'High risk right now — tighten protections'
      : riskRegime === 'HIGH'
        ? 'Elevated urge risk'
        : riskRegime === 'MODERATE'
          ? 'Moderate risk ahead'
          : 'Low urge risk';

  const summary = survey
    ? `Estimated from your check-in and recent activity (${relapseProbabilityPct}% risk). Peak window: ${predictedPeakWindow}.`
    : `Estimated from recent activity (${relapseProbabilityPct}% baseline). Complete the 6-question check-in to tailor this to your habits.`;

  const recommendedActionLabel = !survey
    ? 'Complete 6-Question Check-In'
    : needsHardening
      ? `Apply ${recommendedLockDays}-Day Lock Preset`
      : 'Review Activity';

  return {
    relapseProbabilityPct,
    confidencePct,
    riskRegime,
    isSurveyCalibrated: Boolean(survey),
    predictedPeakWindow,
    headline,
    summary,
    factors,
    recommendedSchedule,
    recommendedLockDays,
    needsHardening,
    recommendedActionLabel,
  };
}
