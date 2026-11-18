export const BLUEPRINT_LIMITS = {
  ownerIdMaxLength: 128,
  ownerIdPattern: /^[a-zA-Z0-9_-]+$/,
  emailMaxLength: 254,
  displayNameMaxLength: 120,
  preferredNameMaxLength: 60,
  pinHashMaxLength: 64,
  themeModeMaxLength: 16,
  privateDnsHostMaxLength: 253,
  domainMinLength: 3,
  domainMaxLength: 253,
  domainPattern: /^[a-z0-9.-]+\.[a-z]{2,}$/,
  categoryNameMaxLength: 64,
  packageNameMinLength: 3,
  packageNameMaxLength: 160,
  packageNamePattern: /^[a-zA-Z0-9_.]+$/,
  appLabelMaxLength: 80,
  targetMaxLength: 253,
  sourceMaxLength: 32,
  validSources: ['Web Shield', 'In-App WebView', 'App Shield', 'Install Guard', 'AI Agent'] as const,
  triggerTagMaxLength: 40,
  urgeNoteMaxLength: 280,
  maxDailyBetSpendNgn: 10_000_000,
  goalTitleMaxLength: 100,
  goalWhyMaxLength: 280,
  goalMaxTargetDays: 3650,
  goalMaxAmountNgn: 100_000_000,
  validGoalCategories: ['savings', 'streak', 'milestone'] as const,
  surveyOptionMaxLength: 60,
  surveyTriggersMaxLength: 240,
  surveySummaryMaxLength: 500,
  validRiskTiers: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const,
  validProfileRiskTiers: ['UNASSESSED', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const,
  ticketSubjectMinLength: 3,
  ticketSubjectMaxLength: 140,
  ticketMessageMinLength: 5,
  ticketMessageMaxLength: 2000,
  ticketReplyMaxLength: 2000,
  validTicketCategories: [
    'RECOVERY_HELP',
    'RELAPSE_SUPPORT',
    'BLOCKER_ISSUE',
    'LOCK_OR_PIN',
    'BANK_EXCLUSION',
  ] as const,
  validTicketUrgencies: ['STANDARD', 'HIGH', 'URGENT'] as const,
  validTicketStatuses: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const,
} as const;

export const BOOTSTRAPPED_ADMIN_EMAIL = 'abdulhakemadeleke36@gmail.com';

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL);
}

export function toSafeFirestoreDocId(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/\./g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const sliced = cleaned.slice(0, BLUEPRINT_LIMITS.ownerIdMaxLength);
  return sliced || 'doc';
}

export function sanitizeDomainForBlueprint(rawDomain: string): string {
  return rawDomain.trim().toLowerCase().slice(0, BLUEPRINT_LIMITS.domainMaxLength);
}

export function sanitizePackageForBlueprint(rawPkg: string): string {
  return rawPkg
    .trim()
    .replace(/[^a-zA-Z0-9_.]/g, '')
    .slice(0, BLUEPRINT_LIMITS.packageNameMaxLength);
}

export function sanitizeUrgeFields(triggerTag: string, note: string): {
  triggerTag: string;
  note: string;
} {
  const safeTag =
    triggerTag.trim().slice(0, BLUEPRINT_LIMITS.triggerTagMaxLength) || 'General';
  const safeNote = note.trim().slice(0, BLUEPRINT_LIMITS.urgeNoteMaxLength);
  return { triggerTag: safeTag, note: safeNote };
}

export function sanitizeEventTarget(target: string): string {
  return (target.trim() || 'blocked.domain').slice(0, BLUEPRINT_LIMITS.targetMaxLength);
}

export function sanitizePreferredName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, BLUEPRINT_LIMITS.preferredNameMaxLength);
}

export function sanitizeGoalFields(input: {
  title: string;
  category: string;
  targetDays: number;
  targetAmountNgn: number;
  whyNote: string;
  lockDurationDays: number;
}) {
  const safeCategory = BLUEPRINT_LIMITS.validGoalCategories.includes(
    input.category as (typeof BLUEPRINT_LIMITS.validGoalCategories)[number],
  )
    ? (input.category as (typeof BLUEPRINT_LIMITS.validGoalCategories)[number])
    : 'streak';
  return {
    title:
      input.title.trim().slice(0, BLUEPRINT_LIMITS.goalTitleMaxLength) ||
      '30-Day Betting-Free Goal',
    category: safeCategory,
    targetDays: Math.max(
      1,
      Math.min(BLUEPRINT_LIMITS.goalMaxTargetDays, Math.round(input.targetDays || 30)),
    ),
    targetAmountNgn: Math.max(
      0,
      Math.min(BLUEPRINT_LIMITS.goalMaxAmountNgn, Math.round(input.targetAmountNgn || 0)),
    ),
    whyNote: input.whyNote.trim().slice(0, BLUEPRINT_LIMITS.goalWhyMaxLength),
    lockDurationDays: Math.max(0, Math.min(365, Math.round(input.lockDurationDays || 0))),
  };
}

export function sanitizeSupportTicketInput(input: {
  category: string;
  urgency: string;
  subject: string;
  message: string;
}) {
  const category = BLUEPRINT_LIMITS.validTicketCategories.includes(
    input.category as (typeof BLUEPRINT_LIMITS.validTicketCategories)[number],
  )
    ? (input.category as (typeof BLUEPRINT_LIMITS.validTicketCategories)[number])
    : 'RECOVERY_HELP';
  const urgency = BLUEPRINT_LIMITS.validTicketUrgencies.includes(
    input.urgency as (typeof BLUEPRINT_LIMITS.validTicketUrgencies)[number],
  )
    ? (input.urgency as (typeof BLUEPRINT_LIMITS.validTicketUrgencies)[number])
    : 'STANDARD';
  const subject = input.subject.trim().slice(0, BLUEPRINT_LIMITS.ticketSubjectMaxLength);
  const message = input.message.trim().slice(0, BLUEPRINT_LIMITS.ticketMessageMaxLength);
  return { category, urgency, subject, message };
}

export function isValidFirestoreDocId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= BLUEPRINT_LIMITS.ownerIdMaxLength &&
    BLUEPRINT_LIMITS.ownerIdPattern.test(id)
  );
}
