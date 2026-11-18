import React, { useState } from 'react';
import {
  Anchor,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Download,
  LockKeyhole,
  Share2,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { LiquidGlassCard } from '../components/LiquidGlass';
import { DerivedMainState } from '../data/types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { formatNaira } from '../utils/currency';

interface DownloadScreenProps {
  state: DerivedMainState;
  onOpenBlocker: () => void;
  onSignInGoogle: () => void;
  isSignedIn: boolean;
}

type ShowcaseTab = 'guard' | 'savings' | 'lock';

const FEATURES = [
  {
    num: '01',
    title: 'Works Across Browsers & Social Apps',
    body: 'Stops SportyBet, Bet9ja, BetKing, 1xBet, Stake, and betting links inside Chrome, Safari, Instagram, TikTok, and Telegram without slowing your phone.',
  },
  {
    num: '02',
    title: '640+ Betting Sites & 130+ Betting Apps',
    body: 'Preloaded sportsbooks, casinos, virtuals, and crash games blocked right away — including new betting apps if you try to install them.',
  },
  {
    num: '03',
    title: 'Lock Timer That Prevents Deleting the App',
    body: 'Lock your protection from 1 to 90 days. Once active, GambleAware cannot be turned off or deleted until your countdown reaches zero.',
  },
  {
    num: '04',
    title: 'Live Naira (₦) Savings Tracker',
    body: 'Set what you used to spend each day on betting and watch your real Naira savings add up every single day you stay clean.',
  },
  {
    num: '05',
    title: 'Free Online Backup Across Devices',
    body: 'Sign in with Google or email at ₦0 cost to keep your streak, Naira savings, personal goals, and blocked websites synced.',
  },
  {
    num: '06',
    title: '60s Calm Reset & Real Support Links',
    body: 'Built-in 60-second guided breathing exercises when urges hit hard, plus direct access to confidential recovery help.',
  },
];

const COMPARISON_ROWS = [
  {
    capability: '640+ Betting Sites & New Lookalike Links',
    apk: 'All Browsers & Social Apps',
    pwa: 'Site Checker & Custom List',
  },
  {
    capability: 'Betting Sign-In Blocker & Redirect',
    apk: 'Automatic On Your Phone',
    pwa: 'Instant Web Redirect',
  },
  {
    capability: '130+ Betting Apps Blocked Automatically',
    apk: 'Blocks Apps From Opening',
    pwa: 'App Blocklist Rules',
  },
  {
    capability: 'Prevent Uninstalling Until Timer Ends',
    apk: 'Phone Delete Lock Enforced',
    pwa: 'Lock Timer & 4-Digit PIN',
  },
  {
    capability: 'Personal Goals, Naira Saved & Cloud Backup',
    apk: 'Included (Free Forever)',
    pwa: 'Included (Free Forever)',
  },
];

export const DownloadScreen: React.FC<DownloadScreenProps> = ({
  state,
  onOpenBlocker,
  onSignInGoogle,
  isSignedIn,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('guard');
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  const builtInDomainCount = state.builtInDomainCount;
  const dailySpendEstimate = state.settings.dailyBetSpendEstimate;
  const cleanMetric =
    state.cleanDays > 0
      ? `${state.cleanDays}d ${state.cleanHoursRemainder}h`
      : `${state.cleanHoursRemainder}h ${state.cleanMinutesRemainder}m`;
  const savedSoFar = formatNaira(state.estimatedSavedAmount);
  const thirtyDayGoal = formatNaira(dailySpendEstimate * 30);
  const latestEvent = state.recentEvents[0] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pt-6 pb-28 md:px-6 md:pt-10 md:pb-16">
      {/* Hero Split Section */}
      <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col items-start lg:col-span-6">
          <p className="text-xs font-semibold tracking-widest text-[var(--accent-ink)] uppercase">
            Free Gambling Blocker · Built for Everyday Use
          </p>

          <h1 className="mt-3 font-display text-4xl leading-[1.06] font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
            Stop betting apps before the impulse wins.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--ink-muted)]">
            Full protection across mobile browsers, social apps, and {builtInDomainCount}+ betting
            websites — with live Naira (₦) savings, personal goals, and free backup.
          </p>

          {/* Primary + Secondary Action Cluster */}
          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <a
              href="/downloads/GambleAware-Nigeria.apk"
              download="GambleAware.apk"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-[var(--active-fill)] px-6 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Download Android App</span>
            </a>

            {isInstalled ? (
              <span className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--muted-fill)] px-5 text-sm font-semibold text-[var(--accent-ink)]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Saved on Home Screen</span>
              </span>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={install}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)]"
              >
                <Smartphone className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                <span>Save Web App to Phone</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowBrowserGuide((prev) => !prev)}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)]"
              >
                <Share2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                <span>How to Add to Home Screen</span>
              </button>
            )}
          </div>

          {showBrowserGuide ? (
            <div className="mt-4 w-full max-w-lg rounded-[20px] border border-[var(--glass-border)] bg-[var(--muted-fill)] p-4 text-xs leading-relaxed text-[var(--ink-muted)]">
              {isIOS ? (
                <p>
                  <strong className="text-[var(--ink)]">iPhone &amp; iPad (Safari):</strong> Tap
                  the <strong>Share</strong> icon in Safari, then choose{' '}
                  <strong>Add to Home Screen</strong> to keep GambleAware one tap away.
                </p>
              ) : (
                <p>
                  <strong className="text-[var(--ink)]">Android / Chrome / Edge:</strong> Open your
                  browser menu (&vellip;) and choose <strong>Add to Home screen</strong>. For full
                  automatic blocking across apps, tap <strong>Download Android App</strong> above.
                </p>
              )}
            </div>
          ) : null}

          <p className="mt-4 text-xs text-[var(--ink-muted)]">
            Android 7.0+ · Easy 2-minute install · Battery friendly · Free Forever
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={onOpenBlocker}
              className="inline-flex cursor-pointer items-center gap-1 text-[var(--accent-ink)] hover:underline"
            >
              <span>Back to Home Dashboard</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            {!isSignedIn ? (
              <button
                type="button"
                onClick={onSignInGoogle}
                className="inline-flex cursor-pointer items-center gap-1 text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <span>Sign in with Google to save progress</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Right: Live Android Device Companion Showcase */}
        <div className="flex flex-col items-center lg:col-span-6">
          <div
            role="tablist"
            aria-label="Live Android companion views"
            className="mb-5 grid w-full max-w-[340px] grid-cols-3 gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] p-1 backdrop-blur-xl"
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
                  className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-xs whitespace-nowrap transition-colors ${
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

          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[56px] opacity-35 blur-2xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 35%, rgba(255, 61, 154, 0.36), transparent 68%)',
              }}
            />

            <div className="relative w-[292px] rounded-[42px] border-[3px] border-[#2B2028] bg-[#0B090C] p-2.5 shadow-2xl sm:w-[308px]">
              <div
                aria-hidden="true"
                className="absolute top-24 -right-[5px] h-14 w-[3px] rounded-r-sm bg-[#3A2B35]"
              />
              <div
                aria-hidden="true"
                className="absolute top-42 -right-[5px] h-9 w-[3px] rounded-r-sm bg-[#3A2B35]"
              />

              <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#070609] text-[#F9F5F8]">
                <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px] font-mono text-white/75">
                  <span>{state.isFullyArmed ? 'GUARD ON' : 'STANDBY'}</span>
                  <div className="h-3.5 w-3.5 rounded-full border border-white/15 bg-black" />
                  <span>PRIVATE</span>
                </div>

                {activeTab === 'guard' ? (
                  <div className="flex flex-col items-center px-4 pt-2 pb-5">
                    <div className="flex w-full items-center justify-between text-xs">
                      <span className="font-display font-bold text-white">GambleAware</span>
                      <span className="rounded-full bg-[#FF3D9A] px-2 py-0.5 font-mono text-[10px] font-semibold text-black">
                        {state.isFullyArmed ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>

                    <div className="relative mt-4 flex h-28 w-28 items-center justify-center rounded-full border border-[#FF3D9A]/35 bg-[#FF3D9A]/10">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF3D9A] text-black shadow-lg">
                        <Anchor className="h-9 w-9" />
                      </div>
                    </div>

                    <p className="mt-3 font-display text-sm font-semibold text-white">
                      {state.isFullyArmed ? 'Web & App Guard Active' : 'Protection Paused'}
                    </p>
                    <p className="mt-0.5 text-center text-[11px] text-white/60">
                      {builtInDomainCount}+ sportsbooks &amp; 130+ betting apps guarded
                    </p>

                    <div className="mt-3.5 grid w-full grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-white/10 bg-[#141016] p-2.5">
                        <p className="text-[10px] text-white/55">Your Streak</p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-white">
                          {cleanMetric}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#FF3D9A]/30 bg-[#1B1018] p-2.5">
                        <p className="text-[10px] text-white/65">Naira Saved</p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-[#FF72B8]">
                          {savedSoFar}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#141016] px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[11px] font-semibold text-white">
                          {latestEvent ? latestEvent.target : 'Real-Time Filter Ready'}
                        </p>
                        <p className="text-[10px] text-[#FF72B8]">
                          {latestEvent
                            ? `${latestEvent.source} · Intercepted`
                            : `Custom Rules: ${state.customBlockedDomains.length} domains`}
                        </p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FF3D9A]" />
                    </div>
                  </div>
                ) : null}

                {activeTab === 'savings' ? (
                  <div className="flex flex-col px-4 pt-2 pb-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[10px] text-white/55 uppercase">
                          30-Day Goal Target
                        </p>
                        <p className="font-display text-lg font-bold text-[#FF72B8] tabular-nums">
                          {thirtyDayGoal}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#FF3D9A]/35 bg-[#1B1018] px-2.5 py-1 font-mono text-[10px] text-[#FF72B8]">
                        {formatNaira(dailySpendEstimate)}/day
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-[#130F15] p-3">
                      <svg viewBox="0 0 220 96" className="h-24 w-full">
                        <defs>
                          <linearGradient id="goalNairaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF3D9A" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#FF3D9A" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <line
                          x1="0"
                          y1="78"
                          x2="220"
                          y2="78"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                        <line
                          x1="0"
                          y1="44"
                          x2="220"
                          y2="44"
                          stroke="rgba(255,255,255,0.06)"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <path
                          d="M 8 80 Q 64 72 112 52 T 212 16 L 212 88 L 8 88 Z"
                          fill="url(#goalNairaFill)"
                        />
                        <path
                          d="M 8 80 Q 64 72 112 52 T 212 16"
                          fill="none"
                          stroke="#FF3D9A"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="112"
                          cy="52"
                          r="4"
                          fill="#FFFFFF"
                          stroke="#FF3D9A"
                          strokeWidth="2"
                        />
                        <circle cx="212" cy="16" r="4.5" fill="#FF3D9A" />
                      </svg>
                      <div className="mt-1 flex justify-between font-mono text-[9px] text-white/50">
                        <span>Day 1</span>
                        <span>Day 14</span>
                        <span>Day 30</span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] font-medium text-white/60">
                        Your Logged Trigger Patterns
                      </p>
                      {state.triggerBreakdown.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {state.triggerBreakdown.slice(0, 4).map((item) => (
                            <span
                              key={item.triggerTag}
                              className="rounded-full border border-white/10 bg-[#17121A] px-2.5 py-1 font-mono text-[10px] text-white/85"
                            >
                              {item.triggerTag} · {item.count}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] leading-relaxed text-white/55">
                          No urges logged yet. Record resisted urges on the Guard or Progress tabs.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {activeTab === 'lock' ? (
                  <div className="flex flex-col px-4 pt-2 pb-5">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-white">
                        Commitment Lock
                      </span>
                      <LockKeyhole className="h-4 w-4 text-[#FF3D9A]" />
                    </div>
                    <p className="mt-1 text-[11px] text-white/60">
                      {state.isTimeLockedNow
                        ? 'Uninstalls & Settings tampering blocked'
                        : 'Set a 1–90 day lock from the Lock tab'}
                    </p>

                    <div className="mt-3.5 grid grid-cols-4 gap-1.5">
                      {state.lockClockQuad.map((slot) => (
                        <div
                          key={slot.unit}
                          className="flex flex-col items-center rounded-2xl border border-[#FF3D9A]/30 bg-[#181118] py-2.5"
                        >
                          <span className="font-mono text-base font-bold text-white tabular-nums">
                            {slot.digits}
                          </span>
                          <span className="font-mono text-[9px] text-[#FF72B8]">
                            {slot.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 space-y-2 text-[11px]">
                      {[
                        {
                          label: 'Prevent Deleting App',
                          on: state.isDeviceAdminEnabled,
                        },
                        {
                          label: 'Keep Blocker Locked',
                          on: state.settings.antiTamperLockEnabled,
                        },
                        {
                          label: 'Online Account Backup',
                          on: isSignedIn,
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#141016] px-3 py-2"
                        >
                          <span className="text-white/90">{row.label}</span>
                          <span
                            className={`font-mono text-[10px] font-semibold ${
                              row.on ? 'text-[#FF3D9A]' : 'text-white/45'
                            }`}
                          >
                            {row.on ? 'ON' : 'OFF'}
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

      {/* Numbered Feature Grid */}
      <section className="border-t border-[var(--subtle-border)] pt-10">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-ink)] uppercase">
            Built for Complete Recovery
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
            Every layer designed so willpower never stands alone.
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => (
            <LiquidGlassCard key={feat.num} className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <span className="font-mono text-sm font-bold text-[var(--accent-ink)]">
                  {feat.num}.
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold text-[var(--ink)]">
                  {feat.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)] sm:text-sm">
                  {feat.body}
                </p>
              </div>
            </LiquidGlassCard>
          ))}
        </div>
      </section>

      {/* 3-Step Setup + Comparison */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <LiquidGlassCard className="p-5 sm:p-6 lg:col-span-5">
          <p className="text-xs font-semibold text-[var(--accent-ink)] uppercase">
            Quick Phone Setup
          </p>
          <h2 className="mt-1.5 font-display text-xl font-bold text-[var(--ink)]">
            How to install on Android
          </h2>

          <ol className="mt-4 space-y-4">
            {[
              {
                step: '1',
                title: 'Download the GambleAware app',
                desc: 'Tap "Download Android App" above to save the installer to your phone.',
              },
              {
                step: '2',
                title: 'Allow installation on your phone',
                desc: 'Open the downloaded file and tap Allow when Android asks for permission.',
              },
              {
                step: '3',
                title: 'Turn on your Blocker & Lock Timer',
                desc: 'Follow the 3 simple on-screen steps and sign in to save your goals online.',
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
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            <span>Download Android App Now</span>
          </a>
        </LiquidGlassCard>

        <LiquidGlassCard className="p-5 sm:p-6 lg:col-span-7">
          <p className="text-xs font-semibold text-[var(--accent-ink)] uppercase">
            Choose Your Option
          </p>
          <h2 className="mt-1.5 font-display text-xl font-bold text-[var(--ink)]">
            Android Phone App vs. Web Dashboard
          </h2>

          {/* Mobile stacked comparison cards */}
          <div className="mt-4 divide-y divide-[var(--subtle-border)]/60 sm:hidden">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.capability} className="space-y-1.5 py-3 text-xs">
                <p className="font-semibold text-[var(--ink)]">{row.capability}</p>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[var(--ink-muted)]">Phone App:</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--accent-ink)]">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>{row.apk}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[var(--ink-muted)]">Web App:</span>
                  <span className="text-[var(--ink-muted)]">{row.pwa}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop 12-col comparison table */}
          <div className="mt-4 hidden divide-y divide-[var(--subtle-border)]/60 sm:block">
            <div className="grid grid-cols-12 gap-2 pb-2 text-[11px] font-semibold text-[var(--ink-muted)] uppercase">
              <span className="col-span-6">What you get</span>
              <span className="col-span-3 text-[var(--accent-ink)]">Phone App</span>
              <span className="col-span-3">Web App</span>
            </div>
            {COMPARISON_ROWS.map((row) => (
              <div
                key={row.capability}
                className="grid grid-cols-12 items-center gap-2 py-3 text-xs"
              >
                <span className="col-span-6 pr-2 font-medium text-[var(--ink)]">
                  {row.capability}
                </span>
                <span className="col-span-3 flex items-center gap-1 font-medium text-[var(--accent-ink)]">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>{row.apk}</span>
                </span>
                <span className="col-span-3 text-[var(--ink-muted)]">{row.pwa}</span>
              </div>
            ))}
          </div>
        </LiquidGlassCard>
      </section>
    </div>
  );
};
