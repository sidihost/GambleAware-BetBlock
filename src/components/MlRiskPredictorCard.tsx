import React from 'react';
import {
  Activity,
  ClipboardCheck,
  Clock3,
  Cpu,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { MlRiskEvaluation } from '../utils/mlRiskModel';
import { LiquidGlassCard, LiquidSectionHeader } from './LiquidGlass';

interface MlRiskPredictorCardProps {
  evaluation: MlRiskEvaluation;
  onOpenSurvey: () => void;
  onApplyAdaptiveHardening: () => void;
}

export const MlRiskPredictorCard: React.FC<MlRiskPredictorCardProps> = ({
  evaluation,
  onOpenSurvey,
  onApplyAdaptiveHardening,
}) => {
  // Semi-circular arc gauge geometry (r=42, arc length ~131.95)
  const radius = 40;
  const arcLength = Math.PI * radius;
  const progressFraction = evaluation.relapseProbabilityPct / 100;
  const strokeDashoffset = arcLength * (1 - progressFraction);

  const isElevated = evaluation.riskRegime === 'HIGH' || evaluation.riskRegime === 'CRITICAL';
  const regimeLabel =
    evaluation.riskRegime === 'CRITICAL'
      ? 'High alert'
      : evaluation.riskRegime === 'HIGH'
        ? 'Elevated'
        : evaluation.riskRegime === 'MODERATE'
          ? 'Moderate'
          : 'Low';

  return (
    <LiquidGlassCard className="p-3.5 sm:p-4" data-testid="ml-risk-predictor-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--soft-accent-bg)] text-[var(--accent-ink)]">
            <Cpu className="h-4 w-4" />
          </div>
          <LiquidSectionHeader
            title="Risk Outlook"
            subtitle="Estimated from recent attempts and your 6-question check-in"
          />
        </div>
        <span
          className={`shrink-0 font-mono text-[11px] font-semibold ${
            isElevated ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
          }`}
        >
          {regimeLabel} · {evaluation.confidencePct}% confidence
        </span>
      </div>

      {/* Main Forecast Grid: Semi-Circular Gauge + Predicted Peak Window */}
      <div className="mt-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 py-3">
          <div className="relative h-14 w-24 shrink-0">
            <svg viewBox="0 0 100 58" className="h-full w-full overflow-visible" aria-hidden="true">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="var(--subtle-border)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="var(--active-fill)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 220ms ease-out' }}
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 text-center">
              <span
                data-testid="ml-risk-probability"
                className="font-display text-lg font-bold tabular-nums text-[var(--ink)]"
              >
                {evaluation.relapseProbabilityPct}%
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[var(--ink-muted)]">Near-term urge risk</p>
            <p className="mt-0.5 text-sm font-bold leading-snug text-[var(--ink)]">
              {evaluation.headline}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent-ink)]">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            <span>Most likely trigger window</span>
          </div>
          <p className="mt-0.5 font-display text-sm font-bold text-[var(--ink)]">
            {evaluation.predictedPeakWindow}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-muted)]">
            {evaluation.summary}
          </p>
        </div>
      </div>

      {/* Feature Importance Attributions */}
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] font-medium text-[var(--ink-muted)]">
          <span>What shapes this estimate</span>
          <span className="font-mono">
            {evaluation.isSurveyCalibrated ? 'Check-in + activity' : 'Activity only'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {evaluation.factors.map((factor) => {
            const isProtective = factor.direction === 'protective';
            return (
              <div
                key={factor.id}
                className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-[var(--ink)]">
                    {isProtective ? (
                      <TrendingDown className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                    )}
                    <span className="truncate">{factor.label}</span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[11px] font-bold tabular-nums ${
                      isProtective
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-[var(--accent-ink)]'
                    }`}
                  >
                    {isProtective ? '-' : '+'}
                    {factor.impactPct}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted-fill)]">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      isProtective
                        ? 'bg-emerald-600 dark:bg-emerald-400'
                        : 'bg-[var(--active-fill)]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, factor.impactPct))}%` }}
                  />
                </div>
                <p className="mt-1 truncate text-[10px] text-[var(--ink-muted)]">{factor.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct Action Strip: Launch Recovery Survey + Recommended Settings */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onOpenSurvey}
          data-testid="open-ml-survey-button"
          className={`inline-flex min-h-[44px] w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-opacity sm:flex-1 ${
            !evaluation.isSurveyCalibrated
              ? 'bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90'
              : 'border border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
          }`}
        >
          <ClipboardCheck className="h-4 w-4 shrink-0" />
          <span>
            {evaluation.isSurveyCalibrated ? 'Update Check-In' : 'Take 6-Question Check-In'}
          </span>
        </button>

        {evaluation.needsHardening ? (
          <button
            type="button"
            onClick={onApplyAdaptiveHardening}
            data-testid="apply-ml-hardening-button"
            className={`inline-flex min-h-[44px] w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-opacity sm:flex-1 ${
              evaluation.isSurveyCalibrated
                ? 'bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90'
                : 'border border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Apply {evaluation.recommendedLockDays}d Protection</span>
          </button>
        ) : (
          <div className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-[var(--ink)] sm:flex-1">
            <Activity className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
            <span>Recommended Guards On</span>
          </div>
        )}
      </div>
    </LiquidGlassCard>
  );
};
