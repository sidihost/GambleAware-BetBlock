import { ProtectionSettingsState } from '../data/types';

export interface ShieldDiagnosticLayer {
  id: 'dns' | 'admin_uninstall' | 'search_redirect' | 'deposit_guard' | 'tamper_lock';
  label: string;
  detail: string;
  isHealthy: boolean;
  weight: number;
}

export interface ShieldLeakAudit {
  score: number;
  gradeLabel: 'Fortified' | 'Hardened' | 'Partial' | 'Exposed';
  healthyCount: number;
  totalCount: number;
  layers: ShieldDiagnosticLayer[];
}

export function evaluateShieldLeakAudit(params: {
  settings: ProtectionSettingsState;
  isAccessibilityEnabled: boolean;
  isDeviceAdminEnabled: boolean;
  nowMs?: number;
}): ShieldLeakAudit {
  const { settings, isAccessibilityEnabled, isDeviceAdminEnabled, nowMs = Date.now() } = params;
  const isTimeLocked = settings.lockUntilEpochMs > nowMs;

  const adGuardOn = settings.adBlockerEnabled !== false;
  const layers: ShieldDiagnosticLayer[] = [
    {
      id: 'dns',
      label: 'All-Browser Site Shield',
      detail:
        settings.isProtectionEnabled && settings.browserShieldEnabled && isAccessibilityEnabled
          ? 'Blocks sites as you type in Chrome, Firefox, Opera, Brave, Edge, and in-app browsers without taking a VPN slot'
          : 'Turn on Shield and Accessibility access to block sites across browsers without a VPN',
      isHealthy: settings.isProtectionEnabled && settings.browserShieldEnabled && isAccessibilityEnabled,
      weight: 25,
    },
    {
      id: 'admin_uninstall',
      label: 'Device Admin Uninstall Lock',
      detail: isDeviceAdminEnabled
        ? 'Prevents App Info uninstall, Force Stop, and Admin removal while locked'
        : 'Enable Device Admin in Lock settings to stop impulsive uninstalls',
      isHealthy: isDeviceAdminEnabled,
      weight: 25,
    },
    {
      id: 'search_redirect',
      label: 'Gambling Ad & Redirect Filter',
      detail:
        settings.searchGuardEnabled && settings.strictKeywordFilter && adGuardOn
          ? 'Filters betting ad networks, popunders, affiliate links, and lookalike domains'
          : 'Enable Ad Blocker, Search Guard, and strict keywords to catch redirects',
      isHealthy: settings.searchGuardEnabled && settings.strictKeywordFilter && adGuardOn,
      weight: 20,
    },
    {
      id: 'deposit_guard',
      label: 'App, Cashier & Booking-Code Block',
      detail:
        settings.appShieldEnabled && settings.depositGuardEnabled !== false
          ? 'Covers 150+ betting apps, deposit checkouts, and shared slip links'
          : 'Enable App & Deposit protection to block checkout pages',
      isHealthy: settings.appShieldEnabled && settings.depositGuardEnabled !== false,
      weight: 15,
    },
    {
      id: 'tamper_lock',
      label: 'Lock Timer & Rule Protection',
      detail:
        isTimeLocked || Boolean(settings.pinHash) || settings.antiTamperLockEnabled
          ? isTimeLocked
            ? 'Countdown lock active — weakening rules is disabled'
            : 'PIN and rule protection active against impulse changes'
          : 'Set a PIN or lock timer in Lock settings',
      isHealthy: isTimeLocked || Boolean(settings.pinHash) || settings.antiTamperLockEnabled,
      weight: 15,
    },
  ];

  const score = layers.reduce((acc, layer) => acc + (layer.isHealthy ? layer.weight : 0), 0);
  const healthyCount = layers.filter((l) => l.isHealthy).length;
  const gradeLabel: ShieldLeakAudit['gradeLabel'] =
    score >= 95 ? 'Fortified' : score >= 75 ? 'Hardened' : score >= 45 ? 'Partial' : 'Exposed';

  return {
    score,
    gradeLabel,
    healthyCount,
    totalCount: layers.length,
    layers,
  };
}
