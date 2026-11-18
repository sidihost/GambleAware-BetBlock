import React, { useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Grid,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { resolveBettingBrand } from '../blocker/brandCatalog';
import { GAMBLING_CATEGORY_META, GamblingCategory } from '../blocker/gamblingCategory';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import { BettingBrandLogo, FeaturedBrandsWall } from '../components/BettingBrandLogo';
import { LiquidGlassCard, LiquidSectionHeader, LiquidSwitch } from '../components/LiquidGlass';
import { DerivedMainState, InstalledAppInfo } from '../data/types';
import { formatBlockedTargetDisplay } from '../utils/blockedLogGrouping';
import { resolveDeviceAppMeta } from '../utils/deviceAppCatalog';

interface BlocklistScreenProps {
  state: DerivedMainState;
  onToggleCategory: (category: GamblingCategory, enabled: boolean) => void;
  onToggleStrictKeywords: (enabled: boolean) => void;
  onToggleBrowserShield: (enabled: boolean) => void;
  onToggleAppShield: (enabled: boolean) => void;
  onToggleSearchGuard: (enabled: boolean) => void;
  onToggleDepositGuard: (enabled: boolean) => void;
  onToggleAdBlocker: (enabled: boolean) => void;
  onAddCustomDomain: (domain: string, isAllowlist: boolean) => void;
  onRemoveCustomDomain: (domain: string, isAllowlist: boolean) => void;
  onAddBlockedApp: (app: InstalledAppInfo) => void;
  onRemoveBlockedApp: (pkg: string) => void;
}

const COMMON_WEBVIEW_APPS: InstalledAppInfo[] = [
  { packageName: 'com.android.chrome', label: 'Chrome Browser' },
  { packageName: 'com.opera.mini.native', label: 'Opera Mini' },
  { packageName: 'com.instagram.android', label: 'Instagram' },
  { packageName: 'com.zhiliaoapp.musically', label: 'TikTok' },
  { packageName: 'org.telegram.messenger', label: 'Telegram' },
  { packageName: 'com.twitter.android', label: 'X (Twitter)' },
];

export const BlocklistScreen: React.FC<BlocklistScreenProps> = ({
  state,
  onToggleCategory,
  onToggleStrictKeywords,
  onToggleBrowserShield,
  onToggleAppShield,
  onToggleSearchGuard,
  onToggleDepositGuard,
  onToggleAdBlocker,
  onAddCustomDomain,
  onRemoveCustomDomain,
  onAddBlockedApp,
  onRemoveBlockedApp,
}) => {
  const [newDomainText, setNewDomainText] = useState('');
  const [isAddingAllowlist, setIsAddingAllowlist] = useState(false);
  const [registrySearch, setRegistrySearch] = useState('');
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [showAdvancedAppInput, setShowAdvancedAppInput] = useState(false);
  const [customAppLabel, setCustomAppLabel] = useState('');
  const [customAppPkg, setCustomAppPkg] = useState('');

  const matchingRegistryDomains = useMemo(() => {
    const q = registrySearch.trim().toLowerCase();
    const entries = Array.from(GamblingRegistry.domainToCategory.entries());
    if (!q) return entries.slice(0, 12);
    return entries.filter(([domain]) => domain.includes(q)).slice(0, 30);
  }, [registrySearch]);

  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = customAppPkg.trim().toLowerCase();
    const label = customAppLabel.trim() || pkg;
    if (!pkg || pkg.length < 3 || !/^[a-zA-Z0-9_.]+$/.test(pkg)) return;
    onAddBlockedApp({ packageName: pkg, label });
    setCustomAppLabel('');
    setCustomAppPkg('');
    setShowAppPicker(false);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainText.trim()) return;
    onAddCustomDomain(newDomainText, isAddingAllowlist);
    setNewDomainText('');
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3.5 px-3.5 pt-3.5 pb-24 sm:px-5 md:px-6 md:pt-5 md:pb-12">
      <div className="px-0.5">
        <h1 className="font-display text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl">
          Blocked Sites &amp; Apps
        </h1>
        <p className="text-xs text-[var(--ink-muted)]">
          Choose which betting categories, websites, and apps stay blocked for you
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">

      {/* Category Toggles */}
      <LiquidGlassCard className="p-3.5 sm:p-4">
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
            title="Block New Copycat Sites"
            subtitle="Automatically catches new betting lookalike sites and links"
            checked={state.settings.strictKeywordFilter}
            onChange={onToggleStrictKeywords}
          />
        </div>
      </LiquidGlassCard>

      {/* Where Protection Works */}
      <LiquidGlassCard className="p-3.5 sm:p-4" tourKey="blocklist_guards">
        <LiquidSectionHeader
          title="Protection Coverage"
          subtitle="Blocks gambling across browsers, searches, and phone apps"
        />
        <div className="mt-2.5 divide-y divide-[var(--subtle-border)]/45">
          <CategorySwitchRow
            title="Websites & Social App Links"
            subtitle="Stops betting websites inside Chrome, Safari, Instagram, TikTok, and Telegram"
            checked={state.settings.browserShieldEnabled}
            onChange={onToggleBrowserShield}
          />
          <CategorySwitchRow
            title="Installed Betting Apps"
            subtitle="Blocks 150+ betting apps from opening or being newly installed"
            checked={state.settings.appShieldEnabled}
            onChange={onToggleAppShield}
          />
          <CategorySwitchRow
            title="Betting Searches & Redirect Unwrap"
            subtitle="Blocks betting searches & social redirects while keeping recovery portals open"
            checked={state.settings.searchGuardEnabled}
            onChange={onToggleSearchGuard}
          />
          <CategorySwitchRow
            title="Cashier & Booking-Code Firewall"
            subtitle="Stops bet-slip booking links, promo codes & deposit pages while keeping safe fintechs open"
            checked={state.settings.depositGuardEnabled}
            onChange={onToggleDepositGuard}
          />
          <CategorySwitchRow
            title="Gambling Ads, Popunders & Affiliates"
            subtitle="Blocks betting ad networks, popunders & promo links — works alongside other VPNs"
            checked={state.settings.adBlockerEnabled !== false}
            onChange={onToggleAdBlocker}
          />
        </div>
      </LiquidGlassCard>
      </div>

      {/* Covered Betting Platforms Logo Showcase */}
      <LiquidGlassCard className="p-3.5 sm:p-4">
        <LiquidSectionHeader
          title="Major Covered Platforms"
          subtitle={`Exact brand recognition across ${state.builtInDomainCount}+ sportsbooks, casinos, crash sites & poker rooms`}
        />
        <div className="mt-3">
          <FeaturedBrandsWall
            limit={16}
            onSelectDomain={(domain) => setRegistrySearch(domain.split('.')[0])}
          />
        </div>
      </LiquidGlassCard>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      {/* Custom Website Rules */}
      <LiquidGlassCard className="p-3.5 sm:p-4">
        <LiquidSectionHeader
          title="Custom Website Rules"
          subtitle="Add specific websites to always block or keep allowed"
        />
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsAddingAllowlist(false)}
            className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
              !isAddingAllowlist
                ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            Block Website
          </button>
          <button
            type="button"
            onClick={() => setIsAddingAllowlist(true)}
            className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
              isAddingAllowlist
                ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            Always Allow
          </button>
        </div>

        <form onSubmit={handleAddDomain} className="mt-2.5 flex gap-2">
          <input
            type="text"
            value={newDomainText}
            onChange={(e) => setNewDomainText(e.target.value)}
            placeholder="Enter a website domain"
            className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Add domain rule"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
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
      <LiquidGlassCard className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-semibold text-[var(--ink)]">
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
            <span>Add App</span>
          </button>
        </div>

        {state.customBlockedApps.length === 0 ? (
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            No extra apps added yet. Tap Add App to pick extra browsers or social apps to guard.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {state.customBlockedApps.map((app) => (
              <div
                key={app.packageName}
                className="flex items-center gap-3 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-2.5"
              >
                <Ban className="h-4 w-4 shrink-0 text-[var(--ink)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">{app.appLabel}</p>
                  <p className="truncate text-[11px] text-[var(--ink-muted)]">
                    {resolveDeviceAppMeta(app.packageName, app.appLabel).riskNote}
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
      </div>

      {/* Built-in Protected Websites Search */}
      <LiquidGlassCard className="p-3.5 sm:p-4">
        <LiquidSectionHeader
          title={`Built-in Protected Platforms (${state.builtInDomainCount}+)`}
          subtitle="Search sportsbooks, casinos, poker, and crypto sites already blocked for you"
        />
        <div className="relative mt-2.5">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            value={registrySearch}
            onChange={(e) => setRegistrySearch(e.target.value)}
            placeholder="Search built-in blocked platforms"
            className="h-10 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] pr-3 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
          />
        </div>
        <div className="mt-2.5 divide-y divide-[var(--subtle-border)]/45">
          {matchingRegistryDomains.map(([domain, category]) => (
            <div key={domain} className="flex items-center justify-between gap-3 py-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <BettingBrandLogo target={domain} size="sm" />
                <span className="truncate text-xs font-semibold text-[var(--ink)] sm:text-sm">
                  {resolveBettingBrand(domain).displayName}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-[var(--ink-muted)]">
                {GAMBLING_CATEGORY_META[category].displayName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </LiquidGlassCard>

      {/* Add Extra App Modal */}
      {showAppPicker ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose an App to Block"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div className="max-h-[90dvh] w-full max-w-[460px] overflow-y-auto rounded-t-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4 text-[var(--ink)] sm:rounded-2xl sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold sm:text-lg">Choose an App to Block</h2>
              <button
                type="button"
                onClick={() => setShowAppPicker(false)}
                aria-label="Close app dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs font-medium text-[var(--ink-muted)]">
              Tap an app below to block links inside it
            </p>
            <div className="mt-2 max-h-[240px] space-y-2 overflow-y-auto pr-1">
              {COMMON_WEBVIEW_APPS.map((app) => {
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
            <div className="mt-4 border-t border-[var(--subtle-border)] pt-3">
              <button
                type="button"
                onClick={() => setShowAdvancedAppInput((v) => !v)}
                className="cursor-pointer text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                {showAdvancedAppInput ? 'Hide advanced option' : 'Advanced: Enter custom app ID'}
              </button>
              {showAdvancedAppInput ? (
                <form onSubmit={handleAddCustomApp} className="mt-2.5 space-y-2.5">
                  <input
                    type="text"
                    value={customAppLabel}
                    onChange={(e) => setCustomAppLabel(e.target.value)}
                    placeholder="App name"
                    className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAppPkg}
                      onChange={(e) => setCustomAppPkg(e.target.value)}
                      placeholder="Android package name"
                      className="h-11 min-w-0 flex-1 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 font-mono text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="shrink-0 cursor-pointer rounded-[14px] bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                </form>
              ) : null}
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
  <div className="flex items-center gap-2.5 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] py-1.5 pr-1.5 pl-3">
    {isAllowlist ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
    ) : (
      <Ban className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
    )}
    <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">
      {formatBlockedTargetDisplay(domain)}
    </span>
    <button
      type="button"
      onClick={onDelete}
      aria-label={`Delete ${formatBlockedTargetDisplay(domain)}`}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);
