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
      title: 'Late-Night Protection (10 PM – 5 AM)',
      subtitle: 'Tightens keyword and search filters overnight',
      icon: <MoonStar className="h-4 w-4 text-[var(--accent-ink)]" />,
      checked: schedule.lateNightLockout,
    },
    {
      key: 'matchdayWeekendGuard',
      title: 'Weekend Match Schedule (Fri 6 PM – Sun)',
      subtitle: 'Extra filtering during weekend football fixtures',
      icon: <Flame className="h-4 w-4 text-[var(--accent-ink)]" />,
      checked: schedule.matchdayWeekendGuard,
    },
    {
      key: 'paydaySurgeGuard',
      title: 'Payday Protection (25th – 3rd of Month)',
      subtitle: 'Keeps filters stricter around salary days',
      icon: <Wallet className="h-4 w-4 text-[var(--accent-ink)]" />,
      checked: schedule.paydaySurgeGuard,
    },
  ];

  return (
    <LiquidGlassCard className="p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
            <CalendarClock className="h-4 w-4" />
          </div>
          <LiquidSectionHeader
            title="Scheduled Extra Protection"
            subtitle="Tightens filters automatically during hours when urges are common"
          />
        </div>
        <span
          className={`shrink-0 font-mono text-[11px] font-semibold ${
            status.isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
          }`}
        >
          {status.isActive ? 'Active' : 'Scheduled'}
        </span>
      </div>

      <div className="mt-2.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-2 text-xs">
        <p className="font-semibold text-[var(--ink)]">
          {status.isActive
            ? `Active now: ${status.activeLabels.join(' · ')}`
            : 'Waiting for next scheduled window'}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{status.nextWindowHint}</p>
      </div>

      <div className="mt-2.5 divide-y divide-[var(--subtle-border)]/50">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 py-2 first:pt-1 last:pb-1">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div className="mt-0.5 shrink-0">{row.icon}</div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--ink)]">{row.title}</p>
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
