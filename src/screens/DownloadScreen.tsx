import React, { useEffect, useState } from 'react';
import {
  Anchor,
  Check,
  Clock,
  Copy,
  Download,
  GlobeLock,
  LockKeyhole,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import { LiquidGlassCard, LiquidShieldOrb } from '../components/LiquidGlass';
import { formatNaira } from '../utils/currency';
import {
  buildLockCountdownQuad,
  formatLockDurationLong,
  LOCK_DURATION_PRESETS,
} from '../utils/lockDurations';

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

export const DownloadScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AndroidPreviewTab>('shield');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isPausedByHover, setIsPausedByHover] = useState(false);
  const [dailySpendNgn, setDailySpendNgn] = useState<number>(5000);
  const [previewLockDays, setPreviewLockDays] = useState<number>(180);
  const [copiedUrl, setCopiedUrl] = useState(false);

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

  const features = [
    {
      num: '01',
      icon: LockKeyhole,
      title: 'Device Admin Lock from First Setup',
      body: 'Asks for your first name, turns on Android Device Admin, and sets your countdown right during installation so you cannot uninstall the app on a whim.',
      wide: true,
    },
    {
      num: '02',
      icon: GlobeLock,
      title: 'No VPN Slot Required',
      body: 'Blocks SportyBet, Bet9ja, BetKing, 1xBet, Stake, and betting links inside Chrome, Instagram, TikTok, and Telegram while keeping your VPN free.',
      wide: false,
    },
    {
      num: '03',
      icon: Smartphone,
      title: `${builtInAppCount}+ Betting Apps & New APKs`,
      body: 'Stops sportsbook and casino apps already on your phone and catches newly installed betting APKs before they open.',
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
      body: 'Calculates how much money stays with you based on your daily stake — stored on your device so clearing app cache will not wipe it.',
      wide: false,
    },
    {
      num: '06',
      icon: ShieldCheck,
      title: '24-Hour to 2-Year Lock & Settings Guard',
      body: 'Choose 24 hours, 7 days, 30 days, 90 days, 6 months, 1 year, or 2 years. App Info and Package Installer removal screens stay blocked until the clock runs out.',
      wide: true,
    },
  ];

  const comparisonRows = [
    {
      capability: 'Cost & Sign-Up',
      gambleAware: 'Free · No account needed',
      gamban: 'Paid subscription · Account required',
    },
    {
      capability: `${builtInDomainCount}+ Websites & In-App Links`,
      gambleAware: 'Blocks without using a VPN',
      gamban: 'Takes over your Android VPN slot',
    },
    {
      capability: `${builtInAppCount}+ Betting Apps & Sideloaded APKs`,
      gambleAware: 'Blocks installed & new apps',
      gamban: 'Focused mainly on web traffic',
    },
    {
      capability: 'Uninstall & Countdown Lock',
      gambleAware: 'Device Admin lock up to 2 years',
      gamban: 'Standard subscription settings',
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
      desc: 'Tap Download APK to save the Android installer to your phone.',
    },
    {
      num: '02',
      title: 'Confirm app installation',
      desc: 'Open the downloaded file from your browser or Downloads folder and tap Install.',
    },
    {
      num: '03',
      title: 'Arm Admin Lock & choose your timer',
      desc: 'Add your first name, grant Device Admin and Accessibility access, and lock in anywhere from 24 hours to 2 years.',
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pt-8 pb-20 md:px-6 md:pt-12 md:pb-24">
      {/* Hero Split Section */}
      <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col items-start lg:col-span-6">
          <h1 className="font-display text-[clamp(2.2rem,4vw,3.45rem)] leading-[1.06] font-bold tracking-tight text-balance text-[var(--ink)]">
            A gambling blocker you can&rsquo;t switch off midway.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-muted)]">
            GambleAware blocks {builtInDomainCount}+ sportsbooks, casinos, and {builtInAppCount}+
            betting apps on Android. Lock uninstalls and app settings for 24 hours up to 2 years —
            free, offline, and without taking your VPN slot.
          </p>

          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <a
              href="/downloads/GambleAware-Nigeria.apk"
              download="GambleAware.apk"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-[var(--active-fill)] px-6 text-sm font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Download Android App</span>
            </a>

            <button
              type="button"
              onClick={() => void handleCopyAppUrl()}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-5 text-sm font-semibold whitespace-nowrap text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)]"
            >
              {copiedUrl ? (
                <Check className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              )}
              <span>{copiedUrl ? 'Link Copied' : 'Copy Download Link'}</span>
            </button>
          </div>

          <p className="mt-4 text-xs text-[var(--ink-muted)]">
            Android 7.0+ <span aria-hidden="true">·</span> Free with zero sign-up{' '}
            <span aria-hidden="true">·</span> Keeps data on your device
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
                Max Admin lock
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
                              Zero-VPN · Browser, WebView &amp; App Shield
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
                          Protection &amp; Admin Lock On
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

                      <div className="flex items-center justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[11px] font-semibold text-[var(--ink)]">
                            sportybet.com
                          </p>
                          <p className="text-[10px] text-[var(--accent-ink)]">
                            Blocked in Chrome
                          </p>
                        </div>
                        <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
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

                      <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-[var(--ink)]">
                          Recent Blocks
                        </p>
                        <div className="mt-1.5 space-y-1 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[var(--ink)]">bet9ja.com</span>
                            <span className="text-[var(--accent-ink)]">Browser</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[var(--ink)]">SportyBet APK</span>
                            <span className="text-[var(--accent-ink)]">App Guard</span>
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
                      { id: 'shield' as const, label: 'Shield', icon: Anchor },
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

      {/* Clean Editorial 01/02/03 Install Guide + Gamban Comparison */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <LiquidGlassCard className="p-6 lg:col-span-5">
          <div id="install-guide" className="scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-[var(--ink)]">
              How to install on Android
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              Takes under two minutes. No registration required.
            </p>

            <ol className="mt-5 divide-y divide-[var(--subtle-border)]/70">
              {installSteps.map((item) => (
                <li key={item.num} className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0">
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

            <a
              href="/downloads/GambleAware-Nigeria.apk"
              download="GambleAware.apk"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Download Android App</span>
            </a>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard className="p-6 lg:col-span-7">
          <div id="comparison" className="scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-[var(--ink)]">
              GambleAware vs. Gamban
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              GambleAware has no subscription fee, leaves your Android VPN free, arms Device Admin
              at install for up to 2 years, and stores your progress offline.
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
                  <span className="col-span-4 flex items-start gap-1.5 rounded-lg bg-[var(--muted-fill)]/70 px-2.5 py-1.5 font-medium text-[var(--accent-ink)]">
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
