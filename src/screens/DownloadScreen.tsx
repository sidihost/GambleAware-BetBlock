import React, { useEffect, useState } from 'react';
import {
  Anchor,
  Check,
  Copy,
  Download,
  LockKeyhole,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import { LiquidGlassCard, LiquidShieldOrb } from '../components/LiquidGlass';
import { formatNaira } from '../utils/currency';

interface DownloadScreenProps {
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

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

export const DownloadScreen: React.FC<DownloadScreenProps> = ({
  isDarkTheme,
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<AndroidPreviewTab>('shield');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isPausedByHover, setIsPausedByHover] = useState(false);
  const [dailySpendNgn, setDailySpendNgn] = useState<number>(5000);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const builtInDomainCount = GamblingRegistry.domainToCategory.size;
  const builtInAppCount = GamblingRegistry.knownGamblingAppPackages.size;
  const thirtyDaySaved = formatNaira(dailySpendNgn * 30);
  const annualSaved = formatNaira(dailySpendNgn * 365);
  const weekSaved = formatNaira(dailySpendNgn * 7);

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
      title: 'Instant Lock-In Onboarding',
      body: 'Personalizes your home shield with your first name and secures Android Device Admin + Delete Lock right from setup so an urge cannot undo your guard.',
      wide: true,
    },
    {
      num: '02',
      title: 'Zero-VPN System Blocking',
      body: 'Stops SportyBet, Bet9ja, BetKing, 1xBet, Stake, and links inside Chrome, Safari, Instagram, TikTok, and Telegram without occupying your VPN slot.',
      wide: false,
    },
    {
      num: '03',
      title: `${builtInAppCount}+ Betting Apps & APK Shield`,
      body: 'Blocks preinstalled sportsbooks and casinos immediately — and intercepts newly sideloaded or Play Store betting APKs on install.',
      wide: false,
    },
    {
      num: '04',
      title: 'High-Risk Schedule Guard',
      body: 'Tightens strict keyword & search blocking automatically during late nights (10 PM – 5 AM), matchday weekends, and salary paydays (25th – 3rd).',
      wide: false,
    },
    {
      num: '05',
      title: 'Naira (₦) Savings & Goal Tracker',
      body: 'Tracks real Naira saved from your daily betting spend toward personal milestones — stored privately on your device with zero account.',
      wide: false,
    },
    {
      num: '06',
      title: 'Anti-Tamper Lock & Calm Reset',
      body: 'Guards Android Settings & Package Installer screens during your 1–90 day countdown, paired with an instant 60-second urge breathing reset.',
      wide: true,
    },
  ];

  const comparisonRows = [
    {
      capability: 'Price & Account Requirement',
      gambleAware: 'Free Forever · Zero Sign-Up',
      gamban: 'Paid Subscription · Account Required',
    },
    {
      capability: `${builtInDomainCount}+ Betting Sites & Social App Links`,
      gambleAware: 'Blocked Without Using Your VPN Slot',
      gamban: 'Occupies Your Single Phone VPN Slot',
    },
    {
      capability: `${builtInAppCount}+ Betting Apps & New APK Installs`,
      gambleAware: 'Stops Existing & Newly Installed Apps',
      gamban: 'Mainly Relies on Network Filter',
    },
    {
      capability: 'Default Admin Lock & Settings Tamper Guard',
      gambleAware: 'Armed on Install · Blocks Uninstall Screens',
      gamban: 'Standard Subscription Cancellation',
    },
    {
      capability: 'Naira (₦) Savings, Payday Guard & Local Vault',
      gambleAware: 'Built-In Offline with Zero Data Loss',
      gamban: 'No Local Currency or Payday Guard',
    },
  ];

  const installSteps = [
    {
      num: '01',
      title: 'Download the GambleAware installer',
      desc: 'Tap "Download Android App" to save GambleAware.apk directly to your phone.',
    },
    {
      num: '02',
      title: 'Approve app installation',
      desc: 'Open the downloaded file and allow installation on your Android device.',
    },
    {
      num: '03',
      title: 'Complete guided setup & lock timer',
      desc: 'Add your first name, activate Device Admin & Accessibility Shield, and lock your countdown.',
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
      <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col items-start lg:col-span-6">
          <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.06] font-bold tracking-tight text-balance text-[var(--ink)]">
            Stop betting apps before the impulse wins.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-muted)]">
            The free Android blocker engineered for Nigeria &amp; global sportsbooks. Automatically
            blocks {builtInDomainCount}+ gambling websites, social in-app links, and{' '}
            {builtInAppCount}+ betting apps — with Admin Uninstall Lock armed right from install.
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
              <span>{copiedUrl ? 'Link Copied' : 'Share Download Link'}</span>
            </button>
          </div>

          <p className="mt-5 text-xs text-[var(--ink-muted)]">
            Android 7.0+ <span aria-hidden="true">·</span> Free forever{' '}
            <span aria-hidden="true">·</span> Zero sign-up or VPN slot required
          </p>
        </div>

        {/* Right: Authentic Full-Screen Android App Mockup (Auto-Cycling 01–04) */}
        <div
          className="flex flex-col items-center lg:col-span-6"
          onMouseEnter={() => setIsPausedByHover(true)}
          onMouseLeave={() => setIsPausedByHover(false)}
        >
          {/* Clean Editorial 01–04 Screen Switcher + Theme Toggle */}
          <div className="mb-4 flex w-full max-w-[360px] items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Android app screens"
              className="flex items-center gap-1 rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-1"
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
                    className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors ${
                      selected
                        ? 'bg-[var(--muted-fill)] font-semibold text-[var(--accent-ink)]'
                        : 'font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-75">{tab.num}</span>{' '}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkTheme ? 'Switch to White theme' : 'Switch to Black & Pink theme'}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 text-xs font-medium whitespace-nowrap text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)]"
            >
              {isDarkTheme ? (
                <Sun className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
              ) : (
                <Moon className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
              )}
              <span className="hidden sm:inline">{isDarkTheme ? 'White' : 'Dark'}</span>
            </button>
          </div>

          {/* Realistic Android Phone Shell */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[56px] opacity-20 blur-2xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 35%, var(--active-fill), transparent 68%)',
              }}
            />

            <div className="relative w-[304px] rounded-[42px] border-[3px] border-[var(--glass-border)] bg-[var(--surface)] p-2.5 shadow-2xl sm:w-[322px]">
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
              <div className="relative flex h-[582px] flex-col justify-between overflow-hidden rounded-[32px] border border-[var(--subtle-border)] bg-[var(--canvas)] text-[var(--ink)]">
                {/* Minimal Native Android Status Strip */}
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
                          <div className="scale-[0.78] -my-4">
                            <LiquidShieldOrb
                              isProtected
                              isLocked
                              onClick={() => selectPreviewTab('lock')}
                            />
                          </div>
                        </div>

                        <p className="text-center font-display text-sm font-bold text-[var(--ink)]">
                          Maximum Lock &amp; Shield Active
                        </p>
                        <p className="mt-0.5 text-center text-[10px] leading-snug text-[var(--ink-muted)]">
                          Blocking SportyBet, Bet9ja, Bet365, 1xBet, Stake &amp; betting apps in real
                          time.
                        </p>

                        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3 py-2 text-[10px]">
                          <span className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                            <LockKeyhole className="h-3 w-3 text-[var(--accent-ink)]" />
                            <span>Uninstall Lock Timer</span>
                          </span>
                          <span className="font-mono font-bold text-[var(--accent-ink)] tabular-nums">
                            06d 23h 59m
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
                          <p className="text-[9px] text-[var(--ink-muted)]">Est. Saved</p>
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
                            Intercepted by Web Shield
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
                          Customize categories, keywords, domains &amp; apps
                        </p>
                      </div>

                      <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-3">
                        <p className="text-xs font-semibold text-[var(--ink)]">
                          Gambling Categories
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          {builtInDomainCount}+ built-in sites protected
                        </p>

                        <div className="mt-2.5 divide-y divide-[var(--subtle-border)]/70">
                          {[
                            { name: 'Sportsbooks & Betting', count: '210+ sites' },
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
                          System Protection Shields
                        </p>
                        <div className="mt-2 space-y-2 text-[11px]">
                          {[
                            { label: 'Browser & Social WebView Shield', detail: 'Chrome, IG, TikTok, TG' },
                            { label: `Installed Betting App Shield`, detail: `${builtInAppCount}+ apps + new APKs` },
                            { label: 'High-Risk Schedule Guard', detail: 'Night, weekend & payday' },
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
                          Recovery Progress
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          Betting-free streak, Naira saved &amp; shield log
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
                          Tap daily stake to calculate Naira saved:
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
                          Recent Interceptions
                        </p>
                        <div className="mt-1.5 space-y-1 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[var(--ink)]">bet9ja.com</span>
                            <span className="text-[var(--accent-ink)]">Web Shield</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[var(--ink)]">SportyBet APK</span>
                            <span className="text-[var(--accent-ink)]">App Shield</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* SCREEN 04: LockSettingsScreen.kt */}
                  {activeTab === 'lock' ? (
                    <div className="flex h-full flex-col justify-between gap-2.5">
                      <div className="px-0.5">
                        <p className="font-display text-base font-bold text-[var(--ink)]">
                          Commitment Lock
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          Prevent uninstalling, tampering, or pausing your shield
                        </p>
                      </div>

                      <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--ink)]">
                            Commitment Lock Active
                          </span>
                          <LockKeyhole className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                        </div>
                        <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                          Armed automatically from initial setup
                        </p>

                        <div className="mt-3 grid grid-cols-4 gap-1.5">
                          {[
                            { digits: '06', unit: 'DAYS' },
                            { digits: '23', unit: 'HRS' },
                            { digits: '59', unit: 'MIN' },
                            { digits: '00', unit: 'SEC' },
                          ].map((slot) => (
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
                      </div>

                      <div className="space-y-2">
                        {[
                          { label: 'Device Admin Delete Lock', status: 'Locked On' },
                          { label: 'Settings Anti-Tamper Guard', status: 'Active' },
                          { label: 'Accountability PIN', status: '4-Digit Set' },
                          { label: '3-Layer Zero-Loss Vault', status: 'Synced' },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2 text-[11px]"
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
        </div>
      </section>

      {/* Numbered Capabilities Bento Grid */}
      <section id="features" className="scroll-mt-20 border-t border-[var(--subtle-border)] pt-12">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-balance text-[var(--ink)] sm:text-3xl">
            Every layer built so willpower never stands alone.
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--ink-muted)]">
            Engineered natively for Android so you cannot pause protection, clear data to escape a
            countdown, or reopen betting apps when temptation peaks.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
          {features.map((feat) => (
            <LiquidGlassCard
              key={feat.num}
              className={`flex flex-col justify-between p-6 ${
                feat.wide ? 'lg:col-span-6' : 'lg:col-span-3'
              }`}
            >
              <div>
                <span className="font-mono text-sm font-bold text-[var(--accent-ink)] tabular-nums">
                  {feat.num}.
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold text-[var(--ink)]">
                  {feat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{feat.body}</p>
              </div>
            </LiquidGlassCard>
          ))}
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
              Takes under 2 minutes with zero sign-up.
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
              <span>Download Android App Now</span>
            </a>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard className="p-6 lg:col-span-7">
          <div id="comparison" className="scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-[var(--ink)]">
              GambleAware vs. Gamban
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              Unlike paid VPN blockers, GambleAware never charges a fee, keeps your Android VPN slot
              free, automatically arms Device Admin &amp; Uninstall protection on setup, and protects
              your recovery milestones offline.
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

            {/* Desktop 12-col table */}
            <div className="mt-5 hidden divide-y divide-[var(--subtle-border)]/70 sm:block">
              <div className="grid grid-cols-12 gap-3 pb-2.5 text-xs font-semibold text-[var(--ink-muted)]">
                <span className="col-span-5">Capability</span>
                <span className="col-span-4 text-[var(--accent-ink)]">GambleAware</span>
                <span className="col-span-3">Gamban</span>
              </div>
              {comparisonRows.map((row) => (
                <div
                  key={row.capability}
                  className="grid grid-cols-12 items-center gap-3 py-3 text-xs"
                >
                  <span className="col-span-5 pr-2 font-medium text-[var(--ink)]">
                    {row.capability}
                  </span>
                  <span className="col-span-4 flex items-center gap-1.5 font-medium text-[var(--accent-ink)]">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>{row.gambleAware}</span>
                  </span>
                  <span className="col-span-3 text-[var(--ink-muted)]">{row.gamban}</span>
                </div>
              ))}
            </div>
          </div>
        </LiquidGlassCard>
      </section>
    </div>
  );
};
