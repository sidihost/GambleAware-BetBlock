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

  const layers: ShieldDiagnosticLayer[] = [
    {
      id: 'dns',
      label: 'DNS & Browser Domain Shield',
      detail:
        settings.isProtectionEnabled && settings.browserShieldEnabled && isAccessibilityEnabled
          ? 'Blocking 820+ sportsbooks, casinos, crash sites & mirrors'
          : 'Enable core Shield & Browser Guard to intercept betting domains',
      isHealthy: settings.isProtectionEnabled && settings.browserShieldEnabled && isAccessibilityEnabled,
      weight: 25,
    },
    {
      id: 'admin_uninstall',
      label: 'Device Admin Uninstall Lock',
      detail: isDeviceAdminEnabled
        ? 'OS Admin guard prevents impulsive uninstall until Commitment Lock clears'
        : 'Arm Device Admin in Lock Settings to prevent impulsive app removal',
      isHealthy: isDeviceAdminEnabled,
      weight: 25,
    },
    {
      id: 'search_redirect',
      label: 'Search, Redirect & Homoglyph Guard',
      detail:
        settings.searchGuardEnabled && settings.strictKeywordFilter
          ? 'Unwraps social redirects (ig/t.co), homoglyph spoofs & betting queries'
          : 'Enable Search Guard & Strict Keywords to catch redirect links',
      isHealthy: settings.searchGuardEnabled && settings.strictKeywordFilter,
      weight: 20,
    },
    {
      id: 'deposit_guard',
      label: 'Cashier, Booking-Code & App Firewall',
      detail:
        settings.appShieldEnabled && settings.depositGuardEnabled !== false
          ? 'Blocks 150+ betting packages, deposit portals & shared booking codes'
          : 'Enable App & Deposit Firewall to stop checkout redirects',
      isHealthy: settings.appShieldEnabled && settings.depositGuardEnabled !== false,
      weight: 15,
    },
    {
      id: 'tamper_lock',
      label: 'Commitment Timer / PIN Co-Lock',
      detail:
        isTimeLocked || Boolean(settings.pinHash) || settings.antiTamperLockEnabled
          ? isTimeLocked
            ? 'Countdown Commitment Lock active — rule weakening disabled'
            : 'Tamper Guard / PIN armed against moment-of-weakness edits'
          : 'Set a PIN or Commitment Timer in Lock Settings',
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
