import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  MoreVertical,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { ANDROID_APK_DOWNLOAD_URL } from '../utils/platformCompatibility';
import { BrandGMark } from './AppHeader';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'secondary' | 'header';
  label?: string;
  className?: string;
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'secondary',
  label,
  className = '',
  onInstalled,
}) => {
  const {
    isInstalled,
    isInstallable,
    isInIframe,
    clientPlatform,
    standaloneInstallUrl,
    install,
  } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  if (isInstalled) {
    return null;
  }

  const buttonText =
    label ??
    (variant === 'header'
      ? 'Install'
      : clientPlatform === 'ios'
        ? 'Install on iPhone'
        : 'Install Web App');

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        onInstalled?.();
        return;
      }
      if (outcome === 'dismissed') {
        return;
      }
    }
    setModalOpen(true);
  };

  const baseStyles =
    variant === 'primary'
      ? 'inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90 sm:h-11 sm:text-sm'
      : variant === 'header'
        ? 'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 text-xs font-semibold whitespace-nowrap text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)] sm:h-9 sm:px-3'
        : 'inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)] sm:h-11 sm:text-sm';

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        data-testid="pwa-install-button"
        className={`${baseStyles} ${className}`}
      >
        <Smartphone className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
        <span>{buttonText}</span>
      </button>

      {modalOpen ? (
        <PWAInstallModal
          isInIframe={isInIframe}
          clientPlatform={clientPlatform}
          standaloneInstallUrl={standaloneInstallUrl}
          hasNativePrompt={isInstallable}
          onTriggerNativePrompt={async () => {
            const outcome = await install();
            if (outcome === 'accepted') {
              setModalOpen(false);
              onInstalled?.();
            }
          }}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
};

interface PWAInstallModalProps {
  isInIframe: boolean;
  clientPlatform: 'ios' | 'android' | 'desktop';
  standaloneInstallUrl: string;
  hasNativePrompt: boolean;
  onTriggerNativePrompt: () => Promise<void>;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isInIframe,
  clientPlatform,
  standaloneInstallUrl,
  hasNativePrompt,
  onTriggerNativePrompt,
  onClose,
}) => {
  const [tab, setTab] = useState<'android' | 'ios' | 'desktop'>(
    clientPlatform === 'ios' ? 'ios' : clientPlatform === 'android' ? 'android' : 'desktop',
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install GambleAware"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="flex max-h-[90dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--subtle-border)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <BrandGMark className="h-8 w-8 shrink-0" />
            <div>
              <h2 className="font-display text-base font-bold text-[var(--ink)]">
                Install GambleAware
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Save to your home screen or install on Android
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close install guide"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-3.5 sm:px-5">
          {isInIframe ? (
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] p-3.5">
              <p className="text-xs font-semibold text-[var(--ink)]">
                Open in your browser to install
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                Embedded preview frames block browser install prompts. Open GambleAware in its own
                browser tab first, then tap Install.
              </p>
              <a
                href={standaloneInstallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span>Open in Browser Tab</span>
              </a>
            </div>
          ) : hasNativePrompt ? (
            <button
              type="button"
              onClick={() => void onTriggerNativePrompt()}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:text-sm"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Install App Now</span>
            </button>
          ) : null}

          {/* Platform Switcher */}
          <div
            role="tablist"
            aria-label="Choose device type"
            className="grid grid-cols-3 gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-1 text-xs"
          >
            {(
              [
                { id: 'android', label: 'Android' },
                { id: 'ios', label: 'iPhone / iPad' },
                { id: 'desktop', label: 'Desktop' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`cursor-pointer rounded-full py-1.5 font-semibold transition-colors ${
                  tab === item.id
                    ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'android' ? (
            <div className="space-y-3 text-xs leading-relaxed text-[var(--ink-muted)]">
              <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5">
                <p className="font-semibold text-[var(--ink)]">
                  Option A: Full Android App (APK)
                </p>
                <p className="mt-1">
                  Needed for system-wide blocking across Chrome, Brave, Firefox, social browsers, and
                  uninstall lock.
                </p>
                <a
                  href={ANDROID_APK_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download GambleAware-Nigeria.apk</span>
                </a>
                <div className="mt-3 space-y-1.5 border-t border-[var(--subtle-border)] pt-2.5 text-[11px]">
                  <p className="flex items-start gap-1.5 font-semibold text-[var(--ink)]">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                    <span>If Android shows &ldquo;App not installed.&rdquo;:</span>
                  </p>
                  <p>
                    1. Uninstall any older GambleAware build first so signing keys match (if
                    Uninstall Lock was on, open{' '}
                    <span className="font-semibold text-[var(--ink)]">
                      Settings → Security → Device admin apps
                    </span>{' '}
                    and deactivate GambleAware first).
                  </p>
                  <p>
                    2. Allow{' '}
                    <span className="font-semibold text-[var(--ink)]">Install unknown apps</span>{' '}
                    for Chrome or Files and keep 50 MB+ free storage.
                  </p>
                  <p>
                    3. If Play Protect asks, tap{' '}
                    <span className="font-semibold text-[var(--ink)]">
                      More details → Install anyway
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5">
                <p className="font-semibold text-[var(--ink)]">
                  Option B: Add to Home Screen in Chrome
                </p>
                <ol className="mt-1.5 space-y-1">
                  <li>
                    1. Open the page in Chrome (outside any in-app viewer) and tap the{' '}
                    <MoreVertical className="inline h-3.5 w-3.5 text-[var(--ink)]" /> menu.
                  </li>
                  <li>
                    2. Tap <span className="font-semibold text-[var(--ink)]">Add to Home screen</span>{' '}
                    → <span className="font-semibold text-[var(--ink)]">Install</span>.
                  </li>
                </ol>
              </div>
            </div>
          ) : null}

          {tab === 'ios' ? (
            <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              <p className="font-semibold text-[var(--ink)]">Install in Safari on iPhone or iPad</p>
              <ol className="mt-2 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                  <span>
                    Open <span className="font-mono text-[var(--ink)]">/?app=1</span> in{' '}
                    <span className="font-semibold text-[var(--ink)]">Safari</span> (Chrome on iOS
                    does not support Add to Home Screen).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Share className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                  <span>
                    Tap the <span className="font-semibold text-[var(--ink)]">Share</span> button at
                    the bottom of Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
                  <span>
                    Scroll down, tap{' '}
                    <span className="font-semibold text-[var(--ink)]">Add to Home Screen</span>, then
                    tap <span className="font-semibold text-[var(--ink)]">Add</span>.
                  </span>
                </li>
              </ol>
            </div>
          ) : null}

          {tab === 'desktop' ? (
            <div className="rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              <p className="font-semibold text-[var(--ink)]">Install in Chrome or Edge</p>
              <ol className="mt-2 space-y-2">
                <li>
                  1. Make sure GambleAware is open in its own browser tab (not an embedded preview).
                </li>
                <li>
                  2. Click the install icon in the right side of the address bar, or open browser menu{' '}
                  → <span className="font-semibold text-[var(--ink)]">Save and share → Install GambleAware</span>.
                </li>
                <li>3. Confirm Install to launch GambleAware in its own standalone window.</li>
              </ol>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-[var(--subtle-border)] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] shadow-lg md:bottom-5"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
      <span>Offline — on-device rules remain active</span>
    </div>
  );
};
