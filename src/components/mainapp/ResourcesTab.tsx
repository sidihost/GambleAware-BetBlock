import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  ExternalLink,
  HeartHandshake,
  Phone,
  Search,
  ShieldCheck,
  Square,
  Wind,
} from 'lucide-react';
import {
  RECOVERY_RESOURCES,
  RELAPSE_QUICK_ACTIONS,
  RESOURCE_CATEGORY_LABELS,
  ResourceCategory,
} from '../../utils/recoveryResources';

interface ResourcesTabProps {
  bankFreezeChecks: Record<string, boolean>;
  onToggleBankFreezeCheck: (checkId: string) => void;
  onOpenCalmReset: () => void;
}

const BANK_FREEZE_CHECKLIST = [
  {
    id: 'card-mcc-block',
    title: 'Turn on Bank Gambling Card Block (MCC 7995)',
    detail: 'Enable the built-in gambling freeze inside Monzo, Starling, Revolut, Chase, or Barclays.',
  },
  {
    id: 'ng-transfer-cap',
    title: 'Lower Daily Debit Card & Transfer Limits',
    detail: 'Reduce instant NIP / web-card limits inside GTWorld, AccessMore, Zenith, UBA, OPay, or Kuda.',
  },
  {
    id: 'locked-savings-vault',
    title: 'Move Spare Balance Into a Locked Vault',
    detail: 'Place spare cash into a Fixed / SafeLock vault requiring 24–72h withdrawal friction.',
  },
  {
    id: 'unsubscribe-sms-promos',
    title: 'Block Promo SMS & Permanently Close Old Accounts',
    detail: 'Opt out of free-bet marketing texts and request permanent closure on old bookmaker profiles.',
  },
  {
    id: 'self-exclusion-register',
    title: 'Register on National Self-Exclusion (GAMSTOP / BetStop)',
    detail: 'Combine operator-level legal exclusion with GambleAware on-device blocking.',
  },
] as const;

const CATEGORY_ORDER: Array<'ALL' | ResourceCategory> = [
  'ALL',
  'FINANCIAL_BLOCKS',
  'SELF_EXCLUSION',
  'HELPLINES',
  'RELAPSE_CBT',
];

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  bankFreezeChecks,
  onToggleBankFreezeCheck,
  onOpenCalmReset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ResourceCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return RECOVERY_RESOURCES.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.steps.some((step) => step.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const completedChecklistCount = useMemo(
    () => BANK_FREEZE_CHECKLIST.filter((c) => Boolean(bankFreezeChecks[c.id])).length,
    [bankFreezeChecks],
  );

  const checklistPct = Math.round((completedChecklistCount / BANK_FREEZE_CHECKLIST.length) * 100);

  return (
    <div data-testid="mainapp-tab-resources" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
            Verified Recovery Resources · Always Allowlisted
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
            Bank Blocks, Self-Exclusion &amp; 24/7 Helplines
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Layer device blocking with bank card freezes, national self-exclusion, and free confidential support.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCalmReset}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
        >
          <Wind className="h-4 w-4" />
          <span>Start 60s Calm Reset</span>
        </button>
      </div>

      {/* Interactive Bank & Card Freeze Checklist + 48-Hour Relapse Reset */}
      <div className="grid gap-5 lg:grid-cols-12">
        <section
          data-testid="bank-freeze-checklist"
          className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6 lg:col-span-7"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[var(--ink)]">
                Financial Friction &amp; Bank-Block Checklist
              </h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Complete these steps to close payment workarounds during late-night urges.
              </p>
            </div>
            <span
              data-testid="bank-checklist-progress"
              className="shrink-0 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums"
            >
              {completedChecklistCount}/{BANK_FREEZE_CHECKLIST.length} Done
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--subtle-border)]">
            <div
              className="h-full bg-[var(--active-fill)] transition-all duration-200"
              style={{ width: `${checklistPct}%` }}
            />
          </div>

          <div className="mt-4 divide-y divide-[var(--subtle-border)]">
            {BANK_FREEZE_CHECKLIST.map((item) => {
              const checked = Boolean(bankFreezeChecks[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`bank-check-${item.id}`}
                  onClick={() => onToggleBankFreezeCheck(item.id)}
                  className="flex w-full cursor-pointer items-start gap-3 py-3 text-left first:pt-0 last:pb-0"
                >
                  {checked ? (
                    <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                  ) : (
                    <Square className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold sm:text-sm ${
                        checked ? 'text-[var(--ink-muted)] line-through' : 'text-[var(--ink)]'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{item.detail}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 48-Hour Relapse Reset Protocol */}
        <section className="flex flex-col justify-between rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6 lg:col-span-5">
          <div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-[var(--accent-ink)]" />
              <h2 className="font-display text-base font-bold text-[var(--ink)]">
                48-Hour Relapse Reset Plan
              </h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
              If a slip happened, stop loss-chasing immediately. Follow these 4 steps right now:
            </p>

            <ol className="mt-4 space-y-2.5">
              {RELAPSE_QUICK_ACTIONS.map((action, index) => (
                <li
                  key={action}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3"
                >
                  <span className="font-mono text-xs font-bold text-[var(--accent-ink)]">
                    0{index + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-[var(--ink)]">{action}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--subtle-border)] pt-3.5 text-xs text-[var(--ink-muted)]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
            <span>All verified helplines remain permanently allowlisted by GambleAware.</span>
          </div>
        </section>
      </div>

      {/* Search & Category Filter Bar */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Recovery resource categories"
            className="flex flex-wrap gap-1.5"
          >
            {CATEGORY_ORDER.map((cat) => {
              const selected = selectedCategory === cat;
              const label = cat === 'ALL' ? `All (${RECOVERY_RESOURCES.length})` : RESOURCE_CATEGORY_LABELS[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`resource-cat-${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-10 cursor-pointer rounded-full border px-4 text-xs font-semibold transition-colors ${
                    selected
                      ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--glass-border)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              data-testid="resource-search-input"
              aria-label="Search recovery resources"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search banks, GAMSTOP, MANI..."
              className="h-10 w-full rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] pr-4 pl-10 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />
          </div>
        </div>

        {/* Full Resource Directory Grid */}
        {filteredResources.length === 0 ? (
          <div className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-8 text-center">
            <p className="font-display text-sm font-bold text-[var(--ink)]">
              No resources match “{searchQuery}”
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="mt-3 h-10 cursor-pointer rounded-full border border-[var(--subtle-border)] px-4 text-xs font-semibold text-[var(--accent-ink)]"
            >
              Show All 12 Resources
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2" data-testid="resources-grid">
            {filteredResources.map((item) => (
              <article
                key={item.id}
                data-testid={`resource-card-${item.id}`}
                className="flex flex-col justify-between rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] font-bold uppercase">
                    <span className="text-[var(--accent-ink)]">
                      {RESOURCE_CATEGORY_LABELS[item.category]}
                    </span>
                    <span className="text-[var(--ink-muted)]">{item.region}</span>
                  </div>

                  <h3 className="mt-2 font-display text-base font-bold text-[var(--ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                    {item.subtitle}
                  </p>

                  <ul className="mt-3.5 space-y-2 border-t border-[var(--subtle-border)] pt-3.5">
                    {item.steps.map((step) => (
                      <li
                        key={step}
                        className="flex items-start gap-2 text-xs leading-relaxed text-[var(--ink)]"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--active-fill)]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {item.phone || item.url ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--subtle-border)] pt-4">
                    {item.phone ? (
                      <a
                        href={`tel:${item.phone.replace(/[^+\d]/g, '')}`}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call {item.phone}</span>
                      </a>
                    ) : null}
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
                      >
                        <span>{item.urlLabel || 'Open Resource'}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
