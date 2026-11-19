import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  HeartHandshake,
  Phone,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  ANDROID_APK_DOWNLOAD_URL,
  APK_DOWNLOAD_FILENAME,
  buildApkShareUrl,
  ClientPlatform,
  formatIosBlocklistText,
  getDefaultInstallGuideTarget,
  TOP_BETTING_DOMAINS_FOR_IOS,
} from '../utils/platformCompatibility';
import { RECOVERY_RESOURCES } from '../utils/recoveryResources';

interface DeploymentHubProps {
  clientPlatform: ClientPlatform;
  downloadStarted: boolean;
  onTriggerApkDownload: () => void;
}

const ANDROID_STEPS = [
  {
    step: '01',
    title: 'Download the signed APK',
    detail:
      'Tap Download Android App (APK) to save GambleAware-Nigeria.apk directly to your device.',
  },
  {
    step: '02',
    title: 'Allow browser install & open',
    detail:
      'Tap the finished download notification. If Android prompts "Install unknown apps", enable it for Chrome once.',
  },
  {
    step: '03',
    title: 'Arm Zero-VPN Shield & Lock',
    detail:
      'Complete the guided 3-step setup: enable Accessibility Shield, turn on Device Admin Guard, and pick a Commitment Lock timer.',
  },
];

const IOS_STEPS = [
  {
    step: '01',
    title: 'Open Screen Time Content Restrictions',
    detail:
      'On your iPhone, go to Settings → Screen Time → Content & Privacy Restrictions → Content Restrictions → Web Content.',
  },
  {
    step: '02',
    title: 'Enable Limit Adult Websites & paste domains',
    detail:
      'Copy our 22 high-risk betting domains below and add them under "Never Allow" to block Safari, Chrome, and embedded links.',
  },
  {
    step: '03',
    title: 'Ask a trusted partner to set the passcode',
    detail:
      'Set a Screen Time passcode held by a trusted friend or family member so restrictions cannot be removed during urges.',
  },
];

export const DeploymentHub: React.FC<DeploymentHubProps> = ({
  clientPlatform,
  downloadStarted,
  onTriggerApkDownload,
}) => {
  const [guideTab, setGuideTab] = useState<'android' | 'ios'>(() =>
    getDefaultInstallGuideTarget(clientPlatform),
  );
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const [copiedApkLink, setCopiedApkLink] = useState(false);
  const [copiedIosList, setCopiedIosList] = useState(false);

  const helplines = useMemo(
    () => RECOVERY_RESOURCES.filter((r) => r.category === 'HELPLINES'),
    [],
  );

  const handleCopyApkLink = async () => {
    const shareUrl = buildApkShareUrl(
      typeof window !== 'undefined' ? window.location.origin : '',
    );
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedApkLink(true);
      window.setTimeout(() => setCopiedApkLink(false), 2200);
    } catch {
      setCopiedApkLink(false);
    }
  };

  const handleCopyIosDomains = async () => {
    try {
      await navigator.clipboard.writeText(formatIosBlocklistText());
      setCopiedIosList(true);
      window.setTimeout(() => setCopiedIosList(false), 2200);
    } catch {
      setCopiedIosList(false);
    }
  };

  return (
    <section
      id="install"
      aria-labelledby="install-heading"
      className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20"
    >
      <div className="mb-8 max-w-2xl">
        <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
          07 · Download &amp; Setup Guide
        </p>
        <h2
          id="install-heading"
          className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl"
        >
          Install in under two minutes.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
          Direct Android app download, plus a free Screen Time setup guide for iPhone and iPad users.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 5 cols: Direct Android Release Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--soft-accent-bg)] text-[var(--accent-ink)]">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-[var(--ink)]">
                    GambleAware for Android
                  </h3>
                  <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                    100% Free App · Android 7.0+
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
              Full Android protection covering all browsers, betting apps, popunder ads, uninstall protection, Commitment Lock timer, and Trusted Buddy Co-Lock.
            </p>

            {downloadStarted ? (
              <div
                role="status"
                data-testid="apk-download-feedback"
                className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[var(--safe-border)] bg-[var(--safe-bg)] p-3.5 text-xs text-[var(--safe-ink)]"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Download started: {APK_DOWNLOAD_FILENAME}</p>
                  <p className="mt-0.5 opacity-90">
                    Open your browser Downloads bar and tap the file to install GambleAware on your phone.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-2.5">
              <a
                href={ANDROID_APK_DOWNLOAD_URL}
                download={APK_DOWNLOAD_FILENAME}
                data-testid="install-hub-download-btn"
                onClick={onTriggerApkDownload}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>Download Android App (APK)</span>
              </a>

              <button
                type="button"
                data-testid="copy-apk-link-btn"
                onClick={handleCopyApkLink}
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-[var(--glass-border)]"
              >
                {copiedApkLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[var(--safe-ink)]" />
                    <span>Download Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Download Link to Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-6 border-t border-[var(--subtle-border)] pt-4 font-mono text-[11px] text-[var(--ink-muted)]">
            Free forever · Ready to install · 100% private on your phone
          </p>
        </div>

        {/* Right 7 cols: Tabbed Setup Guide (Android APK / iPhone Screen Time) */}
        <div className="rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--subtle-border)] pb-4">
            <h3 className="font-display text-lg font-bold text-[var(--ink)]">
              Step-by-Step Setup Guide
            </h3>
            <div
              role="tablist"
              aria-label="Platform setup guide"
              className="inline-flex items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={guideTab === 'android'}
                data-testid="guide-tab-android"
                onClick={() => setGuideTab('android')}
                className={`cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  guideTab === 'android'
                    ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                Android APK
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={guideTab === 'ios'}
                data-testid="guide-tab-ios"
                onClick={() => setGuideTab('ios')}
                className={`cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  guideTab === 'ios'
                    ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                iPhone Screen Time
              </button>
            </div>
          </div>

          {guideTab === 'android' ? (
            <div className="mt-5 space-y-4" data-testid="guide-panel-android">
              <ol className="space-y-3.5">
                {ANDROID_STEPS.map((item) => (
                  <li
                    key={item.step}
                    className="flex items-start gap-3.5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4"
                  >
                    <span className="font-mono text-xs font-bold text-[var(--accent-ink)]">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold text-[var(--ink)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Collapsible Troubleshooting Disclosure */}
              <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)]">
                <button
                  type="button"
                  data-testid="troubleshoot-toggle-btn"
                  aria-expanded={troubleshootOpen}
                  onClick={() => setTroubleshootOpen((open) => !open)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left text-xs font-semibold text-[var(--ink)]"
                >
                  <span>Seeing &ldquo;File might be harmful&rdquo; or Android Restricted Settings?</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--ink-muted)] transition-transform ${
                      troubleshootOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {troubleshootOpen ? (
                  <div
                    data-testid="troubleshoot-content"
                    className="space-y-2 border-t border-[var(--subtle-border)] px-4 py-3.5 text-xs leading-relaxed text-[var(--ink-muted)]"
                  >
                    <p>
                      <strong className="text-[var(--ink)]">Chrome download prompt:</strong> Android shows this standard message for every APK downloaded outside Google Play. Tap <em>Download anyway</em> to continue.
                    </p>
                    <p>
                      <strong className="text-[var(--ink)]">Android 13+ Restricted Settings:</strong> If Accessibility appears greyed out, open <em>Settings → Apps → GambleAware → top-right ⋮ menu → Allow restricted settings</em>, then return to enable GambleAware Shield.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4" data-testid="guide-panel-ios">
              <ol className="space-y-3">
                {IOS_STEPS.map((item) => (
                  <li
                    key={item.step}
                    className="flex items-start gap-3.5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4"
                  >
                    <span className="font-mono text-xs font-bold text-[var(--accent-ink)]">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold text-[var(--ink)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[var(--ink)]">
                    Top {TOP_BETTING_DOMAINS_FOR_IOS.length} Betting Domains for iPhone Screen Time
                  </p>
                  <button
                    type="button"
                    data-testid="copy-ios-domains-btn"
                    onClick={handleCopyIosDomains}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3 py-1 text-[11px] font-semibold text-[var(--active-content)] hover:opacity-90"
                  >
                    {copiedIosList ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied 22 Domains</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy All 22 Domains</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-[var(--ink-muted)]">
                  {TOP_BETTING_DOMAINS_FOR_IOS.join(' · ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiet Confidential Recovery Helplines Strip */}
      <div className="mt-10 rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="h-5 w-5 text-[var(--accent-ink)]" />
            <div>
              <h3 className="font-display text-base font-bold text-[var(--ink)]">
                Confidential Recovery Helplines
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                Always allowlisted by GambleAware Safe-Support Guard — free and confidential.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {helplines.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4"
            >
              <div>
                <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
                  {item.region}
                </p>
                <p className="mt-1 font-display text-sm font-bold text-[var(--ink)]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                  {item.subtitle}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--subtle-border)] pt-3 text-xs font-semibold">
                {item.phone ? (
                  <a
                    href={`tel:${item.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1 font-mono text-[var(--accent-ink)] hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{item.phone}</span>
                  </a>
                ) : null}
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--ink)] hover:underline"
                  >
                    <span>Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
