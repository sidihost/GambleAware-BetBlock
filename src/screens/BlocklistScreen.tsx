import React, { useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Globe,
  Grid,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { GAMBLING_CATEGORY_META, GamblingCategory } from '../blocker/gamblingCategory';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import { LiquidGlassCard, LiquidSectionHeader, LiquidSwitch } from '../components/LiquidGlass';
import { DerivedMainState, InstalledAppInfo } from '../data/types';

interface BlocklistScreenProps {
  state: DerivedMainState;
  onToggleCategory: (category: GamblingCategory, enabled: boolean) => void;
  onToggleStrictKeywords: (enabled: boolean) => void;
  onToggleBrowserShield: (enabled: boolean) => void;
  onToggleAppShield: (enabled: boolean) => void;
  onToggleSearchGuard: (enabled: boolean) => void;
  onAddCustomDomain: (domain: string, isAllowlist: boolean) => void;
  onRemoveCustomDomain: (domain: string, isAllowlist: boolean) => void;
  onAddBlockedApp: (app: InstalledAppInfo) => void;
  onRemoveBlockedApp: (pkg: string) => void;
}

export const BlocklistScreen: React.FC<BlocklistScreenProps> = ({
  state,
  onToggleCategory,
  onToggleStrictKeywords,
  onToggleBrowserShield,
  onToggleAppShield,
  onToggleSearchGuard,
  onAddCustomDomain,
  onRemoveCustomDomain,
  onAddBlockedApp,
  onRemoveBlockedApp,
}) => {
  const [newDomainText, setNewDomainText] = useState('');
  const [isAddingAllowlist, setIsAddingAllowlist] = useState(false);
  const [registrySearch, setRegistrySearch] = useState('');
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [appFilter, setAppFilter] = useState('');

  const matchingRegistryDomains = useMemo(() => {
    const q = registrySearch.trim().toLowerCase();
    const entries = Array.from(GamblingRegistry.domainToCategory.entries());
    if (!q) return entries.slice(0, 12);
    return entries.filter(([domain]) => domain.includes(q)).slice(0, 30);
  }, [registrySearch]);

  const filteredApps = useMemo(() => {
    const q = appFilter.trim().toLowerCase();
    if (!q) return state.installedApps;
    return state.installedApps.filter(
      (a) => a.label.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q),
    );
  }, [state.installedApps, appFilter]);

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainText.trim()) return;
    onAddCustomDomain(newDomainText, isAddingAllowlist);
    setNewDomainText('');
  };

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-3.5 px-4 pt-3 pb-28">
      <div className="px-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
          Blocklist & Rules
        </h1>
        <p className="text-xs text-[var(--ink-muted)]">
          Customize categories, mirror detection, domains, and apps
        </p>
      </div>

      {/* Category Toggles */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <LiquidSectionHeader
          title="Gambling Categories"
          subtitle={
            state.isAnyLockActive
              ? 'Turning categories off requires unlocking'
              : 'All 5 categories active by default'
          }
        />
        <div className="mt-3 divide-y divide-[var(--subtle-border)]/45">
          <CategorySwitchRow
            title={GAMBLING_CATEGORY_META[GamblingCategory.SPORTSBOOK].displayName}
            subtitle={GAMBLING_CATEGORY_META[GamblingCategory.SPORTSBOOK].description}
            checked={state.settings.blockSportsbooks}
            onChange={(v) => onToggleCategory(GamblingCategory.SPORTSBOOK, v)}
          />
          <CategorySwitchRow
            title={GAMBLING_CATEGORY_META[GamblingCategory.CASINO].displayName}
            subtitle={GAMBLING_CATEGORY_META[GamblingCategory.CASINO].description}
            checked={state.settings.blockCasinos}
            onChange={(v) => onToggleCategory(GamblingCategory.CASINO, v)}
          />
          <CategorySwitchRow
            title={GAMBLING_CATEGORY_META[GamblingCategory.POKER_BINGO].displayName}
            subtitle={GAMBLING_CATEGORY_META[GamblingCategory.POKER_BINGO].description}
            checked={state.settings.blockPokerAndBingo}
            onChange={(v) => onToggleCategory(GamblingCategory.POKER_BINGO, v)}
          />
          <CategorySwitchRow
            title={GAMBLING_CATEGORY_META[GamblingCategory.CRYPTO_BETTING].displayName}
            subtitle={GAMBLING_CATEGORY_META[GamblingCategory.CRYPTO_BETTING].description}
            checked={state.settings.blockCryptoBetting}
            onChange={(v) => onToggleCategory(GamblingCategory.CRYPTO_BETTING, v)}
          />
          <CategorySwitchRow
            title={GAMBLING_CATEGORY_META[GamblingCategory.FANTASY_LOTTERY].displayName}
            subtitle={GAMBLING_CATEGORY_META[GamblingCategory.FANTASY_LOTTERY].description}
            checked={state.settings.blockFantasyAndLottery}
            onChange={(v) => onToggleCategory(GamblingCategory.FANTASY_LOTTERY, v)}
          />
          <CategorySwitchRow
            title="Smart Mirror & Keyword Filter"
            subtitle="Catches unindexed mirrors & gambling WebView interfaces"
            checked={state.settings.strictKeywordFilter}
            onChange={onToggleStrictKeywords}
          />
        </div>
      </LiquidGlassCard>

      {/* Real-Time Guards */}
      <LiquidGlassCard className="p-4 sm:p-5" tourKey="blocklist_guards">
        <LiquidSectionHeader
          title="Real-Time Guards"
          subtitle="Active across browsers, in-app WebViews, and installed apps"
        />
        <div className="mt-2.5 divide-y divide-[var(--subtle-border)]/45">
          <CategorySwitchRow
            title="Universal Web & WebView Guard"
            subtitle="Stops Chrome, Firefox, Edge, Brave, Custom Tabs & social WebViews"
            checked={state.settings.browserShieldEnabled}
            onChange={onToggleBrowserShield}
          />
          <CategorySwitchRow
            title="Betting App & Install Guard"
            subtitle="Blocks 120+ betting apps + newly downloaded gambling APKs"
            checked={state.settings.appShieldEnabled}
            onChange={onToggleAppShield}
          />
          <CategorySwitchRow
            title="Search Engine Gambling Guard"
            subtitle="Intercepts direct betting searches while keeping recovery & help safe"
            checked={state.settings.searchGuardEnabled}
            onChange={onToggleSearchGuard}
          />
        </div>
      </LiquidGlassCard>

      {/* Custom Domain Rules */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <LiquidSectionHeader
          title="Custom Domain Rules"
          subtitle="Add specific websites to block or allowlist"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsAddingAllowlist(false)}
            className={`cursor-pointer rounded-full border px-3 py-2.5 text-xs font-medium transition-colors ${
              !isAddingAllowlist
                ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'border-[var(--subtle-border)] bg-[var(--surface)]/60 text-[var(--ink-muted)]'
            }`}
          >
            Block Domain
          </button>
          <button
            type="button"
            onClick={() => setIsAddingAllowlist(true)}
            className={`cursor-pointer rounded-full border px-3 py-2.5 text-xs font-medium transition-colors ${
              isAddingAllowlist
                ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'border-[var(--subtle-border)] bg-[var(--surface)]/60 text-[var(--ink-muted)]'
            }`}
          >
            Allowlist Exception
          </button>
        </div>

        <form onSubmit={handleAddDomain} className="mt-2.5 flex gap-2">
          <input
            type="text"
            value={newDomainText}
            onChange={(e) => setNewDomainText(e.target.value)}
            placeholder="e.g. mybookie.ag"
            className="h-12 min-w-0 flex-1 rounded-[16px] border border-[var(--subtle-border)] bg-[var(--surface)]/70 px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Add domain rule"
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[16px] bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
          </button>
        </form>

        {state.customBlockedDomains.length > 0 ? (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium text-[var(--ink-muted)]">
              Custom Blocked ({state.customBlockedDomains.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {state.customBlockedDomains.map((item) => (
                <DomainRuleRow
                  key={item.domain}
                  domain={item.domain}
                  isAllowlist={false}
                  onDelete={() => onRemoveCustomDomain(item.domain, false)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {state.allowlistedDomains.length > 0 ? (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-[var(--ink-muted)]">
              Allowlisted ({state.allowlistedDomains.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {state.allowlistedDomains.map((item) => (
                <DomainRuleRow
                  key={item.domain}
                  domain={item.domain}
                  isAllowlist={true}
                  onDelete={() => onRemoveCustomDomain(item.domain, true)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </LiquidGlassCard>

      {/* Extra Blocked Apps */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold text-[var(--ink)]">
              Extra Blocked Apps
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Built-in list covers 120+ betting apps automatically
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAppPicker(true)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
          >
            <Grid className="h-4 w-4" />
            <span>Pick App</span>
          </button>
        </div>

        {state.customBlockedApps.length === 0 ? (
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            No extra apps added yet. Tap Pick App to add any installed app to App Shield.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {state.customBlockedApps.map((app) => (
              <div
                key={app.packageName}
                className="flex items-center gap-3 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--surface)]/65 px-3 py-2.5"
              >
                <Ban className="h-4 w-4 shrink-0 text-[var(--ink)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">{app.appLabel}</p>
                  <p className="truncate font-mono text-[11px] text-[var(--ink-muted)]">
                    {app.packageName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveBlockedApp(app.packageName)}
                  aria-label={`Remove ${app.appLabel}`}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </LiquidGlassCard>

      {/* Protected Registry Search */}
      <LiquidGlassCard className="p-4 sm:p-5">
        <LiquidSectionHeader
          title={`Protected Registry (${state.builtInDomainCount} Domains)`}
          subtitle="Search built-in sportsbooks, casinos, poker, and crypto sites"
        />
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            value={registrySearch}
            onChange={(e) => setRegistrySearch(e.target.value)}
            placeholder="Search registry (e.g. draftkings, poker)"
            className="h-11 w-full rounded-[16px] border border-[var(--subtle-border)] bg-[var(--surface)]/70 pr-3.5 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
          />
        </div>
        <div className="mt-3 divide-y divide-[var(--subtle-border)]/45">
          {matchingRegistryDomains.map(([domain, category]) => (
            <div key={domain} className="flex items-center justify-between gap-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-[var(--ink)]" />
                <span className="truncate text-sm text-[var(--ink)]">{domain}</span>
              </div>
              <span className="shrink-0 text-xs text-[var(--ink-muted)]">
                {GAMBLING_CATEGORY_META[category].displayName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </LiquidGlassCard>

      {/* App Picker Modal */}
      {showAppPicker ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select App to Block"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div className="w-full max-w-[480px] rounded-t-[28px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)] sm:rounded-[28px]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Select App to Block</h2>
              <button
                type="button"
                onClick={() => setShowAppPicker(false)}
                aria-label="Close app picker"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                placeholder="Filter installed apps"
                className="h-11 w-full rounded-[16px] border border-[var(--subtle-border)] bg-[var(--canvas)] pr-3.5 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
              />
            </div>
            <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {filteredApps.map((app) => {
                const alreadyBlocked = state.customBlockedApps.some(
                  (a) => a.packageName === app.packageName.toLowerCase(),
                );
                return (
                  <button
                    key={app.packageName}
                    type="button"
                    disabled={alreadyBlocked}
                    onClick={() => {
                      onAddBlockedApp(app);
                      setShowAppPicker(false);
                    }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-[16px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3 text-left transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-65"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-semibold text-[var(--ink)]">{app.label}</p>
                      <p className="truncate font-mono text-xs text-[var(--ink-muted)]">
                        {app.packageName}
                      </p>
                    </div>
                    {alreadyBlocked ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--ink)]" />
                    ) : (
                      <Plus className="h-5 w-5 shrink-0 text-[var(--ink)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const CategorySwitchRow: React.FC<{
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ title, subtitle, checked, onChange }) => (
  <div className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{subtitle}</p>
    </div>
    <LiquidSwitch checked={checked} onChange={onChange} ariaLabel={title} />
  </div>
);

const DomainRuleRow: React.FC<{
  domain: string;
  isAllowlist: boolean;
  onDelete: () => void;
}> = ({ domain, isAllowlist, onDelete }) => (
  <div className="flex items-center gap-2.5 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--surface)]/65 py-1.5 pr-1.5 pl-3">
    {isAllowlist ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--ink)]" />
    ) : (
      <Ban className="h-4 w-4 shrink-0 text-[var(--ink)]" />
    )}
    <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">{domain}</span>
    <button
      type="button"
      onClick={onDelete}
      aria-label={`Delete ${domain}`}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);
