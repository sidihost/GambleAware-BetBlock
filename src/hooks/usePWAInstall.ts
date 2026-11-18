import { useCallback, useEffect, useState } from 'react';
import {
  buildStandaloneInstallUrl,
  type ClientPlatform,
  detectClientPlatform,
  type InstallActionMode,
  resolveInstallActionMode,
} from '../utils/platformCompatibility';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let earlyCapturedPrompt: BeforeInstallPromptEvent | null = null;
let earlyCaptureAttached = false;
const promptListeners = new Set<() => void>();

function notifyPromptListeners() {
  for (const listener of promptListeners) {
    listener();
  }
}

export function captureEarlyInstallPrompt() {
  if (typeof window === 'undefined' || earlyCaptureAttached) return;
  earlyCaptureAttached = true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    earlyCapturedPrompt = e as BeforeInstallPromptEvent;
    notifyPromptListeners();
  });

  window.addEventListener('appinstalled', () => {
    earlyCapturedPrompt = null;
    notifyPromptListeners();
  });
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function checkIsInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => earlyCapturedPrompt,
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsStandalone());
  const [isInIframe, setIsInIframe] = useState<boolean>(() => checkIsInIframe());
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return detectClientPlatform(
      window.navigator.userAgent,
      window.navigator.maxTouchPoints ?? 0,
    );
  });

  useEffect(() => {
    captureEarlyInstallPrompt();
    setIsInstalled(checkIsStandalone());
    setIsInIframe(checkIsInIframe());
    setDeferredPrompt(earlyCapturedPrompt);

    const detected = detectClientPlatform(
      window.navigator.userAgent,
      window.navigator.maxTouchPoints ?? 0,
    );
    setClientPlatform(detected);

    const syncPrompt = () => {
      setDeferredPrompt(earlyCapturedPrompt);
      if (checkIsStandalone()) {
        setIsInstalled(true);
      }
    };

    promptListeners.add(syncPrompt);

    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };
    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    const handleInstalled = () => {
      earlyCapturedPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      promptListeners.delete(syncPrompt);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptEvent = deferredPrompt ?? earlyCapturedPrompt;
    if (!promptEvent) return 'unavailable';
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        earlyCapturedPrompt = null;
        setDeferredPrompt(null);
        setIsInstalled(true);
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const installMode: InstallActionMode = resolveInstallActionMode({
    isInstalled,
    hasDeferredPrompt: Boolean(deferredPrompt ?? earlyCapturedPrompt),
    isInIframe,
  });

  const standaloneInstallUrl =
    typeof window !== 'undefined' ? buildStandaloneInstallUrl(window.location.href) : '/?app=1';

  return {
    isInstallable: Boolean(deferredPrompt ?? earlyCapturedPrompt),
    isInstalled,
    isInIframe,
    isIOS: clientPlatform === 'ios',
    clientPlatform,
    installMode,
    standaloneInstallUrl,
    install,
  };
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return online;
}
