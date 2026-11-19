import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BettingBrandLogo } from './BettingBrandLogo';
import { formatNaira } from '../utils/currency';
import {
  DEFAULT_SANDBOX_CONFIG,
  evaluateSandboxQuery,
  SANDBOX_PRESETS,
} from '../utils/interactiveDemo';

interface LiveFilterSandboxProps {
  externalQuery?: string;
  externalQuerySeq?: number;
}

export const LiveFilterSandbox: React.FC<LiveFilterSandboxProps> = ({
  externalQuery,
  externalQuerySeq = 0,
}) => {
  const [query, setQuery] = useState<string>('sporty');

  useEffect(() => {
    if (externalQuery && externalQuerySeq > 0) {
      setQuery(externalQuery);
    }
  }, [externalQuery, externalQuerySeq]);

  const verdict = useMemo(
    () => evaluateSandboxQuery(query, DEFAULT_SANDBOX_CONFIG, 5000),
    [query],
  );

  return (
    <section
      id="live-filter"
      aria-labelledby="live-filter-heading"
      className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20"
    >
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
            01 · Live On-Device Filter Engine
          </p>
          <h2
            id="live-filter-heading"
            className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl"
          >
            Test the Zero-VPN blocker before you install.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
            Runs the exact TypeScript/Kotlin rule engine shipped in GambleAware Android. Type a partial betting name, cashier link, ad tracker, or recovery helpline.
          </p>
        </div>

        <p className="font-mono text-xs text-[var(--ink-muted)]">
          100% local evaluation · Zero network calls
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-7">
        {/* Search Input Row */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="sandbox-input"
            placeholder="Try sporty, bet9ja.com/deposit?code=AB99X, popads.net, or gamcare.org.uk..."
            aria-label="Test a betting domain, URL, or prefix"
            className="h-12 w-full rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] pr-11 pl-11 font-mono text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--active-fill)] focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear filter input"
              className="absolute top-1/2 right-3 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* 1-Tap Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--ink-muted)]">Try presets:</span>
          {SANDBOX_PRESETS.map((preset) => {
            const active = query.trim().toLowerCase() === preset.query.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`sandbox-preset-${preset.id}`}
                onClick={() => setQuery(preset.query)}
                className={`cursor-pointer rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                  active
                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] font-semibold text-[var(--active-content)]'
                    : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:border-[var(--glass-border)] hover:text-[var(--ink)]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Verdict Output Panel */}
        <div
          data-testid="sandbox-verdict-panel"
          data-verdict={verdict.status}
          className={`mt-6 rounded-2xl border p-5 transition-colors ${
            verdict.status === 'BLOCKED'
              ? 'border-[var(--block-border)] bg-[var(--block-bg)]'
              : verdict.status === 'ALLOWED'
                ? 'border-[var(--safe-border)] bg-[var(--safe-bg)]'
                : 'border-[var(--subtle-border)] bg-[var(--control-bg)]'
          }`}
        >
          {verdict.status === 'IDLE' ? (
            <div className="flex items-center gap-3 text-sm text-[var(--ink-muted)]">
              <Cpu className="h-5 w-5 shrink-0" />
              <p>{verdict.reason}</p>
            </div>
          ) : null}

          {verdict.status === 'BLOCKED' ? (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  {verdict.brandIdentity ? (
                    <BettingBrandLogo target={verdict.matchedTarget} size="md" />
                  ) : null}
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-[var(--block-ink)]" />
                      <span
                        data-testid="sandbox-verdict-label"
                        className="font-mono text-xs font-bold tracking-wider text-[var(--block-ink)] uppercase"
                      >
                        BLOCKED · {verdict.latencyLabel}
                      </span>
                    </div>
                    <h3 className="mt-0.5 font-display text-lg font-bold text-[var(--ink)]">
                      {verdict.brandIdentity?.isExactCatalogMatch
                        ? `${verdict.brandIdentity.displayName} intercepted`
                        : `Matched "${verdict.matchedTarget}"`}
                    </h3>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
                  {verdict.reason}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--block-border)] pt-3 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="font-mono text-[10px] tracking-wider text-[var(--ink-muted)] uppercase">
                      Detection Layer
                    </dt>
                    <dd className="mt-0.5 font-semibold text-[var(--ink)]">
                      {verdict.detectionLayer}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] tracking-wider text-[var(--ink-muted)] uppercase">
                      Category
                    </dt>
                    <dd className="mt-0.5 font-semibold text-[var(--ink)]">
                      {verdict.categoryLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] tracking-wider text-[var(--ink-muted)] uppercase">
                      Matched Rule
                    </dt>
                    <dd className="mt-0.5 truncate font-mono font-semibold text-[var(--ink)]">
                      {verdict.matchedTarget}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Expected Loss / Promo Neutralization Card */}
              {verdict.promoReport ? (
                <div className="flex flex-col justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4">
                  <div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>
                        {verdict.promoReport.depositRedirectDetected
                          ? 'Cashier & Deposit Guard'
                          : verdict.promoReport.hasPromoOrBookingCode
                            ? 'Booking / Promo Code Neutralized'
                            : 'House-Edge Reality Check'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                      {verdict.promoReport.summary}
                    </p>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between border-t border-[var(--subtle-border)] pt-3">
                    <span className="text-xs text-[var(--ink-muted)]">
                      Expected loss (30 bets × ₦5k)
                    </span>
                    <span className="font-mono text-sm font-bold text-[var(--ink)] tabular-nums">
                      {formatNaira(verdict.promoReport.expectedLossAfter30BetsNgn)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {verdict.status === 'ALLOWED' ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {verdict.isSafeSupportAllowlisted ? (
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--safe-ink)]" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--safe-ink)]" />
                )}
                <div>
                  <span
                    data-testid="sandbox-verdict-label"
                    className="font-mono text-xs font-bold tracking-wider text-[var(--safe-ink)] uppercase"
                  >
                    ALLOWED · {verdict.detectionLayer}
                  </span>
                  <h3 className="mt-0.5 font-display text-base font-bold text-[var(--ink)]">
                    {verdict.matchedTarget}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{verdict.reason}</p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold text-[var(--safe-ink)] tabular-nums">
                {verdict.latencyLabel}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
