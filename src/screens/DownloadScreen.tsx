import React, { useState } from 'react';
import {
  Anchor,
  Check,
  CheckCircle2,
  Copy,
  Download,
  LockKeyhole,
  Moon,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import { BrandAnchorMark } from '../components/AppHeader';
import { LiquidGlassCard } from '../components/LiquidGlass';
import { formatNaira } from '../utils/currency';

interface DownloadScreenProps {
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

type ShowcaseTab = 'guard' | 'savings' | 'lock';

const SPEND_PRESETS = [1000, 2500, 5000, 10000] as const;

export const DownloadScreen: React.FC<DownloadScreenProps> = ({
  isDarkTheme,
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('guard');
  const [dailySpendNgn, setDailySpendNgn] = useState<number>(5000);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const builtInDomainCount = GamblingRegistry.domainToCategory.size;
  const builtInAppCount = GamblingRegistry.knownGamblingAppPackages.size;
  const thirtyDaySaved = formatNaira(dailySpendNgn * 30);
  const annualSaved = formatNaira(dailySpendNgn * 365);
  const sampleWeekSaved = formatNaira(dailySpendNgn * 7);

  const features = [
    {
      num: '01',
      title: 'Auto-Admin & Lock on Install',
      body: 'Prompts for your first name and locks Android Device Admin + Uninstall protection right on setup so an urge cannot undo your guard later.',
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
      {/* Hero Split Section (Badge-Free Top Copy) */}
      <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col items-start lg:col-span-6">
          <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.06] font-bold tracking-tight text-balance text-[var(--ink)]">
            Stop betting apps before the impulse wins.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-muted)]">
            The free Android blocker engineered for Nigeria &amp; global sportsbooks. Automatically
            blocks {builtInDomainCount}+ gambling websites, social in-app links, and {builtInAppCount}+
            betting apps — with Admin Uninstall Lock armed right from install.
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

        {/* Right: Theme-Synced Live Android App Showcase */}
        <div className="flex flex-col items-center lg:col-span-6">
          <div className="mb-5 flex w-full max-w-[400px] flex-wrap items-center justify-center gap-2">
            <div
              role="tablist"
              aria-label="Android app screen previews"
              className="grid flex-1 grid-cols-3 gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] p-1 backdrop-blur-xl"
            >
              {(
                [
                  { id: 'guard', label: '01 Guard', icon: <Anchor className="h-3.5 w-3.5" /> },
                  { id: 'savings', label: '02 ₦ Saved', icon: <TrendingUp className="h-3.5 w-3.5" /> },
                  { id: 'lock', label: '03 Lock', icon: <LockKeyhole className="h-3.5 w-3.5" /> },
                ] as const
              ).map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex h-9 cursor-pointer items-center justify-center gap-1 rounded-full px-2 text-xs whitespace-nowrap transition-colors ${
                      selected
                        ? 'bg-[var(--active-fill)] font-semibold text-[var(--active-content)]'
                        : 'font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkTheme ? 'Switch to White theme' : 'Switch to Black & Pink theme'}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-3.5 text-xs font-semibold whitespace-nowrap text-[var(--ink)] backdrop-blur-xl transition-colors hover:bg-[var(--muted-fill)]"
            >
              {isDarkTheme ? (
                <Sun className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
              ) : (
                <Moon className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
              )}
              <span>{isDarkTheme ? 'White' : 'Black & Pink'}</span>
            </button>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[56px] opacity-25 blur-2xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 35%, var(--active-fill), transparent 68%)',
              }}
            />

            <div className="relative w-[298px] rounded-[42px] border-[3px] border-[var(--glass-border)] bg-[var(--surface)] p-2.5 shadow-2xl sm:w-[314px]">
              <div
                aria-hidden="true"
                className="absolute top-24 -right-[5px] h-14 w-[3px] rounded-r-sm bg-[var(--subtle-border)]"
              />
              <div
                aria-hidden="true"
                className="absolute top-42 -right-[5px] h-9 w-[3px] rounded-r-sm bg-[var(--subtle-border)]"
              />

              <div className="overflow-hidden rounded-[32px] border border-[var(--subtle-border)] bg-[var(--canvas)] text-[var(--ink)]">
                <div className="flex items-center justify-between px-5 pt-3 pb-2 font-mono text-[10px] text-[var(--ink-muted)]">
                  <span>SHIELD ON</span>
                  <div className="h-3.5 w-3.5 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)]" />
                  <span>ADMIN LOCK</span>
                </div>

                {activeTab === 'guard' ? (
                  <div className="flex flex-col items-center px-4 pt-2 pb-5">
                    <div className="flex w-full items-center justify-between text-xs">
                      <span className="font-display font-bold text-[var(--ink)]">
                        GambleAware · Tunde
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[var(--accent-ink)]">
                        ARMED
                      </span>
                    </div>

                    <div className="relative mt-4 flex h-28 w-28 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--muted-fill)]">
                      <BrandAnchorMark className="h-20 w-20 shadow-lg" />
                    </div>

                    <p className="mt-3 font-display text-sm font-semibold text-[var(--ink)]">
                      Full Lock &amp; Blocker Active
                    </p>
                    <p className="mt-0.5 text-center text-[11px] text-[var(--ink-muted)]">
                      {builtInDomainCount}+ sportsbooks &amp; {builtInAppCount}+ betting apps guarded
                    </p>

                    <div className="mt-3.5 grid w-full grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5">
                        <p className="text-[10px] text-[var(--ink-muted)]">Clean Streak</p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-[var(--ink)] tabular-nums">
                          7d 14h
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--muted-fill)] p-2.5">
                        <p className="text-[10px] text-[var(--ink-muted)]">Est. Saved</p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-[var(--accent-ink)] tabular-nums">
                          {sampleWeekSaved}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex w-full items-center justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[11px] font-semibold text-[var(--ink)]">
                          sportybet.com
                        </p>
                        <p className="text-[10px] text-[var(--accent-ink)]">
                          Web &amp; App Shield · Intercepted
                        </p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                    </div>
                  </div>
                ) : null}

                {activeTab === 'savings' ? (
                  <div className="flex flex-col px-4 pt-2 pb-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[10px] text-[var(--ink-muted)]">
                          30-Day Money Saved
                        </p>
                        <p className="font-display text-lg font-bold text-[var(--accent-ink)] tabular-nums">
                          {thirtyDaySaved}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] text-[var(--ink-muted)]">1-Year Est.</p>
                        <p className="font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                          {annualSaved}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-3">
                      <svg viewBox="0 0 220 92" className="h-22 w-full">
                        <defs>
                          <linearGradient id="goalNairaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--active-fill)" stopOpacity="0.34" />
                            <stop offset="100%" stopColor="var(--active-fill)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <line
                          x1="0"
                          y1="74"
                          x2="220"
                          y2="74"
                          stroke="var(--subtle-border)"
                          strokeWidth="1"
                        />
                        <line
                          x1="0"
                          y1="42"
                          x2="220"
                          y2="42"
                          stroke="var(--subtle-border)"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <path
                          d="M 8 76 Q 64 68 112 48 T 212 14 L 212 84 L 8 84 Z"
                          fill="url(#goalNairaFill)"
                        />
                        <path
                          d="M 8 76 Q 64 68 112 48 T 212 14"
                          fill="none"
                          stroke="var(--active-fill)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="112"
                          cy="48"
                          r="4"
                          fill="var(--canvas)"
                          stroke="var(--active-fill)"
                          strokeWidth="2"
                        />
                        <circle cx="212" cy="14" r="4.5" fill="var(--active-fill)" />
                      </svg>
                      <div className="mt-1 flex justify-between font-mono text-[9px] text-[var(--ink-muted)]">
                        <span>Day 1</span>
                        <span>Day 14</span>
                        <span>Day 30</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="mb-1.5 text-[10px] font-medium text-[var(--ink-muted)]">
                        Tap daily stake to calculate savings:
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {SPEND_PRESETS.map((amount) => {
                          const selected = dailySpendNgn === amount;
                          return (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => setDailySpendNgn(amount)}
                              className={`h-8 cursor-pointer rounded-lg border font-mono text-[10px] font-semibold tabular-nums transition-colors ${
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
                  </div>
                ) : null}

                {activeTab === 'lock' ? (
                  <div className="flex flex-col px-4 pt-2 pb-5">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-[var(--ink)]">
                        Commitment Lock
                      </span>
                      <LockKeyhole className="h-4 w-4 text-[var(--accent-ink)]" />
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                      Armed automatically on first install
                    </p>

                    <div className="mt-3.5 grid grid-cols-4 gap-1.5">
                      {[
                        { digits: '06', unit: 'DAYS' },
                        { digits: '23', unit: 'HRS' },
                        { digits: '59', unit: 'MIN' },
                        { digits: '00', unit: 'SEC' },
                      ].map((slot) => (
                        <div
                          key={slot.unit}
                          className="flex flex-col items-center rounded-2xl border border-[var(--glass-border)] bg-[var(--muted-fill)] py-2.5"
                        >
                          <span className="font-mono text-base font-bold text-[var(--ink)] tabular-nums">
                            {slot.digits}
                          </span>
                          <span className="font-mono text-[9px] text-[var(--accent-ink)]">
                            {slot.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 space-y-2 text-[11px]">
                      {[
                        'Device Admin Delete Lock',
                        'Settings Anti-Tamper Guard',
                        '3-Layer Zero-Loss Vault',
                      ].map((label) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2"
                        >
                          <span className="text-[var(--ink)]">{label}</span>
                          <span className="font-mono text-[10px] font-semibold text-[var(--accent-ink)]">
                            ARMED
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
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

      {/* 3-Step Install Guide + Gamban Comparison */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <LiquidGlassCard className="p-6 lg:col-span-5">
          <div id="install-guide" className="scroll-mt-20">
            <h2 className="font-display text-xl font-bold text-[var(--ink)]">
              How to install on Android
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              Takes under 2 minutes with zero sign-up.
            </p>

            <ol className="mt-5 space-y-4">
              {[
                {
                  step: '1',
                  title: 'Download the GambleAware installer',
                  desc: 'Tap "Download Android App" to save GambleAware.apk to your device.',
                },
                {
                  step: '2',
                  title: 'Approve app installation',
                  desc: 'Open the downloaded file and allow installation when Android prompts.',
                },
                {
                  step: '3',
                  title: 'Enter your name & arm Admin Lock',
                  desc: 'GambleAware immediately prompts Device Admin & Accessibility Shield and locks your timer.',
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--active-fill)] font-mono text-xs font-bold text-[var(--active-content)]">
                    {item.step}
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
