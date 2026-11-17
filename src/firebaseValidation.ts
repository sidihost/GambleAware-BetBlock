export const BLUEPRINT_LIMITS = {
  ownerIdMaxLength: 128,
  ownerIdPattern: /^[a-zA-Z0-9_-]+$/,
  emailMaxLength: 254,
  displayNameMaxLength: 120,
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
  validSources: ['Web Shield', 'In-App WebView', 'App Shield', 'Install Guard'] as const,
  triggerTagMaxLength: 40,
  urgeNoteMaxLength: 280,
  maxDailyBetSpendNgn: 10_000_000,
} as const;

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

export function isValidFirestoreDocId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= BLUEPRINT_LIMITS.ownerIdMaxLength &&
    BLUEPRINT_LIMITS.ownerIdPattern.test(id)
  );
}
