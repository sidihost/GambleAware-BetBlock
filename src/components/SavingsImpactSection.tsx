import React, { useMemo, useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { DAILY_SPEND_OPTIONS_NGN, formatNaira } from '../utils/currency';
import { getRegistryMetrics } from '../utils/interactiveDemo';
import { buildWealthProjection } from '../utils/wealthProjection';

function formatShortNaira(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₦${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `₦${amount}`;
}

export const SavingsImpactSection: React.FC = () => {
  const [dailyStakeNgn, setDailyStakeNgn] = useState<number>(5000);
  const metrics = useMemo(() => getRegistryMetrics(), []);

  const comparisonRows = useMemo(
    () => [
      {
        feature: 'VPN & Work Network Compatibility',
        gambleAware:
          'Zero-VPN Accessibility Shield (runs alongside ProtonVPN, WARP & banking apps)',
        competitor: 'Occupies the Android VPN slot; breaks work VPNs and drains battery',
      },
      {
        feature: 'Keystroke-Level Interception',
        gambleAware:
          'Blocks betting brands like "sporty" or "bet9ja" while typing before page load',
        competitor: 'Waits for DNS resolution after navigation begins',
      },
      {
        feature: 'African & Global Mirror Registry',
        gambleAware: `${metrics.domainCount.toLocaleString()}+ domains & ${metrics.appCount}+ apps incl. SportyBet, Bet9ja, BetKing, MSport, 1xBet & Stake`,
        competitor:
          'Primarily Western-centric lists; regional .ng/.ke/.gh mirrors often slip through',
      },
      {
        feature: 'Offline Tamper & Buddy Co-Lock',
        gambleAware:
          'Device Admin uninstall lock + 24h–2y timer + zero-server Buddy Challenge/Response',
        competitor: 'Cloud subscription required for device lock management',
      },
      {
        feature: 'Pricing & Data Privacy',
        gambleAware:
          '100% Free APK · All filtering stays on-device with zero traffic logging',
        competitor: 'Paid monthly/annual subscription with cloud account telemetry',
      },
    ],
    [metrics],
  );

  const projections = useMemo(
    () => buildWealthProjection(dailyStakeNgn),
    [dailyStakeNgn],
  );

  return (
    <section
      id="compare"
      aria-labelledby="savings-compare-heading"
      className="border-y border-[var(--subtle-border)] bg-[var(--surface)]/50 py-14 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left 5 cols: Interactive Savings & Wealth Projection Calculator */}
          <div className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-6 lg:col-span-5">
            <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
              04 · Recovery Impact Calculator
            </p>
            <h2
              id="savings-compare-heading"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--ink)]"
            >
              See what stays in your bank account.
            </h2>
            <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
              Adjust your typical daily betting spend to project your bet-free capital across key recovery milestones.
            </p>

            {/* Daily Spend Display + Range Slider */}
            <div className="mt-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4">
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor="daily-stake-range"
                  className="text-xs font-semibold text-[var(--ink-muted)]"
                >
                  Daily betting spend
                </label>
                <span
                  data-testid="calculator-daily-value"
                  className="font-mono text-xl font-bold text-[var(--ink)] tabular-nums"
                >
                  {formatNaira(dailyStakeNgn)}
                </span>
              </div>

              <input
                id="daily-stake-range"
                data-testid="calculator-slider"
                type="range"
                min={500}
                max={50000}
                step={500}
                value={dailyStakeNgn}
                onChange={(e) => setDailyStakeNgn(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer accent-[var(--active-fill)]"
              />

              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {DAILY_SPEND_OPTIONS_NGN.map((opt) => {
                  const selected = dailyStakeNgn === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      data-testid={`calculator-preset-${opt}`}
                      onClick={() => setDailyStakeNgn(opt)}
                      className={`cursor-pointer rounded-full border py-1.5 text-center font-mono text-[11px] font-semibold transition-colors ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {formatShortNaira(opt)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4 Projection Cards */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {projections.map((item) => (
                <div
                  key={item.days}
                  data-testid={`projection-${item.days}d`}
                  className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5"
                >
                  <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
                    {item.label}
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-[var(--ink)] tabular-nums">
                    {item.formattedNgn}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--ink-muted)]">
                    {item.milestoneIdea}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right 7 cols: GambleAware vs Gamban Architecture Comparison */}
          <div className="flex flex-col justify-between rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-6 lg:col-span-7">
            <div>
              <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
                05 · Technical Comparison
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
                GambleAware vs. Legacy VPN Blockers
              </h3>
              <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
                Why on-device Accessibility &amp; Device Admin enforcement outperforms traditional VPN-based gambling blockers like Gamban.
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[460px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--subtle-border)] font-mono text-[10px] tracking-wider text-[var(--ink-muted)] uppercase">
                      <th className="py-2.5 pr-4 font-semibold">Capability</th>
                      <th className="py-2.5 pr-4 font-semibold text-[var(--accent-ink)]">
                        GambleAware v2.1
                      </th>
                      <th className="py-2.5 font-semibold">Gamban / VPN Apps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--subtle-border)]">
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className="align-top">
                        <td className="py-3.5 pr-4 font-semibold text-[var(--ink)]">
                          {row.feature}
                        </td>
                        <td className="py-3.5 pr-4 text-[var(--ink)]">
                          <div className="flex items-start gap-2">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--safe-ink)]" />
                            <span className="leading-relaxed">{row.gambleAware}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-[var(--ink-muted)]">
                          <div className="flex items-start gap-2">
                            <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
                            <span className="leading-relaxed">{row.competitor}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
