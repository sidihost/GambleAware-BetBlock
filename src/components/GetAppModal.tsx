import React from 'react';
import { CheckCircle2, Download, Share2, Smartphone, Sparkles, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface GetAppModalProps {
  onClose: () => void;
}

export const GetAppModal: React.FC<GetAppModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Download GambleAware Nigeria"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="w-full max-w-[480px] rounded-t-[28px] border border-[var(--glass-border)] bg-[var(--surface)] p-5 text-[var(--ink)] sm:rounded-[28px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Get GambleAware App</h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Nigeria Edition • Black &amp; Pink Shield
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close download modal"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Option 1: Native Android APK */}
        <div className="mt-4 rounded-[20px] border border-[var(--glass-border)] bg-[var(--muted-fill)] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-bold text-[var(--ink)]">
              Android App (.apk)
            </p>
            <span className="font-mono text-[11px] font-semibold text-[var(--accent-ink)]">
              Android 7.0+
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
            Includes full Device Admin anti-uninstall lock, Accessibility WebView &amp; browser
            blocker, betting APK Install Guard, and Nigerian Naira tracker.
          </p>

          <a
            href="/downloads/GambleAware-Nigeria.apk"
            download="GambleAware-Nigeria.apk"
            className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            <span>Download Android APK</span>
          </a>

          <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--ink-muted)]">
            After downloading, tap the file in your notification tray and allow &ldquo;Install
            unknown apps&rdquo; for your browser.
          </p>
        </div>

        {/* Option 2: Installable Web App (PWA) */}
        <div className="mt-3 rounded-[20px] border border-[var(--subtle-border)] bg-[var(--canvas)] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-bold text-[var(--ink)]">
              Quick Web App (All Devices)
            </p>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">Offline Ready</span>
          </div>

          {isInstalled ? (
            <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-[var(--glass-border)] bg-[var(--muted-fill)] px-3.5 py-2.5 text-xs font-semibold text-[var(--accent-ink)]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Installed on your home screen</span>
            </div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={install}
              className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--muted-fill)] px-4 text-xs font-semibold text-[var(--ink)] hover:opacity-90"
            >
              <Sparkles className="h-4 w-4 text-[var(--accent-ink)]" />
              <span>Install Web App to Home Screen</span>
            </button>
          ) : isIOS ? (
            <div className="mt-2.5 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3 text-xs leading-relaxed text-[var(--ink-muted)]">
              <p className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                <Share2 className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                <span>Install on iPhone / iPad (Safari):</span>
              </p>
              <p className="mt-1">
                Tap the <strong>Share</strong> icon in Safari, then choose{' '}
                <strong>Add to Home Screen</strong>.
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              You can also install GambleAware from your browser menu (&ldquo;Install app&rdquo;
              or &ldquo;Add to Home screen&rdquo;) to run standalone offline.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
