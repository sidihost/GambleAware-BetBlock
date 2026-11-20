import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { GAMBLING_CATEGORY_META, GamblingCategory } from '../blocker/gamblingCategory';
import { BettingBrandLogo } from './BettingBrandLogo';
import {
  BrandFilterTab,
  filterCoveredBrands,
  getRegistryMetrics,
} from '../utils/interactiveDemo';

interface CoveredBrandsExplorerProps {
  onTestDomain: (domain: string) => void;
}

const CATEGORY_TABS: Array<{ id: BrandFilterTab; label: string }> = [
  { id: 'ALL', label: 'All Operators' },
  { id: GamblingCategory.SPORTSBOOK, label: 'Sportsbooks' },
  { id: GamblingCategory.CRYPTO_BETTING, label: 'Crypto & Crash' },
  { id: GamblingCategory.POKER_BINGO, label: 'Poker & Bingo' },
  { id: GamblingCategory.FANTASY_LOTTERY, label: 'Fantasy & Lottery' },
];

export const CoveredBrandsExplorer: React.FC<CoveredBrandsExplorerProps> = ({
  onTestDomain,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BrandFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const metrics = useMemo(() => getRegistryMetrics(), []);
  const filteredBrands = useMemo(
    () => filterCoveredBrands(selectedCategory, searchQuery),
    [selectedCategory, searchQuery],
  );

  const visibleBrands =
    showAll || searchQuery.trim().length > 0 || selectedCategory !== 'ALL'
      ? filteredBrands
      : filteredBrands.slice(0, 12);

  return (
    <section
      id="coverage"
      aria-labelledby="coverage-heading"
      className="border-y border-[var(--subtle-border)] bg-[var(--surface)]/50 py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
              02 · Verified Blocking Coverage
            </p>
            <h2
              id="coverage-heading"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl"
            >
              Built for Nigerian, African, and global betting mirrors.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Covers {metrics.domainCount.toLocaleString()}+ primary domains and regional mirrors,{' '}
              {metrics.appCount}+ native Android betting packages, and {metrics.adTrackerCount}+ popunder ad trackers. Click any brand to test it in the filter above.
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="brand-search-input"
              placeholder="Search SportyBet, Bet9ja, Stake..."
              aria-label="Search covered betting brands"
              className="h-10 w-full rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] pr-9 pl-10 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--active-fill)] focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear brand search"
                className="absolute top-1/2 right-2.5 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter betting brands by category"
          className="mt-6 flex flex-wrap items-center gap-2"
        >
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`brand-filter-${tab.id}`}
                onClick={() => setSelectedCategory(tab.id)}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--glass-border)] hover:text-[var(--ink)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <span className="w-full pt-1 font-mono text-xs text-[var(--ink-muted)] tabular-nums sm:ml-auto sm:w-auto sm:pt-0">
            Showing {visibleBrands.length} of {filteredBrands.length} featured operators
          </span>
        </div>

        {/* Brands Grid or Empty Search State */}
        {visibleBrands.length === 0 ? (
          <div
            data-testid="brand-empty-state"
            className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] px-6 py-10 text-center"
          >
            <p className="font-display text-base font-semibold text-[var(--ink)]">
              No featured operator matched &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="mt-1 max-w-md text-xs text-[var(--ink-muted)]">
              GambleAware still blocks {metrics.domainCount.toLocaleString()}+ domains, strict keywords, and any custom domain you add in the Android app.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onTestDomain(searchQuery);
                }}
                className="cursor-pointer rounded-full bg-[var(--active-fill)] px-4 py-2 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Test &ldquo;{searchQuery}&rdquo; in Live Filter
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 py-2 text-xs font-semibold text-[var(--ink)]"
              >
                Reset Filter
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleBrands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                data-testid={`brand-card-${brand.id}`}
                onClick={() => onTestDomain(brand.primaryDomain)}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-3.5 text-left transition-colors hover:border-[var(--glass-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
              >
                <BettingBrandLogo target={brand.primaryDomain} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate font-display text-sm font-bold text-[var(--ink)]">
                      {brand.name}
                    </p>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="truncate font-mono text-[11px] text-[var(--ink-muted)]">
                    {brand.primaryDomain}
                    {brand.aliases.length > 0 ? ` +${brand.aliases.length} mirrors` : ''}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]">
                    {GAMBLING_CATEGORY_META[brand.category].displayName.split(' ')[0]} · {brand.region}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!showAll &&
        searchQuery.trim().length === 0 &&
        selectedCategory === 'ALL' &&
        filteredBrands.length > 12 ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              data-testid="show-all-brands-btn"
              onClick={() => setShowAll(true)}
              className="cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-5 py-2 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-[var(--glass-border)]"
            >
              Show all {filteredBrands.length} featured operators
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};
