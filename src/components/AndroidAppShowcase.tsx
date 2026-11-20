import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Ban,
  Check,
  Clock,
  KeyRound,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Unlock,
  Wind,
} from 'lucide-react';
import { BettingBrandLogo } from './BettingBrandLogo';
import { BrandGMark } from './AppHeader';
import { LiquidShieldOrb } from './LiquidGlass';
import { formatNaira } from '../utils/currency';
import {
  buildLockCountdownQuad,
  formatLockDurationLong,
  LOCK_DURATION_PRESETS,
} from '../utils/lockDurations';

type PhoneTab = 'welcome' | 'shield' | 'rules' | 'progress' | 'lock';
type SimulationMode = 'browser' | 'playstore';

interface RuleToggleItem {
  id: string;
  label: string;
  detail: string;
  enabled: boolean;
}

const INITIAL_RULES: RuleToggleItem[] = [
  { id: 'playstore', label: 'Play Store & APK Guard', detail: 'Stops betting app downloads & flags installs', enabled: true },
  { id: 'sportsbooks', label: 'Sportsbooks & Odds', detail: 'SportyBet, Bet9ja, BetKing, 1xBet', enabled: true },
  { id: 'casinos', label: 'Casinos, Slots & Crash', detail: 'Aviator, live tables, instant slots', enabled: true },
  { id: 'crypto', label: 'Crypto & Offshore', detail: 'Stake, Roobet, Rollbit, BC.Game', enabled: true },
  { id: 'ads', label: 'Betting Ads & Popunders', detail: 'PopAds, affiliate btag links, banners', enabled: true },
  { id: 'search', label: 'Search Guard', detail: 'Blocks betting queries, keeps helplines', enabled: true },
];

const RECENT_BLOCKED_EVENTS = [
  { target: 'sportybet.com', label: 'SportyBet', layer: 'Keystroke prefix', ago: '2m ago' },
  { target: 'bet9ja.com', label: 'Bet9ja', layer: 'Cashier URL', ago: '1h ago' },
  { target: '1xbet.ng', label: '1xBet', layer: 'App package', ago: 'Yesterday' },
  { target: 'stake.com', label: 'Stake', layer: 'Crypto registry', ago: '2d ago' },
];

const WEEKLY_URGES = [
  { day: 'M', count: 5 },
  { day: 'T', count: 3 },
  { day: 'W', count: 4 },
  { day: 'T', count: 2 },
  { day: 'F', count: 3 },
  { day: 'S', count: 1 },
  { day: 'S', count: 1 },
];

const STAKE_PRESETS = [2500, 5000, 10000, 25000] as const;

export const AndroidAppShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PhoneTab>('shield');
  const [isProtected, setIsProtected] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [lockDays, setLockDays] = useState<number>(30);
  const [tickSec, setTickSec] = useState(0);
  const [rules, setRules] = useState<RuleToggleItem[]>(INITIAL_RULES);
  const [lockGuardToast, setLockGuardToast] = useState<string | null>(null);
  const [dailyStakeNgn, setDailyStakeNgn] = useState<number>(5000);
  const [bankedBonusNgn, setBankedBonusNgn] = useState<number>(0);
  const [blockedCount, setBlockedCount] = useState<number>(19);

  // Live Blocked Intervention simulation state
  const [interventionOpen, setInterventionOpen] = useState(false);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('browser');
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingSecLeft, setBreathingSecLeft] = useState(60);
  const [stakeBankedThisSession, setStakeBankedThisSession] = useState(false);

  // Live ticking countdown for the commitment lock quad
  useEffect(() => {
    const id = window.setInterval(() => {
      setTickSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // 60s Calm Reset breathing countdown when active
  useEffect(() => {
    if (!breathingActive || !interventionOpen) return;
    const id = window.setInterval(() => {
      setBreathingSecLeft((prev) => {
        if (prev <= 1) {
          setBreathingActive(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [breathingActive, interventionOpen]);

  // Clear guard toast automatically
  useEffect(() => {
    if (!lockGuardToast) return;
    const id = window.setTimeout(() => setLockGuardToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [lockGuardToast]);

  const remainingMs = useMemo(() => {
    const baseMs = lockDays * 86_400_000 - 4 * 3_600_000 - 18 * 60_000;
    return Math.max(0, baseMs - tickSec * 1000);
  }, [lockDays, tickSec]);

  const countdownQuad = useMemo(() => buildLockCountdownQuad(remainingMs), [remainingMs]);
  const activeRuleCount = useMemo(() => rules.filter((r) => r.enabled).length, [rules]);
  const totalSaved14d = dailyStakeNgn * 14 + bankedBonusNgn;
  const projectedAnnual = dailyStakeNgn * 365;

  const handleOrbToggle = () => {
    if (isProtected && isLocked) {
      setLockGuardToast(`Commitment Lock active (${formatLockDurationLong(lockDays)}). Protection cannot be paused.`);
      return;
    }
    setIsProtected((prev) => !prev);
  };

  const handleToggleRule = (ruleId: string) => {
    const target = rules.find((r) => r.id === ruleId);
    if (!target) return;
    if (target.enabled && isLocked) {
      setLockGuardToast('Commitment Lock prevents weakening active rules.');
      return;
    }
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  const handleOpenSimulation = (mode: SimulationMode = 'browser') => {
    setSimulationMode(mode);
    setBlockedCount((c) => c + 1);
    setStakeBankedThisSession(false);
    setBreathingActive(false);
    setBreathingSecLeft(60);
    setInterventionOpen(true);
  };

  const handleBankUrgeStake = () => {
    if (stakeBankedThisSession) return;
    setBankedBonusNgn((prev) => prev + dailyStakeNgn);
    setStakeBankedThisSession(true);
  };

  const selectorTabs: Array<{ id: PhoneTab; num: string; label: string }> = [
    { id: 'welcome', num: '00', label: 'Welcome' },
    { id: 'shield', num: '01', label: 'Shield' },
    { id: 'rules', num: '02', label: 'Rules' },
    { id: 'progress', num: '03', label: 'Progress' },
    { id: 'lock', num: '04', label: 'Lock' },
  ];

  const bottomNavTabs: Array<{ id: Exclude<PhoneTab, 'welcome'>; label: string; icon: React.ReactNode }> = [
    { id: 'shield', label: 'Shield', icon: <Shield className="h-3.5 w-3.5" /> },
    { id: 'rules', label: 'Rules', icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
    { id: 'progress', label: 'Progress', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'lock', label: 'Lock', icon: <Lock className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col items-center" data-testid="android-app-showcase">
      {/* External Interactive Screen Selector */}
      <div
        role="tablist"
        aria-label="Interactive Android app screens"
        className="mb-4 inline-flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-1 sm:rounded-full"
      >
        {selectorTabs.map((tab) => {
          const selected = activeTab === tab.id && !interventionOpen;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              data-testid={`phone-tab-${tab.id}`}
              onClick={() => {
                setInterventionOpen(false);
                setActiveTab(tab.id);
              }}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors sm:rounded-full sm:px-3 ${
                selected
                  ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <span className="font-mono text-[10px] opacity-80">{tab.num}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Android Titanium Device Frame */}
      <div className="relative w-full max-w-[336px] rounded-[42px] border-[3px] border-slate-800 bg-[#0B0E14] p-2.5 shadow-[0_24px_60px_-24px_rgba(9,11,16,0.45)] dark:border-slate-700 dark:ring-1 dark:ring-white/10 dark:shadow-[0_28px_72px_-24px_rgba(255,61,154,0.18)]">
        {/* Inner Viewport */}
        <div className="relative flex h-[600px] flex-col overflow-hidden rounded-[32px] border border-[var(--subtle-border)] bg-[var(--canvas)] text-[var(--ink)]">
          {/* Android Status Bar + Camera Punch */}
          <div className="flex shrink-0 items-center justify-between px-5 pt-2.5 pb-1.5 font-mono text-[10px] font-semibold text-[var(--ink-muted)]">
            <span className="tabular-nums">09:41</span>
            <div className="h-3.5 w-3.5 rounded-full bg-[#0B0E14] ring-1 ring-white/15" aria-hidden="true" />
            <span>5G · 98%</span>
          </div>

          {/* Guard Toast Notification inside Phone */}
          {lockGuardToast ? (
            <div
              role="status"
              data-testid="phone-lock-guard-toast"
              className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-[var(--block-border)] bg-[var(--block-bg)] px-3 py-2 text-[11px] font-medium text-[var(--block-ink)]"
            >
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span className="leading-snug">{lockGuardToast}</span>
            </div>
          ) : null}

          {/* Main Screen Body OR Simulated Blocked Intervention Overlay */}
          {interventionOpen ? (
            <div
              data-testid="phone-intervention-overlay"
              className="flex flex-1 flex-col justify-between bg-[var(--canvas)] px-4 pt-3 pb-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--block-ink)] uppercase">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {simulationMode === 'playstore' ? 'Play Store Blocked · 9ms' : 'Intercepted in 11ms'}
                  </span>
                  <button
                    type="button"
                    data-testid="close-intervention-btn"
                    onClick={() => setInterventionOpen(false)}
                    className="cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  >
                    Return
                  </button>
                </div>

                <div className="mt-4 flex flex-col items-center rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4 text-center">
                  <BettingBrandLogo target="sportybet.com" size="lg" />
                  <h4 className="mt-3 font-display text-base font-bold text-[var(--ink)]">
                    {simulationMode === 'playstore'
                      ? 'Play Store Download Blocked'
                      : 'SportyBet Blocked'}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--ink-muted)]">
                    {simulationMode === 'playstore'
                      ? 'Stopped SportyBet download inside Google Play Store automatically. Your VPN and everyday apps stay untouched.'
                      : 'Keystroke prefix matched before page load. Your own VPN and everyday apps keep running normally.'}
                  </p>
                </div>

                {/* 60s Calm Reset Widget */}
                <div className="mt-3 rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-[var(--accent-ink)]" />
                      <span className="text-xs font-semibold text-[var(--ink)]">60s Calm Reset</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[var(--accent-ink)] tabular-nums">
                      {breathingActive ? `${breathingSecLeft}s` : 'Ready'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                    {breathingActive
                      ? breathingSecLeft % 8 >= 4
                        ? 'Inhale steadily through your nose (4s)...'
                        : 'Exhale slowly and drop your shoulders (4s)...'
                      : 'Most betting urges peak and subside within 60 seconds.'}
                  </p>
                  <button
                    type="button"
                    data-testid="toggle-breathing-btn"
                    onClick={() => setBreathingActive((b) => !b)}
                    className="mt-2.5 w-full cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] py-1.5 text-[11px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--glass-border)]"
                  >
                    {breathingActive ? 'Pause Breathing Timer' : 'Start 60s Breathing Reset'}
                  </button>
                </div>
              </div>

              {/* 1-Tap Bank Urge Stake CTA */}
              <div className="space-y-2">
                <button
                  type="button"
                  data-testid="bank-stake-btn"
                  onClick={handleBankUrgeStake}
                  className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition-opacity ${
                    stakeBankedThisSession
                      ? 'border border-[var(--safe-border)] bg-[var(--safe-bg)] text-[var(--safe-ink)]'
                      : 'bg-[var(--active-fill)] text-[var(--active-content)] hover:opacity-90'
                  }`}
                >
                  {stakeBankedThisSession ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Banked {formatNaira(dailyStakeNgn)} to Savings</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Bank {formatNaira(dailyStakeNgn)} Stake as Saved</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInterventionOpen(false);
                    setActiveTab('progress');
                  }}
                  className="w-full cursor-pointer py-1 text-center text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  View updated savings in Progress →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-3.5 pt-1 pb-2">
              {activeTab === 'welcome' ? (
                <div
                  className="flex h-full flex-col justify-between py-2 text-center"
                  data-testid="phone-screen-welcome"
                >
                  <div className="flex flex-col items-center">
                    <div className="relative mt-2 flex h-20 w-20 items-center justify-center">
                      <span
                        className="absolute inset-0 rounded-full border border-[var(--active-fill)]/30 bg-[var(--soft-accent-bg)]"
                        aria-hidden="true"
                      />
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] shadow-sm">
                        <BrandGMark className="h-9 w-9" />
                      </div>
                    </div>

                    <p className="mt-3 font-mono text-[9px] font-bold tracking-widest text-[var(--accent-ink)] uppercase">
                      100% Free · Zero-VPN Shield
                    </p>
                    <h4 className="mt-1 font-display text-lg font-bold tracking-tight text-[var(--ink)]">
                      Welcome to GambleAware
                    </h4>
                    <p className="mt-1 px-2 text-[11px] leading-relaxed text-[var(--ink-muted)]">
                      Calm, unbreakable protection against betting sites and apps — without slowing down your phone.
                    </p>

                    <div className="mt-4 w-full space-y-2 text-left">
                      <div className="flex items-start gap-2.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5">
                        <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                        <div>
                          <p className="text-[11px] font-semibold text-[var(--ink)]">Use Any VPN Freely</p>
                          <p className="text-[10px] leading-snug text-[var(--ink-muted)]">
                            ProtonVPN, Mullvad, NordVPN &amp; WARP work without affecting your lock.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5">
                        <ShoppingBag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                        <div>
                          <p className="text-[11px] font-semibold text-[var(--ink)]">Play Store &amp; Install Guard</p>
                          <p className="text-[10px] leading-snug text-[var(--ink-muted)]">
                            Automatically blocks betting downloads &amp; detects installed betting apps.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                        <div>
                          <p className="text-[11px] font-semibold text-[var(--ink)]">Unbreakable Commitment Lock</p>
                          <p className="text-[10px] leading-snug text-[var(--ink-muted)]">
                            Stops uninstall, Force Stop &amp; clock jumps while banking apps stay untouched.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <button
                      type="button"
                      data-testid="phone-welcome-start-btn"
                      onClick={() => setActiveTab('shield')}
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] py-2.5 text-xs font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
                    >
                      <span>Get Started — Set Up Shield</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <p className="font-mono text-[9px] text-[var(--ink-muted)]">
                      Only betting apps blocked · Free forever
                    </p>
                  </div>
                </div>
              ) : null}

              {activeTab === 'shield' ? (
                <div className="space-y-3" data-testid="phone-screen-shield">
                  {/* Top App Bar inside Phone */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <BrandGMark className="h-6 w-6" />
                      <div>
                        <p className="font-display text-sm font-bold leading-none text-[var(--ink)]">
                          GambleAware
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] text-[var(--ink-muted)]">
                          ZERO-VPN SHIELD · FREE
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('lock')}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[10px] font-semibold text-[var(--accent-ink)]"
                    >
                      {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      <span>{isLocked ? `${lockDays}d Lock` : 'Unlocked'}</span>
                    </button>
                  </div>

                  {/* Hero Orb Card */}
                  <div className="flex flex-col items-center rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-3.5 text-center">
                    <LiquidShieldOrb
                      isProtected={isProtected}
                      isLocked={isLocked}
                      onClick={handleOrbToggle}
                      sizeClass="h-[112px] w-[112px]"
                    />
                    <p className="mt-2 font-display text-sm font-bold text-[var(--ink)]">
                      {isProtected ? 'Device Shield Armed' : 'Shield Paused'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                      {isProtected
                        ? `${activeRuleCount}/${rules.length} guards active · Other VPNs run freely`
                        : 'Tap orb to re-arm instant protection'}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                      <button
                        type="button"
                        data-testid="simulate-block-btn"
                        onClick={() => handleOpenSimulation('browser')}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--accent-ink)] transition-colors hover:opacity-90"
                      >
                        <Ban className="h-3 w-3" />
                        <span>Simulate Site Block</span>
                      </button>
                      <button
                        type="button"
                        data-testid="simulate-playstore-btn"
                        onClick={() => handleOpenSimulation('playstore')}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--glass-border)]"
                      >
                        <ShoppingBag className="h-3 w-3 text-[var(--accent-ink)]" />
                        <span>Play Store Block</span>
                      </button>
                    </div>
                  </div>

                  {/* 3-Column Metrics Trio */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5 text-center">
                      <p className="font-mono text-sm font-bold text-[var(--ink)] tabular-nums">14d</p>
                      <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">Clean streak</p>
                    </div>
                    <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5 text-center">
                      <p className="font-mono text-sm font-bold text-[var(--accent-ink)] tabular-nums">
                        {blockedCount}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">Blocked</p>
                    </div>
                    <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] p-2.5 text-center">
                      <p className="font-mono text-sm font-bold text-[var(--safe-ink)] tabular-nums">
                        {formatNaira(totalSaved14d)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">Kept safe</p>
                    </div>
                  </div>

                  {/* Synced Lock Countdown Bar */}
                  <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2.5">
                    <div className="flex items-center justify-between text-[10px] font-medium text-[var(--ink-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[var(--accent-ink)]" />
                        Commitment Lock
                      </span>
                      <span className="font-mono text-[var(--ink)] tabular-nums">
                        {isLocked
                          ? `${countdownQuad[0].digits}d ${countdownQuad[1].digits}h ${countdownQuad[2].digits}m ${countdownQuad[3].digits}s`
                          : 'Off'}
                      </span>
                    </div>
                  </div>

                  {/* Active Protection Stack Row */}
                  <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[var(--ink)]">Protection Stack</span>
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--safe-ink)]">
                        <ShieldCheck className="h-3 w-3" />
                        Play Store · Other VPNs OK
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'rules' ? (
                <div className="space-y-2.5" data-testid="phone-screen-rules">
                  <div className="pt-1">
                    <p className="font-display text-sm font-bold text-[var(--ink)]">
                      Blocking Rules
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {isLocked
                        ? 'Locked: new rules can be added, active rules cannot be disabled.'
                        : 'Unlocked: toggle any protection category below.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between gap-2.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[var(--ink)]">
                            {rule.label}
                          </p>
                          <p className="truncate text-[10px] text-[var(--ink-muted)]">
                            {rule.detail}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={rule.enabled}
                          aria-label={`Toggle ${rule.label}`}
                          data-testid={`phone-rule-${rule.id}`}
                          onClick={() => handleToggleRule(rule.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                            rule.enabled
                              ? 'border-[var(--active-fill)] bg-[var(--active-fill)]'
                              : 'border-[var(--subtle-border)] bg-[var(--muted-fill)]'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                              rule.enabled
                                ? 'translate-x-4.5 bg-[var(--active-content)]'
                                : 'translate-x-0.5 bg-[var(--ink-muted)]'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === 'progress' ? (
                <div className="space-y-3" data-testid="phone-screen-progress">
                  <div className="pt-1">
                    <p className="font-display text-sm font-bold text-[var(--ink)]">
                      Recovery Progress
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Savings &amp; intercepted attempts over 14 days
                    </p>
                  </div>

                  {/* Savings Summary */}
                  <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-3.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                        Saved so far
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[var(--safe-ink)]">
                        <TrendingUp className="h-3 w-3" />
                        {formatNaira(projectedAnnual)} / yr
                      </span>
                    </div>
                    <p
                      data-testid="phone-total-saved"
                      className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums"
                    >
                      {formatNaira(totalSaved14d)}
                    </p>

                    {/* Daily Stake Selector */}
                    <div className="mt-3">
                      <p className="mb-1.5 text-[10px] font-medium text-[var(--ink-muted)]">
                        Typical daily stake
                      </p>
                      <div className="grid grid-cols-4 gap-1">
                        {STAKE_PRESETS.map((stake) => {
                          const active = dailyStakeNgn === stake;
                          return (
                            <button
                              key={stake}
                              type="button"
                              data-testid={`phone-stake-${stake}`}
                              onClick={() => setDailyStakeNgn(stake)}
                              className={`cursor-pointer rounded-lg border py-1 font-mono text-[10px] font-semibold transition-colors ${
                                active
                                  ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                                  : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                              }`}
                            >
                              ₦{stake >= 1000 ? `${stake / 1000}k` : stake}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Interception Trend */}
                  <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[var(--ink)]">7-Day Urge Trend</span>
                      <span className="font-mono text-[10px] text-[var(--safe-ink)]">Trending down</span>
                    </div>
                    <div className="mt-3 grid h-16 grid-cols-7 items-end gap-1.5">
                      {WEEKLY_URGES.map((bar, idx) => (
                        <div key={idx} className="flex h-full flex-col items-center justify-end gap-1">
                          <div
                            className="w-full rounded-t-md bg-[var(--active-fill)]/85 transition-all"
                            style={{ height: `${Math.max(18, (bar.count / 5) * 100)}%` }}
                          />
                          <span className="font-mono text-[9px] text-[var(--ink-muted)]">
                            {bar.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Intercepted Brands */}
                  <div className="space-y-1.5">
                    {RECENT_BLOCKED_EVENTS.slice(0, 3).map((ev) => (
                      <div
                        key={ev.target}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <BettingBrandLogo target={ev.target} size="xs" />
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold text-[var(--ink)]">
                              {ev.label}
                            </p>
                            <p className="truncate font-mono text-[9px] text-[var(--ink-muted)]">
                              {ev.layer}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[9px] text-[var(--ink-muted)]">
                          {ev.ago}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === 'lock' ? (
                <div className="space-y-3" data-testid="phone-screen-lock">
                  <div className="pt-1">
                    <p className="font-display text-sm font-bold text-[var(--ink)]">
                      Commitment Lock
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Prevents impulsive pausing, rule weakening, or uninstalls.
                    </p>
                  </div>

                  {/* Countdown Quad */}
                  <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
                        {isLocked ? 'Tamper Lock Active' : 'Lock Disarmed'}
                      </span>
                      <button
                        type="button"
                        data-testid="phone-lock-toggle"
                        onClick={() => setIsLocked((l) => !l)}
                        className="cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
                      >
                        {isLocked ? 'Preview Unlock' : 'Arm Lock'}
                      </button>
                    </div>

                    <div
                      data-testid="phone-countdown-quad"
                      className="mt-3 grid grid-cols-4 gap-1.5"
                    >
                      {countdownQuad.map((cell) => (
                        <div
                          key={cell.unit}
                          className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] py-2 text-center"
                        >
                          <p className="font-mono text-base font-bold text-[var(--ink)] tabular-nums">
                            {isLocked ? cell.digits : '00'}
                          </p>
                          <p className="font-mono text-[8px] text-[var(--ink-muted)]">
                            {cell.unit}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Lock Duration Presets */}
                    <div className="mt-3">
                      <p className="mb-1.5 text-[10px] font-medium text-[var(--ink-muted)]">
                        Duration ({formatLockDurationLong(lockDays)})
                      </p>
                      <div className="grid grid-cols-4 gap-1">
                        {LOCK_DURATION_PRESETS.slice(0, 4)
                          .concat(LOCK_DURATION_PRESETS.slice(4))
                          .map((preset) => {
                            const selected = lockDays === preset.days;
                            return (
                              <button
                                key={preset.days}
                                type="button"
                                data-testid={`phone-lock-days-${preset.days}`}
                                onClick={() => {
                                  setLockDays(preset.days);
                                  setIsLocked(true);
                                }}
                                className={`cursor-pointer rounded-lg border py-1 font-mono text-[10px] font-semibold transition-colors ${
                                  selected
                                    ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                                    : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                                }`}
                              >
                                {preset.shortLabel}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Hardening Rows */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[var(--ink)]">
                          Device Admin Guard
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          Blocks App Info uninstalls
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[var(--safe-ink)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Armed
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[var(--ink)]">
                          Clock &amp; Tamper Guard
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          Blocks Date/Time &amp; Force Stop bypass
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[var(--safe-ink)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Armed
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[var(--ink)]">
                          Trusted Buddy Co-Lock
                        </p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          Offline challenge · 482-915
                        </p>
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-[var(--accent-ink)]">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* In-Phone Floating Navigation Bar (hidden on full-screen Welcome stage) */}
          {activeTab !== 'welcome' ? (
            <div className="shrink-0 border-t border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 py-2">
              <div className="grid grid-cols-4 gap-1">
                {bottomNavTabs.map((tab) => {
                  const selected = activeTab === tab.id && !interventionOpen;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setInterventionOpen(false);
                        setActiveTab(tab.id);
                      }}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl py-1.5 transition-colors ${
                        selected
                          ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {tab.icon}
                      <span className="mt-0.5 text-[9px] font-semibold leading-none">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
