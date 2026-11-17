import React, { useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Download,
  Globe,
  Lock,
  NotebookPen,
  Shield,
  Smartphone,
  Trash2,
  Wind,
} from 'lucide-react';
import { GAMBLING_CATEGORY_META } from '../blocker/gamblingCategory';
import { LiquidGlassCard, LiquidSectionHeader } from '../components/LiquidGlass';
import {
  BettingFreeProgressChart,
  InteractiveBlockedBarChart,
} from '../components/ProgressCharts';
import { DerivedMainState, RECOVERY_MILESTONES } from '../data/types';
import { formatNaira } from '../utils/currency';

interface ActivityScreenProps {
  state: DerivedMainState;
  onClearHistory: () => void;
  onOpenUrgeJournal: () => void;
  onLaunchCalmReset: () => void;
}

const SOURCE_OPTIONS = ['All', 'Web Shield', 'In-App WebView', 'App Shield', 'Install Guard'];

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  state,
  onClearHistory,
  onOpenUrgeJournal,
  onLaunchCalmReset,
}) => {
  const [selectedChartMode, setSelectedChartMode] = useState<0 | 1>(0);
  const [selectedSource, setSelectedSource] = useState<string>('All');

  const filteredEvents = useMemo(
    () =>
      selectedSource === 'All'
        ? state.recentEvents
        : state.recentEvents.filter((e) => e.source === selectedSource),
    [state.recentEvents, selectedSource],
  );

  const savedFormatted = formatNaira(state.estimatedSavedAmount);

  const pad2 = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-3.5 px-4 pt-3 pb-28">
      {/* Header & Betting-Free Hero Card */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
            Recovery Progress
          </h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Betting-free streak, savings & shield telemetry
          </p>
        </div>
        {state.recentEvents.length > 0 ? (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        ) : null}
      </div>

      <LiquidGlassCard className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-[var(--ink-muted)]">
              BETTING-FREE STREAK
            </p>
            <p className="mt-1 font-display text-4xl font-bold tabular-nums text-[var(--ink)]">
              {state.cleanDays} Day{state.cleanDays === 1 ? '' : 's'}
            </p>
          </div>
          <div className="rounded-[16px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-2 text-right">
            <p className="font-mono text-sm font-semibold tabular-nums text-[var(--ink)]">
              {pad2(state.cleanHoursRemainder)}h : {pad2(state.cleanMinutesRemainder)}m :{' '}
              {pad2(state.cleanSecondsRemainder)}s
            </p>
            <p className="text-[11px] text-[var(--ink-muted)]">Next: {state.nextMilestone.title}</p>
          </div>
        </div>

        {/* Monochrome Milestone Progress Bar */}
        <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)]">
          <div
            className="h-full rounded-full bg-[var(--active-fill)] transition-all duration-300"
            style={{ width: `${Math.max(3, state.milestoneProgressFraction * 100)}%` }}
          />
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <ProgressMiniStat label="Est. Saved" value={savedFormatted} accent />
          <ProgressMiniStat label="Urges Resisted" value={String(state.totalUrgeResistedCount)} />
          <ProgressMiniStat label="Blocked" value={String(state.totalBlockedCount)} />
        </div>
      </LiquidGlassCard>

      {/* Interactive Visual Progress Chart */}
      <LiquidGlassCard className="p-4 sm:p-5" tourKey="progress_dashboard">
        <div>
          <h2 className="font-display text-base font-semibold text-[var(--ink)]">
            {selectedChartMode === 0 ? 'Betting-Free Trajectory' : '7-Day Intercepts'}
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            {selectedChartMode === 0
              ? 'Touch & scrub across milestones'
              : `${state.todayBlockedCount} today • ${state.totalBlockedCount} total`}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedChartMode(0)}
            className={`cursor-pointer rounded-full border px-3 py-2.5 text-xs font-medium transition-colors ${
              selectedChartMode === 0
                ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'border-[var(--subtle-border)] bg-[var(--surface)]/60 text-[var(--ink-muted)]'
            }`}
          >
            Days & Savings
          </button>
          <button
            type="button"
            onClick={() => setSelectedChartMode(1)}
            className={`cursor-pointer rounded-full border px-3 py-2.5 text-xs font-medium transition-colors ${
              selectedChartMode === 1
                ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'border-[var(--subtle-border)] bg-[var(--surface)]/60 text-[var(--ink-muted)]'
            }`}
          >
            7-Day Blocks
          </button>
        </div>

        <div className="mt-3.5">
          {selectedChartMode === 0 ? (
            <BettingFreeProgressChart
              cleanDays={state.cleanDays}
              cleanHoursRemainder={state.cleanHoursRemainder}
              dailySpendEstimate={state.settings.dailyBetSpendEstimate}
              nextMilestoneDay={state.nextMilestone.days}
            />
          ) : (
            <InteractiveBlockedBarChart stats={state.sevenDayStats} />
          )}
        </div>
      </LiquidGlassCard>

      {/* Recovery Milestone Badges */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <LiquidSectionHeader
          title="Recovery Milestones"
          subtitle="Badges unlock automatically as your betting-free days climb"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {RECOVERY_MILESTONES.map((milestone) => {
            const unlocked = state.cleanDays >= milestone.days;
            return (
              <span
                key={milestone.days}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  unlocked
                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'border-[var(--subtle-border)] bg-[var(--muted-fill)] text-[var(--ink-muted)]'
                }`}
              >
                {unlocked ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                <span>
                  {milestone.label} • {milestone.title}
                </span>
              </span>
            );
          })}
        </div>
      </LiquidGlassCard>

      {/* Urge Journal & Triggers */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <LiquidSectionHeader
          title="Urge Journal & Triggers"
          subtitle={`${state.totalUrgeResistedCount} urge victories recorded on-device`}
        />
        {state.triggerBreakdown.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {state.triggerBreakdown.map((item) => (
              <span
                key={item.triggerTag}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-1.5 text-xs text-[var(--ink)]"
              >
                <span className="font-medium">{item.triggerTag}</span>
                <span className="font-mono font-bold tabular-nums">{item.count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-[var(--ink-muted)]">
            When you pass on a betting urge, log what triggered it to recognize patterns and protect
            peak times.
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenUrgeJournal}
            className="flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
          >
            <NotebookPen className="h-4 w-4 shrink-0" />
            <span className="truncate">Log Urge Victory</span>
          </button>
          <button
            type="button"
            onClick={onLaunchCalmReset}
            className="flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] px-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
          >
            <Wind className="h-4 w-4 shrink-0" />
            <span className="truncate">60s SOS Calm</span>
          </button>
        </div>
      </LiquidGlassCard>

      {/* Blocked by Category */}
      {state.categoryBreakdown.length > 0 ? (
        <LiquidGlassCard className="p-4 sm:p-5">
          <LiquidSectionHeader title="Blocked by Category" subtitle="Recent distribution" />
          <div className="mt-2.5 flex flex-wrap gap-2">
            {state.categoryBreakdown.map((entry) => (
              <span
                key={entry.category}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-1.5 text-xs text-[var(--ink)]"
              >
                <span>{GAMBLING_CATEGORY_META[entry.category].displayName.split(' ')[0]}</span>
                <span className="font-mono font-bold tabular-nums">{entry.count}</span>
              </span>
            ))}
          </div>
        </LiquidGlassCard>
      ) : null}

      {/* Source Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {SOURCE_OPTIONS.map((source) => {
          const selected = selectedSource === source;
          return (
            <button
              key={source}
              type="button"
              onClick={() => setSelectedSource(source)}
              className={`cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                selected
                  ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'border-[var(--glass-border)] bg-[var(--glass-fill)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              {source}
            </button>
          );
        })}
      </div>

      {/* Event List or Empty State */}
      {filteredEvents.length === 0 ? (
        <LiquidGlassCard className="p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--muted-fill)] text-[var(--ink)]">
            <Shield className="h-7 w-7" />
          </div>
          <h3 className="mt-3.5 font-display text-base font-semibold text-[var(--ink)]">
            All Quiet Here
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
            When GambleAware intercepts a gambling site, in-app WebView, or betting app, it will
            appear in this timeline.
          </p>
        </LiquidGlassCard>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredEvents.map((ev) => {
            const timeText = new Date(ev.timestamp).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });
            const icon =
              ev.source === 'Web Shield' ? (
                <Globe className="h-5 w-5" />
              ) : ev.source === 'App Shield' ? (
                <Smartphone className="h-5 w-5" />
              ) : ev.source === 'Install Guard' ? (
                <Download className="h-5 w-5" />
              ) : (
                <Ban className="h-5 w-5" />
              );

            return (
              <LiquidGlassCard key={ev.id} className="rounded-[20px] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
                    {icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">{ev.target}</p>
                    <p className="truncate text-xs text-[var(--ink-muted)]">
                      {ev.source} • {timeText}
                    </p>
                  </div>
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      )}

      <footer className="py-2 text-center">
        <p className="text-xs font-semibold text-[var(--ink)]">GambleAware</p>
        <p className="text-xs text-[var(--ink-muted)]">A product of Imoogle Technology</p>
      </footer>
    </div>
  );
};

const ProgressMiniStat: React.FC<{ label: string; value: string; accent?: boolean }> = ({
  label,
  value,
  accent = false,
}) => (
  <div className="rounded-[16px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-2.5 py-2.5">
    <p className="truncate text-[11px] text-[var(--ink-muted)]">{label}</p>
    <p
      className={`mt-0.5 truncate font-mono text-base font-bold tabular-nums ${
        accent ? 'text-[var(--accent-ink)]' : 'text-[var(--ink)]'
      }`}
    >
      {value}
    </p>
  </div>
);
