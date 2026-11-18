export type NotificationKind = 'test' | 'milestone' | 'lock' | 'relapse_support' | 'daily_checkin';

export interface NotificationPermissionSummary {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
}

export interface LocalNotificationPayload {
  kind: NotificationKind;
  title: string;
  body: string;
  tag: string;
}

export function getNotificationCapability(): NotificationPermissionSummary {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, permission: 'unsupported' };
  }
  return {
    supported: true,
    permission: Notification.permission,
  };
}

export function buildNotificationPayload(
  kind: NotificationKind,
  context?: { cleanDays?: number; savedFormatted?: string; lockLabel?: string },
): LocalNotificationPayload {
  switch (kind) {
    case 'milestone': {
      const days = Math.max(1, context?.cleanDays ?? 1);
      const savedPart = context?.savedFormatted ? ` (~${context.savedFormatted} saved)` : '';
      return {
        kind,
        title: `${days} Day${days === 1 ? '' : 's'} Betting-Free`,
        body: `Milestone reached${savedPart}. Every clean day weakens gambling triggers.`,
        tag: `gambleaware-milestone-${days}`,
      };
    }
    case 'lock': {
      const span = context?.lockLabel || 'Active';
      return {
        kind,
        title: `Commitment Lock Armed (${span})`,
        body: 'Anti-tamper & blocklist protection remain locked until your timer reaches zero.',
        tag: 'gambleaware-lock-armed',
      };
    }
    case 'relapse_support':
      return {
        kind,
        title: 'Reset Complete · Shield Hardened',
        body: 'A slip does not erase your progress. Focus on the next 24 hours with your tightened rules.',
        tag: 'gambleaware-relapse-reset',
      };
    case 'daily_checkin':
      return {
        kind,
        title: 'Evening Check-In · Stay Grounded',
        body: 'Protect your sleep and keep your phone away from late-night betting triggers.',
        tag: 'gambleaware-daily-checkin',
      };
    case 'test':
    default:
      return {
        kind: 'test',
        title: 'GambleAware Alerts Working',
        body: 'Milestone, Commitment Lock, and relapse-support alerts are ready on this device.',
        tag: 'gambleaware-test-alert',
      };
  }
}

export async function requestAndDispatchNotification(
  payload: LocalNotificationPayload,
  askPermissionIfDefault = true,
): Promise<{ delivered: boolean; permission: NotificationPermission | 'unsupported'; error?: string }> {
  const cap = getNotificationCapability();
  if (!cap.supported) {
    return {
      delivered: false,
      permission: 'unsupported',
      error: 'Browser notifications are unavailable in this context (use Home Screen PWA or Android app).',
    };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'default' && askPermissionIfDefault) {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return {
        delivered: false,
        permission: Notification.permission,
        error: 'Notification permission prompt was dismissed.',
      };
    }
  }

  if (permission !== 'granted') {
    return {
      delivered: false,
      permission,
      error:
        permission === 'denied'
          ? 'Notifications are blocked in browser/site settings. Enable notifications to receive alerts.'
          : 'Notification permission is required first.',
    };
  }

  // Prefer active Service Worker registration on mobile PWAs / iOS / Android Chrome
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: payload.tag,
        });
        return { delivered: true, permission };
      }
    }
  } catch {
    // Fall back to direct Notification constructor below
  }

  try {
    new Notification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      tag: payload.tag,
    });
    return { delivered: true, permission };
  } catch {
    return {
      delivered: false,
      permission,
      error: 'Browser blocked foreground popup — add GambleAware to Home Screen to enable PWA alerts.',
    };
  }
}
