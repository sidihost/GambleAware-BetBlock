import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
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
import type {
  CloudRecoveryProfile,
  DerivedMainState,
  SupportTicketRecord,
} from '../data/types';
import {
  BLUEPRINT_LIMITS,
  sanitizePreferredName,
  sanitizeSupportTicketInput,
} from '../firebaseValidation';
import type { EvaluatedSurveyProfile } from '../utils/recoverySurvey';

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
    const recoveryPayload = {
      ownerId: user.uid,
      email: user.email.slice(0, BLUEPRINT_LIMITS.emailMaxLength),
      displayName: (user.displayName || safePreferred).slice(
        0,
        BLUEPRINT_LIMITS.displayNameMaxLength,
      ),
      preferredName: safePreferred,
      isProtectionEnabled: Boolean(uiState.settings.isProtectionEnabled),
      isLocked: Boolean(uiState.isTimeLockedNow),
      lockUntilEpochMs: Math.max(0, Math.round(uiState.settings.lockUntilEpochMs || 0)),
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
    // Throw structured FirestoreErrorInfo for ErrorBoundary/diagnostics when rules fail
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      handleFirestoreError(error, OperationType.WRITE, `${profilePath} | ${privatePath}`);
    }
    throw error;
  }
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
