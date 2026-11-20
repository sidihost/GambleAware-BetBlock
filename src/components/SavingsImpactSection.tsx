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
        feature: 'Use Any VPN Freely',
        gambleAware:
          'Zero VPN conflict — ProtonVPN, Mullvad, NordVPN, WARP & banking apps run untouched while your lock stays armed',
        competitor: 'Hijacks Android’s VPN slot, blocks other VPNs, drains battery, and breaks banking apps',
      },
      {
        feature: 'Play Store & Install Blocker',
        gambleAware:
          'Automatically blocks betting app downloads in Play Store & APK sideloaders, and flags installed betting apps',
        competitor: 'Still lets you search and download betting apps from Google Play Store',
      },
      {
        feature: 'Instant Typing Protection',
        gambleAware:
          'Stops betting brands like "sporty" or "bet9ja" the moment you start typing',
        competitor: 'Only reacts after the website has already started loading',
      },
      {
        feature: 'Nigerian, African & Global Sites',
        gambleAware: `${metrics.domainCount.toLocaleString()}+ sites & ${metrics.appCount}+ apps including SportyBet, Bet9ja, BetKing, MSport, 1xBet & Stake`,
        competitor:
          'Mainly Western lists where African betting mirrors often slip through',
      },
      {
        feature: 'Unbreakable Commitment Lock',
        gambleAware:
          'Blocks uninstall, Force Stop & Date/Time clock tampering + Trusted Buddy approval code completely free',
        competitor: 'Paid subscription required and vulnerable to VPN/clock workarounds',
      },
      {
        feature: 'Pricing & Everyday App Safety',
        gambleAware:
          '100% Free Forever · Only betting & user-selected apps blocked · 100% private on-device',
        competitor: 'Paid monthly or annual subscription required',
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
      className="border-y border-[var(--subtle-border)] bg-[var(--surface)]/50 py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
          {/* Left 5 cols: Interactive Savings & Wealth Projection Calculator */}
          <div className="min-w-0 rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6 lg:col-span-5">
            <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
              04 · Recovery Impact Calculator
            </p>
            <h2
              id="savings-compare-heading"
              className="mt-2 font-display text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl"
            >
              See what stays in your bank account.
            </h2>
            <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
              Adjust your typical daily betting spend to project your bet-free capital across key recovery milestones.
            </p>

            {/* Daily Spend Display + Range Slider */}
            <div className="mt-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4">
              <div className="flex items-baseline justify-between gap-2">
                <label
                  htmlFor="daily-stake-range"
                  className="text-xs font-semibold text-[var(--ink-muted)]"
                >
                  Daily betting spend
                </label>
                <span
                  data-testid="calculator-daily-value"
                  className="font-mono text-lg font-bold text-[var(--ink)] tabular-nums sm:text-xl"
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

              <div className="mt-3 flex flex-wrap gap-1.5">
                {DAILY_SPEND_OPTIONS_NGN.map((opt) => {
                  const selected = dailyStakeNgn === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      data-testid={`calculator-preset-${opt}`}
                      onClick={() => setDailyStakeNgn(opt)}
                      className={`min-w-[54px] flex-1 cursor-pointer rounded-full border px-2 py-1.5 text-center font-mono text-[11px] font-semibold transition-colors ${
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
            <div className="mt-4 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
              {projections.map((item) => (
                <div
                  key={item.days}
                  data-testid={`projection-${item.days}d`}
                  className="min-w-0 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5"
                >
                  <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
                    {item.label}
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-[var(--ink)] tabular-nums sm:text-lg">
                    {item.formattedNgn}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--ink-muted)]">
                    {item.milestoneIdea}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right 7 cols: GambleAware vs Paid Blockers Comparison */}
          <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6 lg:col-span-7">
            <div>
              <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
                05 · Why GambleAware
              </p>
              <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl">
                GambleAware vs. Paid Blockers
              </h3>
              <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
                See why GambleAware delivers stronger everyday protection than paid VPN blockers like Gamban — at zero cost.
              </p>

              {/* Mobile Stacked Comparison List (< md — Zero Horizontal Scroll) */}
              <div className="mt-5 divide-y divide-[var(--subtle-border)] md:hidden">
                {comparisonRows.map((row) => (
                  <div key={row.feature} className="py-4 first:pt-2 last:pb-0">
                    <p className="font-display text-sm font-bold text-[var(--ink)]">
                      {row.feature}
                    </p>
                    <div className="mt-2 space-y-2 text-xs">
                      <div className="flex items-start gap-2 text-[var(--ink)]">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--safe-ink)]" />
                        <p className="leading-relaxed">
                          <span className="font-mono text-[10px] font-bold tracking-wider text-[var(--accent-ink)] uppercase">
                            GambleAware:{' '}
                          </span>
                          {row.gambleAware}
                        </p>
                      </div>
                      <div className="flex items-start gap-2 text-[var(--ink-muted)]">
                        <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
                        <p className="leading-relaxed">
                          <span className="font-mono text-[10px] font-semibold tracking-wider uppercase">
                            Paid apps:{' '}
                          </span>
                          {row.competitor}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Clean Hairline Table (md+) */}
              <div className="mt-6 hidden md:block">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--subtle-border)] font-mono text-[10px] tracking-wider text-[var(--ink-muted)] uppercase">
                      <th className="w-[24%] py-2.5 pr-4 font-semibold">Feature</th>
                      <th className="w-[41%] py-2.5 pr-4 font-semibold text-[var(--accent-ink)]">
                        GambleAware (Free)
                      </th>
                      <th className="w-[35%] py-2.5 font-semibold">Gamban / Paid Apps</th>
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
