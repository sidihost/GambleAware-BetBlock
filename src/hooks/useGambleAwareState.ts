import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { BlockFilterConfig, BlocklistMatcher, BlockMatchResult } from '../blocker/blocklistMatcher';
import { GamblingCategory } from '../blocker/gamblingCategory';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
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
  CloudAccountInfo,
  CloudSyncStatus,
  DailyBlockStat,
  DerivedMainState,
  InstalledAppInfo,
  ProtectionSettingsState,
  RECOVERY_MILESTONES,
  RecoveryGoalCategory,
  RecoveryGoalEntity,
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
  deleteGoalFromCloud,
  syncSettingsToCloud,
  updatePreferredNameInCloud,
  upsertBlockedAppInCloud,
  upsertCustomDomainInCloud,
  upsertGoalInCloud,
} from '../firebaseSync';
import {
  sanitizeDomainForBlueprint,
  sanitizeEventTarget,
  sanitizeGoalFields,
  sanitizePackageForBlueprint,
  sanitizePreferredName,
  sanitizeUrgeFields,
} from '../firebaseValidation';
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

function formatAuthErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';
  if (code === 'auth/operation-not-allowed') {
    return 'Email sign-in is currently unavailable. Please use Continue with Google below.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'That email or password did not match our records.';
  }
  if (code === 'auth/weak-password') {
    return 'Please choose a password with at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google sign-in window. Allow popups for this site or sign in with email below.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in was closed before finishing.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts right now. Please wait a minute and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error — please check your internet connection and try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Sign-in is not enabled on this preview domain yet. Please use the main app URL.';
  }
  return 'Unable to complete sign-in right now. Please try again.';
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
    }, 3200);
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
        displayName: user.displayName ?? storeRef.current.preferredName ?? 'GambleAware Member',
        photoUrl: user.photoURL ?? null,
        emailVerified: user.emailVerified,
      });

      if (!storeRef.current.preferredName && user.displayName) {
        setStore((prev) => ({
          ...prev,
          preferredName: sanitizePreferredName(user.displayName ?? ''),
        }));
      }

      if (!user.emailVerified) {
        setCloudSyncStatus('local');
        setCloudErrorMsg(null);
        return;
      }

      setCloudSyncStatus('connecting');
      setCloudErrorMsg(null);
      try {
        await bootstrapUserCloudAccount(user, storeRef.current);
        if (activeUidRef.current !== user.uid) return;

        unsubscribeListeners = attachUserCloudListeners(user.uid, {
          onPrivateInfoUpdate: (preferredName) => {
            if (preferredName) {
              setStore((prev) => ({ ...prev, preferredName }));
            }
          },
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
          onGoalsUpdate: (goals) => {
            setStore((prev) => ({ ...prev, goals }));
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

  const signInWithGoogleCloud = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    setCloudSyncStatus('connecting');
    setCloudErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setStatusBannerMessage('Signed in — welcome to GambleAware');
      return { ok: true };
    } catch (err) {
      const msg = formatAuthErrorMessage(err);
      setCloudSyncStatus(activeUidRef.current ? 'error' : 'local');
      if (!(err instanceof Error && err.message.includes('popup-closed-by-user'))) {
        setCloudErrorMsg(msg);
      }
      return { ok: false, error: msg };
    }
  }, []);

  const signUpWithEmailCloud = useCallback(
    async (params: {
      name: string;
      email: string;
      password: string;
    }): Promise<{ ok: boolean; error?: string; verificationSent?: boolean }> => {
      const cleanName = sanitizePreferredName(params.name);
      if (!cleanName) {
        return { ok: false, error: 'Please enter your name so we can personalize your dashboard.' };
      }
      setCloudSyncStatus('connecting');
      setCloudErrorMsg(null);
      setStore((prev) => ({ ...prev, preferredName: cleanName }));
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          params.email.trim(),
          params.password,
        );
        await updateProfile(cred.user, { displayName: cleanName });
        await sendEmailVerification(cred.user).catch(() => {});
        setCloudUser({
          uid: cred.user.uid,
          email: cred.user.email ?? params.email.trim(),
          displayName: cleanName,
          photoUrl: null,
          emailVerified: cred.user.emailVerified,
        });
        setStatusBannerMessage(`Welcome, ${cleanName.split(' ')[0]}! Check your email to verify sync.`);
        return { ok: true, verificationSent: true };
      } catch (err) {
        const msg = formatAuthErrorMessage(err);
        setCloudSyncStatus(activeUidRef.current ? 'error' : 'local');
        setCloudErrorMsg(msg);
        return { ok: false, error: msg };
      }
    },
    [],
  );

  const signInWithEmailCloud = useCallback(
    async (params: {
      email: string;
      password: string;
    }): Promise<{ ok: boolean; error?: string }> => {
      setCloudSyncStatus('connecting');
      setCloudErrorMsg(null);
      try {
        const cred = await signInWithEmailAndPassword(auth, params.email.trim(), params.password);
        const name = cred.user.displayName || storeRef.current.preferredName;
        if (name) {
          setStore((prev) => ({ ...prev, preferredName: sanitizePreferredName(name) }));
        }
        setStatusBannerMessage('Welcome back to GambleAware');
        return { ok: true };
      } catch (err) {
        const msg = formatAuthErrorMessage(err);
        setCloudSyncStatus(activeUidRef.current ? 'error' : 'local');
        setCloudErrorMsg(msg);
        return { ok: false, error: msg };
      }
    },
    [],
  );

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setStatusBannerMessage('Verification link sent to your email');
    } catch (err) {
      setStatusBannerMessage(formatAuthErrorMessage(err));
    }
  }, []);

  const refreshEmailVerification = useCallback(async (): Promise<{ verified: boolean }> => {
    if (!auth.currentUser) return { verified: false };
    try {
      await auth.currentUser.reload();
      const verified = Boolean(auth.currentUser.emailVerified);
      setCloudUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email ?? '',
        displayName:
          auth.currentUser.displayName ?? storeRef.current.preferredName ?? 'GambleAware Member',
        photoUrl: auth.currentUser.photoURL ?? null,
        emailVerified: verified,
      });
      if (verified) {
        setCloudSyncStatus('connecting');
        await bootstrapUserCloudAccount(auth.currentUser, storeRef.current);
        setCloudSyncStatus('synced');
        setLastSyncedAtMs(Date.now());
        setStatusBannerMessage('Email verified — cloud backup is now active');
      } else {
        setStatusBannerMessage('Email not verified yet — check your inbox or spam folder');
      }
      return { verified };
    } catch {
      return { verified: false };
    }
  }, []);

  const sendPasswordReset = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      const cleanEmail = email.trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { ok: false, error: 'Enter your account email address first.' };
      }
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        setStatusBannerMessage('Password reset email sent');
        return { ok: true };
      } catch (err) {
        return { ok: false, error: formatAuthErrorMessage(err) };
      }
    },
    [],
  );

  const signOutGoogleCloud = useCallback(async () => {
    await signOut(auth);
    setCloudSyncStatus('local');
    setCloudErrorMsg(null);
    setStatusBannerMessage('Signed out — on-device protection stays active');
  }, []);

  const setPreferredName = useCallback(
    (name: string) => {
      const clean = sanitizePreferredName(name);
      setStore((prev) => ({ ...prev, preferredName: clean }));
      const uid = activeUidRef.current;
      if (uid && auth.currentUser?.emailVerified) {
        void updatePreferredNameInCloud(
          uid,
          auth.currentUser.email ?? '',
          auth.currentUser.displayName ?? clean,
          clean,
        );
      }
      if (clean) {
        setStatusBannerMessage(`Personalized for ${clean.split(' ')[0]}`);
      }
    },
    [],
  );

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

  const firstName = useMemo(
    () => extractFirstName(store.preferredName, cloudUser?.displayName, cloudUser?.email),
    [store.preferredName, cloudUser?.displayName, cloudUser?.email],
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
    };
  }, [
    store,
    nowMs,
    firstName,
    primaryGoal,
    domainLookupQuery,
    domainLookupResult,
    statusBannerMessage,
  ]);

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

  const setAiAutoBlockEnabled = useCallback(
    (enabled: boolean) => {
      updateSettings((s) => ({ ...s, aiAutoBlockEnabled: enabled }));
      setStatusBannerMessage(
        enabled ? 'GambleAware AI auto-blocking turned on' : 'GambleAware AI auto-blocking paused',
      );
    },
    [updateSettings],
  );

  const setGoalReminderEnabled = useCallback(
    (enabled: boolean) => updateSettings((s) => ({ ...s, goalReminderEnabled: enabled })),
    [updateSettings],
  );

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

      setStore((prev) => {
        const demoted = newGoal.isPrimary
          ? prev.goals.map((g) => ({ ...g, isPrimary: false }))
          : prev.goals;
        const nextGoals = [newGoal, ...demoted];
        return { ...prev, goals: nextGoals };
      });

      const uid = activeUidRef.current;
      if (uid && auth.currentUser?.emailVerified) {
        void upsertGoalInCloud(uid, newGoal);
      }

      if (clean.lockDurationDays > 0) {
        activateTimeLock(clean.lockDurationDays, true);
      }
      setStatusBannerMessage(`Goal created: ${newGoal.title}`);
      return newGoal;
    },
    [activateTimeLock],
  );

  const setPrimaryGoal = useCallback((goalId: string) => {
    let targetGoal: RecoveryGoalEntity | undefined;
    setStore((prev) => {
      const updated = prev.goals.map((g) => {
        const match = g.goalId === goalId;
        const next = { ...g, isPrimary: match };
        if (match) targetGoal = next;
        return next;
      });
      return { ...prev, goals: updated };
    });
    const uid = activeUidRef.current;
    if (uid && auth.currentUser?.emailVerified && targetGoal) {
      void upsertGoalInCloud(uid, targetGoal);
    }
  }, []);

  const toggleGoalCompleted = useCallback((goalId: string) => {
    let updatedGoal: RecoveryGoalEntity | undefined;
    setStore((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.goalId !== goalId) return g;
        updatedGoal = { ...g, isCompleted: !g.isCompleted };
        return updatedGoal;
      }),
    }));
    const uid = activeUidRef.current;
    if (uid && auth.currentUser?.emailVerified && updatedGoal) {
      void upsertGoalInCloud(uid, updatedGoal);
    }
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    setStore((prev) => {
      const remaining = prev.goals.filter((g) => g.goalId !== goalId);
      if (remaining.length > 0 && !remaining.some((g) => g.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return { ...prev, goals: remaining };
    });
    const uid = activeUidRef.current;
    if (uid && auth.currentUser?.emailVerified) {
      void deleteGoalFromCloud(uid, goalId);
    }
    setStatusBannerMessage('Goal removed');
  }, []);

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

  const verifyPin = useCallback(
    (pin: string) => {
      return attemptPin(pin).ok;
    },
    [attemptPin],
  );

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
    (target: string, source: string, category: string) => {
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
    signUpWithEmailCloud,
    signInWithEmailCloud,
    resendVerificationEmail,
    refreshEmailVerification,
    sendPasswordReset,
    signOutGoogleCloud,
    setPreferredName,
    forceSyncNow,
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
    setThemeMode,
    setDailySpendEstimate,
    setNotificationsEnabled,
    setAiAutoBlockEnabled,
    setGoalReminderEnabled,
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
    resetAllData,
    clearBanner,
  };
}
