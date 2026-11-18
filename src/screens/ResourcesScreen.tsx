import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  ExternalLink,
  Landmark,
  LifeBuoy,
  LockKeyhole,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { LiquidGlassCard, LiquidSectionHeader } from '../components/LiquidGlass';
import { DerivedMainState, SupportTicketRecord } from '../data/types';
import { formatNaira } from '../utils/currency';
import {
  RECOVERY_RESOURCES,
  RELAPSE_QUICK_ACTIONS,
  RESOURCE_CATEGORY_LABELS,
  ResourceCategory,
} from '../utils/recoveryResources';
import {
  DEFAULT_SURVEY_ANSWERS,
  EvaluatedSurveyProfile,
  RecoverySurveyAnswers,
  SURVEY_TRIGGER_OPTIONS,
  SurveyPeakWindow,
  SurveyPrimaryFormat,
  SurveyRelapseFrequency,
  SurveySpendBand,
  SurveySupportReadiness,
} from '../utils/recoverySurvey';

export type ResourcesTab = 'all' | 'survey' | 'library' | 'support';

interface ResourcesScreenProps {
  state: DerivedMainState;
  userEmail: string | null;
  cloudError: string | null;
  userTickets: SupportTicketRecord[];
  initialTab?: ResourcesTab;
  tabNonce?: number;
  onSignIn: () => void;
  onSubmitSurvey: (answers: RecoverySurveyAnswers) => EvaluatedSurveyProfile;
  onApplySurveyPreset: (profile: EvaluatedSurveyProfile) => void;
  onLogRelapseReset: (params: {
    trigger: string;
    note: string;
    tightenLockDays: number;
    resetStreakTimer: boolean;
  }) => void;
  onCreateSupportTicket: (input: {
    category: SupportTicketRecord['category'];
    urgency: SupportTicketRecord['urgency'];
    subject: string;
    message: string;
  }) => Promise<boolean>;
  onNavigateToLock: () => void;
  onNavigateToBlocklist: () => void;
}

const PRIMARY_FORMATS: SurveyPrimaryFormat[] = [
  'Sports & Live Odds',
  'Online Slots & Casino',
  'Crash / Aviator / Crypto',
  'Poker / Virtuals / Fantasy',
  'Multiple Platforms',
];

const SPEND_BANDS: SurveySpendBand[] = [
  'Under ₦2,500 / day',
  '₦2,500 – ₦10,000 / day',
  '₦10,000 – ₦30,000 / day',
  'Above ₦30,000 / day',
];

const RELAPSE_FREQUENCIES: SurveyRelapseFrequency[] = [
  'First time quitting',
  '1–2 slips per month',
  'Weekly slips',
  'Daily urges / unable to stop alone',
];

const PEAK_WINDOWS: SurveyPeakWindow[] = [
  'Mornings & Work Hours',
  'Evenings & Matchdays',
  'Late Night (10 PM – 5 AM)',
  'Payday & Weekends',
];

const SUPPORT_READINESS_OPTIONS: SurveySupportReadiness[] = [
  'Just want strong blocking',
  'Want blockers + financial freeze',
  'Ready for long lock + accountability buddy',
  'Need immediate relapse / crisis help',
];

const RELAPSE_TRIGGER_CHOICES = [
  'Matchday Impulse',
  'Late-Night Chasing Losses',
  'Payday / Spare Balance',
  'Promo SMS / Social Link',
  'Stress or Isolation',
];

const TICKET_CATEGORIES: Array<{ value: SupportTicketRecord['category']; label: string }> = [
  { value: 'RECOVERY_HELP', label: 'Recovery Guidance' },
  { value: 'RELAPSE_SUPPORT', label: 'Post-Relapse Support' },
  { value: 'BANK_EXCLUSION', label: 'Bank Block & Self-Exclusion' },
  { value: 'BLOCKER_ISSUE', label: 'Website or App Bypass' },
  { value: 'LOCK_OR_PIN', label: 'Commitment Lock or PIN' },
];

export const ResourcesScreen: React.FC<ResourcesScreenProps> = ({
  state,
  userEmail,
  cloudError,
  userTickets,
  initialTab = 'all',
  tabNonce = 0,
  onSignIn,
  onSubmitSurvey,
  onApplySurveyPreset,
  onLogRelapseReset,
  onCreateSupportTicket,
  onNavigateToLock,
  onNavigateToBlocklist,
}) => {
  const [activeTab, setActiveTab] = useState<ResourcesTab>(initialTab);
  const [resourceFilter, setResourceFilter] = useState<'ALL' | ResourceCategory>('ALL');

  useEffect(() => {
    if (tabNonce > 0) {
      setActiveTab(initialTab);
    }
  }, [initialTab, tabNonce]);

  // Survey state seeded with last saved assessment if available
  const [surveyAnswers, setSurveyAnswers] = useState<RecoverySurveyAnswers>(
    () => state.latestSurvey?.answers ?? DEFAULT_SURVEY_ANSWERS,
  );
  const [surveyResult, setSurveyResult] = useState<EvaluatedSurveyProfile | null>(
    () => state.latestSurvey,
  );

  // Relapse 48h Protocol modal state
  const [relapseModalOpen, setRelapseModalOpen] = useState(false);
  const [relapseTrigger, setRelapseTrigger] = useState(RELAPSE_TRIGGER_CHOICES[0]);
  const [relapseNote, setRelapseNote] = useState('');
  const [tightenLockDays, setTightenLockDays] = useState(30);
  const [resetStreakTimer, setResetStreakTimer] = useState(true);

  // Support ticket form state
  const [ticketCategory, setTicketCategory] =
    useState<SupportTicketRecord['category']>('RECOVERY_HELP');
  const [ticketUrgency, setTicketUrgency] =
    useState<SupportTicketRecord['urgency']>('STANDARD');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState<string | null>(null);

  const filteredResources = useMemo(() => {
    if (resourceFilter === 'ALL') return RECOVERY_RESOURCES;
    return RECOVERY_RESOURCES.filter((r) => r.category === resourceFilter);
  }, [resourceFilter]);

  const toggleSurveyTrigger = (trigger: string) => {
    setSurveyAnswers((prev) => {
      const exists = prev.triggers.includes(trigger);
      if (exists) {
        const next = prev.triggers.filter((t) => t !== trigger);
        return { ...prev, triggers: next.length > 0 ? next : [trigger] };
      }
      return { ...prev, triggers: [...prev.triggers, trigger].slice(0, 6) };
    });
  };

  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const evaluated = onSubmitSurvey(surveyAnswers);
    setSurveyResult(evaluated);
  };

  const handleRecommendationAction = (
    target: EvaluatedSurveyProfile['recommendations'][number]['actionTarget'],
    profile: EvaluatedSurveyProfile,
  ) => {
    switch (target) {
      case 'apply_preset':
        onApplySurveyPreset(profile);
        break;
      case 'lock':
        onNavigateToLock();
        break;
      case 'blocklist':
        onNavigateToBlocklist();
        break;
      case 'resources_bank':
        setActiveTab('library');
        setResourceFilter('FINANCIAL_BLOCKS');
        break;
      case 'resources_relapse':
        setRelapseModalOpen(true);
        break;
      case 'support':
        setActiveTab('support');
        break;
    }
  };

  const handleRelapseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogRelapseReset({
      trigger: relapseTrigger,
      note: relapseNote,
      tightenLockDays,
      resetStreakTimer,
    });
    setRelapseNote('');
    setRelapseModalOpen(false);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketFeedback(null);
    setSubmittingTicket(true);
    try {
      const ok = await onCreateSupportTicket({
        category: ticketCategory,
        urgency: ticketUrgency,
        subject: ticketSubject,
        message: ticketMessage,
      });
      if (ok) {
        setTicketSubject('');
        setTicketMessage('');
        setTicketFeedback('Support request sent confidentially. You will see replies right here.');
      }
    } finally {
      setSubmittingTicket(false);
    }
  };

  const showSurvey = activeTab === 'all' || activeTab === 'survey';
  const showLibrary = activeTab === 'all' || activeTab === 'library';
  const showSupport = activeTab === 'all' || activeTab === 'support';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3.5 px-3.5 pt-3.5 pb-24 sm:px-5 md:px-6 md:pt-5 md:pb-12">
      {/* Page Title & Clean View Switcher */}
      <div className="flex flex-col justify-between gap-2.5 px-0.5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl">
            Recovery Resources &amp; Support
          </h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Short check-in, bank card freezes, national self-exclusion, and private support
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Resources sections"
          className="inline-flex flex-wrap gap-1 self-start rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] p-1 sm:self-auto"
        >
          {(
            [
              { id: 'all', label: 'All Tools' },
              { id: 'survey', label: 'Survey Plan' },
              { id: 'library', label: 'Bank & Guides' },
              { id: 'support', label: 'Support Desk' },
            ] as const
          ).map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  selected
                    ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Urgent Relapse 48-Hour Reset Banner Card */}
      <LiquidGlassCard className="p-3.5 sm:p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--soft-accent-bg)] text-[var(--accent-ink)]">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-[15px] font-bold text-[var(--ink)]">
                  Had a Slip? 48-Hour Reset
                </h2>
                {state.relapseLogs.length > 0 ? (
                  <span className="font-mono text-[11px] font-semibold text-[var(--ink-muted)]">
                    · {state.relapseLogs.length} logged reset
                    {state.relapseLogs.length === 1 ? '' : 's'}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                One slip does not wipe out your progress. Stop chasing losses right away, tighten
                your filters, extend your lock, and give yourself 48 calm hours.
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {RELAPSE_QUICK_ACTIONS.map((step) => (
                  <p key={step} className="text-[11px] text-[var(--ink)]">
                    <span className="font-bold text-[var(--accent-ink)]">·</span> {step}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRelapseModalOpen(true)}
            data-testid="open-relapse-protocol-button"
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Start 48-Hour Reset</span>
          </button>
        </div>
      </LiquidGlassCard>

      {/* Section 1: Personalized Recovery Survey & Recommendations */}
      {showSurvey ? (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
          <LiquidGlassCard className="p-3.5 sm:p-4 lg:col-span-7">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--soft-accent-bg)] text-[var(--accent-ink)]">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <LiquidSectionHeader
                title="6-Question Check-In"
                subtitle="Answer six short questions to pick a suitable lock length and schedule."
              />
            </div>

            <form onSubmit={handleSurveySubmit} className="mt-4 space-y-4">
              {/* Q1 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--ink)]">
                  1. Primary gambling format you want blocked
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRIMARY_FORMATS.map((option) => {
                    const selected = surveyAnswers.primaryFormat === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setSurveyAnswers((prev) => ({ ...prev, primaryFormat: option }))
                        }
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                            : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q2 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--ink)]">
                  2. Common triggers (select all that apply)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SURVEY_TRIGGER_OPTIONS.map((trigger) => {
                    const selected = surveyAnswers.triggers.includes(trigger);
                    return (
                      <button
                        key={trigger}
                        type="button"
                        onClick={() => toggleSurveyTrigger(trigger)}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                            : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {trigger}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q3 & Q4 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="survey-spend-band"
                    className="mb-1.5 block text-xs font-semibold text-[var(--ink)]"
                  >
                    3. Typical daily stake
                  </label>
                  <select
                    id="survey-spend-band"
                    value={surveyAnswers.spendBand}
                    onChange={(e) =>
                      setSurveyAnswers((prev) => ({
                        ...prev,
                        spendBand: e.target.value as SurveySpendBand,
                      }))
                    }
                    className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs font-medium text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                  >
                    {SPEND_BANDS.map((band) => (
                      <option key={band} value={band}>
                        {band}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="survey-relapse-freq"
                    className="mb-1.5 block text-xs font-semibold text-[var(--ink)]"
                  >
                    4. Recent relapse frequency
                  </label>
                  <select
                    id="survey-relapse-freq"
                    value={surveyAnswers.relapseFrequency}
                    onChange={(e) =>
                      setSurveyAnswers((prev) => ({
                        ...prev,
                        relapseFrequency: e.target.value as SurveyRelapseFrequency,
                      }))
                    }
                    className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs font-medium text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                  >
                    {RELAPSE_FREQUENCIES.map((freq) => (
                      <option key={freq} value={freq}>
                        {freq}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Q5 & Q6 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="survey-peak-window"
                    className="mb-1.5 block text-xs font-semibold text-[var(--ink)]"
                  >
                    5. Highest-risk time window
                  </label>
                  <select
                    id="survey-peak-window"
                    value={surveyAnswers.peakWindow}
                    onChange={(e) =>
                      setSurveyAnswers((prev) => ({
                        ...prev,
                        peakWindow: e.target.value as SurveyPeakWindow,
                      }))
                    }
                    className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs font-medium text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                  >
                    {PEAK_WINDOWS.map((win) => (
                      <option key={win} value={win}>
                        {win}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="survey-support-readiness"
                    className="mb-1.5 block text-xs font-semibold text-[var(--ink)]"
                  >
                    6. Protection readiness
                  </label>
                  <select
                    id="survey-support-readiness"
                    value={surveyAnswers.supportReadiness}
                    onChange={(e) =>
                      setSurveyAnswers((prev) => ({
                        ...prev,
                        supportReadiness: e.target.value as SurveySupportReadiness,
                      }))
                    }
                    className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs font-medium text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                  >
                    {SUPPORT_READINESS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                data-testid="generate-survey-plan-button"
                className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>See Suggested Plan</span>
              </button>
            </form>
          </LiquidGlassCard>

          {/* Tailored Recommendations Output */}
          <LiquidGlassCard className="flex flex-col justify-between p-3.5 sm:p-4 lg:col-span-5">
            {surveyResult ? (
              <div data-testid="survey-recommendation-panel">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] font-bold tracking-wider text-[var(--accent-ink)] uppercase">
                      Priority · {surveyResult.riskTier}
                    </p>
                    <h2 className="mt-0.5 font-display text-lg font-bold text-[var(--ink)]">
                      Suggested Plan
                    </h2>
                  </div>
                  <div className="rounded-[12px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-2.5 py-1.5 text-right">
                    <p className="text-[10px] text-[var(--ink-muted)]">Score</p>
                    <p className="font-mono text-sm font-bold text-[var(--ink)] tabular-nums">
                      {surveyResult.riskScore}/100
                    </p>
                  </div>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  {surveyResult.summary}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-2">
                    <p className="text-[10px] text-[var(--ink-muted)]">Recommended Lock</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-[var(--ink)] tabular-nums">
                      {surveyResult.recommendedLockDays} Days
                    </p>
                  </div>
                  <div className="rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-2">
                    <p className="text-[10px] text-[var(--ink-muted)]">Daily Spend Estimate</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-[var(--accent-ink)] tabular-nums">
                      {formatNaira(surveyResult.recommendedDailySpendNgn)}
                    </p>
                  </div>
                </div>

                {/* Live ML Engine Sync Readout */}
                <div className="mt-2.5 flex items-center justify-between gap-2 rounded-[14px] border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Cpu className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-[var(--ink)]">
                        Risk Estimate ({state.mlRisk.confidencePct}% confidence)
                      </p>
                      <p className="truncate text-[10px] text-[var(--ink-muted)]">
                        Higher-risk window: {state.mlRisk.predictedPeakWindow}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                    {state.mlRisk.relapseProbabilityPct}%
                  </span>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  {surveyResult.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-[16px] border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[var(--ink)]">{rec.title}</p>
                        <span className="shrink-0 font-mono text-[10px] font-bold text-[var(--accent-ink)]">
                          {rec.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--ink-muted)]">
                        {rec.description}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRecommendationAction(rec.actionTarget, surveyResult)}
                        className={`mt-2.5 inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-3.5 text-[11px] font-semibold transition-opacity ${
                          rec.actionTarget === 'apply_preset'
                            ? 'bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90'
                            : 'border border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                        }`}
                      >
                        {rec.actionLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] text-[var(--accent-ink)]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="mt-3 font-display text-base font-bold text-[var(--ink)]">
                  Check-In Summary
                </h2>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-[var(--ink-muted)]">
                  Complete the six questions on the left to get a suggested lock length, schedule,
                  and bank-blocking steps tailored to your habits.
                </p>
              </div>
            )}
          </LiquidGlassCard>
        </div>
      ) : null}

      {/* Section 2: Gamban-Parity Resources Library */}
      {showLibrary ? (
        <LiquidGlassCard className="p-3.5 sm:p-4">
          <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--soft-accent-bg)] text-[var(--accent-ink)]">
                <BookOpen className="h-4 w-4" />
              </div>
              <LiquidSectionHeader
                title="Bank Blocks &amp; Self-Exclusion"
                subtitle="Pair device blocking with card freezes and national exclusion tools"
              />
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {(
              [
                { id: 'ALL', label: 'All Guides' },
                { id: 'FINANCIAL_BLOCKS', label: RESOURCE_CATEGORY_LABELS.FINANCIAL_BLOCKS },
                { id: 'SELF_EXCLUSION', label: RESOURCE_CATEGORY_LABELS.SELF_EXCLUSION },
                { id: 'HELPLINES', label: RESOURCE_CATEGORY_LABELS.HELPLINES },
                { id: 'RELAPSE_CBT', label: RESOURCE_CATEGORY_LABELS.RELAPSE_CBT },
              ] as const
            ).map((cat) => {
              const selected = resourceFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setResourceFilter(cat.id)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className="flex flex-col justify-between rounded-[18px] border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold tracking-wider text-[var(--accent-ink)] uppercase">
                      {RESOURCE_CATEGORY_LABELS[res.category]}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                      {res.region}
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-display text-sm font-bold text-[var(--ink)]">
                    {res.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                    {res.subtitle}
                  </p>
                  <ul className="mt-2.5 space-y-1.5">
                    {res.steps.map((step) => (
                      <li
                        key={step}
                        className="flex items-start gap-2 text-xs leading-snug text-[var(--ink)]"
                      >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {res.phone || res.url ? (
                  <div className="mt-3.5 flex flex-wrap gap-2 border-t border-[var(--subtle-border)] pt-3">
                    {res.phone ? (
                      <a
                        href={`tel:${res.phone.replace(/[^+\d]/g, '')}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-[11px] font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                      >
                        <PhoneCall className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                        <span>{res.phone}</span>
                      </a>
                    ) : null}
                    {res.url ? (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-[11px] font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                      >
                        {res.category === 'FINANCIAL_BLOCKS' ? (
                          <Landmark className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                        )}
                        <span>{res.urlLabel || 'Open Official Site'}</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </LiquidGlassCard>
      ) : null}

      {/* Section 3: Confidential Support Desk */}
      {showSupport ? (
        <LiquidGlassCard className="p-3.5 sm:p-4">
          <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--soft-accent-bg)] text-[var(--accent-ink)]">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <LiquidSectionHeader
                title="Private Support"
                subtitle="Message our team about slip recovery, bank blocks, or sites that bypassed protection"
              />
            </div>

            {userEmail ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[var(--ink)]">
                <UserCheck className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                <span>{userEmail}</span>
              </span>
            ) : null}
          </div>

          {cloudError ? (
            <div className="mt-3 flex items-start gap-2 rounded-[14px] border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] p-3 text-xs text-[var(--ink)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              <p>{cloudError}</p>
            </div>
          ) : null}

          {!userEmail ? (
            <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-[18px] border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Sign in with Google to message Support &amp; view replies
                </p>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  All blocker rules remain 100% private and local. Google Sign-In is only needed so
                  support staff can reply securely to your thread.
                </p>
              </div>
              <button
                type="button"
                onClick={onSignIn}
                data-testid="support-google-signin-button"
                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                <UserCheck className="h-4 w-4" />
                <span>Sign In with Google</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* New Ticket Form */}
              <form onSubmit={(e) => void handleTicketSubmit(e)} className="space-y-3 lg:col-span-6">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="ticket-category"
                      className="mb-1 block text-xs font-semibold text-[var(--ink)]"
                    >
                      Topic
                    </label>
                    <select
                      id="ticket-category"
                      value={ticketCategory}
                      onChange={(e) =>
                        setTicketCategory(e.target.value as SupportTicketRecord['category'])
                      }
                      className="h-10 w-full rounded-[12px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                    >
                      {TICKET_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ticket-urgency"
                      className="mb-1 block text-xs font-semibold text-[var(--ink)]"
                    >
                      Urgency
                    </label>
                    <select
                      id="ticket-urgency"
                      value={ticketUrgency}
                      onChange={(e) =>
                        setTicketUrgency(e.target.value as SupportTicketRecord['urgency'])
                      }
                      className="h-10 w-full rounded-[12px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                    >
                      <option value="STANDARD">Standard</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent (Immediate Support)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ticket-subject"
                    className="mb-1 block text-xs font-semibold text-[var(--ink)]"
                  >
                    Subject
                  </label>
                  <input
                    id="ticket-subject"
                    type="text"
                    required
                    minLength={3}
                    maxLength={140}
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Need help blocking a new mirror site or relapse support"
                    className="h-10 w-full rounded-[12px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ticket-message"
                    className="mb-1 block text-xs font-semibold text-[var(--ink)]"
                  >
                    Message
                  </label>
                  <textarea
                    id="ticket-message"
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={4}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Share how we can help. Keep sensitive banking PINs private."
                    className="w-full rounded-[12px] border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                  />
                </div>

                {ticketFeedback ? (
                  <p className="text-xs font-medium text-[var(--accent-ink)]">{ticketFeedback}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submittingTicket ? 'Sending...' : 'Send Support Request'}</span>
                </button>
              </form>

              {/* Ticket Thread History */}
              <div className="space-y-2.5 lg:col-span-6">
                <p className="text-xs font-semibold text-[var(--ink)]">
                  Your Support Threads ({userTickets.length})
                </p>
                {userTickets.length === 0 ? (
                  <div className="rounded-[16px] border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4 text-xs text-[var(--ink-muted)]">
                    No support requests submitted yet. Messages sent here stay private between you
                    and the GambleAware support administrator.
                  </div>
                ) : (
                  <div className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
                    {userTickets.map((tkt) => (
                      <div
                        key={tkt.ticketId}
                        className="rounded-[16px] border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-bold text-[var(--ink)]">
                            {tkt.subject}
                          </p>
                          <span className="shrink-0 font-mono text-[10px] font-bold text-[var(--accent-ink)]">
                            {tkt.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                          {tkt.message}
                        </p>
                        {tkt.adminReply ? (
                          <div className="mt-2.5 rounded-[12px] border border-[var(--glass-border)] bg-[var(--muted-fill)] p-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--accent-ink)]">
                              <MessageSquare className="h-3 w-3" />
                              <span>Support Team Reply</span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--ink)]">
                              {tkt.adminReply}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </LiquidGlassCard>
      ) : null}

      {/* Relapse Reset Modal */}
      {relapseModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="48-Hour Relapse Reset Protocol"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <form
            onSubmit={handleRelapseSubmit}
            className="max-h-[90dvh] w-full max-w-[460px] overflow-y-auto rounded-t-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4 text-[var(--ink)] sm:rounded-2xl sm:p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <h2 className="font-display text-base font-bold">48-Hour Reset</h2>
              </div>
              <button
                type="button"
                onClick={() => setRelapseModalOpen(false)}
                aria-label="Close relapse reset dialog"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              Note what triggered the slip. Submitting tightens keyword, search, and deposit blocking
              right away so things stay steady from here.
            </p>

            <div className="mt-3.5">
              <p className="mb-1.5 text-xs font-semibold text-[var(--ink)]">What led to this slip?</p>
              <div className="flex flex-wrap gap-1.5">
                {RELAPSE_TRIGGER_CHOICES.map((choice) => {
                  const selected = relapseTrigger === choice;
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setRelapseTrigger(choice)}
                      className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--muted-fill)] text-[var(--ink)]'
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3.5">
              <p className="mb-1.5 text-xs font-semibold text-[var(--ink)]">
                Lock Protection Extension
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {[
                  { days: 7, label: '+7 Days' },
                  { days: 30, label: '+30 Days' },
                  { days: 90, label: '+90 Days' },
                  { days: 0, label: 'Keep Lock' },
                ].map((opt) => {
                  const selected = tightenLockDays === opt.days;
                  return (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setTightenLockDays(opt.days)}
                      className={`h-9 cursor-pointer rounded-xl border text-xs font-semibold ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-3.5 flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-2.5 text-xs font-medium text-[var(--ink)]">
              <input
                type="checkbox"
                checked={resetStreakTimer}
                onChange={(e) => setResetStreakTimer(e.target.checked)}
                className="h-4 w-4 accent-[var(--active-fill)]"
              />
              <span>Restart clean streak clock from Day 0 now</span>
            </label>

            <label
              htmlFor="relapse-note-input"
              className="mt-3.5 mb-1 block text-xs font-semibold text-[var(--ink)]"
            >
              Private reflection / mirror domain to close (optional)
            </label>
            <textarea
              id="relapse-note-input"
              rows={2}
              maxLength={280}
              value={relapseNote}
              onChange={(e) => setRelapseNote(e.target.value)}
              placeholder="e.g. Saw promo link on X after match; moving cash to SafeLock now."
              className="w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--canvas)] p-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setRelapseModalOpen(false)}
                className="h-10 flex-1 cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="confirm-relapse-reset-button"
                className="h-10 flex-[1.5] cursor-pointer rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Apply Reset &amp; Tighten Rules
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};
