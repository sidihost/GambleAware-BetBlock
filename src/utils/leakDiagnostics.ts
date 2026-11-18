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
      label: 'Accessibility All-Browser Shield',
      detail:
        settings.isProtectionEnabled && settings.browserShieldEnabled && isAccessibilityEnabled
          ? 'Blocks while typing across Chrome, Firefox, Opera, Brave, Edge & in-app browsers — zero VPN required'
          : 'Enable core Shield & Accessibility Browser Guard to intercept betting sites without a VPN',
      isHealthy: settings.isProtectionEnabled && settings.browserShieldEnabled && isAccessibilityEnabled,
      weight: 25,
    },
    {
      id: 'admin_uninstall',
      label: 'Device Admin & Settings Guard',
      detail: isDeviceAdminEnabled
        ? 'Blocks App Info uninstall, Force Stop, and Device Admin deactivation until your timer expires'
        : 'Arm Device Admin in Lock Settings to stop impulsive uninstall or tampering',
      isHealthy: isDeviceAdminEnabled,
      weight: 25,
    },
    {
      id: 'search_redirect',
      label: 'Ad, Popunder & Redirect Guard',
      detail:
        settings.searchGuardEnabled && settings.strictKeywordFilter && adGuardOn
          ? 'Blocks gambling ads, popunders, affiliate links, social redirects & spoofed URLs'
          : 'Enable Ad Blocker, Search Guard & Strict Keywords to catch promos and redirects',
      isHealthy: settings.searchGuardEnabled && settings.strictKeywordFilter && adGuardOn,
      weight: 20,
    },
    {
      id: 'deposit_guard',
      label: 'Cashier, Booking-Code & App Firewall',
      detail:
        settings.appShieldEnabled && settings.depositGuardEnabled !== false
          ? 'Blocks 150+ betting apps, deposit checkouts & shared booking codes'
          : 'Enable App & Deposit Firewall to stop checkout redirects',
      isHealthy: settings.appShieldEnabled && settings.depositGuardEnabled !== false,
      weight: 15,
    },
    {
      id: 'tamper_lock',
      label: 'Commitment Timer & Cloud Sync',
      detail:
        isTimeLocked || Boolean(settings.pinHash) || settings.antiTamperLockEnabled
          ? isTimeLocked
            ? 'Countdown Commitment Lock active — rule weakening disabled'
            : 'Tamper Guard & PIN armed against moment-of-weakness edits'
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
