import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Download,
  Lock,
  Moon,
  Shield,
  SlidersHorizontal,
  Sun,
  Target,
  Wind,
} from 'lucide-react';
import {
  BlockFilterConfig,
  BlocklistMatcher,
} from '../blocker/blocklistMatcher';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import { BrandGMark } from '../components/AppHeader';
import { CalmResetModal, UrgeJournalModal } from '../components/mainapp/CalmResetModal';
import { GoalsAndLimitsTab } from '../components/mainapp/GoalsAndLimitsTab';
import { LockTab } from '../components/mainapp/LockTab';
import { ResourcesTab } from '../components/mainapp/ResourcesTab';
import { RulesTab } from '../components/mainapp/RulesTab';
import { ShieldTab } from '../components/mainapp/ShieldTab';
import {
  WelcomeCompletionPayload,
  WelcomeScreen,
} from '../components/mainapp/WelcomeScreen';
import {
  hashPinSync,
  loadStore,
  PersistedStore,
  saveStore,
} from '../data/storage';
import {
  DailyBlockStat,
  HighRiskScheduleConfig,
  ProtectionSettingsState,
  RecoveryGoalCategory,
  ThemeMode,
  TriggerBreakdown,
} from '../data/types';
import { formatNaira } from '../utils/currency';
import {
  createValidatedGoal,
  GOAL_PRESETS,
  removeGoalById,
  setPrimaryGoal,
  toggleGoalCompleted,
} from '../utils/goalsEngine';
import { buildLockCountdownQuad } from '../utils/lockDurations';
import {
  computeNextCooldownAfterAttempt,
  evaluateRateLimitStatus,
  RateLimitConfig,
} from '../utils/rateLimiter';

export type MainAppTab = 'shield' | 'rules' | 'goals' | 'resources' | 'lock';

interface MainAppScreenProps {
  isDarkTheme: boolean;
  onUpdateTheme: (mode: ThemeMode) => void;
  onOpenDownloadPage: () => void;
}

const NAV_ITEMS: Array<{
  id: MainAppTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'shield', label: 'Shield', shortLabel: 'Shield', icon: Shield },
  { id: 'rules', label: 'Blocklist & Rules', shortLabel: 'Rules', icon: SlidersHorizontal },
  { id: 'goals', label: 'Goals & Limits', shortLabel: 'Goals', icon: Target },
  { id: 'resources', label: 'Recovery Resources', shortLabel: 'Resources', icon: BookOpen },
  { id: 'lock', label: 'Commitment Lock', shortLabel: 'Lock', icon: Lock },
];

function shouldAutoSkipWelcome(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1';
}

export const MainAppScreen: React.FC<MainAppScreenProps> = ({
  isDarkTheme,
  onUpdateTheme,
  onOpenDownloadPage,
}) => {
  const [store, setStore] = useState<PersistedStore>(() => loadStore());
  const [activeTab, setActiveTab] = useState<MainAppTab>('shield');
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    if (shouldAutoSkipWelcome()) return false;
    return !loadStore().settings.hasCompletedInitialSetup;
  });
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [calmModalOpen, setCalmModalOpen] = useState(false);
  const [calmBlockedTarget, setCalmBlockedTarget] = useState<string | null>(null);
  const [calmBlockedSource, setCalmBlockedSource] = useState<string | null>(null);
  const [urgeModalOpen, setUrgeModalOpen] = useState(false);

  const persist = useCallback((updater: (prev: PersistedStore) => PersistedStore) => {
    setStore((prev) => {
      const next = updater(prev);
      const stamped = { ...next, updatedAtMs: Date.now() };
      saveStore(stamped);
      return stamped;
    });
  }, []);

  const flashBanner = useCallback((msg: string) => {
    setStatusBanner(msg);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!statusBanner) return;
    const id = window.setTimeout(() => setStatusBanner(null), 3200);
    return () => window.clearTimeout(id);
  }, [statusBanner]);

  const { settings } = store;

  const remainingLockMs = Math.max(0, settings.lockUntilEpochMs - nowMs);
  const isLocked = remainingLockMs > 0;

  const lockCountdownFormatted = useMemo(() => {
    if (!isLocked) return 'Unlocked';
    const q = buildLockCountdownQuad(remainingLockMs);
    return `${q[0].digits}d ${q[1].digits}h ${q[2].digits}m ${q[3].digits}s`;
  }, [isLocked, remainingLockMs]);

  const cleanElapsedMs = Math.max(0, nowMs - settings.protectionStartedAtMs);
  const cleanExactDays = cleanElapsedMs / 86_400_000;
  const cleanDays = Math.floor(cleanExactDays);
  const cleanHours = Math.floor((cleanElapsedMs % 86_400_000) / 3_600_000);
  const cleanMinutes = Math.floor((cleanElapsedMs % 3_600_000) / 60_000);

  const estimatedSavedNgn =
    Math.round(cleanExactDays * settings.dailyBetSpendEstimate) +
    settings.bankedUrgeSavingsNgn;

  const rateLimitStatus = useMemo(
    () =>
      evaluateRateLimitStatus(
        store.events,
        settings.rateLimitConfig,
        settings.highRiskSchedule,
        settings.rateLimitCooldownUntilMs,
        nowMs,
      ),
    [
      store.events,
      settings.rateLimitConfig,
      settings.highRiskSchedule,
      settings.rateLimitCooldownUntilMs,
      nowMs,
    ],
  );

  const customBlockedDomains = useMemo(
    () => store.domains.filter((d) => !d.isAllowlisted),
    [store.domains],
  );
  const allowlistedDomains = useMemo(
    () => store.domains.filter((d) => d.isAllowlisted),
    [store.domains],
  );

  const filterConfig: BlockFilterConfig = useMemo(
    () => ({
      blockSportsbooks: settings.blockSportsbooks,
      blockCasinos: settings.blockCasinos,
      blockPokerAndBingo: settings.blockPokerAndBingo,
      blockCryptoBetting: settings.blockCryptoBetting,
      blockFantasyAndLottery: settings.blockFantasyAndLottery,
      strictKeywordFilter: settings.strictKeywordFilter,
      searchGuardEnabled: settings.searchGuardEnabled,
      adBlockerEnabled: settings.adBlockerEnabled,
      playStoreGuardEnabled: settings.playStoreGuardEnabled,
      customBlockedDomains: new Set(customBlockedDomains.map((d) => d.domain)),
      allowlistedDomains: new Set(allowlistedDomains.map((d) => d.domain)),
      customBlockedPackages: new Set(store.blockedApps.map((a) => a.packageName)),
      customBlockedAppNames: new Set(store.blockedApps.map((a) => a.appLabel)),
    }),
    [settings, customBlockedDomains, allowlistedDomains, store.blockedApps],
  );

  const primaryGoal = useMemo(
    () => store.goals.find((g) => g.isPrimary) ?? store.goals[0] ?? null,
    [store.goals],
  );

  const todayBlockedCount = useMemo(() => {
    const start = new Date(nowMs);
    start.setHours(0, 0, 0, 0);
    const startMs = start.getTime();
    return store.events.filter((e) => e.timestamp >= startMs).length;
  }, [store.events, nowMs]);

  const sevenDayStats: DailyBlockStat[] = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: DailyBlockStat[] = [];
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(nowMs - offset * 86_400_000);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 86_400_000;
      const count = store.events.filter((ev) => ev.timestamp >= start && ev.timestamp < end).length;
      result.push({ dayLabel: dayNames[d.getDay()], count });
    }
    return result;
  }, [store.events, nowMs]);

  const triggerBreakdown: TriggerBreakdown[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of store.urgeLogs) {
      map.set(log.triggerTag, (map.get(log.triggerTag) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([triggerTag, count]) => ({ triggerTag, count }))
      .sort((a, b) => b.count - a.count);
  }, [store.urgeLogs]);

  const activeGuardsCount = [
    settings.browserShieldEnabled,
    settings.playStoreGuardEnabled,
    settings.appShieldEnabled,
    settings.adBlockerEnabled,
    settings.searchGuardEnabled,
    settings.depositGuardEnabled,
  ].filter(Boolean).length;

  const handleCompleteWelcome = (payload: WelcomeCompletionPayload) => {
    const now = Date.now();
    const preset = GOAL_PRESETS.find((g) => g.id === payload.selectedGoalPresetId) ?? GOAL_PRESETS[0];

    persist((prev) => {
      const nextGoals =
        prev.goals.length === 0
          ? [
              {
                goalId: `goal_welcome_${now}`,
                title: preset.title,
                category: preset.category,
                targetDays: preset.targetDays,
                targetAmountNgn: preset.targetAmountNgn,
                whyNote: preset.whyNote,
                isPrimary: true,
                isCompleted: false,
                lockDurationDays: payload.lockDays,
                createdAtMs: now,
              },
            ]
          : prev.goals;

      return {
        ...prev,
        preferredName: payload.preferredName,
        goals: nextGoals,
        settings: {
          ...prev.settings,
          hasCompletedInitialSetup: true,
          dailyBetSpendEstimate: payload.dailyStakeNgn,
          lockUntilEpochMs:
            payload.lockDays > 0
              ? Math.max(prev.settings.lockUntilEpochMs, now + payload.lockDays * 86_400_000)
              : prev.settings.lockUntilEpochMs,
          rateLimitConfig: {
            ...prev.settings.rateLimitConfig,
            enabled: true,
            maxAttemptsPer10Min: payload.maxAttemptsPer10Min,
            cooldownMinutes: payload.cooldownMinutes,
          },
        },
      };
    });

    setShowWelcome(false);
    setActiveTab('shield');
    flashBanner('Shield armed with your goal and burst rate limit.');
  };

  const handleSkipWelcome = () => {
    persist((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        hasCompletedInitialSetup: true,
      },
    }));
    setShowWelcome(false);
  };

  const handleToggleShield = () => {
    if (settings.isProtectionEnabled && isLocked) {
      flashBanner(`Commitment Lock active (${lockCountdownFormatted}). Shield cannot be paused.`);
      return;
    }
    persist((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        isProtectionEnabled: !prev.settings.isProtectionEnabled,
      },
    }));
  };

  const handleRecordBlockedAttempt = (target: string, openModal: boolean) => {
    const now = Date.now();
    const matched = BlocklistMatcher.matchTypedBrowserInput(target, filterConfig);
    const newEvent = {
      id: now,
      target: matched.matchedTarget || target,
      source: 'All-Browser Shield',
      categoryName: matched.category || 'SPORTSBOOK',
      timestamp: now,
    };

    const nextEvents = [newEvent, ...store.events].slice(0, 200);
    const cooldownOutcome = computeNextCooldownAfterAttempt(
      nextEvents,
      settings.rateLimitConfig,
      settings.highRiskSchedule,
      settings.rateLimitCooldownUntilMs,
      now,
    );

    persist((prev) => ({
      ...prev,
      events: [newEvent, ...prev.events].slice(0, 200),
      settings: {
        ...prev.settings,
        rateLimitCooldownUntilMs: cooldownOutcome.nextCooldownUntilMs,
      },
    }));

    if (cooldownOutcome.triggered && cooldownOutcome.reason) {
      flashBanner(cooldownOutcome.reason);
    } else {
      flashBanner(`Intercepted ${newEvent.target} (${rateLimitStatus.attemptsLast10Min + 1}/${rateLimitStatus.effectiveBurstLimit} in 10m).`);
    }

    if (openModal) {
      setCalmBlockedTarget(newEvent.target);
      setCalmBlockedSource(newEvent.source);
      setCalmModalOpen(true);
    }
  };

  const handleToggleRuleSetting = (key: keyof ProtectionSettingsState, nextVal: boolean) => {
    if (!nextVal && isLocked) {
      flashBanner('Commitment Lock prevents disabling active protection rules.');
      return;
    }
    persist((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: nextVal,
      },
    }));
  };

  const handleAddCustomDomain = (rawDomain: string, isAllowlist: boolean) => {
    if (isAllowlist && isLocked) {
      flashBanner('Commitment Lock prevents adding allowlist bypasses.');
      return;
    }
    const clean = rawDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
    if (!clean) return;
    persist((prev) => ({
      ...prev,
      domains: [
        {
          domain: clean,
          isAllowlisted: isAllowlist,
          categoryName: isAllowlist ? 'ALLOWLIST' : 'CUSTOM',
          addedAt: Date.now(),
        },
        ...prev.domains.filter((d) => d.domain !== clean),
      ],
    }));
    flashBanner(isAllowlist ? `Allowlisted ${clean}.` : `Added ${clean} to custom blocklist.`);
  };

  const handleRemoveCustomDomain = (domain: string, isAllowlist: boolean) => {
    if (!isAllowlist && isLocked) {
      flashBanner('Commitment Lock prevents removing blocked domains.');
      return;
    }
    persist((prev) => ({
      ...prev,
      domains: prev.domains.filter((d) => d.domain !== domain),
    }));
  };

  const handleAddBlockedApp = (packageName: string, appLabel: string) => {
    persist((prev) => ({
      ...prev,
      blockedApps: [
        { packageName, appLabel, addedAt: Date.now() },
        ...prev.blockedApps.filter((a) => a.packageName !== packageName),
      ],
    }));
    flashBanner(`Pinned ${appLabel} to App Shield.`);
  };

  const handleRemoveBlockedApp = (packageName: string) => {
    if (isLocked) {
      flashBanner('Commitment Lock prevents unpinning blocked apps.');
      return;
    }
    persist((prev) => ({
      ...prev,
      blockedApps: prev.blockedApps.filter((a) => a.packageName !== packageName),
    }));
  };

  const handleUpdateRateLimitConfig = (patch: Partial<RateLimitConfig>) => {
    if (patch.enabled === false && isLocked) {
      flashBanner('Commitment Lock prevents disabling the burst rate limiter.');
      return;
    }
    persist((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        rateLimitConfig: {
          ...prev.settings.rateLimitConfig,
          ...patch,
        },
      },
    }));
  };

  const handleUpdateHighRiskSchedule = (patch: Partial<HighRiskScheduleConfig>) => {
    if (isLocked && Object.values(patch).some((v) => v === false)) {
      flashBanner('Commitment Lock prevents disabling high-risk schedules.');
      return;
    }
    persist((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        highRiskSchedule: {
          ...prev.settings.highRiskSchedule,
          ...patch,
        },
      },
    }));
  };

  const handleCreateGoal = (input: {
    title: string;
    category: RecoveryGoalCategory;
    targetDays: number;
    targetAmountNgn: number;
    whyNote: string;
  }) => {
    const result = createValidatedGoal(input, store.goals);
    if (!result.valid || !result.goal) {
      return { valid: false, error: result.error };
    }
    const created = result.goal;
    persist((prev) => ({
      ...prev,
      goals: [created, ...prev.goals],
    }));
    flashBanner(`Recovery goal “${created.title}” saved.`);
    return { valid: true, error: null };
  };

  const handleBankStake = () => {
    persist((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        bankedUrgeSavingsNgn:
          prev.settings.bankedUrgeSavingsNgn + prev.settings.dailyBetSpendEstimate,
        bankedUrgeCount: prev.settings.bankedUrgeCount + 1,
      },
    }));
    flashBanner(`Banked ${formatNaira(settings.dailyBetSpendEstimate)} into recovery savings.`);
  };

  const handleLogUrge = (triggerTag: string, note: string) => {
    persist((prev) => ({
      ...prev,
      urgeLogs: [
        {
          id: Date.now(),
          triggerTag,
          note,
          timestamp: Date.now(),
        },
        ...prev.urgeLogs,
      ].slice(0, 100),
    }));
    flashBanner(`Logged resisted urge (${triggerTag}).`);
  };

  const handleToggleBankCheck = (checkId: string) => {
    persist((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        bankFreezeChecks: {
          ...prev.settings.bankFreezeChecks,
          [checkId]: !prev.settings.bankFreezeChecks[checkId],
        },
      },
    }));
  };

  const handleActivateLock = (days: number) => {
    const targetUntil = Date.now() + days * 86_400_000;
    if (isLocked && targetUntil <= settings.lockUntilEpochMs) {
      flashBanner('Active Commitment Lock can only be extended to a longer duration.');
      return;
    }
    persist((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        isProtectionEnabled: true,
        lockUntilEpochMs: targetUntil,
      },
    }));
    flashBanner(`Commitment Lock active for ${days} day${days === 1 ? '' : 's'}.`);
  };

  if (showWelcome) {
    return (
      <WelcomeScreen
        initialName={store.preferredName}
        initialDailyStake={settings.dailyBetSpendEstimate}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => onUpdateTheme(isDarkTheme ? ThemeMode.LIGHT : ThemeMode.DARK)}
        onComplete={handleCompleteWelcome}
        onSkip={handleSkipWelcome}
        onOpenDownloadPage={onOpenDownloadPage}
      />
    );
  }

  return (
    <div
      data-testid="main-app-shell"
      className="flex min-h-screen w-full bg-[var(--canvas)] text-[var(--ink)]"
    >
      {/* Desktop Left Navigation Sidebar (lg: 1024px+) */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[var(--subtle-border)] bg-[var(--surface)] p-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div>
          <div className="flex items-center gap-2.5 px-1">
            <BrandGMark className="h-8 w-8 shrink-0" />
            <div>
              <p className="font-display text-base font-bold leading-none text-[var(--ink)]">
                GambleAware
              </p>
              <p className="mt-1 font-mono text-[10px] font-semibold text-[var(--accent-ink)] uppercase">
                Zero-VPN · 100% Free
              </p>
            </div>
          </div>

          <nav aria-label="Main app navigation" className="mt-7 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`sidebar-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                    selected
                      ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'text-[var(--ink-muted)] hover:bg-[var(--control-bg)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Utilities */}
        <div className="space-y-2 border-t border-[var(--subtle-border)] pt-4">
          <button
            type="button"
            onClick={() => {
              setCalmBlockedTarget(null);
              setCalmModalOpen(true);
            }}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] text-xs font-semibold text-[var(--ink)] hover:border-[var(--glass-border)]"
          >
            <Wind className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
            <span>60s SOS Calm Reset</span>
          </button>

          <button
            type="button"
            data-testid="sidebar-download-apk-btn"
            onClick={onOpenDownloadPage}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--soft-accent-bg)] text-xs font-semibold text-[var(--accent-ink)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Android APK Page</span>
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact Top Bar (Mobile: 52px + Bottom Nav 58px = 110px <= 15% of 844px) */}
        <header className="sticky top-0 z-30 flex h-[52px] w-full items-center justify-between gap-2 border-b border-[var(--subtle-border)] bg-[var(--surface)] px-4 lg:h-16 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <BrandGMark className="h-7 w-7 shrink-0" />
            <span className="truncate font-display text-[15px] font-bold text-[var(--ink)]">
              GambleAware
            </span>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="font-mono text-xs font-semibold text-[var(--accent-ink)] uppercase">
              {settings.isProtectionEnabled ? 'Shield Armed' : 'Shield Paused'}
            </span>
            <span aria-hidden="true" className="text-[var(--ink-muted)]">·</span>
            <span className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
              {rateLimitStatus.isCooldownActive
                ? `Cooldown ${rateLimitStatus.cooldownFormatted}`
                : `Burst ${rateLimitStatus.attemptsLast10Min}/${rateLimitStatus.effectiveBurstLimit} (10m)`}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              data-testid="header-download-apk-btn"
              onClick={onOpenDownloadPage}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs font-semibold whitespace-nowrap text-[var(--ink)] hover:border-[var(--glass-border)]"
            >
              <Download className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
              <span>APK</span>
            </button>
            <button
              type="button"
              data-testid="header-theme-toggle-btn"
              onClick={() => onUpdateTheme(isDarkTheme ? ThemeMode.LIGHT : ThemeMode.DARK)}
              aria-label={isDarkTheme ? 'Switch to White theme' : 'Switch to Obsidian theme'}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink)]"
            >
              {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Status Toast Banner */}
        {statusBanner ? (
          <div
            role="status"
            data-testid="mainapp-status-banner"
            className="mx-auto mt-3 w-full max-w-5xl px-4 lg:px-8"
          >
            <div className="rounded-2xl border border-[var(--active-fill)] bg-[var(--soft-accent-bg)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-ink)]">
              {statusBanner}
            </div>
          </div>
        ) : null}

        {/* Scrollable Workspace Content */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-24 lg:px-8 lg:py-8">
          {activeTab === 'shield' ? (
            <ShieldTab
              preferredName={store.preferredName}
              isProtected={settings.isProtectionEnabled}
              isLocked={isLocked}
              lockCountdownFormatted={lockCountdownFormatted}
              cleanDays={cleanDays}
              cleanExactDays={cleanExactDays}
              cleanHours={cleanHours}
              cleanMinutes={cleanMinutes}
              estimatedSavedNgn={estimatedSavedNgn}
              dailyStakeNgn={settings.dailyBetSpendEstimate}
              totalBlockedCount={store.events.length}
              todayBlockedCount={todayBlockedCount}
              totalUrgeResistedCount={store.urgeLogs.length}
              activeGuardsCount={activeGuardsCount}
              totalGuardsCount={6}
              builtInDomainCount={GamblingRegistry.domainToCategory.size}
              primaryGoal={primaryGoal}
              rateLimitStatus={rateLimitStatus}
              recentEvents={store.events}
              filterConfig={filterConfig}
              onToggleShield={handleToggleShield}
              onSimulateBlockedAttempt={(domain) => handleRecordBlockedAttempt(domain, true)}
              onOpenCalmReset={() => {
                setCalmBlockedTarget(null);
                setCalmModalOpen(true);
              }}
              onOpenUrgeJournal={() => setUrgeModalOpen(true)}
              onBankStake={handleBankStake}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          ) : null}

          {activeTab === 'rules' ? (
            <RulesTab
              settings={settings}
              isLocked={isLocked}
              customBlockedDomains={customBlockedDomains}
              allowlistedDomains={allowlistedDomains}
              customBlockedApps={store.blockedApps}
              onToggleSetting={handleToggleRuleSetting}
              onAddCustomDomain={handleAddCustomDomain}
              onRemoveCustomDomain={handleRemoveCustomDomain}
              onAddBlockedApp={handleAddBlockedApp}
              onRemoveBlockedApp={handleRemoveBlockedApp}
            />
          ) : null}

          {activeTab === 'goals' ? (
            <GoalsAndLimitsTab
              rateLimitConfig={settings.rateLimitConfig}
              rateLimitStatus={rateLimitStatus}
              highRiskSchedule={settings.highRiskSchedule}
              isLocked={isLocked}
              goals={store.goals}
              cleanDays={cleanDays}
              cleanExactDays={cleanExactDays}
              estimatedSavedNgn={estimatedSavedNgn}
              dailyStakeNgn={settings.dailyBetSpendEstimate}
              sevenDayStats={sevenDayStats}
              triggerBreakdown={triggerBreakdown}
              onUpdateRateLimitConfig={handleUpdateRateLimitConfig}
              onUpdateHighRiskSchedule={handleUpdateHighRiskSchedule}
              onTestBurstLimit={() => handleRecordBlockedAttempt('sportybet.com', false)}
              onResetCooldown={() => {
                persist((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, rateLimitCooldownUntilMs: 0 },
                }));
                flashBanner('Cooldown timer cleared.');
              }}
              onCreateGoal={handleCreateGoal}
              onSetPrimaryGoal={(goalId) =>
                persist((prev) => ({ ...prev, goals: setPrimaryGoal(prev.goals, goalId) }))
              }
              onToggleGoalCompleted={(goalId) =>
                persist((prev) => ({ ...prev, goals: toggleGoalCompleted(prev.goals, goalId) }))
              }
              onRemoveGoal={(goalId) =>
                persist((prev) => ({ ...prev, goals: removeGoalById(prev.goals, goalId) }))
              }
              onUpdateDailyStake={(stake) =>
                persist((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, dailyBetSpendEstimate: stake },
                }))
              }
              onOpenUrgeJournal={() => setUrgeModalOpen(true)}
            />
          ) : null}

          {activeTab === 'resources' ? (
            <ResourcesTab
              bankFreezeChecks={settings.bankFreezeChecks}
              onToggleBankFreezeCheck={handleToggleBankCheck}
              onOpenCalmReset={() => {
                setCalmBlockedTarget(null);
                setCalmModalOpen(true);
              }}
            />
          ) : null}

          {activeTab === 'lock' ? (
            <LockTab
              settings={settings}
              isLocked={isLocked}
              remainingLockMs={remainingLockMs}
              currentTimeMs={nowMs}
              isDarkTheme={isDarkTheme}
              onActivateLock={handleActivateLock}
              onToggleAntiTamper={(enabled) => {
                if (!enabled && isLocked) {
                  flashBanner('Commitment Lock prevents turning off Anti-Tamper protection.');
                  return;
                }
                persist((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, antiTamperLockEnabled: enabled },
                }));
              }}
              onSetPin={(pin) =>
                persist((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, pinHash: hashPinSync(pin) },
                }))
              }
              onClearPin={() =>
                persist((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, pinHash: null },
                }))
              }
              onSaveBuddyConfig={(partnerName, challengeCode) =>
                persist((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    buddyPartnerName: partnerName,
                    buddyChallengeCode: challengeCode,
                  },
                }))
              }
              onEmergencyBuddyUnlock={() =>
                persist((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    lockUntilEpochMs: 0,
                    rateLimitCooldownUntilMs: 0,
                  },
                }))
              }
              onUpdateTheme={onUpdateTheme}
              onReplayWelcome={() => setShowWelcome(true)}
              onResetStreak={() => {
                persist((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, protectionStartedAtMs: Date.now() },
                }));
                flashBanner('Clean streak timer restarted from right now.');
              }}
              onOpenDownloadPage={onOpenDownloadPage}
            />
          ) : null}
        </main>
      </div>

      {/* Mobile Bottom 5-Tab Navigation Bar (< lg, 58px height) */}
      <nav
        aria-label="Mobile main navigation"
        data-testid="mobile-bottom-nav"
        className="fixed inset-x-0 bottom-0 z-30 grid h-[58px] grid-cols-5 border-t border-[var(--subtle-border)] bg-[var(--surface)] px-1 lg:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`mobile-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 transition-colors ${
                selected ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
              }`}
            >
              <span
                className={`flex h-7 w-11 items-center justify-center rounded-full ${
                  selected ? 'bg-[var(--active-fill)] text-[var(--active-content)]' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-semibold leading-none">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <CalmResetModal
        open={calmModalOpen}
        blockedTarget={calmBlockedTarget}
        blockedSource={calmBlockedSource}
        cooldownActive={rateLimitStatus.isCooldownActive}
        cooldownFormatted={rateLimitStatus.cooldownFormatted}
        dailyStakeNgn={settings.dailyBetSpendEstimate}
        onClose={() => setCalmModalOpen(false)}
        onBankStake={handleBankStake}
        onOpenResources={() => setActiveTab('resources')}
      />

      <UrgeJournalModal
        open={urgeModalOpen}
        onClose={() => setUrgeModalOpen(false)}
        onSubmit={handleLogUrge}
      />
    </div>
  );
};
