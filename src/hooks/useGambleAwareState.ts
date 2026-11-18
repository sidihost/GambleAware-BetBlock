import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlockFilterConfig, BlocklistMatcher, BlockMatchResult } from '../blocker/blocklistMatcher';
import { GamblingCategory } from '../blocker/gamblingCategory';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import {
  hydrateFromDurableLayers,
  parseBackupInput,
  persistToAllLayers,
} from '../data/durableVault';
import {
  clearPinAttemptState,
  createDefaultStore,
  getPinLockoutRemainingSec,
  hashPinSync,
  loadStore,
  PersistedStore,
  recordFailedPinAttempt,
  saveStore,
  verifyPinHashSync,
} from '../data/storage';
import {
  BlockedAppEntity,
  BlockedDomainEntity,
  BlockedEventEntity,
  CategoryBreakdown,
  DailyBlockStat,
  DerivedMainState,
  DurableStorageStatus,
  HighRiskScheduleConfig,
  InstalledAppInfo,
  ProtectionSettingsState,
  RECOVERY_MILESTONES,
  RecoveryGoalCategory,
  RecoveryGoalEntity,
  ThemeMode,
  TriggerBreakdown,
  UrgeLogEntity,
} from '../data/types';
import {
  sanitizeDomainForBlueprint,
  sanitizeEventTarget,
  sanitizeGoalFields,
  sanitizePackageForBlueprint,
  sanitizePreferredName,
  sanitizeUrgeFields,
} from '../firebaseValidation';
import { evaluateHighRiskGuard } from '../utils/highRiskGuard';
import { detectGamblingLoginOrSite, extractFirstName } from '../utils/personalization';

function formatTwoDigits(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function buildSevenDayStats(events: BlockedEventEntity[], nowMs: number): DailyBlockStat[] {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const countsByDayKey = new Map<string, number>();

  for (const event of events) {
    const d = new Date(event.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    countsByDayKey.set(key, (countsByDayKey.get(key) ?? 0) + 1);
  }

  const stats: DailyBlockStat[] = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const d = new Date(nowMs - daysAgo * 86_400_000);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const label = daysAgo === 0 ? 'Today' : dayLabels[d.getDay()];
    stats.push({ dayLabel: label, count: countsByDayKey.get(key) ?? 0 });
  }
  return stats;
}

function buildCategoryBreakdown(events: BlockedEventEntity[]): CategoryBreakdown[] {
  if (events.length === 0) return [];
  const counts = new Map<GamblingCategory, number>();
  for (const ev of events) {
    const cat = (Object.values(GamblingCategory) as string[]).includes(ev.categoryName)
      ? (ev.categoryName as GamblingCategory)
      : GamblingCategory.CUSTOM;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

function buildTriggerBreakdown(logs: UrgeLogEntity[]): TriggerBreakdown[] {
  if (logs.length === 0) return [];
  const counts = new Map<string, number>();
  for (const log of logs) {
    counts.set(log.triggerTag, (counts.get(log.triggerTag) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([triggerTag, count]) => ({ triggerTag, count }))
    .sort((a, b) => b.count - a.count);
}

export function useGambleAwareState() {
  const [store, setStore] = useState<PersistedStore>(() => loadStore());
  const storeRef = useRef<PersistedStore>(store);
  storeRef.current = store;

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [domainLookupQuery, setDomainLookupQuery] = useState<string>('');
  const [statusBannerMessage, setStatusBannerMessage] = useState<string | null>(null);
  const [durableStatus, setDurableStatus] = useState<DurableStorageStatus>({
    localSaved: true,
    indexedDbSaved: false,
    cacheVaultSaved: false,
    persistentGranted: null,
    lastSavedAtMs: Date.now(),
  });
  const hydratedRef = useRef(false);

  // Hydrate and auto-heal across LocalStorage, IndexedDB, and CacheStorage on boot
  useEffect(() => {
    let active = true;
    void hydrateFromDurableLayers(storeRef.current).then((res) => {
      if (!active) return;
      hydratedRef.current = true;
      setDurableStatus(res.status);
      if (res.restoredStore) {
        setStore(res.restoredStore);
        setStatusBannerMessage('Protection state auto-restored from Recovery Vault');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist every update across LocalStorage + IndexedDB + CacheStorage
  useEffect(() => {
    saveStore(store);
    if (!hydratedRef.current) return;
    let active = true;
    void persistToAllLayers(store, durableStatus.persistentGranted).then((nextStatus) => {
      if (active) setDurableStatus(nextStatus);
    });
    return () => {
      active = false;
    };
  }, [store, durableStatus.persistentGranted]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!statusBannerMessage) return;
    const id = window.setTimeout(() => {
      setStatusBannerMessage(null);
    }, 3200);
    return () => window.clearTimeout(id);
  }, [statusBannerMessage]);

  const mutateStore = useCallback((updater: (prev: PersistedStore) => PersistedStore) => {
    setStore((prev) => {
      const next = updater(prev);
      return {
        ...next,
        schemaVersion: 4,
        updatedAtMs: Date.now(),
      };
    });
  }, []);

  const setPreferredName = useCallback(
    (name: string) => {
      const clean = sanitizePreferredName(name);
      mutateStore((prev) => ({ ...prev, preferredName: clean }));
      if (clean) {
        setStatusBannerMessage(`Personalized for ${clean.split(' ')[0]}`);
      } else {
        setStatusBannerMessage('Name cleared');
      }
    },
    [mutateStore],
  );

  const highRiskStatus = useMemo(
    () => evaluateHighRiskGuard(store.settings.highRiskSchedule, nowMs),
    [store.settings.highRiskSchedule, nowMs],
  );

  const filterConfig: BlockFilterConfig = useMemo(
    () => ({
      blockSportsbooks: store.settings.blockSportsbooks,
      blockCasinos: store.settings.blockCasinos,
      blockPokerAndBingo: store.settings.blockPokerAndBingo,
      blockCryptoBetting: store.settings.blockCryptoBetting,
      blockFantasyAndLottery: store.settings.blockFantasyAndLottery,
      strictKeywordFilter: store.settings.strictKeywordFilter || highRiskStatus.isActive,
      searchGuardEnabled: store.settings.searchGuardEnabled || highRiskStatus.isActive,
      customBlockedDomains: new Set(
        store.domains.filter((d) => !d.isAllowlisted).map((d) => d.domain),
      ),
      allowlistedDomains: new Set(
        store.domains.filter((d) => d.isAllowlisted).map((d) => d.domain),
      ),
      customBlockedPackages: new Set(store.blockedApps.map((a) => a.packageName.toLowerCase())),
    }),
    [store.settings, store.domains, store.blockedApps, highRiskStatus.isActive],
  );

  const domainLookupResult: BlockMatchResult | null = useMemo(() => {
    if (!domainLookupQuery.trim()) return null;
    return BlocklistMatcher.matchTypedBrowserInput(domainLookupQuery, filterConfig);
  }, [domainLookupQuery, filterConfig]);

  const firstName = useMemo(
    () => extractFirstName(store.preferredName, null, null),
    [store.preferredName],
  );

  const primaryGoal = useMemo(
    () => store.goals.find((g) => g.isPrimary) ?? store.goals[0] ?? null,
    [store.goals],
  );

  const uiState: DerivedMainState = useMemo(() => {
    const { settings } = store;
    const isFullyArmed = settings.isProtectionEnabled && store.isAccessibilityEnabled;
    const isTimeLockedNow = settings.lockUntilEpochMs > nowMs;
    const hasPin = Boolean(settings.pinHash);
    const isAnyLockActive = isTimeLockedNow || hasPin;
    const remainingLockMsNow = Math.max(0, settings.lockUntilEpochMs - nowMs);
    const totalSec = Math.floor(remainingLockMsNow / 1000);
    const lockDays = Math.floor(totalSec / 86400);
    const lockHours = Math.floor((totalSec % 86400) / 3600);
    const lockMinutes = Math.floor((totalSec % 3600) / 60);
    const lockSeconds = totalSec % 60;

    const lockCountdownFormatted =
      remainingLockMsNow <= 0
        ? '00d 00h 00m 00s'
        : `${formatTwoDigits(lockDays)}d ${formatTwoDigits(lockHours)}h ${formatTwoDigits(lockMinutes)}m ${formatTwoDigits(lockSeconds)}s`;

    const lockClockQuad = [
      { digits: formatTwoDigits(lockDays), unit: 'DAYS' },
      { digits: formatTwoDigits(lockHours), unit: 'HRS' },
      { digits: formatTwoDigits(lockMinutes), unit: 'MIN' },
      { digits: formatTwoDigits(lockSeconds), unit: 'SEC' },
    ];

    const cleanElapsedMs =
      settings.isProtectionEnabled && settings.protectionStartedAtMs > 0
        ? Math.max(0, nowMs - settings.protectionStartedAtMs)
        : 0;
    const cleanExactDays = cleanElapsedMs / 86_400_000;
    const cleanDays = Math.floor(cleanExactDays);
    const cleanHoursRemainder = Math.floor((cleanElapsedMs / 3_600_000) % 24);
    const cleanMinutesRemainder = Math.floor((cleanElapsedMs / 60_000) % 60);
    const cleanSecondsRemainder = Math.floor((cleanElapsedMs / 1000) % 60);

    const nextMilestone =
      RECOVERY_MILESTONES.find((m) => m.days > cleanDays) ??
      RECOVERY_MILESTONES[RECOVERY_MILESTONES.length - 1];
    const milestoneProgressFraction = Math.min(
      1,
      Math.max(0, cleanExactDays / Math.max(1, nextMilestone.days)),
    );
    const estimatedSavedAmount = Math.floor(cleanExactDays * settings.dailyBetSpendEstimate);

    const todayStart = new Date(nowMs);
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    const sevenDaysAgoMs = nowMs - 7 * 86_400_000;

    const todayBlockedCount = store.events.filter((e) => e.timestamp >= todayStartMs).length;
    const lastSevenDaysEvents = store.events.filter((e) => e.timestamp >= sevenDaysAgoMs);

    return {
      settings,
      preferredName: store.preferredName,
      firstName,
      isAccessibilityEnabled: store.isAccessibilityEnabled,
      isDeviceAdminEnabled: store.isDeviceAdminEnabled,
      privateDnsStatus: store.privateDnsStatus,
      goals: store.goals,
      primaryGoal,
      customBlockedDomains: store.domains.filter((d) => !d.isAllowlisted),
      allowlistedDomains: store.domains.filter((d) => d.isAllowlisted),
      customBlockedApps: store.blockedApps,
      recentEvents: store.events,
      recentUrgeLogs: store.urgeLogs,
      totalBlockedCount: store.events.length,
      todayBlockedCount,
      totalUrgeResistedCount: store.urgeLogs.length,
      sevenDayStats: buildSevenDayStats(lastSevenDaysEvents, nowMs),
      categoryBreakdown: buildCategoryBreakdown(store.events),
      triggerBreakdown: buildTriggerBreakdown(store.urgeLogs),
      domainLookupQuery,
      domainLookupResult,
      statusBannerMessage,
      builtInDomainCount: GamblingRegistry.domainToCategory.size,
      currentTimeMs: nowMs,
      isFullyArmed,
      isTimeLockedNow,
      isAnyLockActive,
      hasPin,
      remainingLockMsNow,
      lockCountdownFormatted,
      lockClockQuad,
      cleanElapsedMs,
      cleanExactDays,
      cleanDays,
      cleanHoursRemainder,
      cleanMinutesRemainder,
      cleanSecondsRemainder,
      nextMilestone,
      milestoneProgressFraction,
      estimatedSavedAmount,
      highRiskStatus,
      durableStatus,
    };
  }, [
    store,
    nowMs,
    firstName,
    primaryGoal,
    domainLookupQuery,
    domainLookupResult,
    statusBannerMessage,
    highRiskStatus,
    durableStatus,
  ]);

  const updateSettings = useCallback(
    (updater: (prev: ProtectionSettingsState) => ProtectionSettingsState) => {
      mutateStore((prev) => ({ ...prev, settings: updater(prev.settings) }));
    },
    [mutateStore],
  );

  const enableProtection = useCallback(() => {
    mutateStore((prev) => ({
      ...prev,
      isAccessibilityEnabled: true,
      settings: {
        ...prev.settings,
        isProtectionEnabled: true,
        protectionStartedAtMs:
          prev.settings.protectionStartedAtMs > 0 ? prev.settings.protectionStartedAtMs : Date.now(),
      },
    }));
    setStatusBannerMessage('GambleAware protection active');
  }, [mutateStore]);

  const disableProtection = useCallback(() => {
    updateSettings((s) => ({ ...s, isProtectionEnabled: false }));
    setStatusBannerMessage('Protection paused');
  }, [updateSettings]);

  const activateAccessibilityShield = useCallback(() => {
    mutateStore((prev) => ({
      ...prev,
      isAccessibilityEnabled: true,
      settings: {
        ...prev.settings,
        isProtectionEnabled: true,
        protectionStartedAtMs:
          prev.settings.protectionStartedAtMs > 0 ? prev.settings.protectionStartedAtMs : Date.now(),
      },
    }));
    setStatusBannerMessage('Web, Search & App guard active');
  }, [mutateStore]);

  const enableDeviceAdmin = useCallback(() => {
    mutateStore((prev) => ({
      ...prev,
      isDeviceAdminEnabled: true,
      isAccessibilityEnabled: true,
      settings: {
        ...prev.settings,
        isProtectionEnabled: true,
        antiTamperLockEnabled: true,
        protectionStartedAtMs:
          prev.settings.protectionStartedAtMs > 0 ? prev.settings.protectionStartedAtMs : Date.now(),
      },
    }));
    setStatusBannerMessage('Uninstall & Admin lock active');
  }, [mutateStore]);

  const deactivateDeviceAdmin = useCallback(() => {
    if (
      storeRef.current.settings.lockUntilEpochMs > Date.now() ||
      storeRef.current.settings.antiTamperLockEnabled
    ) {
      setStatusBannerMessage('Uninstall Lock stays armed until your Commitment Lock ends');
      return;
    }
    mutateStore((prev) => ({ ...prev, isDeviceAdminEnabled: false }));
    setStatusBannerMessage('Uninstall lock deactivated');
  }, [mutateStore]);

  const setPrivateDnsHost = useCallback(
    (host: string | null) => {
      const trimmed = host?.trim().slice(0, 253) || null;
      mutateStore((prev) => ({
        ...prev,
        privateDnsStatus: {
          isActive: Boolean(trimmed),
          serverHost: trimmed,
        },
      }));
      setStatusBannerMessage(
        trimmed ? `Private DNS configured (${trimmed})` : 'Private DNS set to Automatic',
      );
    },
    [mutateStore],
  );

  const updateCategory = useCallback(
    (category: GamblingCategory, enabled: boolean) => {
      updateSettings((s) => {
        switch (category) {
          case GamblingCategory.SPORTSBOOK:
            return { ...s, blockSportsbooks: enabled };
          case GamblingCategory.CASINO:
            return { ...s, blockCasinos: enabled };
          case GamblingCategory.POKER_BINGO:
            return { ...s, blockPokerAndBingo: enabled };
          case GamblingCategory.CRYPTO_BETTING:
            return { ...s, blockCryptoBetting: enabled };
          case GamblingCategory.FANTASY_LOTTERY:
            return { ...s, blockFantasyAndLottery: enabled };
          default:
            return s;
        }
      });
    },
    [updateSettings],
  );

  const setStrictKeywordFilter = useCallback(
    (enabled: boolean) => updateSettings((s) => ({ ...s, strictKeywordFilter: enabled })),
    [updateSettings],
  );

  const setBrowserShieldEnabled = useCallback(
    (enabled: boolean) => updateSettings((s) => ({ ...s, browserShieldEnabled: enabled })),
    [updateSettings],
  );

  const setAppShieldEnabled = useCallback(
    (enabled: boolean) => updateSettings((s) => ({ ...s, appShieldEnabled: enabled })),
    [updateSettings],
  );

  const setSearchGuardEnabled = useCallback(
    (enabled: boolean) => updateSettings((s) => ({ ...s, searchGuardEnabled: enabled })),
    [updateSettings],
  );

  const setAntiTamperEnabled = useCallback(
    (enabled: boolean) => updateSettings((s) => ({ ...s, antiTamperLockEnabled: enabled })),
    [updateSettings],
  );

  const setHighRiskScheduleFlag = useCallback(
    (key: keyof HighRiskScheduleConfig, enabled: boolean) => {
      updateSettings((s) => ({
        ...s,
        highRiskSchedule: {
          ...s.highRiskSchedule,
          [key]: enabled,
        },
      }));
      setStatusBannerMessage(enabled ? 'High-risk window guard armed' : 'Schedule window paused');
    },
    [updateSettings],
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => updateSettings((s) => ({ ...s, themeMode: mode })),
    [updateSettings],
  );

  const toggleQuickTheme = useCallback(() => {
    const isCurrentlyDark =
      storeRef.current.settings.themeMode === ThemeMode.DARK ||
      (storeRef.current.settings.themeMode === ThemeMode.SYSTEM &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    const nextMode = isCurrentlyDark ? ThemeMode.LIGHT : ThemeMode.DARK;
    updateSettings((s) => ({ ...s, themeMode: nextMode }));
    setStatusBannerMessage(
      nextMode === ThemeMode.DARK ? 'Switched to Black & Pink theme' : 'Switched to Crisp White theme',
    );
  }, [updateSettings]);

  const setDailySpendEstimate = useCallback(
    (amount: number) =>
      updateSettings((s) => ({
        ...s,
        dailyBetSpendEstimate: Math.max(0, Math.min(10_000_000, amount)),
      })),
    [updateSettings],
  );

  const setNotificationsEnabled = useCallback(
    (enabled: boolean) => {
      updateSettings((s) => ({ ...s, notificationsEnabled: enabled }));
      if (
        enabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        void Notification.requestPermission().catch(() => {});
      }
      setStatusBannerMessage(
        enabled ? 'Recovery & Lock alerts enabled' : 'Recovery notifications muted',
      );
    },
    [updateSettings],
  );

  const setGoalReminderEnabled = useCallback(
    (enabled: boolean) => updateSettings((s) => ({ ...s, goalReminderEnabled: enabled })),
    [updateSettings],
  );

  const completeInitialSetup = useCallback(
    (params: { preferredName: string; lockDays: number; dailySpendNgn: number }) => {
      const cleanName = sanitizePreferredName(params.preferredName);
      const safeDays = Math.max(1, Math.min(730, Math.round(params.lockDays || 7)));
      const safeSpend = Math.max(0, Math.min(10_000_000, Math.round(params.dailySpendNgn || 5000)));
      const now = Date.now();
      const until = now + safeDays * 86_400_000;
      mutateStore((prev) => ({
        ...prev,
        preferredName: cleanName || prev.preferredName,
        isAccessibilityEnabled: true,
        isDeviceAdminEnabled: true,
        settings: {
          ...prev.settings,
          isProtectionEnabled: true,
          antiTamperLockEnabled: true,
          hasCompletedInitialSetup: true,
          hasCompletedTour: true,
          dailyBetSpendEstimate: safeSpend,
          lockUntilEpochMs: Math.max(prev.settings.lockUntilEpochMs, until),
          protectionStartedAtMs:
            prev.settings.protectionStartedAtMs > 0 ? prev.settings.protectionStartedAtMs : now,
        },
      }));
      const spanLabel =
        safeDays === 1
          ? '24 hours'
          : safeDays === 180
            ? '6 months'
            : safeDays === 365
              ? '1 year'
              : safeDays === 730
                ? '2 years'
                : `${safeDays} days`;
      setStatusBannerMessage(
        cleanName
          ? `Locked for ${spanLabel} — welcome, ${cleanName.split(' ')[0]}`
          : `Protection & Admin Lock armed for ${spanLabel}`,
      );
    },
    [mutateStore],
  );

  const activateTimeLock = useCallback(
    (days: number, enableAntiTamper: boolean) => {
      const safeDays = Math.max(1, Math.min(730, Math.round(days || 7)));
      const durationMs = safeDays * 86_400_000;
      const now = Date.now();
      const until = now + durationMs;
      mutateStore((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          lockUntilEpochMs: Math.max(prev.settings.lockUntilEpochMs, until),
          isProtectionEnabled: true,
          antiTamperLockEnabled: enableAntiTamper ? true : prev.settings.antiTamperLockEnabled,
          protectionStartedAtMs:
            prev.settings.protectionStartedAtMs > 0 ? prev.settings.protectionStartedAtMs : now,
        },
      }));
      const spanLabel =
        safeDays === 1
          ? '24 hours'
          : safeDays === 180
            ? '6 months'
            : safeDays === 365
              ? '1 year'
              : safeDays === 730
                ? '2 years'
                : `${safeDays} days`;
      setStatusBannerMessage(`Commitment Lock active for ${spanLabel}`);
    },
    [mutateStore],
  );

  const createGoal = useCallback(
    (input: {
      title: string;
      category: RecoveryGoalCategory;
      targetDays: number;
      targetAmountNgn: number;
      whyNote: string;
      lockDurationDays: number;
      isPrimary?: boolean;
    }): RecoveryGoalEntity => {
      const clean = sanitizeGoalFields(input);
      const now = Date.now();
      const newGoal: RecoveryGoalEntity = {
        goalId: `goal_${now}`,
        title: clean.title,
        category: clean.category,
        targetDays: clean.targetDays,
        targetAmountNgn: clean.targetAmountNgn,
        whyNote: clean.whyNote,
        isPrimary: input.isPrimary ?? true,
        isCompleted: false,
        lockDurationDays: clean.lockDurationDays,
        createdAtMs: now,
      };

      mutateStore((prev) => {
        const demoted = newGoal.isPrimary
          ? prev.goals.map((g) => ({ ...g, isPrimary: false }))
          : prev.goals;
        return { ...prev, goals: [newGoal, ...demoted] };
      });

      if (clean.lockDurationDays > 0) {
        activateTimeLock(clean.lockDurationDays, true);
      }
      setStatusBannerMessage(`Goal created: ${newGoal.title}`);
      return newGoal;
    },
    [activateTimeLock, mutateStore],
  );

  const setPrimaryGoal = useCallback(
    (goalId: string) => {
      mutateStore((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => ({ ...g, isPrimary: g.goalId === goalId })),
      }));
    },
    [mutateStore],
  );

  const toggleGoalCompleted = useCallback(
    (goalId: string) => {
      mutateStore((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.goalId === goalId ? { ...g, isCompleted: !g.isCompleted } : g,
        ),
      }));
    },
    [mutateStore],
  );

  const deleteGoal = useCallback(
    (goalId: string) => {
      mutateStore((prev) => {
        const remaining = prev.goals.filter((g) => g.goalId !== goalId);
        if (remaining.length > 0 && !remaining.some((g) => g.isPrimary)) {
          remaining[0] = { ...remaining[0], isPrimary: true };
        }
        return { ...prev, goals: remaining };
      });
      setStatusBannerMessage('Goal removed');
    },
    [mutateStore],
  );

  const addCustomDomain = useCallback(
    (rawDomain: string, isAllowlisted: boolean) => {
      const normalized = sanitizeDomainForBlueprint(BlocklistMatcher.normalizeDomain(rawDomain));
      if (!normalized || !normalized.includes('.')) {
        setStatusBannerMessage('Enter a valid website domain');
        return;
      }
      const entity: BlockedDomainEntity = {
        domain: normalized,
        isAllowlisted,
        categoryName: GamblingCategory.CUSTOM,
        addedAt: Date.now(),
      };
      mutateStore((prev) => ({
        ...prev,
        domains: [entity, ...prev.domains.filter((d) => d.domain !== normalized)],
      }));
      setStatusBannerMessage(isAllowlisted ? `Allowlisted ${normalized}` : `Blocked ${normalized}`);
    },
    [mutateStore],
  );

  const removeCustomDomain = useCallback(
    (domain: string) => {
      const normalized = sanitizeDomainForBlueprint(domain);
      mutateStore((prev) => ({
        ...prev,
        domains: prev.domains.filter((d) => d.domain !== normalized),
      }));
      setStatusBannerMessage(`Removed ${normalized}`);
    },
    [mutateStore],
  );

  const addBlockedApp = useCallback(
    (app: InstalledAppInfo) => {
      const pkg = sanitizePackageForBlueprint(app.packageName.toLowerCase());
      if (!pkg) return;
      const entity: BlockedAppEntity = {
        packageName: pkg,
        appLabel: app.label.slice(0, 80),
        addedAt: Date.now(),
      };
      mutateStore((prev) => ({
        ...prev,
        blockedApps: [entity, ...prev.blockedApps.filter((a) => a.packageName !== pkg)],
      }));
      setStatusBannerMessage(`Added ${app.label} to App Guard`);
    },
    [mutateStore],
  );

  const removeBlockedApp = useCallback(
    (packageName: string) => {
      const pkg = sanitizePackageForBlueprint(packageName.toLowerCase());
      mutateStore((prev) => ({
        ...prev,
        blockedApps: prev.blockedApps.filter((a) => a.packageName !== pkg),
      }));
      setStatusBannerMessage('Removed app rule');
    },
    [mutateStore],
  );

  const setPin = useCallback(
    (pin: string) => {
      if (pin.length === 4 && /^\d{4}$/.test(pin)) {
        clearPinAttemptState();
        updateSettings((s) => ({ ...s, pinHash: hashPinSync(pin) }));
        setStatusBannerMessage('Accountability PIN enabled');
      }
    },
    [updateSettings],
  );

  const attemptPin = useCallback(
    (pin: string): { ok: boolean; error?: string; lockedForSec?: number } => {
      if (!store.settings.pinHash) return { ok: true };
      const lockoutSec = getPinLockoutRemainingSec();
      if (lockoutSec > 0) {
        return {
          ok: false,
          lockedForSec: lockoutSec,
          error: `Too many wrong attempts. Try again in ${lockoutSec}s.`,
        };
      }
      if (verifyPinHashSync(pin, store.settings.pinHash)) {
        clearPinAttemptState();
        return { ok: true };
      }
      const res = recordFailedPinAttempt();
      if (res.lockedForSec > 0) {
        return {
          ok: false,
          lockedForSec: res.lockedForSec,
          error: `Too many wrong attempts. Locked for ${res.lockedForSec}s.`,
        };
      }
      return {
        ok: false,
        error: `Incorrect PIN (${res.attemptsLeft} attempt${res.attemptsLeft === 1 ? '' : 's'} left)`,
      };
    },
    [store.settings.pinHash],
  );

  const verifyPin = useCallback((pin: string) => attemptPin(pin).ok, [attemptPin]);

  const clearPin = useCallback(
    (currentPin: string) => {
      if (!verifyPinHashSync(currentPin, store.settings.pinHash)) return false;
      clearPinAttemptState();
      updateSettings((s) => ({ ...s, pinHash: null }));
      setStatusBannerMessage('Accountability PIN removed');
      return true;
    },
    [store.settings.pinHash, updateSettings],
  );

  const resetStreak = useCallback(() => {
    updateSettings((s) => ({
      ...s,
      protectionStartedAtMs: Date.now(),
      lastNotifiedMilestoneDay: 0,
    }));
    setStatusBannerMessage('Clean streak restarted');
  }, [updateSettings]);

  const completeTour = useCallback(() => {
    updateSettings((s) => ({ ...s, hasCompletedTour: true }));
  }, [updateSettings]);

  const replayTour = useCallback(() => {
    updateSettings((s) => ({ ...s, hasCompletedTour: false }));
  }, [updateSettings]);

  const logUrgeResisted = useCallback(
    (triggerTag: string, note: string) => {
      const clean = sanitizeUrgeFields(triggerTag, note);
      const now = Date.now();
      const newLog: UrgeLogEntity = {
        id: now,
        triggerTag: clean.triggerTag,
        note: clean.note,
        timestamp: now,
      };
      mutateStore((prev) => ({
        ...prev,
        urgeLogs: [newLog, ...prev.urgeLogs],
      }));
      setStatusBannerMessage(`Urge resisted & logged (${newLog.triggerTag})`);
    },
    [mutateStore],
  );

  const logBlockedEvent = useCallback(
    (target: string, source: string, category: string) => {
      const now = Date.now();
      const ev: BlockedEventEntity = {
        id: now,
        target: sanitizeEventTarget(target),
        source,
        categoryName: category,
        timestamp: now,
      };
      mutateStore((prev) => ({
        ...prev,
        events: [ev, ...prev.events],
      }));
    },
    [mutateStore],
  );

  const checkGamblingLoginAttempt = useCallback(
    (rawInput: string) => {
      if (!storeRef.current.settings.isProtectionEnabled) {
        return { intercepted: false as const };
      }
      const detection = detectGamblingLoginOrSite(rawInput, filterConfig);
      if (!detection.isBlocked) {
        return { intercepted: false as const };
      }
      const targetLabel = detection.match.matchedTarget || detection.normalizedHost || rawInput;
      logBlockedEvent(targetLabel, 'Web Shield', detection.match.category);
      return {
        intercepted: true as const,
        target: targetLabel,
        category: detection.match.category,
        isGamblingLogin: detection.isGamblingLogin,
        reason: detection.match.reason,
      };
    },
    [filterConfig, logBlockedEvent],
  );

  const clearEventHistory = useCallback(() => {
    mutateStore((prev) => ({ ...prev, events: [] }));
    setStatusBannerMessage('Blocked activity log cleared');
  }, [mutateStore]);

  const restoreFromVaultBackup = useCallback(
    (rawKeyOrJson: string): { ok: boolean; error?: string } => {
      const parsed = parseBackupInput(rawKeyOrJson);
      if (!parsed) {
        return {
          ok: false,
          error: 'Invalid Recovery Key or backup file. Check that you pasted the full GA1 key.',
        };
      }
      const stamped: PersistedStore = { ...parsed, updatedAtMs: Date.now() };
      setStore(stamped);
      void persistToAllLayers(stamped, durableStatus.persistentGranted).then(setDurableStatus);
      setStatusBannerMessage('Restored 100% of streak, goals & rules from Recovery Vault');
      return { ok: true };
    },
    [durableStatus.persistentGranted],
  );

  const forceBackupSync = useCallback(async () => {
    const status = await persistToAllLayers(storeRef.current, durableStatus.persistentGranted);
    setDurableStatus(status);
    setStatusBannerMessage('Vault snapshot saved across Local, IndexedDB & Cache');
  }, [durableStatus.persistentGranted]);

  const resetAllData = useCallback(() => {
    setStore(createDefaultStore());
  }, []);

  const clearBanner = useCallback(() => setStatusBannerMessage(null), []);

  return {
    store,
    uiState,
    setPreferredName,
    updateDomainLookupQuery: setDomainLookupQuery,
    checkGamblingLoginAttempt,
    enableProtection,
    disableProtection,
    activateAccessibilityShield,
    enableDeviceAdmin,
    deactivateDeviceAdmin,
    setPrivateDnsHost,
    updateCategory,
    setStrictKeywordFilter,
    setBrowserShieldEnabled,
    setAppShieldEnabled,
    setSearchGuardEnabled,
    setAntiTamperEnabled,
    setHighRiskScheduleFlag,
    setThemeMode,
    toggleQuickTheme,
    setDailySpendEstimate,
    setNotificationsEnabled,
    setGoalReminderEnabled,
    completeInitialSetup,
    createGoal,
    setPrimaryGoal,
    toggleGoalCompleted,
    deleteGoal,
    addCustomDomain,
    removeCustomDomain,
    addBlockedApp,
    removeBlockedApp,
    activateTimeLock,
    setPin,
    attemptPin,
    verifyPin,
    clearPin,
    resetStreak,
    completeTour,
    replayTour,
    logUrgeResisted,
    logBlockedEvent,
    clearEventHistory,
    restoreFromVaultBackup,
    forceBackupSync,
    resetAllData,
    clearBanner,
  };
}
