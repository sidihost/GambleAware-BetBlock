import { DEFAULT_HIGH_RISK_SCHEDULE } from '../utils/highRiskGuard';
import { DEFAULT_RATE_LIMIT_CONFIG } from '../utils/rateLimiter';
import type { EvaluatedSurveyProfile } from '../utils/recoverySurvey';
import {
  BlockedAppEntity,
  BlockedDomainEntity,
  BlockedEventEntity,
  PrivateDnsStatus,
  ProtectionSettingsState,
  RecoveryGoalEntity,
  RelapseLogEntity,
  ThemeMode,
  UrgeLogEntity,
} from './types';

export const STORAGE_KEY = 'gambleaware_store_v1';

export interface PersistedStore {
  schemaVersion?: number;
  updatedAtMs?: number;
  preferredName: string;
  settings: ProtectionSettingsState;
  isAccessibilityEnabled: boolean;
  isDeviceAdminEnabled: boolean;
  privateDnsStatus: PrivateDnsStatus;
  goals: RecoveryGoalEntity[];
  domains: BlockedDomainEntity[];
  blockedApps: BlockedAppEntity[];
  events: BlockedEventEntity[];
  urgeLogs: UrgeLogEntity[];
  relapseLogs: RelapseLogEntity[];
  latestSurvey: EvaluatedSurveyProfile | null;
}

const PIN_ATTEMPT_KEY = 'gambleaware_pin_attempts_v1';
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 60_000;

function sha256Hex(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const k: number[] = [];
  const hash: number[] = [];

  const isPrime = (n: number) => {
    for (let f = 2; f * f <= n; f++) {
      if (n % f === 0) return false;
    }
    return true;
  };

  let primeCounter = 0;
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime(candidate)) continue;
    if (primeCounter < 8) {
      hash[primeCounter] = (Math.pow(candidate, 0.5) * 0x100000000) >>> 0;
    }
    k[primeCounter] = (Math.pow(candidate, 1 / 3) * 0x100000000) >>> 0;
    primeCounter++;
  }

  let padded = ascii + '\x80';
  while ((padded.length % 64) - 56) padded += '\x00';
  for (let i = 0; i < padded.length; i++) {
    const code = padded.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / 0x100000000) | 0;
  words[words.length] = asciiBitLength | 0;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i] || 0
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  return hash.map((h) => (h >>> 0).toString(16).padStart(8, '0')).join('');
}

function generateSaltHex(bytes = 4): string {
  const arr = new Uint8Array(bytes);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function stretchSaltedPin(salt: string, pin: string): string {
  let digest = `${salt}:${pin}:gambleaware_pin_v2`;
  for (let round = 0; round < 250; round++) {
    digest = sha256Hex(`${digest}:${salt}`);
  }
  return digest.slice(0, 32);
}

function legacyHashPinV1(pin: string): string {
  const input = `gambleaware_salt_v1:${pin}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function hashPinSync(pin: string): string {
  const salt = generateSaltHex(4);
  return `v2$${salt}$${stretchSaltedPin(salt, pin)}`;
}

export function verifyPinHashSync(pin: string, storedHash: string | null): boolean {
  if (!storedHash) return true;
  if (storedHash.startsWith('v2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || !parts[1] || !parts[2]) return false;
    const expected = stretchSaltedPin(parts[1], pin);
    return constantTimeEqual(expected, parts[2]);
  }
  return constantTimeEqual(legacyHashPinV1(pin), storedHash);
}

interface PinAttemptState {
  failedCount: number;
  lockedUntilMs: number;
}

export function getPinLockoutRemainingSec(nowMs: number = Date.now()): number {
  try {
    const raw = localStorage.getItem(PIN_ATTEMPT_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Partial<PinAttemptState>;
    const until = Number(parsed.lockedUntilMs || 0);
    if (until <= nowMs) return 0;
    return Math.ceil((until - nowMs) / 1000);
  } catch {
    return 0;
  }
}

export function recordFailedPinAttempt(nowMs: number = Date.now()): {
  attemptsLeft: number;
  lockedForSec: number;
} {
  try {
    const raw = localStorage.getItem(PIN_ATTEMPT_KEY);
    const prev: PinAttemptState = raw
      ? (JSON.parse(raw) as PinAttemptState)
      : { failedCount: 0, lockedUntilMs: 0 };
    const baseCount = prev.lockedUntilMs > nowMs ? MAX_PIN_ATTEMPTS : (prev.failedCount || 0);
    const nextCount = baseCount + 1;
    if (nextCount >= MAX_PIN_ATTEMPTS) {
      const lockedUntilMs = nowMs + PIN_LOCKOUT_MS;
      localStorage.setItem(PIN_ATTEMPT_KEY, JSON.stringify({ failedCount: 0, lockedUntilMs }));
      return { attemptsLeft: 0, lockedForSec: Math.ceil(PIN_LOCKOUT_MS / 1000) };
    }
    localStorage.setItem(PIN_ATTEMPT_KEY, JSON.stringify({ failedCount: nextCount, lockedUntilMs: 0 }));
    return { attemptsLeft: MAX_PIN_ATTEMPTS - nextCount, lockedForSec: 0 };
  } catch {
    return { attemptsLeft: 1, lockedForSec: 0 };
  }
}

export function clearPinAttemptState(): void {
  try {
    localStorage.removeItem(PIN_ATTEMPT_KEY);
  } catch {
    // Ignore storage quota errors
  }
}

export function createDefaultStore(): PersistedStore {
  const now = Date.now();
  return {
    schemaVersion: 5,
    updatedAtMs: 0,
    preferredName: '',
    settings: {
      isProtectionEnabled: true,
      blockSportsbooks: true,
      blockCasinos: true,
      blockPokerAndBingo: true,
      blockCryptoBetting: true,
      blockFantasyAndLottery: true,
      strictKeywordFilter: true,
      browserShieldEnabled: true,
      appShieldEnabled: true,
      searchGuardEnabled: true,
      adBlockerEnabled: true,
      playStoreGuardEnabled: true,
      antiTamperLockEnabled: true,
      lockUntilEpochMs: 0,
      pinHash: null,
      protectionStartedAtMs: now,
      dailyBetSpendEstimate: 5000,
      themeMode: ThemeMode.LIGHT,
      hasCompletedTour: false,
      hasCompletedInitialSetup: false,
      notificationsEnabled: true,
      lastNotifiedMilestoneDay: 0,
      goalReminderEnabled: true,
      highRiskSchedule: { ...DEFAULT_HIGH_RISK_SCHEDULE },
      rateLimitConfig: { ...DEFAULT_RATE_LIMIT_CONFIG },
      rateLimitCooldownUntilMs: 0,
      bankedUrgeSavingsNgn: 0,
      bankedUrgeCount: 0,
      depositGuardEnabled: true,
      buddyPartnerName: '',
      buddyChallengeCode: '',
      bankFreezeChecks: {},
    },
    isAccessibilityEnabled: true,
    isDeviceAdminEnabled: false,
    privateDnsStatus: {
      isActive: false,
      serverHost: null,
    },
    goals: [],
    domains: [],
    blockedApps: [],
    events: [],
    urgeLogs: [],
    relapseLogs: [],
    latestSurvey: null,
  };
}

export function normalizeStoreShape(parsed: Partial<PersistedStore>): PersistedStore {
  const fallback = createDefaultStore();
  const mergedSettings: ProtectionSettingsState = {
    ...fallback.settings,
    ...(parsed.settings ?? {}),
    highRiskSchedule: {
      ...DEFAULT_HIGH_RISK_SCHEDULE,
      ...(parsed.settings?.highRiskSchedule ?? {}),
    },
    bankedUrgeSavingsNgn:
      typeof parsed.settings?.bankedUrgeSavingsNgn === 'number'
        ? Math.max(0, parsed.settings.bankedUrgeSavingsNgn)
        : 0,
    bankedUrgeCount:
      typeof parsed.settings?.bankedUrgeCount === 'number'
        ? Math.max(0, parsed.settings.bankedUrgeCount)
        : 0,
    depositGuardEnabled:
      typeof parsed.settings?.depositGuardEnabled === 'boolean'
        ? parsed.settings.depositGuardEnabled
        : true,
    adBlockerEnabled:
      typeof parsed.settings?.adBlockerEnabled === 'boolean'
        ? parsed.settings.adBlockerEnabled
        : true,
    playStoreGuardEnabled:
      typeof parsed.settings?.playStoreGuardEnabled === 'boolean'
        ? parsed.settings.playStoreGuardEnabled
        : true,
    rateLimitConfig: {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...(parsed.settings?.rateLimitConfig ?? {}),
    },
    rateLimitCooldownUntilMs:
      typeof parsed.settings?.rateLimitCooldownUntilMs === 'number'
        ? Math.max(0, parsed.settings.rateLimitCooldownUntilMs)
        : 0,
    buddyPartnerName:
      typeof parsed.settings?.buddyPartnerName === 'string'
        ? parsed.settings.buddyPartnerName
        : '',
    buddyChallengeCode:
      typeof parsed.settings?.buddyChallengeCode === 'string'
        ? parsed.settings.buddyChallengeCode
        : '',
    bankFreezeChecks:
      parsed.settings?.bankFreezeChecks && typeof parsed.settings.bankFreezeChecks === 'object'
        ? { ...parsed.settings.bankFreezeChecks }
        : {},
  };

  if (!parsed.schemaVersion || parsed.schemaVersion < 3) {
    if (mergedSettings.dailyBetSpendEstimate < 500) {
      mergedSettings.dailyBetSpendEstimate = 5000;
    }
    mergedSettings.themeMode = ThemeMode.LIGHT;
  }

  return {
    schemaVersion: 5,
    updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : Date.now(),
    preferredName: typeof parsed.preferredName === 'string' ? parsed.preferredName : '',
    settings: mergedSettings,
    isAccessibilityEnabled:
      typeof parsed.isAccessibilityEnabled === 'boolean'
        ? parsed.isAccessibilityEnabled
        : fallback.isAccessibilityEnabled,
    isDeviceAdminEnabled:
      typeof parsed.isDeviceAdminEnabled === 'boolean'
        ? parsed.isDeviceAdminEnabled
        : fallback.isDeviceAdminEnabled,
    privateDnsStatus: parsed.privateDnsStatus ?? fallback.privateDnsStatus,
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    domains: Array.isArray(parsed.domains) ? parsed.domains : [],
    blockedApps: Array.isArray(parsed.blockedApps) ? parsed.blockedApps : [],
    events: Array.isArray(parsed.events) ? parsed.events : [],
    urgeLogs: Array.isArray(parsed.urgeLogs) ? parsed.urgeLogs : [],
    relapseLogs: Array.isArray(parsed.relapseLogs) ? parsed.relapseLogs : [],
    latestSurvey: parsed.latestSurvey ?? null,
  };
}

export function loadStore(): PersistedStore {
  const fallback = createDefaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    return normalizeStoreShape(parsed);
  } catch {
    return fallback;
  }
}

export function saveStore(store: PersistedStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}
