import React, { useMemo, useState } from 'react';
import { Plus, Search, Shield, Trash2 } from 'lucide-react';
import { BETTING_BRAND_CATALOG } from '../../blocker/brandCatalog';
import { GAMBLING_CATEGORY_META, GamblingCategory } from '../../blocker/gamblingCategory';
import { BlockedAppEntity, BlockedDomainEntity, ProtectionSettingsState } from '../../data/types';
import { BettingBrandLogo } from '../BettingBrandLogo';
import { LiquidSwitch } from '../LiquidGlass';

interface RulesTabProps {
  settings: ProtectionSettingsState;
  isLocked: boolean;
  customBlockedDomains: BlockedDomainEntity[];
  allowlistedDomains: BlockedDomainEntity[];
  customBlockedApps: BlockedAppEntity[];
  onToggleSetting: (key: keyof ProtectionSettingsState, nextVal: boolean) => void;
  onAddCustomDomain: (rawDomain: string, isAllowlist: boolean) => void;
  onRemoveCustomDomain: (domain: string, isAllowlist: boolean) => void;
  onAddBlockedApp: (packageName: string, appLabel: string) => void;
  onRemoveBlockedApp: (packageName: string) => void;
}

const COMMON_EXTRA_APPS = [
  { packageName: 'com.sportybet.android', label: 'SportyBet Android' },
  { packageName: 'com.bet9ja.mobile', label: 'Bet9ja Sportsbook' },
  { packageName: 'org.xbet.client1', label: '1xBet Mobile' },
  { packageName: 'com.betking.android', label: 'BetKing Mobile' },
  { packageName: 'com.betway.app', label: 'Betway Sports' },
  { packageName: 'com.draftkings.sportsbook', label: 'DraftKings' },
] as const;

export const RulesTab: React.FC<RulesTabProps> = ({
  settings,
  isLocked,
  customBlockedDomains,
  allowlistedDomains,
  customBlockedApps,
  onToggleSetting,
  onAddCustomDomain,
  onRemoveCustomDomain,
  onAddBlockedApp,
  onRemoveBlockedApp,
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [domainMode, setDomainMode] = useState<'block' | 'allow'>('block');
  const [domainError, setDomainError] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState('');

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return BETTING_BRAND_CATALOG;
    return BETTING_BRAND_CATALOG.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.primaryDomain.toLowerCase().includes(q) ||
        b.region.toLowerCase().includes(q),
    );
  }, [brandSearch]);

  const categoryItems: Array<{
    cat: GamblingCategory;
    key: keyof ProtectionSettingsState;
    checked: boolean;
  }> = [
    { cat: GamblingCategory.SPORTSBOOK, key: 'blockSportsbooks', checked: settings.blockSportsbooks },
    { cat: GamblingCategory.CASINO, key: 'blockCasinos', checked: settings.blockCasinos },
    { cat: GamblingCategory.POKER_BINGO, key: 'blockPokerAndBingo', checked: settings.blockPokerAndBingo },
    { cat: GamblingCategory.CRYPTO_BETTING, key: 'blockCryptoBetting', checked: settings.blockCryptoBetting },
    { cat: GamblingCategory.FANTASY_LOTTERY, key: 'blockFantasyAndLottery', checked: settings.blockFantasyAndLottery },
  ];

  const guardItems: Array<{
    key: keyof ProtectionSettingsState;
    title: string;
    detail: string;
    checked: boolean;
  }> = [
    {
      key: 'browserShieldEnabled',
      title: 'All-Browser & WebView Guard (Zero-VPN)',
      detail: 'Intercepts gambling URLs while typing across 20+ browsers while keeping your VPN free.',
      checked: settings.browserShieldEnabled,
    },
    {
      key: 'playStoreGuardEnabled',
      title: 'Play Store & APK Download Blocker',
      detail: 'Stops betting app searches, Play Store installs, and sideloaded APKs automatically.',
      checked: settings.playStoreGuardEnabled,
    },
    {
      key: 'appShieldEnabled',
      title: 'Installed Betting App Shield',
      detail: 'Blocks betting apps on launch while leaving banking, social, and VPN apps untouched.',
      checked: settings.appShieldEnabled,
    },
    {
      key: 'adBlockerEnabled',
      title: 'Betting Ads, Popunders & Affiliates',
      detail: 'Strips gambling banners, affiliate btag links, and betting popunder redirects.',
      checked: settings.adBlockerEnabled,
    },
    {
      key: 'searchGuardEnabled',
      title: 'Search Engine Gambling Guard',
      detail: 'Blocks direct betting queries while keeping recovery helplines always accessible.',
      checked: settings.searchGuardEnabled,
    },
    {
      key: 'depositGuardEnabled',
      title: 'Cashier & Booking-Code Firewall',
      detail: 'Blocks deposit pages, promo bonus URLs, and shared bet-slip booking codes.',
      checked: settings.depositGuardEnabled,
    },
  ];

  const handleAddDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = domainInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('.')) {
      setDomainError('Enter a valid website domain (e.g. mybookie.ag).');
      return;
    }
    setDomainError(null);
    onAddCustomDomain(trimmed, domainMode === 'allow');
    setDomainInput('');
  };

  return (
    <div data-testid="mainapp-tab-rules" className="space-y-6">
      <div>
        <p className="font-mono text-[11px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
          Blocking Engine &amp; Custom Rules
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
          Blocklist &amp; Real-Time Guards
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {isLocked
            ? 'Commitment Lock active: you can add stronger rules anytime, but weakening active rules is locked.'
            : 'Only betting platforms and apps you choose are blocked — everyday apps and VPNs stay untouched.'}
        </p>
      </div>

      {/* Categories & Real-Time Guards Split */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Gambling Categories
          </h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            All 5 built-in categories are armed by default.
          </p>

          <div className="mt-4 divide-y divide-[var(--subtle-border)]">
            {categoryItems.map((item) => {
              const meta = GAMBLING_CATEGORY_META[item.cat];
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink)]">{meta.displayName}</p>
                    <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{meta.description}</p>
                  </div>
                  <LiquidSwitch
                    checked={item.checked}
                    onChange={(next) => onToggleSetting(item.key, next)}
                    ariaLabel={`Toggle ${meta.displayName}`}
                  />
                </div>
              );
            })}
            <div className="flex items-center justify-between gap-4 pt-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Smart Mirror &amp; Keyword Filter
                </p>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  Catches newly registered mirror domains and betting WebViews automatically.
                </p>
              </div>
              <LiquidSwitch
                checked={settings.strictKeywordFilter}
                onChange={(next) => onToggleSetting('strictKeywordFilter', next)}
                ariaLabel="Toggle Smart Mirror & Keyword Filter"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Real-Time Shield Layers
          </h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Works alongside ProtonVPN, Mullvad, NordVPN, WARP &amp; banking apps.
          </p>

          <div className="mt-4 divide-y divide-[var(--subtle-border)]">
            {guardItems.map((guard) => (
              <div
                key={guard.key}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">{guard.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{guard.detail}</p>
                </div>
                <LiquidSwitch
                  checked={guard.checked}
                  onChange={(next) => onToggleSetting(guard.key, next)}
                  ariaLabel={`Toggle ${guard.title}`}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Custom Domains & Extra Blocked Apps */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Custom Domain Rules
          </h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Add specific mirror links to block or safe exceptions to allow.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--control-bg)] p-1">
            <button
              type="button"
              onClick={() => setDomainMode('block')}
              className={`h-9 cursor-pointer rounded-lg text-xs font-semibold transition-colors ${
                domainMode === 'block'
                  ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              Block Domain
            </button>
            <button
              type="button"
              onClick={() => setDomainMode('allow')}
              className={`h-9 cursor-pointer rounded-lg text-xs font-semibold transition-colors ${
                domainMode === 'allow'
                  ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              Allowlist Exception
            </button>
          </div>

          <form onSubmit={handleAddDomainSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              data-testid="rules-custom-domain-input"
              aria-label="Custom website domain"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value);
                setDomainError(null);
              }}
              placeholder="e.g. mybookie.ag"
              className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />
            <button
              type="submit"
              data-testid="rules-add-domain-btn"
              aria-label="Add custom domain rule"
              className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </form>

          {domainError ? (
            <p className="mt-2 text-xs font-medium text-[var(--accent-ink)]">{domainError}</p>
          ) : null}

          <div className="mt-4 space-y-2">
            {customBlockedDomains.length === 0 && allowlistedDomains.length === 0 ? (
              <p className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3 text-xs text-[var(--ink-muted)]">
                No custom domain rules added yet. Built-in coverage already protects 1,035+ sites.
              </p>
            ) : (
              <>
                {customBlockedDomains.map((d) => (
                  <div
                    key={`block-${d.domain}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-semibold text-[var(--ink)]">
                        {d.domain}
                      </p>
                      <p className="text-[11px] text-[var(--accent-ink)]">Custom Blocked</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCustomDomain(d.domain, false)}
                      aria-label={`Remove blocked domain ${d.domain}`}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {allowlistedDomains.map((d) => (
                  <div
                    key={`allow-${d.domain}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-semibold text-[var(--ink)]">
                        {d.domain}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)]">Allowlisted</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCustomDomain(d.domain, true)}
                      aria-label={`Remove allowlisted domain ${d.domain}`}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Extra Blocked Apps */}
        <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Protected Betting Apps
          </h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            150+ betting apps are blocked automatically. Add extra app rules below.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COMMON_EXTRA_APPS.map((app) => {
              const added = customBlockedApps.some((a) => a.packageName === app.packageName);
              return (
                <button
                  key={app.packageName}
                  type="button"
                  onClick={() =>
                    added
                      ? onRemoveBlockedApp(app.packageName)
                      : onAddBlockedApp(app.packageName, app.label)
                  }
                  className={`flex min-h-[48px] cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                    added
                      ? 'border-[var(--active-fill)] bg-[var(--soft-accent-bg)]'
                      : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:border-[var(--glass-border)]'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <BettingBrandLogo target={app.label} size="xs" />
                    <span className="truncate text-xs font-semibold text-[var(--ink)]">
                      {app.label}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] font-bold text-[var(--accent-ink)] uppercase">
                    {added ? 'Pinned' : 'Pin'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Searchable Covered Platforms with Crisp Logos */}
      <section className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Covered Betting Platforms ({BETTING_BRAND_CATALOG.length} Featured)
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              All major Nigerian, African, UK, US, and offshore sportsbooks &amp; casinos.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              aria-label="Search covered betting brands"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Search brand or region..."
              className="h-10 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] pr-3 pl-9 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center gap-3 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3"
            >
              <BettingBrandLogo target={brand.primaryDomain} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[var(--ink)]">{brand.name}</p>
                <p className="truncate font-mono text-[10px] text-[var(--ink-muted)]">
                  {brand.primaryDomain} · {brand.region}
                </p>
              </div>
              <Shield className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
