import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { PersistedStore } from './data/storage';
import {
  BlockedAppEntity,
  BlockedDomainEntity,
  BlockedEventEntity,
  ProtectionSettingsState,
  RecoveryGoalEntity,
  ThemeMode,
  UrgeLogEntity,
} from './data/types';
import { OperationType, db, handleFirestoreError } from './firebase';
import {
  BLUEPRINT_LIMITS,
  isValidFirestoreDocId,
  sanitizeDomainForBlueprint,
  sanitizeEventTarget,
  sanitizeGoalFields,
  sanitizePackageForBlueprint,
  sanitizePreferredName,
  sanitizeUrgeFields,
  toSafeFirestoreDocId,
} from './firebaseValidation';

function buildSettingsPayloadFields(uid: string, store: PersistedStore) {
  const s = store.settings;
  return {
    ownerId: uid,
    isProtectionEnabled: Boolean(s.isProtectionEnabled),
    blockSportsbooks: Boolean(s.blockSportsbooks),
    blockCasinos: Boolean(s.blockCasinos),
    blockPokerAndBingo: Boolean(s.blockPokerAndBingo),
    blockCryptoBetting: Boolean(s.blockCryptoBetting),
    blockFantasyAndLottery: Boolean(s.blockFantasyAndLottery),
    strictKeywordFilter: Boolean(s.strictKeywordFilter),
    browserShieldEnabled: Boolean(s.browserShieldEnabled),
    appShieldEnabled: Boolean(s.appShieldEnabled),
    searchGuardEnabled: Boolean(s.searchGuardEnabled),
    antiTamperLockEnabled: Boolean(s.antiTamperLockEnabled),
    lockUntilEpochMs: Math.max(0, Math.floor(s.lockUntilEpochMs || 0)),
    pinHash: (s.pinHash ?? '').slice(0, BLUEPRINT_LIMITS.pinHashMaxLength),
    protectionStartedAtMs: Math.max(0, Math.floor(s.protectionStartedAtMs || 0)),
    dailyBetSpendEstimate: Math.max(
      0,
      Math.min(BLUEPRINT_LIMITS.maxDailyBetSpendNgn, Math.floor(s.dailyBetSpendEstimate || 0)),
    ),
    themeMode: Object.values(ThemeMode).includes(s.themeMode) ? s.themeMode : ThemeMode.LIGHT,
    hasCompletedTour: Boolean(s.hasCompletedTour),
    notificationsEnabled: Boolean(s.notificationsEnabled),
    lastNotifiedMilestoneDay: Math.max(
      0,
      Math.min(36500, Math.floor(s.lastNotifiedMilestoneDay || 0)),
    ),
    aiAutoBlockEnabled: Boolean(s.aiAutoBlockEnabled),
    goalReminderEnabled: Boolean(s.goalReminderEnabled),
    isAccessibilityEnabled: Boolean(store.isAccessibilityEnabled),
    isDeviceAdminEnabled: Boolean(store.isDeviceAdminEnabled),
    privateDnsActive: Boolean(store.privateDnsStatus.isActive),
    privateDnsHost: (store.privateDnsStatus.serverHost ?? '').slice(
      0,
      BLUEPRINT_LIMITS.privateDnsHostMaxLength,
    ),
  };
}

export async function bootstrapUserCloudAccount(
  user: User,
  localStore: PersistedStore,
): Promise<{ hydratedFromCloud: boolean }> {
  const uid = user.uid;
  const userAnchorPath = `users/${uid}`;
  const privateAccountPath = `users/${uid}/private/account`;
  const settingsPath = `users/${uid}/profile/settings`;

  const userDocRef = doc(db, 'users', uid);
  try {
    const anchorSnap = await getDoc(userDocRef);
    if (!anchorSnap.exists()) {
      await setDoc(userDocRef, {
        ownerId: uid,
        planTier: 'free',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userDocRef, {
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userAnchorPath);
  }

  const privateDocRef = doc(db, 'users', uid, 'private', 'account');
  try {
    const privateSnap = await getDoc(privateDocRef);
    const safeEmail = (user.email ?? 'user@gambleaware.local').slice(
      0,
      BLUEPRINT_LIMITS.emailMaxLength,
    );
    const safeDisplayName = (user.displayName ?? localStore.preferredName ?? '').slice(
      0,
      BLUEPRINT_LIMITS.displayNameMaxLength,
    );
    const safePreferredName = sanitizePreferredName(
      localStore.preferredName || (privateSnap.exists() ? String(privateSnap.data().preferredName ?? '') : '') || safeDisplayName.split(/\s+/)[0] || '',
    );
    if (!privateSnap.exists()) {
      await setDoc(privateDocRef, {
        ownerId: uid,
        email: safeEmail,
        displayName: safeDisplayName,
        preferredName: safePreferredName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(privateDocRef, {
        email: safeEmail,
        displayName: safeDisplayName,
        preferredName: safePreferredName,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privateAccountPath);
  }

  const settingsDocRef = doc(db, 'users', uid, 'profile', 'settings');
  let hydratedFromCloud = false;
  try {
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, {
        ...buildSettingsPayloadFields(uid, localStore),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const batch = writeBatch(db);
      for (const goal of localStore.goals.slice(0, 25)) {
        const cleanId = toSafeFirestoreDocId(goal.goalId);
        if (!isValidFirestoreDocId(cleanId)) continue;
        const cleanFields = sanitizeGoalFields(goal);
        const goalRef = doc(db, 'users', uid, 'goals', cleanId);
        batch.set(goalRef, {
          ownerId: uid,
          goalId: cleanId,
          ...cleanFields,
          isPrimary: Boolean(goal.isPrimary),
          isCompleted: Boolean(goal.isCompleted),
          createdAtMs: Math.max(1, Math.floor(goal.createdAtMs || Date.now())),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const domainItem of localStore.domains) {
        const cleanDomain = sanitizeDomainForBlueprint(domainItem.domain);
        if (!BLUEPRINT_LIMITS.domainPattern.test(cleanDomain)) continue;
        const domainRef = doc(db, 'users', uid, 'domains', toSafeFirestoreDocId(cleanDomain));
        batch.set(domainRef, {
          ownerId: uid,
          domain: cleanDomain,
          isAllowlisted: Boolean(domainItem.isAllowlisted),
          categoryName: (domainItem.categoryName || 'CUSTOM').slice(
            0,
            BLUEPRINT_LIMITS.categoryNameMaxLength,
          ),
          addedAt: Math.max(0, Math.floor(domainItem.addedAt || Date.now())),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const appItem of localStore.blockedApps) {
        const cleanPkg = sanitizePackageForBlueprint(appItem.packageName);
        if (!BLUEPRINT_LIMITS.packageNamePattern.test(cleanPkg)) continue;
        const appRef = doc(db, 'users', uid, 'blockedApps', toSafeFirestoreDocId(cleanPkg));
        batch.set(appRef, {
          ownerId: uid,
          packageName: cleanPkg,
          appLabel: (appItem.appLabel || cleanPkg).slice(0, BLUEPRINT_LIMITS.appLabelMaxLength),
          addedAt: Math.max(0, Math.floor(appItem.addedAt || Date.now())),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const ev of localStore.events.slice(0, 50)) {
        const evId = Math.max(1, Math.floor(ev.id));
        const evRef = doc(db, 'users', uid, 'events', `evt_${evId}`);
        const sourceVal = BLUEPRINT_LIMITS.validSources.includes(
          ev.source as (typeof BLUEPRINT_LIMITS.validSources)[number],
        )
          ? ev.source
          : 'Web Shield';
        batch.set(evRef, {
          ownerId: uid,
          eventId: evId,
          target: sanitizeEventTarget(ev.target),
          source: sourceVal,
          categoryName: (ev.categoryName || 'CUSTOM').slice(
            0,
            BLUEPRINT_LIMITS.categoryNameMaxLength,
          ),
          timestamp: Math.max(1, Math.floor(ev.timestamp || Date.now())),
          createdAt: serverTimestamp(),
        });
      }
      for (const log of localStore.urgeLogs.slice(0, 50)) {
        const logId = Math.max(1, Math.floor(log.id));
        const { triggerTag, note } = sanitizeUrgeFields(log.triggerTag, log.note);
        const logRef = doc(db, 'users', uid, 'urgeLogs', `urge_${logId}`);
        batch.set(logRef, {
          ownerId: uid,
          logId,
          triggerTag,
          note,
          timestamp: Math.max(1, Math.floor(log.timestamp || Date.now())),
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } else {
      hydratedFromCloud = true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, settingsPath);
  }

  return { hydratedFromCloud };
}

export async function updatePreferredNameInCloud(
  uid: string,
  email: string,
  displayName: string,
  preferredName: string,
): Promise<void> {
  const path = `users/${uid}/private/account`;
  const ref = doc(db, 'users', uid, 'private', 'account');
  const safePreferred = sanitizePreferredName(preferredName);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: uid,
        email: (email || 'user@gambleaware.local').slice(0, BLUEPRINT_LIMITS.emailMaxLength),
        displayName: (displayName || safePreferred).slice(0, BLUEPRINT_LIMITS.displayNameMaxLength),
        preferredName: safePreferred,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        preferredName: safePreferred,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncSettingsToCloud(uid: string, store: PersistedStore): Promise<void> {
  const path = `users/${uid}/profile/settings`;
  const settingsRef = doc(db, 'users', uid, 'profile', 'settings');
  const fields = buildSettingsPayloadFields(uid, store);
  try {
    const snap = await getDoc(settingsRef);
    if (!snap.exists()) {
      await setDoc(settingsRef, {
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const { ownerId: _ignoredOwner, ...updatableFields } = fields;
      await updateDoc(settingsRef, {
        ...updatableFields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertGoalInCloud(uid: string, goal: RecoveryGoalEntity): Promise<void> {
  const safeId = toSafeFirestoreDocId(goal.goalId);
  if (!isValidFirestoreDocId(safeId)) return;
  const path = `users/${uid}/goals/${safeId}`;
  const ref = doc(db, 'users', uid, 'goals', safeId);
  const cleanFields = sanitizeGoalFields(goal);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: uid,
        goalId: safeId,
        ...cleanFields,
        isPrimary: Boolean(goal.isPrimary),
        isCompleted: Boolean(goal.isCompleted),
        createdAtMs: Math.max(1, Math.floor(goal.createdAtMs || Date.now())),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...cleanFields,
        isPrimary: Boolean(goal.isPrimary),
        isCompleted: Boolean(goal.isCompleted),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGoalFromCloud(uid: string, goalId: string): Promise<void> {
  const safeId = toSafeFirestoreDocId(goalId);
  const path = `users/${uid}/goals/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'goals', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCustomDomainInCloud(
  uid: string,
  item: BlockedDomainEntity,
): Promise<void> {
  const cleanDomain = sanitizeDomainForBlueprint(item.domain);
  if (!BLUEPRINT_LIMITS.domainPattern.test(cleanDomain)) return;
  const docId = toSafeFirestoreDocId(cleanDomain);
  const path = `users/${uid}/domains/${docId}`;
  const ref = doc(db, 'users', uid, 'domains', docId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: uid,
        domain: cleanDomain,
        isAllowlisted: Boolean(item.isAllowlisted),
        categoryName: (item.categoryName || 'CUSTOM').slice(
          0,
          BLUEPRINT_LIMITS.categoryNameMaxLength,
        ),
        addedAt: Math.max(0, Math.floor(item.addedAt || Date.now())),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        isAllowlisted: Boolean(item.isAllowlisted),
        categoryName: (item.categoryName || 'CUSTOM').slice(
          0,
          BLUEPRINT_LIMITS.categoryNameMaxLength,
        ),
        addedAt: Math.max(0, Math.floor(item.addedAt || Date.now())),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomDomainFromCloud(uid: string, domain: string): Promise<void> {
  const cleanDomain = sanitizeDomainForBlueprint(domain);
  const docId = toSafeFirestoreDocId(cleanDomain);
  const path = `users/${uid}/domains/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'domains', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertBlockedAppInCloud(
  uid: string,
  appItem: BlockedAppEntity,
): Promise<void> {
  const cleanPkg = sanitizePackageForBlueprint(appItem.packageName);
  if (!BLUEPRINT_LIMITS.packageNamePattern.test(cleanPkg)) return;
  const docId = toSafeFirestoreDocId(cleanPkg);
  const path = `users/${uid}/blockedApps/${docId}`;
  const ref = doc(db, 'users', uid, 'blockedApps', docId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: uid,
        packageName: cleanPkg,
        appLabel: (appItem.appLabel || cleanPkg).slice(0, BLUEPRINT_LIMITS.appLabelMaxLength),
        addedAt: Math.max(0, Math.floor(appItem.addedAt || Date.now())),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        appLabel: (appItem.appLabel || cleanPkg).slice(0, BLUEPRINT_LIMITS.appLabelMaxLength),
        addedAt: Math.max(0, Math.floor(appItem.addedAt || Date.now())),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBlockedAppFromCloud(
  uid: string,
  packageName: string,
): Promise<void> {
  const cleanPkg = sanitizePackageForBlueprint(packageName);
  const docId = toSafeFirestoreDocId(cleanPkg);
  const path = `users/${uid}/blockedApps/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'blockedApps', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createBlockedEventInCloud(
  uid: string,
  ev: BlockedEventEntity,
): Promise<void> {
  const evId = Math.max(1, Math.floor(ev.id));
  const docId = `evt_${evId}`;
  const path = `users/${uid}/events/${docId}`;
  const sourceVal = BLUEPRINT_LIMITS.validSources.includes(
    ev.source as (typeof BLUEPRINT_LIMITS.validSources)[number],
  )
    ? ev.source
    : 'Web Shield';
  try {
    await setDoc(doc(db, 'users', uid, 'events', docId), {
      ownerId: uid,
      eventId: evId,
      target: sanitizeEventTarget(ev.target),
      source: sourceVal,
      categoryName: (ev.categoryName || 'CUSTOM').slice(
        0,
        BLUEPRINT_LIMITS.categoryNameMaxLength,
      ),
      timestamp: Math.max(1, Math.floor(ev.timestamp || Date.now())),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function clearEventsInCloud(uid: string): Promise<void> {
  const path = `users/${uid}/events`;
  try {
    const q = query(collection(db, 'users', uid, 'events'), where('ownerId', '==', uid));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createUrgeLogInCloud(uid: string, log: UrgeLogEntity): Promise<void> {
  const logId = Math.max(1, Math.floor(log.id));
  const docId = `urge_${logId}`;
  const path = `users/${uid}/urgeLogs/${docId}`;
  const { triggerTag, note } = sanitizeUrgeFields(log.triggerTag, log.note);
  try {
    await setDoc(doc(db, 'users', uid, 'urgeLogs', docId), {
      ownerId: uid,
      logId,
      triggerTag,
      note,
      timestamp: Math.max(1, Math.floor(log.timestamp || Date.now())),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface CloudListenersCallbacks {
  onPrivateInfoUpdate: (preferredName: string) => void;
  onSettingsUpdate: (patch: {
    settings: ProtectionSettingsState;
    isAccessibilityEnabled: boolean;
    isDeviceAdminEnabled: boolean;
    privateDnsActive: boolean;
    privateDnsHost: string | null;
  }) => void;
  onGoalsUpdate: (goals: RecoveryGoalEntity[]) => void;
  onDomainsUpdate: (domains: BlockedDomainEntity[]) => void;
  onBlockedAppsUpdate: (apps: BlockedAppEntity[]) => void;
  onEventsUpdate: (events: BlockedEventEntity[]) => void;
  onUrgeLogsUpdate: (logs: UrgeLogEntity[]) => void;
}

export function attachUserCloudListeners(
  uid: string,
  callbacks: CloudListenersCallbacks,
): () => void {
  const unsubscribers: Unsubscribe[] = [];

  const privatePath = `users/${uid}/private/account`;
  unsubscribers.push(
    onSnapshot(
      doc(db, 'users', uid, 'private', 'account'),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        const pref = typeof d.preferredName === 'string' ? d.preferredName : '';
        if (pref) {
          callbacks.onPrivateInfoUpdate(pref);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, privatePath);
      },
    ),
  );

  const settingsPath = `users/${uid}/profile/settings`;
  unsubscribers.push(
    onSnapshot(
      doc(db, 'users', uid, 'profile', 'settings'),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        callbacks.onSettingsUpdate({
          settings: {
            isProtectionEnabled: Boolean(d.isProtectionEnabled),
            blockSportsbooks: Boolean(d.blockSportsbooks),
            blockCasinos: Boolean(d.blockCasinos),
            blockPokerAndBingo: Boolean(d.blockPokerAndBingo),
            blockCryptoBetting: Boolean(d.blockCryptoBetting),
            blockFantasyAndLottery: Boolean(d.blockFantasyAndLottery),
            strictKeywordFilter: Boolean(d.strictKeywordFilter),
            browserShieldEnabled: Boolean(d.browserShieldEnabled),
            appShieldEnabled: Boolean(d.appShieldEnabled),
            searchGuardEnabled: Boolean(d.searchGuardEnabled),
            antiTamperLockEnabled: Boolean(d.antiTamperLockEnabled),
            lockUntilEpochMs: Number(d.lockUntilEpochMs ?? 0),
            pinHash: typeof d.pinHash === 'string' && d.pinHash.length > 0 ? d.pinHash : null,
            protectionStartedAtMs: Number(d.protectionStartedAtMs ?? Date.now()),
            dailyBetSpendEstimate: Number(d.dailyBetSpendEstimate ?? 5000),
            themeMode: Object.values(ThemeMode).includes(d.themeMode)
              ? (d.themeMode as ThemeMode)
              : ThemeMode.LIGHT,
            hasCompletedTour: Boolean(d.hasCompletedTour),
            notificationsEnabled: Boolean(d.notificationsEnabled),
            lastNotifiedMilestoneDay: Number(d.lastNotifiedMilestoneDay ?? 0),
            aiAutoBlockEnabled: d.aiAutoBlockEnabled !== undefined ? Boolean(d.aiAutoBlockEnabled) : true,
            goalReminderEnabled: d.goalReminderEnabled !== undefined ? Boolean(d.goalReminderEnabled) : true,
          },
          isAccessibilityEnabled: Boolean(d.isAccessibilityEnabled),
          isDeviceAdminEnabled: Boolean(d.isDeviceAdminEnabled),
          privateDnsActive: Boolean(d.privateDnsActive),
          privateDnsHost:
            typeof d.privateDnsHost === 'string' && d.privateDnsHost.length > 0
              ? d.privateDnsHost
              : null,
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, settingsPath);
      },
    ),
  );

  const goalsPath = `users/${uid}/goals`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'users', uid, 'goals'),
        where('ownerId', '==', uid),
        orderBy('createdAtMs', 'desc'),
      ),
      (snap) => {
        const list: RecoveryGoalEntity[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            goalId: String(d.goalId ?? docSnap.id),
            title: String(d.title ?? 'Recovery Goal'),
            category:
              d.category === 'savings' || d.category === 'milestone' ? d.category : 'streak',
            targetDays: Number(d.targetDays ?? 30),
            targetAmountNgn: Number(d.targetAmountNgn ?? 0),
            whyNote: String(d.whyNote ?? ''),
            isPrimary: Boolean(d.isPrimary),
            isCompleted: Boolean(d.isCompleted),
            lockDurationDays: Number(d.lockDurationDays ?? 0),
            createdAtMs: Number(d.createdAtMs ?? Date.now()),
          };
        });
        callbacks.onGoalsUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, goalsPath);
      },
    ),
  );

  const domainsPath = `users/${uid}/domains`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'users', uid, 'domains'),
        where('ownerId', '==', uid),
        orderBy('addedAt', 'desc'),
      ),
      (snap) => {
        const list: BlockedDomainEntity[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            domain: String(d.domain ?? ''),
            isAllowlisted: Boolean(d.isAllowlisted),
            categoryName: String(d.categoryName ?? 'CUSTOM'),
            addedAt: Number(d.addedAt ?? Date.now()),
          };
        });
        callbacks.onDomainsUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, domainsPath);
      },
    ),
  );

  const appsPath = `users/${uid}/blockedApps`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'users', uid, 'blockedApps'),
        where('ownerId', '==', uid),
        orderBy('addedAt', 'desc'),
      ),
      (snap) => {
        const list: BlockedAppEntity[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            packageName: String(d.packageName ?? ''),
            appLabel: String(d.appLabel ?? ''),
            addedAt: Number(d.addedAt ?? Date.now()),
          };
        });
        callbacks.onBlockedAppsUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, appsPath);
      },
    ),
  );

  const eventsPath = `users/${uid}/events`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'users', uid, 'events'),
        where('ownerId', '==', uid),
        orderBy('timestamp', 'desc'),
      ),
      (snap) => {
        const list: BlockedEventEntity[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: Number(d.eventId ?? Date.now()),
            target: String(d.target ?? ''),
            source: String(d.source ?? 'Web Shield'),
            categoryName: String(d.categoryName ?? 'CUSTOM'),
            timestamp: Number(d.timestamp ?? Date.now()),
          };
        });
        callbacks.onEventsUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, eventsPath);
      },
    ),
  );

  const urgeLogsPath = `users/${uid}/urgeLogs`;
  unsubscribers.push(
    onSnapshot(
      query(
        collection(db, 'users', uid, 'urgeLogs'),
        where('ownerId', '==', uid),
        orderBy('timestamp', 'desc'),
      ),
      (snap) => {
        const list: UrgeLogEntity[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: Number(d.logId ?? Date.now()),
            triggerTag: String(d.triggerTag ?? 'General'),
            note: String(d.note ?? ''),
            timestamp: Number(d.timestamp ?? Date.now()),
          };
        });
        callbacks.onUrgeLogsUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, urgeLogsPath);
      },
    ),
  );

  return () => {
    for (const unsub of unsubscribers) {
      unsub();
    }
  };
}
