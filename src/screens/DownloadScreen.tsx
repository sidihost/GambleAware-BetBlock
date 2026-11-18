import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
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
import { BettingBrandLogo, FeaturedBrandsWall } from '../components/BettingBrandLogo';
import { LiquidGlassCard, LiquidShieldOrb } from '../components/LiquidGlass';
import { formatNaira } from '../utils/currency';
import {
  buildLockCountdownQuad,
  formatLockDurationLong,
  LOCK_DURATION_PRESETS,
} from '../utils/lockDurations';
import {
  ANDROID_APK_DOWNLOAD_URL,
  ANDROID_APK_GITHUB_URL,
  APK_DOWNLOAD_FILENAME,
  buildApkShareUrl,
  detectClientPlatform,
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

export const DownloadScreen: React.FC = () => {
  const [clientPlatform] = useState(() =>
    typeof window !== 'undefined'
      ? detectClientPlatform(window.navigator.userAgent || '', window.navigator.maxTouchPoints || 0)
      : 'android',
  );
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
  const [downloadStarted, setDownloadStarted] = useState(false);

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

  const isAppleHandheld = clientPlatform === 'ios';
  const isAndroidHandheld = clientPlatform === 'android';
  const orderedPlatformCards = getOrderedPlatformCards(clientPlatform);

  const features = [
    {
      num: '01',
      icon: LockKeyhole,
      title: 'Uninstall & Settings Lock',
      body: 'Once granted Device Admin and Shield access, Android blocks app removal, Force Stop, and settings tampering while your timer runs. Optional Google sign-in restores your lock if the phone is wiped.',
      wide: true,
    },
    {
      num: '02',
      icon: GlobeLock,
      title: 'Browser & Ad Blocking Without VPN',
      body: `Blocks ${builtInDomainCount}+ betting sites as you type (even sporty or 1xbe), plus gambling ads and pop-ups across Chrome, Brave, Firefox, Instagram, and Telegram — leaving ProtonVPN, Mullvad, or WARP free to use.`,
      wide: false,
    },
    {
      num: '03',
      icon: Smartphone,
      title: `${builtInAppCount}+ Betting Apps & New Installs`,
      body: 'Detects installed sportsbook and casino apps and blocks newly downloaded betting APKs right away.',
      wide: false,
    },
    {
      num: '04',
      icon: Clock,
      title: 'Urge Alerts & Stake Banking',
      body: 'Spots repeat blocked attempts within 10–60 minutes, strips booking codes and deposit links, and lets you log skipped stakes as savings.',
      wide: false,
    },
    {
      num: '05',
      icon: Wallet,
      title: 'Partner Approval & Savings Goals',
      body: 'Require a 6-digit code from a trusted friend or partner before unlocking early, track personal savings goals, and back up your setup locally.',
      wide: false,
    },
    {
      num: '06',
      icon: ShieldCheck,
      title: 'Free Android APK — No Subscription',
      body: 'No subscription, no paywall, and no browser workaround. Install the signed v2.1.1 Android APK directly for full system-wide browser, ad, and uninstall protection.',
      wide: true,
    },
  ];

  const comparisonRows = [
    {
      capability: 'Works Alongside Other VPNs',
      gambleAware: 'Leaves your VPN slot free — ProtonVPN, Mullvad & WARP work normally',
      gamban: 'Uses the device VPN slot — blocks other VPN apps',
    },
    {
      capability: 'While-Typing & Ad Blocking',
      gambleAware: `Blocks prefixes (sporty, 1xbe), betting ads & ${builtInDomainCount}+ sites`,
      gamban: 'Domain block screen · Paid subscription',
    },
    {
      capability: 'Uninstall Lock & Wipe Recovery',
      gambleAware: 'Device Admin + Tamper Lock + Cloud backup (up to 2 years)',
      gamban: 'Basic uninstall lock · Paid plan',
    },
    {
      capability: 'Urge Tracking & Saved Stakes',
      gambleAware: 'Detects chasing-loss bursts & logs skipped stakes as savings',
      gamban: 'Not included',
    },
    {
      capability: 'Goals & Partner Approval Lock',
      gambleAware: 'Personal ₦ savings goals + offline 6-digit partner unlock',
      gamban: 'Paid subscription · No offline partner code',
    },
    {
      capability: 'Price & Privacy',
      gambleAware: 'Free · Optional Google backup',
      gamban: 'Monthly or annual fee',
    },
  ];

  const installSteps = [
    {
      num: '01',
      title: 'Download GambleAware-Nigeria.apk (v2.1.1)',
      desc: 'Tap Download Android App to save the signed APK straight from this page.',
    },
    {
      num: '02',
      title: 'Install APK & Turn On Shield',
      desc: 'Open the downloaded file, allow "Install unknown apps" for Chrome or Files if prompted, then turn on browser and ad protection — no VPN needed.',
    },
    {
      num: '03',
      title: 'Enable Uninstall Lock & Backup',
      desc: 'Grant Device Admin access and optionally sign in with Google in Lock settings so uninstallation stays blocked and your lock survives a phone reset.',
    },
  ];

  const handleMarkDownloadStarted = () => {
    setDownloadStarted(true);
    window.setTimeout(() => setDownloadStarted(false), 6000);
  };

  const handleCopyApkUrl = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await navigator.clipboard.writeText(buildApkShareUrl(origin));
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-3.5 pt-5 pb-14 sm:px-5 md:gap-12 md:px-6 md:pt-8 md:pb-16">
      {/* Hero Split Section */}
      <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col items-start lg:col-span-6">
          <h1 className="font-display text-[clamp(1.7rem,3.4vw,2.75rem)] leading-[1.08] font-bold tracking-tight text-balance text-[var(--ink)]">
            Block gambling sites and apps — and keep them blocked.
          </h1>

          <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)] sm:text-[15px]">
            GambleAware for Android blocks {builtInDomainCount}+ sportsbooks, casinos, gambling ads,
            and {builtInAppCount}+ betting apps across Chrome, Brave, Instagram, and Telegram
            without taking your VPN slot — so your own VPN keeps working.
          </p>

          <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={ANDROID_APK_DOWNLOAD_URL}
              download={APK_DOWNLOAD_FILENAME}
              onClick={handleMarkDownloadStarted}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90 sm:text-sm"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Download Android App (APK)</span>
            </a>

            <button
              type="button"
              onClick={() => void handleCopyApkUrl()}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)] sm:text-sm"
            >
              {copiedUrl ? (
                <Check className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              )}
              <span>{copiedUrl ? 'APK Link Copied' : 'Copy APK Link'}</span>
            </button>
          </div>

          {downloadStarted ? (
            <div
              role="status"
              className="mt-3 w-full max-w-xl rounded-2xl border border-[var(--glass-border)] bg-[var(--muted-fill)] px-4 py-2.5 text-xs leading-relaxed text-[var(--ink)]"
            >
              <span className="font-semibold text-[var(--accent-ink)]">Downloading v2.1.1:</span>{' '}
              Saving <span className="font-mono font-semibold">{APK_DOWNLOAD_FILENAME}</span> (2.2
              MB). Did it not start?{' '}
              <a
                href={ANDROID_APK_GITHUB_URL}
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2"
              >
                Use the GitHub release mirror
              </a>
              .
            </div>
          ) : null}

          {isAppleHandheld ? (
            <div className="mt-4 w-full max-w-xl rounded-2xl border border-[var(--glass-border)] bg-[var(--muted-fill)] px-4 py-3 text-xs leading-relaxed text-[var(--ink)]">
              <span className="font-semibold text-[var(--accent-ink)]">Viewing on iPhone:</span>{' '}
              GambleAware&rsquo;s main blocker app runs on Android (APK). Send{' '}
              <span className="font-mono font-semibold">{APK_DOWNLOAD_FILENAME}</span> to your
              Android phone, or copy our{' '}
              <a href="#platforms" className="font-semibold underline underline-offset-2">
                22-site Apple Screen Time list
              </a>{' '}
              below.
            </div>
          ) : null}

          <p className="mt-4 text-xs text-[var(--ink-muted)]">
            {isAndroidHandheld
              ? 'Android phone detected · Signed Release v2.1.1 APK (2.2 MB) · Free'
              : 'Android 7.0+ · Signed Release v2.1.1 APK (2.2 MB) · Free · No VPN slot needed'}
          </p>

          {/* Clean Architectural Spec Strip */}
          <div className="mt-6 grid w-full max-w-lg grid-cols-3 gap-3 border-t border-[var(--subtle-border)] pt-5">
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-[var(--ink)] tabular-nums sm:text-xl">
                {builtInDomainCount}+
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-muted)] sm:text-xs">
                Betting sites &amp; links
              </p>
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-[var(--ink)] tabular-nums sm:text-xl">
                {builtInAppCount}+
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-muted)] sm:text-xs">
                Apps &amp; new APKs
              </p>
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-[var(--accent-ink)] tabular-nums sm:text-xl">
                2 Years
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-muted)] sm:text-xs">
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
          <div className="relative flex w-full justify-center">
            <div className="relative w-full max-w-[292px] rounded-[36px] border-[3px] border-[var(--glass-border)] bg-[var(--surface)] p-2 shadow-xl ring-1 ring-[var(--subtle-border)] sm:max-w-[308px]">
              {/* Hardware Side Keys */}
              <div
                aria-hidden="true"
                className="absolute top-20 -right-[5px] h-12 w-[3px] rounded-r-sm bg-[var(--subtle-border)]"
              />
              <div
                aria-hidden="true"
                className="absolute top-36 -right-[5px] h-8 w-[3px] rounded-r-sm bg-[var(--subtle-border)]"
              />

              {/* Inner Android Viewport matching native Compose theme & compact height */}
              <div className="relative flex h-[510px] flex-col justify-between overflow-hidden rounded-[28px] border border-[var(--subtle-border)] bg-[var(--canvas)] text-[var(--ink)] sm:h-[536px]">
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
                <div className="flex-1 overflow-y-auto px-3 pt-1 pb-2">
                  {/* SCREEN 01: ShieldScreen.kt */}
                  {activeTab === 'shield' ? (
                    <div className="flex h-full flex-col justify-between gap-2">
                      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display text-[13px] font-bold whitespace-nowrap text-[var(--ink)]">
                              GambleAware · Tunde
                            </p>
                            <p className="text-[10px] text-[var(--ink-muted)]">
                              Browser &amp; Ad Shield
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[var(--accent-ink)]">
                            <LockKeyhole className="h-3 w-3" />
                            <span>Locked</span>
                          </span>
                        </div>

                        <div className="my-0.5 flex justify-center">
                          <div className="-my-6 scale-[0.68]">
                            <LiquidShieldOrb
                              isProtected
                              isLocked
                              onClick={() => selectPreviewTab('lock')}
                            />
                          </div>
                        </div>

                        <p className="text-center font-display text-[13px] font-bold text-[var(--ink)]">
                          Shield &amp; Lock Active
                        </p>
                        <p className="mt-0.5 text-center text-[10px] leading-snug text-[var(--ink-muted)]">
                          Blocking SportyBet, Bet9ja, Bet365, 1xBet, Stake &amp; betting apps.
                        </p>

                        <div className="mt-2 flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-2.5 py-1.5 text-[10px]">
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
                        <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2">
                          <p className="text-[9px] text-[var(--ink-muted)]">Clean Streak</p>
                          <p className="mt-0.5 font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                            7d 14h
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2">
                          <p className="text-[9px] text-[var(--ink-muted)]">Blocked</p>
                          <p className="mt-0.5 font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                            28
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--muted-fill)] p-2">
                          <p className="text-[9px] text-[var(--ink-muted)]">Saved (7d)</p>
                          <p className="mt-0.5 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                            {weekSaved}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <BettingBrandLogo target="sportybet.com" size="xs" />
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold text-[var(--ink)]">
                              SportyBet
                            </p>
                            <p className="text-[9.5px] text-[var(--ink-muted)]">
                              Typed Guard · Sportsbook · Just now
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] font-bold text-[var(--accent-ink)]">
                          3 blocked
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* SCREEN 02: BlocklistScreen.kt */}
                  {activeTab === 'rules' ? (
                    <div className="flex h-full flex-col justify-between gap-2">
                      <div className="px-0.5">
                        <p className="font-display text-[15px] font-bold text-[var(--ink)]">
                          Blocklist &amp; Rules
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          Categories, keywords, custom domains &amp; apps
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] p-2.5">
                        <p className="text-[11px] font-semibold text-[var(--ink)]">
                          Gambling Categories
                        </p>
                        <p className="text-[9.5px] text-[var(--ink-muted)]">
                          {builtInDomainCount}+ sites included out of the box
                        </p>

                        <div className="mt-1.5 divide-y divide-[var(--subtle-border)]/70">
                          {[
                            { name: 'Sportsbooks & Live Betting', count: '210+ sites' },
                            { name: 'Online Casinos & Slots', count: '190+ sites' },
                            { name: 'Crypto & Crash Games', count: '95+ sites' },
                            { name: 'Fantasy & Lotteries', count: '80+ sites' },
                          ].map((cat) => (
                            <div
                              key={cat.name}
                              className="flex items-center justify-between py-1.5 text-[10.5px]"
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

                      <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5">
                        <p className="text-[11px] font-semibold text-[var(--ink)]">
                          Device-Wide Filters
                        </p>
                        <div className="mt-1.5 space-y-1.5 text-[10.5px]">
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
                              fill="var(--active-fill)"
                              fillOpacity={0.12}
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
                            <span className="truncate text-[11px] font-semibold text-[var(--ink)]">
                              Bet9ja
                            </span>
                            <span className="shrink-0 font-mono text-[10px] font-bold text-[var(--accent-ink)] tabular-nums">
                              4 blocked
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[11px] font-semibold text-[var(--ink)]">
                              SportyBet App
                            </span>
                            <span className="shrink-0 font-mono text-[10px] font-bold text-[var(--accent-ink)] tabular-nums">
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
                            {formatLockDurationLong(previewLockDays)} Lock On
                          </span>
                          <LockKeyhole className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                        </div>
                        <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                          Stays locked until the timer hits zero
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

                        <p className="mt-2 mb-1 text-[10px] font-medium text-[var(--ink-muted)]">
                          Select lock duration:
                        </p>
                        <div className="grid grid-cols-4 gap-1">
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
                                className={`h-6 cursor-pointer rounded-md border px-0 font-mono text-[9.5px] font-semibold transition-colors ${
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
            Android App Walkthrough · Tap tabs or lock durations (24h – 2y)
          </p>
        </div>
      </section>

      {/* Covered Betting Platforms With Exact Logos */}
      <section className="scroll-mt-20 border-t border-[var(--subtle-border)] pt-9">
        <div className="max-w-2xl">
          <h2 className="font-display text-xl font-bold tracking-tight text-balance text-[var(--ink)] sm:text-2xl">
            Major betting sites &amp; apps covered out of the box.
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)] sm:text-sm">
            {builtInDomainCount}+ sportsbooks, casinos, crash games, mirrors, and {builtInAppCount}+
            betting apps blocked across Nigeria, the UK, North America, and crypto rooms.
          </p>
        </div>

        <div className="mt-5">
          <FeaturedBrandsWall limit={16} />
        </div>
      </section>

      {/* Numbered Capabilities Bento Grid */}
      <section id="features" className="scroll-mt-20 border-t border-[var(--subtle-border)] pt-9">
        <div className="max-w-2xl">
          <h2 className="font-display text-xl font-bold tracking-tight text-balance text-[var(--ink)] sm:text-2xl">
            Six practical protections built directly into the Android app.
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)] sm:text-sm">
            Everything runs natively on your phone with no required account and no subscription fee.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-12">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <LiquidGlassCard
                key={feat.num}
                className={`flex flex-col justify-between p-4 sm:p-5 ${
                  feat.wide ? 'lg:col-span-6' : 'lg:col-span-3'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                      {feat.num}.
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--subtle-border)] bg-[var(--muted-fill)] text-[var(--accent-ink)]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold text-[var(--ink)]">
                    {feat.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)] sm:text-[13px]">
                    {feat.body}
                  </p>
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      </section>

      {/* Main Android APK + Optional Apple Screen Time Blocklist */}
      <section
        id="platforms"
        className="scroll-mt-20 border-t border-[var(--subtle-border)] pt-9"
      >
        <div className="max-w-2xl">
          <h2 className="font-display text-xl font-bold tracking-tight text-balance text-[var(--ink)] sm:text-2xl">
            Download the Main Android App (APK).
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)] sm:text-sm">
            Get the signed v2.1.1 Android APK directly below for full system-wide browser, ad, and
            uninstall protection without using your VPN slot.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {orderedPlatformCards.map((platformKey) =>
            platformKey === 'android' ? (
              <LiquidGlassCard key="android" className="flex flex-col justify-between p-4 sm:p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--accent-ink)]">
                      {isAndroidHandheld ? 'YOUR DEVICE · ANDROID 7.0+' : 'ANDROID 7.0+ · MAIN APP'}
                    </span>
                    <Smartphone className="h-4 w-4 text-[var(--accent-ink)]" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[var(--ink)]">
                    Android App (GambleAware-Nigeria.apk)
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                    Blocks {builtInDomainCount}+ betting platforms as you type across Chrome, Brave,
                    Firefox, Edge, Opera, Instagram, TikTok &amp; Telegram — leaving ProtonVPN,
                    Mullvad, or WARP free to run.
                  </p>
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        • Uninstall &amp; Tamper Lock:
                      </span>{' '}
                      Blocks App Info Uninstall, Force Stop, and permission removal while your
                      lock timer is active, with optional Google sign-in backup.
                    </li>
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        • Gambling Ads &amp; Pop-Up Filter:
                      </span>{' '}
                      Stops betting ad networks, affiliate links, mirror sites, and booking codes
                      without taking Android&rsquo;s VPN slot.
                    </li>
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        • App &amp; Sideload Guard ({builtInAppCount}+ apps):
                      </span>{' '}
                      Watches installed sportsbooks and newly downloaded betting APKs immediately.
                    </li>
                  </ul>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <a
                    href={ANDROID_APK_DOWNLOAD_URL}
                    download={APK_DOWNLOAD_FILENAME}
                    onClick={handleMarkDownloadStarted}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span>Download GambleAware-Nigeria.apk</span>
                  </a>
                  <a
                    href={ANDROID_APK_GITHUB_URL}
                    rel="noopener noreferrer"
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span>Backup Mirror (GitHub Release v2.1.1)</span>
                  </a>
                </div>
              </LiquidGlassCard>
            ) : (
              <LiquidGlassCard key="ios" className="flex flex-col justify-between p-4 sm:p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--accent-ink)]">
                      {isAppleHandheld
                        ? 'YOUR DEVICE · IPHONE & IPAD (SCREEN TIME)'
                        : 'IPHONE & IPAD (SCREEN TIME LIST)'}
                    </span>
                    <Share className="h-4 w-4 text-[var(--accent-ink)]" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[var(--ink)]">
                    Apple Screen Time Blocklist
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                    Apple does not support Android APK installers. If you also carry an iPhone or
                    iPad, block major betting sites directly in iOS Settings:
                  </p>
                  <ol className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        1. Copy our top betting sites list:
                      </span>{' '}
                      Tap the button below to copy all {TOP_BETTING_DOMAINS_FOR_IOS.length}{' '}
                      high-risk domains.
                    </li>
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        2. Block betting sites natively:
                      </span>{' '}
                      Open{' '}
                      <span className="font-semibold text-[var(--ink)]">
                        Settings → Screen Time → Content &amp; Privacy Restrictions → Web Content →
                        Limit Adult Websites → Never Allow
                      </span>{' '}
                      and paste them in.
                    </li>
                  </ol>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyIosBlocklist()}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
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
      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <LiquidGlassCard className="p-4 sm:p-5 lg:col-span-5">
          <div id="install-guide" className="scroll-mt-20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[var(--ink)] sm:text-xl">
                {installGuideTab === 'ios'
                  ? 'iPhone Screen Time setup'
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
                  Android APK
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
                  iPhone List
                </button>
              </div>
            </div>

            {installGuideTab === 'ios' ? (
              <>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  Apple blocks APK sideloading, so use built-in iOS Screen Time with our curated
                  betting domain list.
                </p>

                <ol className="mt-5 divide-y divide-[var(--subtle-border)]/70">
                  <li className="flex items-start gap-3.5 pb-3.5">
                    <span className="mt-0.5 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                      01
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Copy the 22 betting sites below
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                        Includes SportyBet, Bet9ja, BetKing, 1xBet, MSport, Stake, and Bet365.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3.5 pt-3.5">
                    <span className="mt-0.5 font-mono text-xs font-bold text-[var(--accent-ink)] tabular-nums">
                      02
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Lock Betting Sites in Screen Time
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                        Paste our {TOP_BETTING_DOMAINS_FOR_IOS.length}-domain blocklist into{' '}
                        <span className="font-semibold">
                          Settings → Screen Time → Content &amp; Privacy Restrictions → Web Content
                          → Limit Adult Websites → Never Allow
                        </span>
                        .
                      </p>
                    </div>
                  </li>
                </ol>

                <div className="mt-5 flex flex-col gap-2">
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
                  Takes under two minutes. Runs without taking your VPN slot, locks uninstallation
                  with Device Admin, and supports Google backup recovery.
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

                {/* APK Install Troubleshooting */}
                <div className="mt-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-4">
                  <p className="text-xs font-semibold text-[var(--ink)]">
                    Saw &ldquo;App not installed.&rdquo;? Common fixes
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-[var(--ink-muted)]">
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        1. Uninstall any older GambleAware build first:
                      </span>{' '}
                      Release v2.1.1+ uses a consistent release signing key, so Android rejects
                      installing over older debug builds. If Uninstall Lock was on, first open{' '}
                      <span className="font-semibold text-[var(--ink)]">
                        Settings → Security → Device admin apps → GambleAware → Deactivate
                      </span>
                      , then uninstall the old app before installing the new APK.
                    </li>
                    <li>
                      <span className="font-semibold text-[var(--ink)]">
                        2. Permission &amp; free space:
                      </span>{' '}
                      Enable{' '}
                      <span className="font-semibold text-[var(--ink)]">Install unknown apps</span>{' '}
                      for Chrome or Files in Android Settings and ensure 50 MB+ free storage.
                    </li>
                    <li>
                      <span className="font-semibold text-[var(--ink)]">3. Play Protect prompt:</span>{' '}
                      Tap{' '}
                      <span className="font-semibold text-[var(--ink)]">
                        More details → Install anyway
                      </span>{' '}
                      to finish installing.
                    </li>
                  </ul>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <a
                    href={ANDROID_APK_DOWNLOAD_URL}
                    download={APK_DOWNLOAD_FILENAME}
                    onClick={handleMarkDownloadStarted}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:text-sm"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span>Download Android App (APK)</span>
                  </a>
                  <a
                    href={ANDROID_APK_GITHUB_URL}
                    rel="noopener noreferrer"
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span>Direct GitHub Release Mirror</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard className="p-4 sm:p-5 lg:col-span-7">
          <div id="comparison" className="scroll-mt-20">
            <h2 className="font-display text-lg font-bold text-[var(--ink)] sm:text-xl">
              GambleAware vs. Gamban
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              GambleAware is free to use, blocks betting sites as you type without taking your VPN
              slot, and lets you lock settings with optional cloud backup.
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
