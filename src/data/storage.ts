import {
  BlockedAppEntity,
  BlockedDomainEntity,
  BlockedEventEntity,
  PrivateDnsStatus,
  ProtectionSettingsState,
  ThemeMode,
  UrgeLogEntity,
} from './types';

const STORAGE_KEY = 'gambleaware_store_v1';

export interface PersistedStore {
  schemaVersion?: number;
  settings: ProtectionSettingsState;
  isAccessibilityEnabled: boolean;
  isDeviceAdminEnabled: boolean;
  privateDnsStatus: PrivateDnsStatus;
  domains: BlockedDomainEntity[];
  blockedApps: BlockedAppEntity[];
  events: BlockedEventEntity[];
  urgeLogs: UrgeLogEntity[];
}

export function hashPinSync(pin: string): string {
  // Deterministic FNV-1a + SHA-style salted digest so PIN verification is synchronous
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

export function createDefaultStore(): PersistedStore {
  const now = Date.now();
  return {
    schemaVersion: 2,
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
      antiTamperLockEnabled: true,
      lockUntilEpochMs: 0,
      pinHash: null,
      protectionStartedAtMs: now,
      dailyBetSpendEstimate: 5000,
      themeMode: ThemeMode.DARK,
      hasCompletedTour: false,
      notificationsEnabled: true,
      lastNotifiedMilestoneDay: 0,
    },
    isAccessibilityEnabled: true,
    isDeviceAdminEnabled: false,
    privateDnsStatus: {
      isActive: false,
      serverHost: null,
    },
    domains: [],
    blockedApps: [],
    events: [],
    urgeLogs: [],
  };
}

export function loadStore(): PersistedStore {
  const fallback = createDefaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    const mergedSettings: ProtectionSettingsState = {
      ...fallback.settings,
      ...(parsed.settings ?? {}),
    };

    // Migrate v1 USD/monochrome-light defaults cleanly to Naira & Black-and-Pink
    if (!parsed.schemaVersion || parsed.schemaVersion < 2) {
      if (mergedSettings.dailyBetSpendEstimate < 500) {
        mergedSettings.dailyBetSpendEstimate = 5000;
      }
      if (mergedSettings.themeMode === ThemeMode.LIGHT) {
        mergedSettings.themeMode = ThemeMode.DARK;
      }
    }

    return {
      schemaVersion: 2,
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
      domains: Array.isArray(parsed.domains) ? parsed.domains : [],
      blockedApps: Array.isArray(parsed.blockedApps) ? parsed.blockedApps : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      urgeLogs: Array.isArray(parsed.urgeLogs) ? parsed.urgeLogs : [],
    };
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
