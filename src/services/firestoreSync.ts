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
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { GamblingCategory } from '../blocker/gamblingCategory';
import type {
  BlockedDomainEntity,
  CloudRecoveryProfile,
  DerivedMainState,
  RecoveryGoalEntity,
  SupportTicketRecord,
  ThemeMode,
} from '../data/types';
import {
  BLUEPRINT_LIMITS,
  sanitizeDomainForBlueprint,
  sanitizeGoalFields,
  sanitizePreferredName,
  sanitizeSupportTicketInput,
  toSafeFirestoreDocId,
} from '../firebaseValidation';
import type { EvaluatedSurveyProfile } from '../utils/recoverySurvey';

export interface CloudSettingsRecord {
  isProtectionEnabled: boolean;
  blockSportsbooks: boolean;
  blockCasinos: boolean;
  blockPokerAndBingo: boolean;
  blockCryptoBetting: boolean;
  blockFantasyAndLottery: boolean;
  strictKeywordFilter: boolean;
  browserShieldEnabled: boolean;
  appShieldEnabled: boolean;
  searchGuardEnabled: boolean;
  antiTamperLockEnabled: boolean;
  lockUntilEpochMs: number;
  pinHash: string;
  protectionStartedAtMs: number;
  dailyBetSpendEstimate: number;
  themeMode: ThemeMode;
  hasCompletedTour: boolean;
  notificationsEnabled: boolean;
  lastNotifiedMilestoneDay: number;
  aiAutoBlockEnabled: boolean;
  goalReminderEnabled: boolean;
  isAccessibilityEnabled: boolean;
  isDeviceAdminEnabled: boolean;
  privateDnsActive: boolean;
  privateDnsHost: string;
}

export interface CloudRecoverySnapshot {
  settings: CloudSettingsRecord | null;
  goals: RecoveryGoalEntity[];
  domains: BlockedDomainEntity[];
  hasActiveCloudLock: boolean;
}

async function ensureUserAnchor(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);
  if (!existing.exists()) {
    await setDoc(userRef, {
      ownerId: user.uid,
      planTier: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(userRef, {
      updatedAt: serverTimestamp(),
    });
  }
}

export async function syncUserRecoveryProfile(
  user: User,
  uiState: DerivedMainState,
): Promise<void> {
  if (!user.emailVerified || !user.email) return;

  const profilePath = `recoveryProfiles/${user.uid}`;
  const privatePath = `users/${user.uid}/private/account`;

  try {
    await ensureUserAnchor(user);

    const safePreferred =
      sanitizePreferredName(uiState.preferredName || user.displayName || '') ||
      user.email.split('@')[0].slice(0, 30);

    const privateRef = doc(db, 'users', user.uid, 'private', 'account');
    const privateSnap = await getDoc(privateRef);
    const privatePayload = {
      ownerId: user.uid,
      email: user.email.slice(0, BLUEPRINT_LIMITS.emailMaxLength),
      displayName: (user.displayName || '').slice(0, BLUEPRINT_LIMITS.displayNameMaxLength),
      preferredName: safePreferred,
      updatedAt: serverTimestamp(),
    };
    if (!privateSnap.exists()) {
      await setDoc(privateRef, {
        ...privatePayload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(privateRef, privatePayload);
    }

    const recoveryRef = doc(db, 'recoveryProfiles', user.uid);
    const recoverySnap = await getDoc(recoveryRef);
    const existingLockUntil = recoverySnap.exists()
      ? Number(recoverySnap.data().lockUntilEpochMs || 0)
      : 0;
    const effectiveLockUntil = Math.max(
      existingLockUntil,
      Math.max(0, Math.round(uiState.settings.lockUntilEpochMs || 0)),
    );

    const recoveryPayload = {
      ownerId: user.uid,
      email: user.email.slice(0, BLUEPRINT_LIMITS.emailMaxLength),
      displayName: (user.displayName || safePreferred).slice(
        0,
        BLUEPRINT_LIMITS.displayNameMaxLength,
      ),
      preferredName: safePreferred,
      isProtectionEnabled: Boolean(uiState.settings.isProtectionEnabled),
      isLocked: effectiveLockUntil > Date.now(),
      lockUntilEpochMs: effectiveLockUntil,
      dailyBetSpendEstimate: Math.max(
        0,
        Math.min(
          BLUEPRINT_LIMITS.maxDailyBetSpendNgn,
          Math.round(uiState.settings.dailyBetSpendEstimate || 0),
        ),
      ),
      cleanDays: Math.max(0, Math.round(uiState.cleanDays)),
      estimatedSavedNgn: Math.max(0, Math.round(uiState.estimatedSavedAmount)),
      totalBlockedCount: Math.max(0, Math.round(uiState.totalBlockedCount)),
      totalUrgeResistedCount: Math.max(0, Math.round(uiState.totalUrgeResistedCount)),
      relapseCount: Math.max(0, Math.round(uiState.relapseLogs.length)),
      surveyRiskTier: uiState.latestSurvey?.riskTier ?? 'UNASSESSED',
      surveyPrimaryFormat: (uiState.latestSurvey?.answers.primaryFormat ?? '').slice(0, 60),
      lastActiveMs: Date.now(),
      updatedAt: serverTimestamp(),
    };

    if (!recoverySnap.exists()) {
      await setDoc(recoveryRef, {
        ...recoveryPayload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(recoveryRef, recoveryPayload);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      handleFirestoreError(error, OperationType.WRITE, `${profilePath} | ${privatePath}`);
    }
    throw error;
  }
}

export async function syncSettingsAndLockToCloud(
  user: User,
  uiState: DerivedMainState,
): Promise<void> {
  if (!user.emailVerified || !user.email) return;
  const path = `users/${user.uid}/profile/settings`;

  try {
    await ensureUserAnchor(user);
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
    const existingSnap = await getDoc(settingsRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const existingLockUntil = Number(existingData?.lockUntilEpochMs || 0);
    const localLockUntil = Math.max(0, Math.round(uiState.settings.lockUntilEpochMs || 0));
    const effectiveLockUntil = Math.max(existingLockUntil, localLockUntil);
    const existingLockActive = existingLockUntil > Date.now();
    const existingPinHash = typeof existingData?.pinHash === 'string' ? existingData.pinHash : '';
    const localPinHash = (uiState.settings.pinHash || '').slice(0, BLUEPRINT_LIMITS.pinHashMaxLength);
    const effectivePinHash =
      existingLockActive && existingPinHash ? existingPinHash : localPinHash;

    const payload = {
      ownerId: user.uid,
      isProtectionEnabled: existingLockActive ? true : Boolean(uiState.settings.isProtectionEnabled),
      blockSportsbooks: Boolean(uiState.settings.blockSportsbooks),
      blockCasinos: Boolean(uiState.settings.blockCasinos),
      blockPokerAndBingo: Boolean(uiState.settings.blockPokerAndBingo),
      blockCryptoBetting: Boolean(uiState.settings.blockCryptoBetting),
      blockFantasyAndLottery: Boolean(uiState.settings.blockFantasyAndLottery),
      strictKeywordFilter: Boolean(uiState.settings.strictKeywordFilter),
      browserShieldEnabled: Boolean(uiState.settings.browserShieldEnabled),
      appShieldEnabled: Boolean(uiState.settings.appShieldEnabled),
      searchGuardEnabled: Boolean(uiState.settings.searchGuardEnabled),
      antiTamperLockEnabled: existingLockActive
        ? true
        : Boolean(uiState.settings.antiTamperLockEnabled),
      lockUntilEpochMs: effectiveLockUntil,
      pinHash: effectivePinHash,
      protectionStartedAtMs: Math.max(0, Math.round(uiState.settings.protectionStartedAtMs || 0)),
      dailyBetSpendEstimate: Math.max(
        0,
        Math.min(
          BLUEPRINT_LIMITS.maxDailyBetSpendNgn,
          Math.round(uiState.settings.dailyBetSpendEstimate || 0),
        ),
      ),
      themeMode: uiState.settings.themeMode,
      hasCompletedTour: Boolean(uiState.settings.hasCompletedTour),
      notificationsEnabled: Boolean(uiState.settings.notificationsEnabled),
      lastNotifiedMilestoneDay: Math.max(0, Math.round(uiState.settings.lastNotifiedMilestoneDay || 0)),
      aiAutoBlockEnabled: Boolean(uiState.settings.adBlockerEnabled !== false),
      goalReminderEnabled: Boolean(uiState.settings.goalReminderEnabled),
      isAccessibilityEnabled: Boolean(uiState.isAccessibilityEnabled),
      isDeviceAdminEnabled: Boolean(uiState.isDeviceAdminEnabled),
      privateDnsActive: Boolean(uiState.privateDnsStatus.isActive),
      privateDnsHost: (uiState.privateDnsStatus.serverHost || '').slice(
        0,
        BLUEPRINT_LIMITS.privateDnsHostMaxLength,
      ),
      updatedAt: serverTimestamp(),
    };

    if (!existingSnap.exists()) {
      await setDoc(settingsRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(settingsRef, payload);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    throw error;
  }
}

export async function syncGoalToCloud(user: User, goal: RecoveryGoalEntity): Promise<void> {
  if (!user.emailVerified) return;
  const path = `users/${user.uid}/goals/${goal.goalId}`;
  try {
    await ensureUserAnchor(user);
    const clean = sanitizeGoalFields(goal);
    const goalRef = doc(db, 'users', user.uid, 'goals', goal.goalId);
    const existing = await getDoc(goalRef);
    const payload = {
      ownerId: user.uid,
      goalId: goal.goalId,
      title: clean.title,
      category: clean.category,
      targetDays: clean.targetDays,
      targetAmountNgn: clean.targetAmountNgn,
      whyNote: clean.whyNote,
      isPrimary: Boolean(goal.isPrimary),
      isCompleted: Boolean(goal.isCompleted),
      lockDurationDays: clean.lockDurationDays,
      createdAtMs: Math.max(1, Math.round(goal.createdAtMs || Date.now())),
      updatedAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      await setDoc(goalRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(goalRef, {
        title: payload.title,
        category: payload.category,
        targetDays: payload.targetDays,
        targetAmountNgn: payload.targetAmountNgn,
        whyNote: payload.whyNote,
        isPrimary: payload.isPrimary,
        isCompleted: payload.isCompleted,
        lockDurationDays: payload.lockDurationDays,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    throw error;
  }
}

export async function deleteGoalFromCloud(user: User, goalId: string): Promise<void> {
  if (!user.emailVerified) return;
  const path = `users/${user.uid}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'goals', goalId));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

export async function syncDomainRuleToCloud(
  user: User,
  rule: BlockedDomainEntity,
): Promise<void> {
  if (!user.emailVerified) return;
  const domain = sanitizeDomainForBlueprint(rule.domain);
  if (!BLUEPRINT_LIMITS.domainPattern.test(domain)) return;
  const docId = toSafeFirestoreDocId(domain);
  const path = `users/${user.uid}/domains/${docId}`;
  try {
    await ensureUserAnchor(user);
    const ref = doc(db, 'users', user.uid, 'domains', docId);
    const existing = await getDoc(ref);
    const payload = {
      ownerId: user.uid,
      domain,
      isAllowlisted: Boolean(rule.isAllowlisted),
      categoryName: (rule.categoryName || GamblingCategory.CUSTOM).slice(
        0,
        BLUEPRINT_LIMITS.categoryNameMaxLength,
      ),
      addedAt: Math.max(0, Math.round(rule.addedAt || Date.now())),
      updatedAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        isAllowlisted: payload.isAllowlisted,
        categoryName: payload.categoryName,
        addedAt: payload.addedAt,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function deleteDomainRuleFromCloud(user: User, domain: string): Promise<void> {
  if (!user.emailVerified) return;
  const docId = toSafeFirestoreDocId(sanitizeDomainForBlueprint(domain));
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'domains', docId));
  } catch {
    // Ignore non-fatal cloud delete errors
  }
}

export async function fetchCloudRecoverySnapshot(user: User): Promise<CloudRecoverySnapshot> {
  if (!user.emailVerified) {
    return { settings: null, goals: [], domains: [], hasActiveCloudLock: false };
  }

  const [settingsSnap, goalsSnap, domainsSnap] = await Promise.all([
    getDoc(doc(db, 'users', user.uid, 'profile', 'settings')).catch(() => null),
    getDocs(collection(db, 'users', user.uid, 'goals')).catch(() => null),
    getDocs(collection(db, 'users', user.uid, 'domains')).catch(() => null),
  ]);

  const settings =
    settingsSnap && settingsSnap.exists() ? (settingsSnap.data() as CloudSettingsRecord) : null;

  const goals: RecoveryGoalEntity[] = goalsSnap
    ? goalsSnap.docs
        .map((d) => d.data() as Partial<RecoveryGoalEntity>)
        .filter((g): g is RecoveryGoalEntity => Boolean(g.goalId && g.title))
        .map((g) => ({
          goalId: g.goalId,
          title: g.title,
          category: g.category || 'streak',
          targetDays: Number(g.targetDays || 30),
          targetAmountNgn: Number(g.targetAmountNgn || 0),
          whyNote: String(g.whyNote || ''),
          isPrimary: Boolean(g.isPrimary),
          isCompleted: Boolean(g.isCompleted),
          lockDurationDays: Number(g.lockDurationDays || 0),
          createdAtMs: Number(g.createdAtMs || Date.now()),
        }))
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
    : [];

  const domains: BlockedDomainEntity[] = domainsSnap
    ? domainsSnap.docs
        .map((d) => d.data() as Partial<BlockedDomainEntity>)
        .filter((d): d is BlockedDomainEntity => Boolean(d.domain))
        .map((d) => ({
          domain: d.domain,
          isAllowlisted: Boolean(d.isAllowlisted),
          categoryName: (d.categoryName as GamblingCategory) || GamblingCategory.CUSTOM,
          addedAt: Number(d.addedAt || Date.now()),
        }))
    : [];

  const hasActiveCloudLock = Boolean(settings && Number(settings.lockUntilEpochMs || 0) > Date.now());

  return {
    settings,
    goals,
    domains,
    hasActiveCloudLock,
  };
}

export async function syncRecoverySurveyToCloud(
  user: User,
  survey: EvaluatedSurveyProfile,
): Promise<void> {
  if (!user.emailVerified) return;
  const path = `users/${user.uid}/surveys/latest`;
  try {
    await ensureUserAnchor(user);
    const ref = doc(db, 'users', user.uid, 'surveys', 'latest');
    const existing = await getDoc(ref);
    const payload = {
      ownerId: user.uid,
      surveyId: 'latest',
      primaryFormat: survey.answers.primaryFormat.slice(0, BLUEPRINT_LIMITS.surveyOptionMaxLength),
      triggersSummary:
        survey.answers.triggers.join(', ').slice(0, BLUEPRINT_LIMITS.surveyTriggersMaxLength) ||
        'General',
      spendBand: survey.answers.spendBand.slice(0, BLUEPRINT_LIMITS.surveyOptionMaxLength),
      relapseFrequency: survey.answers.relapseFrequency.slice(
        0,
        BLUEPRINT_LIMITS.surveyOptionMaxLength,
      ),
      peakWindow: survey.answers.peakWindow.slice(0, BLUEPRINT_LIMITS.surveyOptionMaxLength),
      supportReadiness: survey.answers.supportReadiness.slice(
        0,
        BLUEPRINT_LIMITS.surveyOptionMaxLength,
      ),
      riskScore: Math.max(0, Math.min(100, Math.round(survey.riskScore))),
      riskTier: survey.riskTier,
      recommendedLockDays: Math.max(0, Math.min(730, Math.round(survey.recommendedLockDays))),
      summary: survey.summary.slice(0, BLUEPRINT_LIMITS.surveySummaryMaxLength),
      completedAtMs: Math.max(1, Math.round(survey.completedAtMs)),
      updatedAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createSupportTicketInCloud(
  user: User,
  input: {
    category: SupportTicketRecord['category'];
    urgency: SupportTicketRecord['urgency'];
    subject: string;
    message: string;
  },
  preferredName?: string,
): Promise<string> {
  if (!user.emailVerified || !user.email) {
    throw new Error('Verified Google account required to submit a support ticket.');
  }

  const sanitized = sanitizeSupportTicketInput(input);
  if (sanitized.subject.length < BLUEPRINT_LIMITS.ticketSubjectMinLength) {
    throw new Error('Subject must be at least 3 characters.');
  }
  if (sanitized.message.length < BLUEPRINT_LIMITS.ticketMessageMinLength) {
    throw new Error('Please describe how we can help (at least 5 characters).');
  }

  const now = Date.now();
  const ticketId = `tkt_${now}_${user.uid.slice(0, 8)}`;
  const path = `supportTickets/${ticketId}`;

  try {
    await setDoc(doc(db, 'supportTickets', ticketId), {
      ticketId,
      ownerId: user.uid,
      userEmail: user.email.slice(0, BLUEPRINT_LIMITS.emailMaxLength),
      userName: (preferredName || user.displayName || user.email.split('@')[0]).slice(
        0,
        BLUEPRINT_LIMITS.displayNameMaxLength,
      ),
      category: sanitized.category,
      urgency: sanitized.urgency,
      subject: sanitized.subject,
      message: sanitized.message,
      status: 'OPEN',
      adminReply: '',
      respondedByEmail: '',
      respondedAtMs: 0,
      createdAtMs: now,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ticketId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function replyToSupportTicketAsAdmin(
  ticketId: string,
  params: {
    status: SupportTicketRecord['status'];
    adminReply: string;
  },
): Promise<void> {
  const adminEmail = auth.currentUser?.email || '';
  const path = `supportTickets/${ticketId}`;
  try {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
      status: params.status,
      adminReply: params.adminReply.trim().slice(0, BLUEPRINT_LIMITS.ticketReplyMaxLength),
      respondedByEmail: adminEmail.slice(0, BLUEPRINT_LIMITS.emailMaxLength),
      respondedAtMs: Date.now(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserTickets(
  userId: string,
  onData: (tickets: SupportTicketRecord[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'supportTickets'),
    where('ownerId', '==', userId),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => d.data() as SupportTicketRecord)
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `supportTickets(ownerId=${userId})`);
    },
  );
}

export function subscribeAllTicketsForAdmin(
  onData: (tickets: SupportTicketRecord[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, 'supportTickets'), orderBy('createdAtMs', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as SupportTicketRecord);
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'supportTickets');
    },
  );
}

export function subscribeAllRecoveryProfilesForAdmin(
  onData: (profiles: CloudRecoveryProfile[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, 'recoveryProfiles'), orderBy('lastActiveMs', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as CloudRecoveryProfile);
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'recoveryProfiles');
    },
  );
}
