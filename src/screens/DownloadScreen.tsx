import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Download,
  GlobeLock,
  LockKeyhole,
  Share,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import { BrandGIcon } from '../components/AppHeader';
import { LiquidGlassCard, LiquidShieldOrb } from '../components/LiquidGlass';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { formatNaira } from '../utils/currency';
import {
  buildLockCountdownQuad,
  formatLockDurationLong,
  LOCK_DURATION_PRESETS,
} from '../utils/lockDurations';
import {
  formatIosBlocklistText,
  getDefaultInstallGuideTarget,
  getOrderedPlatformCards,
  TOP_BETTING_DOMAINS_FOR_IOS,
} from '../utils/platformCompatibility';

type AndroidPreviewTab = 'shield' | 'rules' | 'progress' | 'lock';

const PREVIEW_TABS: Array<{
  id: AndroidPreviewTab;
  num: string;
  label: string;
}> = [
  { id: 'shield', num: '01', label: 'Shield' },
  { id: 'rules', num: '02', label: 'Rules' },
  { id: 'progress', num: '03', label: 'Progress' },
  { id: 'lock', num: '04', label: 'Lock' },
];

const SPEND_PRESETS = [1000, 2500, 5000, 10000] as const;

interface DownloadScreenProps {
  onOpenWebApp?: () => void;
}

export const DownloadScreen: React.FC<DownloadScreenProps> = ({ onOpenWebApp }) => {
  const { isIOS, clientPlatform } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<AndroidPreviewTab>('shield');
  const [installGuideTab, setInstallGuideTab] = useState<'android' | 'ios'>(() =>
    getDefaultInstallGuideTarget(clientPlatform),
  );
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isPausedByHover, setIsPausedByHover] = useState(false);
  const [dailySpendNgn, setDailySpendNgn] = useState<number>(5000);
  const [previewLockDays, setPreviewLockDays] = useState<number>(180);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedIosDomains, setCopiedIosDomains] = useState(false);

  const builtInDomainCount = GamblingRegistry.domainToCategory.size;
  const builtInAppCount = GamblingRegistry.knownGamblingAppPackages.size;
  const thirtyDaySaved = formatNaira(dailySpendNgn * 30);
  const annualSaved = formatNaira(dailySpendNgn * 365);
  const weekSaved = formatNaira(dailySpendNgn * 7);

  // Preview countdown corresponding to the selected lock period (24h up to 2 years)
  const previewRemainingMs = Math.max(0, (previewLockDays * 86400 - 60) * 1000);
  const previewLockQuad = buildLockCountdownQuad(previewRemainingMs);
  const compactLockTimer = `${previewLockQuad[0].digits}d ${previewLockQuad[1].digits}h ${previewLockQuad[2].digits}m`;

  // Smooth auto-tour across the 4 authentic Android app screens
  useEffect(() => {
    if (!autoAdvance || isPausedByHover) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const order: AndroidPreviewTab[] = ['shield', 'rules', 'progress', 'lock'];
    const timer = window.setInterval(() => {
      setActiveTab((prev) => {
        const idx = order.indexOf(prev);
        return order[(idx + 1) % order.length];
      });
    }, 4500);

    return () => window.clearInterval(timer);
  }, [autoAdvance, isPausedByHover]);

  const selectPreviewTab = (tab: AndroidPreviewTab) => {
    setAutoAdvance(false);
    setActiveTab(tab);
  };

  const isAppleHandheld = isIOS || clientPlatform === 'ios';
  const isAndroidHandheld = clientPlatform === 'android';
  const orderedPlatformCards = getOrderedPlatformCards(clientPlatform);

  const features = [
    {
      num: '01',
      icon: LockKeyhole,
      title: 'Commitment Lock & Install Guard',
      body: 'Asks for your first name, arms local Anti-Tamper protection, and locks your countdown from 24 hours up to 2 years right after install.',
      wide: true,
    },
    {
      num: '02',
      icon: GlobeLock,
      title: 'Play-Protect Safe On-Device DNS Shield',
      body: 'Uses Android’s local DNS Shield tunnel (zero Accessibility & zero Device Admin triggers) so SportyBet, Bet9ja, 1xBet & Stake resolve nowhere.',
      wide: false,
    },
    {
      num: '03',
      icon: Smartphone,
      title: `${builtInAppCount}+ Betting Apps & New APKs`,
      body: 'Watches installed betting apps and catches newly sideloaded or Play Store betting APKs immediately upon install.',
      wide: false,
    },
    {
      num: '04',
      icon: Clock,
      title: 'Night, Weekend & Payday Guard',
      body: 'Tightens keyword and search blocking automatically from 10 PM to 5 AM, across matchday weekends, and on salary days (25th to 3rd).',
      wide: false,
    },
    {
      num: '05',
      icon: Wallet,
      title: 'Local Naira (₦) Savings Ledger',
      body: 'Calculates how much money stays with you based on your daily stake — stored safely on-device without accounts or subscriptions.',
      wide: false,
    },
    {
      num: '06',
      icon: ShieldCheck,
      title: 'iPhone + Android Without Subscriptions',
      body: 'Android phones install the direct APK with local DNS Shield + Private DNS helper, while iPhone users get a native Home-Screen G app + 1-tap Screen Time list.',
      wide: true,
    },
  ];

  const comparisonRows = [
    {
      capability: 'Cost & Sign-Up',
      gambleAware: 'Free forever · Zero account',
      gamban: 'Paid subscription · Account required',
    },
    {
      capability: `${builtInDomainCount}+ Websites & In-App Browsers`,
      gambleAware: 'On-device DNS Shield + Private DNS',
      gamban: 'Cloud VPN subscription required',
    },
    {
      capability: `${builtInAppCount}+ Betting Apps & Sideloaded APKs`,
      gambleAware: 'Install Guard alerts + APK registry',
      gamban: 'Focused mainly on web traffic',
    },
    {
      capability: 'Google Play Protect Clearance',
      gambleAware: 'Clean manifest · No Accessibility spyware warnings',
      gamban: 'Play Store / paid license only',
    },
    {
      capability: 'Naira (₦) Tracker & Payday Rules',
      gambleAware: 'Built in · Saved offline',
      gamban: 'Not included',
    },
  ];

  const installSteps = [
    {
      num: '01',
      title: 'Download GambleAware.apk',
      desc: 'Tap Download Android App to save the installer to your Android phone.',
    },
    {
      num: '02',
      title: 'Install without Play Protect blocks',
      desc: 'Open the APK from Downloads and tap Install — built with Play-Protect-safe On-Device DNS Shield permissions.',
    },
    {
      num: '03',
      title: 'Arm DNS Shield & Lock Timer',
      desc: 'Add your first name, tap Approve DNS Shield (and optional Private DNS / Always-On VPN lock), and set a timer up to 2 years.',
    },
  ];

  const handleCopyAppUrl = async () => {
    try {
      await navigator.clipboard.writeText('https://gbb.sidihost.sbs');
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  const handleCopyIosBlocklist = async () => {
    try {
      await navigator.clipboard.writeText(formatIosBlocklistText());
      setCopiedIosDomains(true);
      window.setTimeout(() => setCopiedIosDomains(false), 2400);
    } catch {
      setCopiedIosDomains(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pt-8 pb-20 md:px-6 md:pt-12 md:pb-24">
      {/* Hero Split Section */}
      <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col items-start lg:col-span-6">
          <h1 className="font-display text-[clamp(2.1rem,4vw,3.45rem)] leading-[1.06] font-bold tracking-tight text-balance text-[var(--ink)]">
            A gambling blocker you can&rsquo;t switch off midway.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-muted)]">
            GambleAware blocks {builtInDomainCount}+ sportsbooks, casinos, and {builtInAppCount}+
            betting apps on Android using a Play-Protect-safe On-Device DNS Shield — and lets iPhone
            users install cleanly via Safari Home Screen + Screen Time.
          </p>

          <div className="mt-7 flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            {isAppleHandheld && onOpenWebApp ? (
              <button
                type="button"
                onClick={onOpenWebApp}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-sm font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90"
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                <span>Open &amp; Install for iPhone</span>
              </button>
            ) : (
              <a
                href="/downloads/GambleAware-Nigeria.apk?v=2.1.0"
                download="GambleAware-v2.1.apk"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-sm font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>Download Android App</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => void handleCopyAppUrl()}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-sm font-semibold whitespace-nowrap text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)]"
            >
              {copiedUrl ? (
                <Check className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              )}
              <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          {isAppleHandheld ? (
            <div className="mt-4 w-full max-w-xl rounded-2xl border border-[var(--glass-border)] bg-[var(--muted-fill)] px-4 py-3 text-xs leading-relaxed text-[var(--ink)]">
              <span className="font-semibold text-[var(--accent-ink)]">iPhone Ready:</span> Open
              in Safari, tap <span className="font-semibold">Open &amp; Install for iPhone</span>{' '}
              above, then tap <span className="font-semibold">Share → Add to Home Screen</span> +
              our{' '}
              <a href="#platforms" className="font-semibold underline underline-offset-2">
                22-site Screen Time Blocker List
              </a>{' '}
              below.
            </div>
          ) : null}

          <p className="mt-4 text-xs text-[var(--ink-muted)]">
            {isAppleHandheld
              ? 'iPhone / iPad detected · Home-Screen app & Screen Time list ready · Free'
              : isAndroidHandheld
                ? 'Android phone detected · Direct Play-Protect-safe APK ready · Free'
                : 'Android 7.0+ APK · iPhone Home-Screen + Screen Time · Free with zero sign-up'}
          </p>

          {/* Clean Architectural Spec Strip */}
          <div className="mt-8 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-[var(--subtle-border)] pt-6">
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-[var(--ink)] tabular-nums sm:text-2xl">
                {builtInDomainCount}+
              </p>
              <p className="mt-0.5 text-xs leading-snug text-[var(--ink-muted)]">
                Betting sites &amp; links
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-[var(--ink)] tabular-nums sm:text-2xl">
                {builtInAppCount}+
              </p>
              <p className="mt-0.5 text-xs leading-snug text-[var(--ink-muted)]">
                Apps &amp; new APKs
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-[var(--accent-ink)] tabular-nums sm:text-2xl">
                2 Years
              </p>
              <p className="mt-0.5 text-xs leading-snug text-[var(--ink-muted)]">
                Max Lock timer
              </p>
            </div>
          </div>
        </div>

        {/* Right: Centered App Screen Switcher + Authentic Hardware Android Frame */}
        <div
          className="flex flex-col items-center lg:col-span-6"
          onMouseEnter={() => setIsPausedByHover(true)}
          onMouseLeave={() => setIsPausedByHover(false)}
        >
          {/* Centered Screen Switcher (No theme switch next to it) */}
          <div
            role="tablist"
            aria-label="Android app screens"
            className="mb-4 inline-flex max-w-full items-center gap-1 rounded-2xl border border-[var(--subtle-border)] bg-[var(--glass-fill)] p-1 backdrop-blur-xl"
          >
            {PREVIEW_TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectPreviewTab(tab.id)}
                  className={`cursor-pointer rounded-xl px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors sm:px-3 ${
                    selected
                      ? 'bg-[var(--muted-fill)] font-semibold text-[var(--accent-ink)]'
                      : 'font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-70">{tab.num}</span>{' '}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Hardware-Crafted Android Phone Chassis */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[58px] opacity-20 blur-2xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 35%, var(--active-fill), transparent 68%)',
              }}
            />

            <div className="relative w-[304px] rounded-[44px] border-[3px] border-[var(--glass-border)] bg-[var(--surface)] p-2.5 shadow-2xl ring-1 ring-[var(--subtle-border)] sm:w-[324px]">
              {/* Hardware Side Keys */}
              <div
                aria-hidden="true"
                className="absolute top-24 -right-[5px] h-14 w-[3px] rounded-r-sm bg-[var(--subtle-border)]"
              />
              <div
                aria-hidden="true"
                className="absolute top-42 -right-[5px] h-9 w-[3px] rounded-r-sm bg-[var(--subtle-border)]"
              />

              {/* Inner Android Viewport matching native Compose theme & fixed height */}
              <div className="relative flex h-[584px] flex-col justify-between overflow-hidden rounded-[34px] border border-[var(--subtle-border)] bg-[var(--canvas)] text-[var(--ink)]">
                {/* Native Android Status Strip */}
                <div className="flex shrink-0 items-center justify-between px-5 pt-3 pb-1.5 font-mono text-[10px] font-semibold text-[var(--ink-muted)] tabular-nums">
                  <span>9:41</span>
                  <div className="h-3.5 w-3.5 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)]" />
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <span className="inline-block h-2.5 w-4 rounded-[3px] border border-current p-[1.5px]">
                      <span className="block h-full w-3 rounded-[1px] bg-current" />
                    </span>
                  </div>
                </div>

                {/* Active Native Screen Body */}
                <div className="flex-1 overflow-hidden px-3.5 pt-1.5 pb-2.5">
                  {/* SCREEN 01: ShieldScreen.kt */}
                  {activeTab === 'shield' ? (
                    <div className="flex h-full flex-col justify-between gap-2.5">
                      <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display text-sm font-bold whitespace-nowrap text-[var(--ink)]">
                              GambleAware · Tunde
                            </p>
                            <p className="text-[10px] text-[var(--ink-muted)]">
                              On-Device DNS Shield &amp; App Guard
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[var(--accent-ink)]">
                            <LockKeyhole className="h-3 w-3" />
                            <span>Locked</span>
                          </span>
                        </div>

                        <div className="my-1 flex justify-center">
                          <div className="-my-4 scale-[0.78]">
                            <LiquidShieldOrb
                              isProtected
                              isLocked
                              onClick={() => selectPreviewTab('lock')}
                            />
                          </div>
                        </div>

                        <p className="text-center font-display text-sm font-bold text-[var(--ink)]">
                          DNS Shield &amp; Lock On
                        </p>
                        <p className="mt-0.5 text-center text-[10px] leading-snug text-[var(--ink-muted)]">
                          Blocking SportyBet, Bet9ja, Bet365, 1xBet, Stake &amp; betting apps.
                        </p>

                        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-2 text-[10px]">
                          <span className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                            <LockKeyhole className="h-3 w-3 text-[var(--accent-ink)]" />
                            <span>{formatLockDurationLong(previewLockDays)} Lock</span>
                          </span>
                          <span className="font-mono font-bold text-[var(--accent-ink)] tabular-nums">
                            {compactLockTimer}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5">
                          <p className="text-[9px] text-[var(--ink-muted)]">Clean Streak</p>
                          <p className="mt-0.5 font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                            7d 14h
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5">
                          <p className="text-[9px] text-[var(--ink-muted)]">Blocked</p>
                          <p className="mt-0.5 font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                            28
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--muted-fill)] p-2.5">
                          <p className="text-[9px] text-[var(--ink-muted)]">Saved (7d)</p>
                          <p className="mt-0.5 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                            {weekSaved}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[11px] font-semibold text-[var(--ink)]">
                            sportybet.com
                          </p>
                          <p className="text-[10px] text-[var(--ink-muted)]">
                            DNS Shield · Sportsbook · Just now
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] px-2 py-0.5 font-mono text-[9.5px] font-bold text-[var(--accent-ink)]">
                          3 blocked
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* SCREEN 02: BlocklistScreen.kt */}
                  {activeTab === 'rules' ? (
                    <div className="flex h-full flex-col gap-2.5">
                      <div className="px-0.5">
                        <p className="font-display text-base font-bold text-[var(--ink)]">
                          Blocklist &amp; Rules
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          Categories, keywords, custom domains &amp; apps
                        </p>
                      </div>

                      <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-3">
                        <p className="text-xs font-semibold text-[var(--ink)]">
                          Gambling Categories
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          {builtInDomainCount}+ sites included out of the box
                        </p>

                        <div className="mt-2.5 divide-y divide-[var(--subtle-border)]/70">
                          {[
                            { name: 'Sportsbooks & Live Betting', count: '210+ sites' },
                            { name: 'Online Casinos & Slots', count: '190+ sites' },
                            { name: 'Crypto & Crash Games', count: '95+ sites' },
                            { name: 'Fantasy & Lotteries', count: '80+ sites' },
                          ].map((cat) => (
                            <div
                              key={cat.name}
                              className="flex items-center justify-between py-2 text-[11px]"
                            >
                              <div>
                                <p className="font-medium text-[var(--ink)]">{cat.name}</p>
                                <p className="text-[9px] text-[var(--ink-muted)]">{cat.count}</p>
                              </div>
                              <span className="inline-flex h-4 w-7 items-center justify-end rounded-full bg-[var(--active-fill)] px-0.5">
                                <span className="h-3 w-3 rounded-full bg-[var(--active-content)]" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-[var(--subtle-border)] bg-[var(--surface)] p-3">
                        <p className="text-xs font-semibold text-[var(--ink)]">
                          Device-Wide Filters
                        </p>
                        <div className="mt-2 space-y-2 text-[11px]">
                          {[
                            { label: 'Browsers & In-App Links', detail: 'Chrome, IG, TikTok, TG' },
                            { label: 'Installed & New APKs', detail: `${builtInAppCount}+ betting apps` },
                            { label: 'Night & Payday Guard', detail: '10 PM–5 AM, weekends & 25th–3rd' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <div className="min-w-0 pr-2">
                                <p className="truncate font-medium text-[var(--ink)]">{item.label}</p>
                                <p className="text-[9px] text-[var(--ink-muted)]">{item.detail}</p>
                              </div>
                              <span className="font-mono text-[9px] font-semibold text-[var(--accent-ink)]">
                                ON
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* SCREEN 03: ActivityScreen.kt */}
                  {activeTab === 'progress' ? (
                    <div className="flex h-full flex-col justify-between gap-2">
                      <div className="px-0.5">
                        <p className="font-display text-base font-bold text-[var(--ink)]">
                          Savings &amp; Activity
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          Clean days, Naira saved &amp; blocked log
                        </p>
                      </div>

                      <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-[9px] text-[var(--ink-muted)]">
                              30-Day Money Saved
                            </p>
                            <p className="font-display text-lg font-bold text-[var(--accent-ink)] tabular-nums">
                              {thirtyDaySaved}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-[9px] text-[var(--ink-muted)]">
                              1-Year Est.
                            </p>
                            <p className="font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                              {annualSaved}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5">
                          <svg viewBox="0 0 220 76" className="h-[72px] w-full">
                            <defs>
                              <linearGradient id="goalNairaFill" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                  offset="0%"
                                  stopColor="var(--active-fill)"
                                  stopOpacity="0.34"
                                />
                                <stop
                                  offset="100%"
                                  stopColor="var(--active-fill)"
                                  stopOpacity="0"
                                />
                              </linearGradient>
                            </defs>
                            <line
                              x1="0"
                              y1="64"
                              x2="220"
                              y2="64"
                              stroke="var(--subtle-border)"
                              strokeWidth="1"
                            />
                            <line
                              x1="0"
                              y1="34"
                              x2="220"
                              y2="34"
                              stroke="var(--subtle-border)"
                              strokeDasharray="3 3"
                              strokeWidth="1"
                            />
                            <path
                              d="M 8 64 Q 64 56 112 38 T 212 10 L 212 72 L 8 72 Z"
                              fill="url(#goalNairaFill)"
                            />
                            <path
                              d="M 8 64 Q 64 56 112 38 T 212 10"
                              fill="none"
                              stroke="var(--active-fill)"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                            />
                            <circle
                              cx="112"
                              cy="38"
                              r="3.5"
                              fill="var(--canvas)"
                              stroke="var(--active-fill)"
                              strokeWidth="2"
                            />
                            <circle cx="212" cy="10" r="4" fill="var(--active-fill)" />
                          </svg>
                          <div className="mt-1 flex justify-between font-mono text-[9px] text-[var(--ink-muted)]">
                            <span>Day 1</span>
                            <span>Day 14</span>
                            <span>Day 30</span>
                          </div>
                        </div>

                        <p className="mt-2.5 mb-1.5 text-[10px] font-medium text-[var(--ink-muted)]">
                          Select typical daily stake:
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {SPEND_PRESETS.map((amount) => {
                            const selected = dailySpendNgn === amount;
                            return (
                              <button
                                key={amount}
                                type="button"
                                onClick={() => {
                                  setAutoAdvance(false);
                                  setDailySpendNgn(amount);
                                }}
                                className={`h-7 cursor-pointer rounded-lg border font-mono text-[10px] font-semibold tabular-nums transition-colors ${
                                  selected
                                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                                    : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                                }`}
                              >
                                ₦{amount >= 1000 ? `${amount / 1000}k` : amount}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-[var(--ink)]">
                          Blocked Sites &amp; Apps
                        </p>
                        <div className="mt-1.5 space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-mono font-semibold text-[var(--ink)]">
                              bet9ja.com
                            </span>
                            <span className="shrink-0 rounded-full bg-[var(--soft-accent-bg)] px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--accent-ink)]">
                              4 blocked
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-mono font-semibold text-[var(--ink)]">
                              SportyBet App
                            </span>
                            <span className="shrink-0 rounded-full bg-[var(--soft-accent-bg)] px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--accent-ink)]">
                              2 blocked
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* SCREEN 04: LockSettingsScreen.kt (Interactive 24h – 2 Years) */}
                  {activeTab === 'lock' ? (
                    <div className="flex h-full flex-col justify-between gap-2">
                      <div className="px-0.5">
                        <p className="font-display text-base font-bold text-[var(--ink)]">
                          Commitment Lock
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          Lock uninstalls &amp; settings up to 2 years
                        </p>
                      </div>

                      <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--ink)]">
                            {formatLockDurationLong(previewLockDays)} Lock Armed
                          </span>
                          <LockKeyhole className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                        </div>
                        <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                          Cannot be undone until timer hits zero
                        </p>

                        <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                          {previewLockQuad.map((slot) => (
                            <div
                              key={slot.unit}
                              className="flex flex-col items-center rounded-xl border border-[var(--glass-border)] bg-[var(--muted-fill)] py-2"
                            >
                              <span className="font-mono text-sm font-bold text-[var(--ink)] tabular-nums">
                                {slot.digits}
                              </span>
                              <span className="font-mono text-[8px] font-semibold text-[var(--accent-ink)]">
                                {slot.unit}
                              </span>
                            </div>
                          ))}
                        </div>

                        <p className="mt-2.5 mb-1.5 text-[10px] font-medium text-[var(--ink-muted)]">
                          Select lock duration:
                        </p>
                        <div className="grid grid-cols-7 gap-1">
                          {LOCK_DURATION_PRESETS.map((preset) => {
                            const selected = previewLockDays === preset.days;
                            return (
                              <button
                                key={preset.days}
                                type="button"
                                onClick={() => {
                                  setAutoAdvance(false);
                                  setPreviewLockDays(preset.days);
                                }}
                                aria-label={`Preview ${preset.label} lock`}
                                className={`h-7 cursor-pointer rounded-md border px-0 font-mono text-[9.5px] font-semibold transition-colors ${
                                  selected
                                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                                    : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                                }`}
                              >
                                {preset.shortLabel}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {[
                          { label: 'Device Admin Delete Lock', status: 'Locked On' },
                          { label: 'Settings Tamper Guard', status: 'Active' },
                          { label: 'Accountability PIN', status: '4-Digit' },
                          { label: 'Local Cache-Safe Storage', status: 'Protected' },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-1.5 text-[11px]"
                          >
                            <span className="text-[var(--ink)]">{row.label}</span>
                            <span className="font-mono text-[10px] font-semibold text-[var(--accent-ink)]">
                              {row.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Native Android LiquidFloatingNavBar */}
                <div className="shrink-0 px-3 pb-2.5">
                  <div className="grid grid-cols-4 gap-1 rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-1 backdrop-blur-xl">
                    {[
                      { id: 'shield' as const, label: 'Shield', icon: BrandGIcon },
                      { id: 'rules' as const, label: 'Rules', icon: SlidersHorizontal },
                      { id: 'progress' as const, label: 'Progress', icon: TrendingUp },
                      { id: 'lock' as const, label: 'Lock', icon: LockKeyhole },
                    ].map((nav) => {
                      const Icon = nav.icon;
                      const selected = activeTab === nav.id;
                      return (
                        <button
                          key={nav.id}
                          type="button"
                          onClick={() => selectPreviewTab(nav.id)}
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-[16px] py-1.5 transition-colors ${
                            selected
                              ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                              : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="mt-0.5 text-[9px] leading-none font-semibold">
                            {nav.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-[var(--ink-muted)]">
            Interactive preview · Tap tabs or lock durations (24h – 2y)
          </p>
        </div>
      </section>

      {/* Numbered Capabilities Bento Grid */}
      <section id="features" className="scroll-mt-20 border-t border-[var(--subtle-border)] pt-12">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-balance text-[var(--ink)] sm:text-3xl">
            Six protections built directly into Android.
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--ink-muted)]">
            Everything runs locally on your phone with no account, no subscription, and no server
            dependency. Clearing cache or app data will not wipe your timer or blocklist.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <LiquidGlassCard
                key={feat.num}
                className={`flex flex-col justify-between p-6 ${
                  feat.wide ? 'lg:col-span-6' : 'lg:col-span-3'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[var(--accent-ink)] tabular-nums">
                      {feat.num}.
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] text-[var(--accent-ink)]">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-[var(--ink)]">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{feat.body}</p>
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      </section>

      {/* Android & iPhone (2-Platform Clean Layout — No Desktop Web App Clutter) */}
      <section
        id="platforms"
        className="scroll-mt-20 border-t border-[var(--subtle-border)] pt-12"
      >
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-balance text-[var(--ink)] sm:text-3xl">
            Built for Android &amp; iPhone.
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--ink-muted)]">
            Install the native Android APK for on-device DNS Shield blocking, or set up GambleAware
            on your iPhone cleanly via Safari Home Screen + Screen Time.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {orderedPlatformCards.map((platformKey) =>
            platformKey === 'android' ? (
              <LiquidGlassCard key="android" className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--accent-ink)]">
                      {isAndroidHandheld ? 'YOUR DEVICE · ANDROID 7.0+' : 'ANDROID 7.0+'}
                    </span>
                    <Smartphone className="h-4 w-4 text-[var(--accent-ink)]" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[var(--ink)]">
                    Native Android Blocker (APK)
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                    Blocks {builtInDomainCount}+ betting websites across Chrome, Instagram, TikTok,
                    and Telegram using an on-device DNS Shield tunnel — engineered to install
                    cleanly without Accessibility or Device Admin Play Protect blocks.
                  </p>
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        • On-Device DNS Shield:
                      </span>{' '}
                      Drops gambling DNS lookups locally while forwarding safe traffic with zero ads
                      or tracking.
                    </li>
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        • Install Guard + 2y Lock:
                      </span>{' '}
                      Matches 130+ betting apps on DNS and supports Android Always-On VPN lock.
                    </li>
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        • Clean Permissions:
                      </span>{' '}
                      Zero Accessibility, zero Device Admin, and zero background package spying.
                    </li>
                  </ul>
                </div>
                <a
                  href="/downloads/GambleAware-Nigeria.apk?v=2.1.0"
                  download="GambleAware-v2.1.apk"
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download GambleAware.apk</span>
                </a>
              </LiquidGlassCard>
            ) : (
              <LiquidGlassCard key="ios" className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--accent-ink)]">
                      {isAppleHandheld
                        ? 'YOUR DEVICE · IPHONE & IPAD (IOS)'
                        : 'IPHONE & IPAD (IOS)'}
                    </span>
                    <Share className="h-4 w-4 text-[var(--accent-ink)]" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[var(--ink)]">
                    iPhone Home-Screen App + Screen Time Block
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                    Apple does not allow APK installers, so iPhone users get a dedicated Home-Screen
                    GambleAware G app paired with native Apple Screen Time site blocking:
                  </p>
                  <ol className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        1. Add G App to Home Screen:
                      </span>{' '}
                      On your iPhone in Safari, open{' '}
                      <span className="font-mono font-semibold text-[var(--ink)]">
                        gbb.sidihost.sbs/?app=1
                      </span>{' '}
                      and tap{' '}
                      <span className="font-semibold text-[var(--ink)]">
                        Share → Add to Home Screen
                      </span>{' '}
                      for offline clean-streak, ₦ savings, goals &amp; 60s Calm Reset.
                    </li>
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        2. Block betting sites natively:
                      </span>{' '}
                      Go to{' '}
                      <span className="font-semibold text-[var(--ink)]">
                        Settings → Screen Time → Content &amp; Privacy Restrictions → Web Content →
                        Limit Adult Websites → Never Allow
                      </span>{' '}
                      and paste the betting domains below.
                    </li>
                  </ol>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  {isAppleHandheld && onOpenWebApp ? (
                    <button
                      type="button"
                      onClick={onOpenWebApp}
                      className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
                    >
                      <Smartphone className="h-4 w-4 shrink-0" />
                      <span>Open &amp; Add iPhone App</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleCopyIosBlocklist()}
                    className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                  >
                    {copiedIosDomains ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                    )}
                    <span>
                      {copiedIosDomains
                        ? `Copied ${TOP_BETTING_DOMAINS_FOR_IOS.length} Betting Sites`
                        : `Copy ${TOP_BETTING_DOMAINS_FOR_IOS.length} Top Betting Sites for iPhone`}
                    </span>
                  </button>
                </div>
              </LiquidGlassCard>
            ),
          )}
        </div>
      </section>

      {/* Clean Editorial 01/02/03 Install Guide + Play Protect Clearance + Gamban Comparison */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <LiquidGlassCard className="p-6 lg:col-span-5">
          <div id="install-guide" className="scroll-mt-20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-[var(--ink)]">
                {installGuideTab === 'ios'
                  ? 'How to install on iPhone'
                  : 'How to install on Android'}
              </h2>
              <div
                role="tablist"
                aria-label="Install guide device"
                className="inline-flex rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-0.5 text-[11px]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={installGuideTab === 'android'}
                  onClick={() => setInstallGuideTab('android')}
                  className={`cursor-pointer rounded-full px-2.5 py-1 font-semibold transition-colors ${
                    installGuideTab === 'android'
                      ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Android
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={installGuideTab === 'ios'}
                  onClick={() => setInstallGuideTab('ios')}
                  className={`cursor-pointer rounded-full px-2.5 py-1 font-semibold transition-colors ${
                    installGuideTab === 'ios'
                      ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  iPhone
                </button>
              </div>
            </div>

            {installGuideTab === 'ios' ? (
              <>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  Takes under two minutes in Safari — zero App Store friction, zero tracking, and
                  works together with Apple Screen Time.
                </p>

                <ol className="mt-5 divide-y divide-[var(--subtle-border)]/70">
                  <li className="flex items-start gap-3.5 pb-3.5">
                    <span className="mt-0.5 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                      01
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Open in iPhone Safari
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                        Tap <span className="font-semibold">Open &amp; Install for iPhone</span> or
                        visit <span className="font-mono">gbb.sidihost.sbs/?app=1</span> in Safari.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3.5 py-3.5">
                    <span className="mt-0.5 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                      02
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Add GambleAware G to Home Screen
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                        Tap Safari&rsquo;s <span className="font-semibold">Share</span> icon →{' '}
                        <span className="font-semibold">Add to Home Screen</span> for the offline G
                        app with Naira tracker, lock timer, and 60s Calm Reset.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3.5 pt-3.5">
                    <span className="mt-0.5 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                      03
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Lock Betting Sites in Screen Time
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                        Paste our {TOP_BETTING_DOMAINS_FOR_IOS.length}-domain blocklist into{' '}
                        <span className="font-semibold">
                          Settings → Screen Time → Content &amp; Privacy Restrictions → Web Content
                          → Never Allow
                        </span>
                        .
                      </p>
                    </div>
                  </li>
                </ol>

                <div className="mt-5 flex flex-col gap-2">
                  {isAppleHandheld && onOpenWebApp ? (
                    <button
                      type="button"
                      onClick={onOpenWebApp}
                      className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
                    >
                      <Smartphone className="h-4 w-4 shrink-0" />
                      <span>Open &amp; Install for iPhone</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleCopyIosBlocklist()}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                  >
                    {copiedIosDomains ? (
                      <Check className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                    ) : (
                      <Copy className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                    )}
                    <span>
                      {copiedIosDomains
                        ? `Copied ${TOP_BETTING_DOMAINS_FOR_IOS.length} Betting Sites`
                        : `Copy ${TOP_BETTING_DOMAINS_FOR_IOS.length} Top Betting Sites for iPhone`}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  Takes under two minutes. Zero registration, zero Accessibility service, and zero
                  Device Admin spyware flags.
                </p>

                <ol className="mt-5 divide-y divide-[var(--subtle-border)]/70">
                  {installSteps.map((item) => (
                    <li
                      key={item.num}
                      className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0"
                    >
                      <span className="mt-0.5 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                        {item.num}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                {/* Play Protect Clearance Note */}
                <div className="mt-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-4">
                  <p className="text-xs font-semibold text-[var(--ink)]">
                    Built clean for Google Play Protect
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-muted)]">
                    Google Play Protect flags sideloaded APKs that declare Accessibility or Device
                    Admin. GambleAware uses{' '}
                    <span className="font-semibold text-[var(--ink)]">On-Device DNS Shield</span> (
                    <span className="font-mono">VpnService</span>) + Install Guard instead, with
                    zero contact, SMS, storage, or Accessibility access.
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-muted)]">
                    For system-wide lockdown, enable{' '}
                    <span className="font-semibold text-[var(--ink)]">
                      Settings → Network &amp; internet → VPN → GambleAware → Always-on VPN
                    </span>
                    .
                  </p>
                </div>

                <a
                  href="/downloads/GambleAware-Nigeria.apk?v=2.1.0"
                  download="GambleAware-v2.1.apk"
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download Android App</span>
                </a>
              </>
            )}
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard className="p-6 lg:col-span-7">
          <div id="comparison" className="scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-[var(--ink)]">
              GambleAware vs. Gamban
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              GambleAware has zero subscription fee, blocks domains locally via DNS Shield + Private
              DNS, locks commitments up to 2 years, and stores all progress offline.
            </p>

            {/* Mobile stacked comparison */}
            <div className="mt-4 divide-y divide-[var(--subtle-border)]/70 sm:hidden">
              {comparisonRows.map((row) => (
                <div key={row.capability} className="space-y-1.5 py-3 text-xs">
                  <p className="font-semibold text-[var(--ink)]">{row.capability}</p>
                  <div className="flex items-start justify-between gap-3 text-[11px]">
                    <span className="shrink-0 text-[var(--ink-muted)]">GambleAware:</span>
                    <span className="inline-flex items-start gap-1 text-right font-medium text-[var(--accent-ink)]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{row.gambleAware}</span>
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 text-[11px]">
                    <span className="shrink-0 text-[var(--ink-muted)]">Gamban:</span>
                    <span className="text-right text-[var(--ink-muted)]">{row.gamban}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop 12-col table with subtle highlighted GambleAware column */}
            <div className="mt-5 hidden divide-y divide-[var(--subtle-border)]/70 sm:block">
              <div className="grid grid-cols-12 items-center gap-3 pb-2.5 text-xs font-semibold text-[var(--ink-muted)]">
                <span className="col-span-4">Feature</span>
                <span className="col-span-4 rounded-lg bg-[var(--muted-fill)] px-2.5 py-1 text-[var(--accent-ink)]">
                  GambleAware
                </span>
                <span className="col-span-4 px-2">Gamban</span>
              </div>
              {comparisonRows.map((row) => (
                <div
                  key={row.capability}
                  className="grid grid-cols-12 items-center gap-3 py-3 text-xs"
                >
                  <span className="col-span-4 pr-2 font-medium text-[var(--ink)]">
                    {row.capability}
                  </span>
                  <span className="col-span-4 flex items-start gap-1.5 rounded-lg bg-[var(--muted-fill)] px-2.5 py-1.5 font-medium text-[var(--accent-ink)]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{row.gambleAware}</span>
                  </span>
                  <span className="col-span-4 px-2 text-[var(--ink-muted)]">{row.gamban}</span>
                </div>
              ))}
            </div>
          </div>
        </LiquidGlassCard>
      </section>
    </div>
  );
};
