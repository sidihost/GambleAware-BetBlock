import React from 'react';
import { CalendarClock, Flame, MoonStar, Wallet } from 'lucide-react';
import { HighRiskScheduleConfig, HighRiskWindowStatus } from '../data/types';
import { LiquidGlassCard, LiquidSectionHeader, LiquidSwitch } from './LiquidGlass';

interface HighRiskGuardCardProps {
  schedule: HighRiskScheduleConfig;
  status: HighRiskWindowStatus;
  onToggleWindow: (key: keyof HighRiskScheduleConfig, enabled: boolean) => void;
}

export const HighRiskGuardCard: React.FC<HighRiskGuardCardProps> = ({
  schedule,
  status,
  onToggleWindow,
}) => {
  const rows: Array<{
    key: keyof HighRiskScheduleConfig;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    checked: boolean;
  }> = [
    {
      key: 'lateNightLockout',
      title: 'Late-Night Urge Lockout (10 PM – 5 AM)',
      subtitle: 'Auto-heightens strict keyword & search blocking overnight',
      icon: <MoonStar className="h-4 w-4 text-[var(--accent-ink)]" />,
      checked: schedule.lateNightLockout,
    },
    {
      key: 'matchdayWeekendGuard',
      title: 'Matchday Weekend Shield (Fri 6 PM – Sun)',
      subtitle: 'Extra guard during Premier League & weekend fixtures',
      icon: <Flame className="h-4 w-4 text-[var(--accent-ink)]" />,
      checked: schedule.matchdayWeekendGuard,
    },
    {
      key: 'paydaySurgeGuard',
      title: 'Payday Surge Guard (25th – 3rd of Month)',
      subtitle: 'Keeps salary days locked against deposit urges',
      icon: <Wallet className="h-4 w-4 text-[var(--accent-ink)]" />,
      checked: schedule.paydaySurgeGuard,
    },
  ];

  return (
    <LiquidGlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
            <CalendarClock className="h-5 w-5" />
          </div>
          <LiquidSectionHeader
            title="Smart High-Risk Schedule"
            subtitle="Automatically tightens protection during peak temptation hours"
          />
        </div>
        <span
          className={`shrink-0 font-mono text-[11px] font-semibold ${
            status.isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
          }`}
        >
          {status.isActive ? 'HEIGHTENED' : 'STANDBY'}
        </span>
      </div>

      <div className="mt-3 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-2 text-xs">
        <p className="font-semibold text-[var(--ink)]">
          {status.isActive
            ? `Active now: ${status.activeLabels.join(' · ')}`
            : 'Standing watch'}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{status.nextWindowHint}</p>
      </div>

      <div className="mt-3 divide-y divide-[var(--subtle-border)]/50">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <div className="mt-0.5 shrink-0">{row.icon}</div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--ink)] sm:text-sm">{row.title}</p>
                <p className="text-[11px] text-[var(--ink-muted)]">{row.subtitle}</p>
              </div>
            </div>
            <LiquidSwitch
              checked={row.checked}
              onChange={(v) => onToggleWindow(row.key, v)}
              ariaLabel={row.title}
            />
          </div>
        ))}
      </div>
    </LiquidGlassCard>
  );
};
