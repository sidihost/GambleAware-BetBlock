import React, { useState } from 'react';
import {
  Ban,
  HeartHandshake,
  Loader2,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Target,
} from 'lucide-react';
import {
  DerivedMainState,
  GeminiAgentAnalysis,
  RecoveryGoalCategory,
} from '../data/types';
import { formatNaira } from '../utils/currency';
import { LiquidGlassCard, LiquidSectionHeader, LiquidSwitch } from './LiquidGlass';

interface GeminiAgentPanelProps {
  state: DerivedMainState;
  onToggleAiAutoBlock: (enabled: boolean) => void;
  onAutoBlockAndRedirect: (params: {
    target: string;
    category: string;
    isLoginAttempt: boolean;
    coachNote: string;
  }) => void;
  onCreateSuggestedGoal: (input: {
    title: string;
    category: RecoveryGoalCategory;
    targetDays: number;
    targetAmountNgn: number;
    whyNote: string;
    lockDurationDays: number;
  }) => void;
}

const QUICK_PROMPTS = [
  'Help me set a realistic goal today',
  "I'm tempted to place a bet right now",
  'Is sportybet-vip-mirror.ng safe?',
];

export const GeminiAgentPanel: React.FC<GeminiAgentPanelProps> = ({
  state,
  onToggleAiAutoBlock,
  onAutoBlockAndRedirect,
  onCreateSuggestedGoal,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<GeminiAgentAnalysis | null>(null);

  const runAgentCoach = async (messageText: string) => {
    const clean = messageText.trim();
    if (!clean) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/agent/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GambleAware-Client': 'web',
        },
        body: JSON.stringify({
          message: clean,
          userName: state.firstName,
          cleanDays: state.cleanDays,
          estimatedSavedNgn: state.estimatedSavedAmount,
          dailySpendNgn: state.settings.dailyBetSpendEstimate,
          hasActiveGoal: Boolean(state.primaryGoal),
          activeGoalTitle: state.primaryGoal?.title ?? '',
          goalsCount: state.goals.length,
          recentBlockedCount: state.totalBlockedCount,
          localHour: new Date().getHours(),
        }),
      });
      const data = (await response.json()) as GeminiAgentAnalysis & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Could not reach GambleAware AI right now.');
      }
      setAnalysis(data);

      if (data.shouldAutoBlock && state.settings.aiAutoBlockEnabled) {
        const target = data.detectedDomain || clean;
        onAutoBlockAndRedirect({
          target,
          category: data.category || 'Sportsbooks',
          isLoginAttempt: Boolean(data.isLoginAttempt),
          coachNote: data.coachMessage,
        });
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to reach GambleAware AI right now.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runAgentCoach(promptInput);
  };

  return (
    <LiquidGlassCard className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <LiquidSectionHeader
            title="GambleAware AI"
            subtitle="Talk through an urge, build a personal goal, or check any betting link"
          />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-1.5 sm:border-0 sm:bg-transparent sm:p-0">
          <span className="text-xs font-medium text-[var(--ink-muted)]">Auto-block links</span>
          <LiquidSwitch
            checked={state.settings.aiAutoBlockEnabled}
            onChange={onToggleAiAutoBlock}
            ariaLabel="Automatically block betting links detected by GambleAware AI"
          />
        </div>
      </div>

      {/* Quick Conversation Prompts */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading}
            onClick={() => {
              setPromptInput(q);
              void runAgentCoach(q);
            }}
            className="cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-1.5 text-left text-xs font-medium text-[var(--ink)] transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Talk to GambleAware AI or paste any link..."
          className="h-11 min-w-0 flex-1 rounded-[16px] border border-[var(--subtle-border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !promptInput.trim()}
          aria-label="Send to GambleAware AI"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>{loading ? 'Thinking…' : 'Send'}</span>
        </button>
      </form>

      {errorMsg ? (
        <div className="mt-3 flex items-start gap-2 rounded-[14px] border border-[var(--glass-border)] bg-[var(--muted-fill)] p-3 text-xs leading-relaxed text-[var(--ink)]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-3 space-y-2.5 rounded-[18px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-ink)]">
              {analysis.shouldAutoBlock ? (
                <Ban className="h-3.5 w-3.5" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              <span>
                {analysis.shouldAutoBlock
                  ? `Blocked & Guarded (${analysis.detectedDomain || analysis.category})`
                  : 'GambleAware AI'}
              </span>
            </span>
            {analysis.shouldRemindGoal && state.goals.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ink-muted)]">
                <Target className="h-3 w-3 text-[var(--accent-ink)]" />
                <span>Goal Suggestion</span>
              </span>
            ) : null}
          </div>

          <p className="text-xs leading-relaxed text-[var(--ink)] sm:text-[13px]">
            {analysis.coachMessage}
          </p>

          {analysis.suggestedGoalTitle ? (
            <div className="flex flex-col gap-2.5 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--ink)]">
                  Idea: {analysis.suggestedGoalTitle}
                </p>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  {analysis.suggestedGoalTargetDays} days
                  {analysis.suggestedGoalAmountNgn > 0
                    ? ` · Save ${formatNaira(analysis.suggestedGoalAmountNgn)}`
                    : ''}
                  {analysis.suggestedGoalWhy ? ` — ${analysis.suggestedGoalWhy}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCreateSuggestedGoal({
                    title: analysis.suggestedGoalTitle,
                    category: analysis.suggestedGoalAmountNgn > 0 ? 'savings' : 'streak',
                    targetDays: analysis.suggestedGoalTargetDays || 30,
                    targetAmountNgn: analysis.suggestedGoalAmountNgn || 0,
                    whyNote: analysis.suggestedGoalWhy || '',
                    lockDurationDays: 7,
                  });
                }}
                className="inline-flex h-9 w-full shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full bg-[var(--active-fill)] px-3.5 text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Use This Goal</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </LiquidGlassCard>
  );
};
