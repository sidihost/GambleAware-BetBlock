import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { BlockFilterConfig, BlocklistMatcher, BlockMatchResult } from '../blocker/blocklistMatcher';
import { GamblingCategory } from '../blocker/gamblingCategory';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import {
  createDefaultStore,
  hashPinSync,
  loadStore,
  PersistedStore,
  saveStore,
} from '../data/storage';
import {
  BlockedAppEntity,
  BlockedDomainEntity,
  BlockedEventEntity,
  CategoryBreakdown,
  CloudAccountInfo,
  CloudSyncStatus,
  DailyBlockStat,
  DerivedMainState,
  InstalledAppInfo,
  ProtectionSettingsState,
  RECOVERY_MILESTONES,
  ThemeMode,
  TriggerBreakdown,
  UrgeLogEntity,
} from '../data/types';
import { auth, googleProvider } from '../firebase';
import {
  attachUserCloudListeners,
  bootstrapUserCloudAccount,
  clearEventsInCloud,
  createBlockedEventInCloud,
  createUrgeLogInCloud,
  deleteBlockedAppFromCloud,
  deleteCustomDomainFromCloud,
  syncSettingsToCloud,
  upsertBlockedAppInCloud,
  upsertCustomDomainInCloud,
} from '../firebaseSync';
import {
  sanitizeDomainForBlueprint,
  sanitizeEventTarget,
  sanitizePackageForBlueprint,
  sanitizeUrgeFields,
} from '../firebaseValidation';

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
    const cat =
      (Object.values(GamblingCategory) as string[]).includes(ev.categoryName)
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

  const [cloudUser, setCloudUser] = useState<CloudAccountInfo | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('local');
  const [lastSyncedAtMs, setLastSyncedAtMs] = useState<number | null>(null);
  const [cloudErrorMsg, setCloudErrorMsg] = useState<string | null>(null);
  const activeUidRef = useRef<string | null>(null);

  useEffect(() => {
    saveStore(store);
  }, [store]);

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
    }, 3000);
    return () => window.clearTimeout(id);
  }, [statusBannerMessage]);

  // Attach Firebase Auth + Firestore real-time cloud listeners when signed in
  useEffect(() => {
    let unsubscribeListeners: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeListeners) {
        unsubscribeListeners();
        unsubscribeListeners = null;
      }

      if (!user) {
        activeUidRef.current = null;
        setCloudUser(null);
        setCloudSyncStatus('local');
        setCloudErrorMsg(null);
        return;
      }

      activeUidRef.current = user.uid;
      setCloudUser({
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? 'GambleAware Member',
        photoUrl: user.photoURL ?? null,
      });

      if (!user.emailVerified) {
        setCloudSyncStatus('error');
        setCloudErrorMsg('Please verify your Google email to sync data to Cloud Firestore.');
        return;
      }

      setCloudSyncStatus('connecting');
      setCloudErrorMsg(null);
      try {
        await bootstrapUserCloudAccount(user, storeRef.current);
        if (activeUidRef.current !== user.uid) return;

        unsubscribeListeners = attachUserCloudListeners(user.uid, {
          onSettingsUpdate: (patch) => {
            setStore((prev) => ({
              ...prev,
              settings: patch.settings,
              isAccessibilityEnabled: patch.isAccessibilityEnabled,
              isDeviceAdminEnabled: patch.isDeviceAdminEnabled,
              privateDnsStatus: {
                isActive: patch.privateDnsActive,
                serverHost: patch.privateDnsHost,
              },
            }));
            setCloudSyncStatus('synced');
            setLastSyncedAtMs(Date.now());
          },
          onDomainsUpdate: (domains) => {
            setStore((prev) => ({ ...prev, domains }));
            setLastSyncedAtMs(Date.now());
          },
          onBlockedAppsUpdate: (blockedApps) => {
            setStore((prev) => ({ ...prev, blockedApps }));
            setLastSyncedAtMs(Date.now());
          },
          onEventsUpdate: (events) => {
            setStore((prev) => ({ ...prev, events }));
            setLastSyncedAtMs(Date.now());
          },
          onUrgeLogsUpdate: (urgeLogs) => {
            setStore((prev) => ({ ...prev, urgeLogs }));
            setLastSyncedAtMs(Date.now());
          },
        });
        setCloudSyncStatus('synced');
        setLastSyncedAtMs(Date.now());
      } catch (err) {
        setCloudSyncStatus('error');
        setCloudErrorMsg(
          err instanceof Error ? err.message : 'Unable to connect Free Cloud Sync right now.',
        );
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeListeners) unsubscribeListeners();
    };
  }, []);

  const pushSettingsSnapshot = useCallback((nextStore: PersistedStore) => {
    const uid = activeUidRef.current;
    if (!uid || !auth.currentUser?.emailVerified) return;
    void syncSettingsToCloud(uid, nextStore)
      .then(() => {
        setCloudSyncStatus('synced');
        setLastSyncedAtMs(Date.now());
      })
      .catch((err) => {
        setCloudSyncStatus('error');
        setCloudErrorMsg(err instanceof Error ? err.message : 'Cloud sync update failed');
      });
  }, []);

  const signInWithGoogleCloud = useCallback(async () => {
    setCloudSyncStatus('connecting');
    setCloudErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setStatusBannerMessage('Free Cloud Sync connected');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In was cancelled or blocked.';
      setCloudSyncStatus(activeUidRef.current ? 'error' : 'local');
      if (!msg.includes('popup-closed-by-user')) {
        setCloudErrorMsg(msg);
      }
    }
  }, []);

  const signOutGoogleCloud = useCallback(async () => {
    await signOut(auth);
    setCloudSyncStatus('local');
    setCloudErrorMsg(null);
    setStatusBannerMessage('Switched to on-device local storage');
  }, []);

  const forceSyncNow = useCallback(async () => {
    const uid = activeUidRef.current;
    if (!uid || !auth.currentUser?.emailVerified) return;
    setCloudSyncStatus('connecting');
    try {
      await syncSettingsToCloud(uid, storeRef.current);
      setCloudSyncStatus('synced');
      setLastSyncedAtMs(Date.now());
      setStatusBannerMessage('Cloud database synced (₦0 Free Tier)');
    } catch (err) {
      setCloudSyncStatus('error');
      setCloudErrorMsg(err instanceof Error ? err.message : 'Sync failed');
    }
  }, []);

  const filterConfig: BlockFilterConfig = useMemo(
    () => ({
      blockSportsbooks: store.settings.blockSportsbooks,
      blockCasinos: store.settings.blockCasinos,
      blockPokerAndBingo: store.settings.blockPokerAndBingo,
      blockCryptoBetting: store.settings.blockCryptoBetting,
      blockFantasyAndLottery: store.settings.blockFantasyAndLottery,
      strictKeywordFilter: store.settings.strictKeywordFilter,
      searchGuardEnabled: store.settings.searchGuardEnabled,
      customBlockedDomains: new Set(
        store.domains.filter((d) => !d.isAllowlisted).map((d) => d.domain),
      ),
      allowlistedDomains: new Set(
        store.domains.filter((d) => d.isAllowlisted).map((d) => d.domain),
      ),
      customBlockedPackages: new Set(store.blockedApps.map((a) => a.packageName.toLowerCase())),
    }),
    [store.settings, store.domains, store.blockedApps],
  );

  const domainLookupResult: BlockMatchResult | null = useMemo(() => {
    if (!domainLookupQuery.trim()) return null;
    return BlocklistMatcher.matchDomainOrUrl(domainLookupQuery, filterConfig);
  }, [domainLookupQuery, filterConfig]);

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
      isAccessibilityEnabled: store.isAccessibilityEnabled,
      isDeviceAdminEnabled: store.isDeviceAdminEnabled,
      privateDnsStatus: store.privateDnsStatus,
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
    };
  }, [store, nowMs, domainLookupQuery, domainLookupResult, statusBannerMessage]);

  const mutateStoreAndSyncSettings = useCallback(
    (updater: (prev: PersistedStore) => PersistedStore) => {
      setStore((prev) => {
        const next = updater(prev);
        pushSettingsSnapshot(next);
        return next;
      });
    },
    [pushSettingsSnapshot],
  );

  const updateSettings = useCallback(
    (updater: (prev: ProtectionSettingsState) => ProtectionSettingsState) => {
      mutateStoreAndSyncSettings((prev) => ({ ...prev, settings: updater(prev.settings) }));
    },
    [mutateStoreAndSyncSettings],
  );

  const enableProtection = useCallback(() => {
    mutateStoreAndSyncSettings((prev) => ({
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
  }, [mutateStoreAndSyncSettings]);

  const disableProtection = useCallback(() => {
    updateSettings((s) => ({ ...s, isProtectionEnabled: false }));
    setStatusBannerMessage('Protection paused');
  }, [updateSettings]);

  const activateAccessibilityShield = useCallback(() => {
    mutateStoreAndSyncSettings((prev) => ({
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
  }, [mutateStoreAndSyncSettings]);

  const enableDeviceAdmin = useCallback(() => {
    mutateStoreAndSyncSettings((prev) => ({ ...prev, isDeviceAdminEnabled: true }));
    setStatusBannerMessage('Uninstall lock active');
  }, [mutateStoreAndSyncSettings]);

  const deactivateDeviceAdmin = useCallback(() => {
    mutateStoreAndSyncSettings((prev) => ({ ...prev, isDeviceAdminEnabled: false }));
    setStatusBannerMessage('Uninstall lock deactivated');
  }, [mutateStoreAndSyncSettings]);

  const setPrivateDnsHost = useCallback(
    (host: string | null) => {
      const trimmed = host?.trim().slice(0, 253) || null;
      mutateStoreAndSyncSettings((prev) => ({
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
    [mutateStoreAndSyncSettings],
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

  const setThemeMode = useCallback(
    (mode: ThemeMode) => updateSettings((s) => ({ ...s, themeMode: mode })),
    [updateSettings],
  );

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
      if (enabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        void Notification.requestPermission().catch(() => {});
      }
      setStatusBannerMessage(
        enabled ? 'Recovery & Lock alerts enabled' : 'Recovery notifications muted',
      );
    },
    [updateSettings],
  );

  const addCustomDomain = useCallback((rawDomain: string, isAllowlisted: boolean) => {
    const normalized = sanitizeDomainForBlueprint(BlocklistMatcher.normalizeDomain(rawDomain));
    if (!normalized || !normalized.includes('.')) {
      setStatusBannerMessage('Enter a valid domain such as sportybet.com');
      return;
    }
    const entity: BlockedDomainEntity = {
      domain: normalized,
      isAllowlisted,
      categoryName: GamblingCategory.CUSTOM,
      addedAt: Date.now(),
    };
    setStore((prev) => {
      const filtered = prev.domains.filter((d) => d.domain !== normalized);
      return {
        ...prev,
        domains: [entity, ...filtered],
      };
    });
    const uid = activeUidRef.current;
    if (uid && auth.currentUser?.emailVerified) {
      void upsertCustomDomainInCloud(uid, entity);
    }
    setStatusBannerMessage(isAllowlisted ? `Allowlisted ${normalized}` : `Blocked ${normalized}`);
  }, []);

  const removeCustomDomain = useCallback((domain: string) => {
    const normalized = sanitizeDomainForBlueprint(domain);
    setStore((prev) => ({
      ...prev,
      domains: prev.domains.filter((d) => d.domain !== normalized),
    }));
    const uid = activeUidRef.current;
    if (uid && auth.currentUser?.emailVerified) {
      void deleteCustomDomainFromCloud(uid, normalized);
    }
    setStatusBannerMessage(`Removed ${normalized}`);
  }, []);

  const addBlockedApp = useCallback((app: InstalledAppInfo) => {
    const pkg = sanitizePackageForBlueprint(app.packageName.toLowerCase());
    if (!pkg) return;
    const entity: BlockedAppEntity = {
      packageName: pkg,
      appLabel: app.label.slice(0, 80),
      addedAt: Date.now(),
    };
    setStore((prev) => {
      const filtered = prev.blockedApps.filter((a) => a.packageName !== pkg);
      return {
        ...prev,
        blockedApps: [entity, ...filtered],
      };
    });
    const uid = activeUidRef.current;
    if (uid && auth.currentUser?.emailVerified) {
      void upsertBlockedAppInCloud(uid, entity);
    }
    setStatusBannerMessage(`Added ${app.label} to App Guard`);
  }, []);

  const removeBlockedApp = useCallback((packageName: string) => {
    const pkg = sanitizePackageForBlueprint(packageName.toLowerCase());
    setStore((prev) => ({
      ...prev,
      blockedApps: prev.blockedApps.filter((a) => a.packageName !== pkg),
    }));
    const uid = activeUidRef.current;
    if (uid && auth.currentUser?.emailVerified) {
      void deleteBlockedAppFromCloud(uid, pkg);
    }
    setStatusBannerMessage('Removed app rule');
  }, []);

  const activateTimeLock = useCallback(
    (days: number, enableAntiTamper: boolean) => {
      const durationMs = days * 86_400_000;
      const now = Date.now();
      const until = now + durationMs;
      mutateStoreAndSyncSettings((prev) => ({
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
      setStatusBannerMessage(`Commitment Lock active for ${days} day${days === 1 ? '' : 's'}`);
    },
    [mutateStoreAndSyncSettings],
  );

  const setPin = useCallback(
    (pin: string) => {
      if (pin.length === 4 && /^\d{4}$/.test(pin)) {
        updateSettings((s) => ({ ...s, pinHash: hashPinSync(pin) }));
        setStatusBannerMessage('Accountability PIN enabled');
      }
    },
    [updateSettings],
  );

  const verifyPin = useCallback(
    (pin: string) => {
      if (!store.settings.pinHash) return true;
      return store.settings.pinHash === hashPinSync(pin);
    },
    [store.settings.pinHash],
  );

  const clearPin = useCallback(
    (currentPin: string) => {
      if (!verifyPin(currentPin)) return false;
      updateSettings((s) => ({ ...s, pinHash: null }));
      setStatusBannerMessage('Accountability PIN removed');
      return true;
    },
    [verifyPin, updateSettings],
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

  const logUrgeResisted = useCallback((triggerTag: string, note: string) => {
    const clean = sanitizeUrgeFields(triggerTag, note);
    const now = Date.now();
    const newLog: UrgeLogEntity = {
      id: now,
      triggerTag: clean.triggerTag,
      note: clean.note,
      timestamp: now,
    };
    setStore((prev) => ({
      ...prev,
      urgeLogs: [newLog, ...prev.urgeLogs],
    }));
    const uid = activeUidRef.current;
    if (uid && auth.currentUser?.emailVerified) {
      void createUrgeLogInCloud(uid, newLog);
    }
    setStatusBannerMessage(`Urge resisted & logged (${newLog.triggerTag})`);
  }, []);

  const logBlockedEvent = useCallback(
    (target: string, source: string, category: GamblingCategory) => {
      const now = Date.now();
      const ev: BlockedEventEntity = {
        id: now,
        target: sanitizeEventTarget(target),
        source,
        categoryName: category,
        timestamp: now,
      };
      setStore((prev) => ({
        ...prev,
        events: [ev, ...prev.events],
      }));
      const uid = activeUidRef.current;
      if (uid && auth.currentUser?.emailVerified) {
        void createBlockedEventInCloud(uid, ev);
      }
    },
    [],
  );

  const clearEventHistory = useCallback(() => {
    setStore((prev) => ({ ...prev, events: [] }));
    const uid = activeUidRef.current;
    if (uid && auth.currentUser?.emailVerified) {
      void clearEventsInCloud(uid);
    }
    setStatusBannerMessage('Blocked activity log cleared');
  }, []);

  const resetAllData = useCallback(() => {
    setStore(createDefaultStore());
  }, []);

  const clearBanner = useCallback(() => setStatusBannerMessage(null), []);

  return {
    uiState,
    cloudUser,
    cloudSyncStatus,
    lastSyncedAtMs,
    cloudErrorMsg,
    signInWithGoogleCloud,
    signOutGoogleCloud,
    forceSyncNow,
    updateDomainLookupQuery: setDomainLookupQuery,
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
    setThemeMode,
    setDailySpendEstimate,
    setNotificationsEnabled,
    addCustomDomain,
    removeCustomDomain,
    addBlockedApp,
    removeBlockedApp,
    activateTimeLock,
    setPin,
    verifyPin,
    clearPin,
    resetStreak,
    completeTour,
    replayTour,
    logUrgeResisted,
    logBlockedEvent,
    clearEventHistory,
    resetAllData,
    clearBanner,
  };
}
