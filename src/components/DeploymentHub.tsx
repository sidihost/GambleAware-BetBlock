import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  HeartHandshake,
  HelpCircle,
  Lock,
  Phone,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { BrandGMark } from './AppHeader';
import { getRegistryMetrics } from '../utils/interactiveDemo';
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

interface InstallStep {
  step: string;
  title: string;
  detail: string;
  pathHint: string;
  duration: string;
}

const ANDROID_STEPS: InstallStep[] = [
  {
    step: '01',
    title: 'Download the signed Android app',
    detail:
      'Tap Download Android App (APK) to save GambleAware-Nigeria.apk directly to your phone.',
    pathHint: 'Browser Downloads → GambleAware-Nigeria.apk',
    duration: '~15 sec',
  },
  {
    step: '02',
    title: 'Allow browser install & open',
    detail:
      'Tap the finished download notification. If Android prompts "Install unknown apps", allow Chrome once to complete installation.',
    pathHint: 'Install unknown apps → Allow from this source',
    duration: '~20 sec',
  },
  {
    step: '03',
    title: 'Arm Zero-VPN Shield & Commitment Lock',
    detail:
      'Follow the in-app 3-step Welcome setup: turn on Accessibility Shield, enable Uninstall Lock, and choose your Commitment Lock timer.',
    pathHint: 'Accessibility → GambleAware → Use Shield',
    duration: '~45 sec',
  },
];

const IOS_STEPS: InstallStep[] = [
  {
    step: '01',
    title: 'Open Screen Time Content Restrictions',
    detail:
      'On your iPhone or iPad, open Content & Privacy Restrictions and switch on Web Content filtering.',
    pathHint: 'Settings → Screen Time → Content Restrictions → Web Content',
    duration: '~25 sec',
  },
  {
    step: '02',
    title: 'Enable Limit Adult Websites & paste domains',
    detail:
      'Copy our 22 high-risk betting domains below and add them under "Never Allow" to block Safari, Chrome, and embedded browser links.',
    pathHint: 'Web Content → Limit Adult Websites → Never Allow',
    duration: '~40 sec',
  },
  {
    step: '03',
    title: 'Let a trusted partner hold the passcode',
    detail:
      'Set a Screen Time passcode held by a trusted friend or family member so restrictions stay firm during late-night urges.',
    pathHint: 'Screen Time → Lock Screen Time Settings',
    duration: '~25 sec',
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
  const [completedAndroidSteps, setCompletedAndroidSteps] = useState<Record<string, boolean>>({});
  const [completedIosSteps, setCompletedIosSteps] = useState<Record<string, boolean>>({});
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const [copiedApkLink, setCopiedApkLink] = useState(false);
  const [copiedIosList, setCopiedIosList] = useState(false);

  const metrics = useMemo(() => getRegistryMetrics(), []);
  const helplines = useMemo(
    () => RECOVERY_RESOURCES.filter((r) => r.category === 'HELPLINES'),
    [],
  );

  const activeSteps = guideTab === 'android' ? ANDROID_STEPS : IOS_STEPS;
  const completedMap = guideTab === 'android' ? completedAndroidSteps : completedIosSteps;
  const completedCount = activeSteps.filter((item) => completedMap[item.step]).length;

  const toggleStepCompletion = (stepId: string) => {
    if (guideTab === 'android') {
      setCompletedAndroidSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
    } else {
      setCompletedIosSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
    }
  };

  const handleDownloadClick = () => {
    setCompletedAndroidSteps((prev) => ({ ...prev, '01': true }));
    onTriggerApkDownload();
  };

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
      setCompletedIosSteps((prev) => ({ ...prev, '02': true }));
      window.setTimeout(() => setCopiedIosList(false), 2200);
    } catch {
      setCopiedIosList(false);
    }
  };

  return (
    <section
      id="install"
      aria-labelledby="install-heading"
      className="border-t border-[var(--subtle-border)] bg-[var(--canvas)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
        {/* Section Editorial Header */}
        <div className="mb-8 flex flex-col justify-between gap-3 sm:mb-10 sm:gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
              06 · Download &amp; Setup Guide
            </p>
            <h2
              id="install-heading"
              className="mt-2 text-balance font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:mt-2.5 sm:text-4xl"
            >
              Install in under two minutes.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:mt-2.5 sm:text-base">
              Get the full native Android app free forever, or follow our 3-step Screen Time guide for iPhone and iPad.
            </p>
          </div>

          <p className="font-mono text-[11px] text-[var(--ink-muted)] sm:text-xs md:text-right">
            Android 7.0+ &amp; iOS · Free forever · No sign-up
          </p>
        </div>

        {/* Main Asymmetric 2-Column Install Stage */}
        <div className="grid items-stretch gap-5 sm:gap-6 lg:grid-cols-12">
          {/* Left 5 Cols: Flat Obsidian Android Download Card (Zero Gradients, Zero Shadows) */}
          <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-white/12 bg-[#0B0E14] p-5 text-white sm:rounded-[28px] sm:p-7 lg:col-span-5 lg:p-8 dark:border-[#232938] dark:bg-[#111520]">
            <div>
              {/* Brand Emblem Lockup */}
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-[#121622] sm:h-13 sm:w-13">
                  <BrandGMark className="h-8 w-8 sm:h-9 sm:w-9" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                    GambleAware for Android
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                    Free Forever · Android 7.0+ · Zero VPN
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-slate-300">
                Full on-device blocking for betting websites, Google Play Store downloads, APK sideloaders, installed betting apps, and popunder ads — while letting any VPN and all everyday apps run freely.
              </p>

              {/* 4-Point Architectural Guarantee Grid (Flat Hairline Dividers) */}
              <dl className="mt-6 grid grid-cols-2 border-y border-white/12">
                <div className="min-w-0 border-r border-b border-white/12 py-3.5 pr-3 sm:pr-4">
                  <dt className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                    Domains &amp; Mirrors
                  </dt>
                  <dd className="mt-1 font-mono text-base font-bold text-white tabular-nums sm:text-lg">
                    {metrics.domainCount.toLocaleString()}+
                  </dd>
                </div>
                <div className="min-w-0 border-b border-white/12 py-3.5 pl-3 sm:pl-4">
                  <dt className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                    Betting Apps
                  </dt>
                  <dd className="mt-1 font-mono text-base font-bold text-white tabular-nums sm:text-lg">
                    {metrics.appCount}+
                  </dd>
                </div>
                <div className="min-w-0 border-r border-white/12 py-3.5 pr-3 sm:pr-4">
                  <dt className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                    VPN Conflict
                  </dt>
                  <dd className="mt-1 font-mono text-base font-bold text-[#FF6BB4] tabular-nums sm:text-lg">
                    0% · Any VPN
                  </dd>
                </div>
                <div className="min-w-0 py-3.5 pl-3 sm:pl-4">
                  <dt className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                    Commitment Lock
                  </dt>
                  <dd className="mt-1 font-mono text-base font-bold text-white tabular-nums sm:text-lg">
                    24h – 2y
                  </dd>
                </div>
              </dl>

              {/* Live Download Confirmation Banner */}
              {downloadStarted ? (
                <div
                  role="status"
                  data-testid="apk-download-feedback"
                  className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[#FF3D9A]/40 bg-[#260E1C] p-3.5 text-xs text-pink-100"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6BB4]" />
                  <div className="min-w-0">
                    <p className="font-semibold break-words text-white">
                      Download started: {APK_DOWNLOAD_FILENAME}
                    </p>
                    <p className="mt-0.5 text-pink-100/85">
                      Open your browser Downloads notification and follow Steps 02 &amp; 03 in the Setup Guide.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Primary & Secondary Action Controls */}
              <div className="mt-6 space-y-2.5">
                <a
                  href={ANDROID_APK_DOWNLOAD_URL}
                  download={APK_DOWNLOAD_FILENAME}
                  data-testid="install-hub-download-btn"
                  onClick={handleDownloadClick}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#D81B78] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#C3166B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6BB4]"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download Android App (APK)</span>
                </a>

                <button
                  type="button"
                  data-testid="copy-apk-link-btn"
                  onClick={handleCopyApkLink}
                  className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-[#141824] px-4 text-xs font-semibold text-slate-200 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {copiedApkLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#FF6BB4]" />
                      <span>Download Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>Copy Download Link to Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quiet Verification Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/12 pt-4 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#FF6BB4]" />
                <span>Private on-device · Zero cloud logs</span>
              </span>
              <span className="font-mono text-slate-500">Signed Release</span>
            </div>
          </div>

          {/* Right 7 Cols: Clean Interactive Guided Timeline (Flat, Responsive) */}
          <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:rounded-[28px] sm:p-7 lg:col-span-7 lg:p-8">
            <div>
              {/* Guide Header & Platform Switcher */}
              <div className="flex flex-col justify-between gap-4 border-b border-[var(--subtle-border)] pb-5 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold tracking-tight text-[var(--ink)] sm:text-xl">
                    Step-by-Step Setup Guide
                  </h3>
                  <p className="mt-1 font-mono text-xs text-[var(--ink-muted)] tabular-nums">
                    {completedCount} of {activeSteps.length} done · Tap a step to check off
                  </p>
                </div>

                <div
                  role="tablist"
                  aria-label="Platform setup guide"
                  className="grid w-full grid-cols-2 items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] p-1 sm:inline-flex sm:w-auto"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={guideTab === 'android'}
                    data-testid="guide-tab-android"
                    onClick={() => setGuideTab('android')}
                    className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors sm:px-3.5 ${
                      guideTab === 'android'
                        ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 shrink-0" />
                    <span>Android APK</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={guideTab === 'ios'}
                    data-testid="guide-tab-ios"
                    onClick={() => setGuideTab('ios')}
                    className={`inline-flex cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors sm:px-3.5 ${
                      guideTab === 'ios'
                        ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    iPhone Guide
                  </button>
                </div>
              </div>

              {/* Interactive Progress Bar */}
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--control-bg)]">
                <div
                  className="h-full rounded-full bg-[var(--active-fill)] transition-transform duration-300 ease-out"
                  style={{
                    transformOrigin: 'left center',
                    transform: `scaleX(${Math.max(0.06, completedCount / activeSteps.length)})`,
                  }}
                />
              </div>

              {/* Vertical Guided Timeline */}
              <div
                className="mt-6"
                data-testid={guideTab === 'android' ? 'guide-panel-android' : 'guide-panel-ios'}
              >
                <ol className="relative space-y-5 sm:space-y-6">
                  {activeSteps.map((item, idx) => {
                    const isDone = Boolean(completedMap[item.step]);
                    const isLast = idx === activeSteps.length - 1;
                    return (
                      <li key={item.step} className="relative flex items-start gap-3.5 sm:gap-4">
                        {/* Vertical connector hairline */}
                        {!isLast ? (
                          <span
                            aria-hidden="true"
                            className={`absolute top-10 left-[17px] h-[calc(100%-1.5rem)] w-px transition-colors ${
                              isDone ? 'bg-[var(--active-fill)]/50' : 'bg-[var(--subtle-border)]'
                            }`}
                          />
                        ) : null}

                        {/* Interactive Milestone Node */}
                        <button
                          type="button"
                          onClick={() => toggleStepCompletion(item.step)}
                          aria-pressed={isDone}
                          aria-label={`Mark step ${item.step}: ${item.title} as ${isDone ? 'incomplete' : 'complete'}`}
                          data-testid={`install-step-${guideTab}-${item.step}`}
                          className={`relative z-10 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border font-mono text-xs font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)] ${
                            isDone
                              ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                              : 'border-[var(--subtle-border)] bg-[var(--canvas)] text-[var(--accent-ink)] hover:border-[var(--active-fill)]'
                          }`}
                        >
                          {isDone ? <Check className="h-4 w-4" /> : item.step}
                        </button>

                        {/* Step Copy */}
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                            <button
                              type="button"
                              onClick={() => toggleStepCompletion(item.step)}
                              className={`cursor-pointer text-left font-display text-[15px] font-bold tracking-tight transition-colors sm:text-base ${
                                isDone
                                  ? 'text-[var(--ink-muted)] line-through decoration-[var(--active-fill)]/60'
                                  : 'text-[var(--ink)] hover:text-[var(--accent-ink)]'
                              }`}
                            >
                              {item.title}
                            </button>
                            <span className="shrink-0 font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                              {isDone ? 'Done' : item.duration}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                            {item.detail}
                          </p>
                          <p className="mt-2 font-mono text-[11px] break-words text-[var(--accent-ink)]">
                            {item.pathHint}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {/* Tab-Specific Footer Utility */}
                {guideTab === 'android' ? (
                  <div className="mt-7 border-t border-[var(--subtle-border)] pt-5">
                    <button
                      type="button"
                      data-testid="troubleshoot-toggle-btn"
                      aria-expanded={troubleshootOpen}
                      onClick={() => setTroubleshootOpen((open) => !open)}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 py-1 text-left text-xs font-semibold text-[var(--ink)] transition-colors hover:text-[var(--accent-ink)]"
                    >
                      <span className="inline-flex min-w-0 items-start gap-2 sm:items-center">
                        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)] sm:mt-0" />
                        <span className="leading-snug">
                          Seeing &ldquo;File might be harmful&rdquo; or Android Restricted Settings?
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[var(--ink-muted)] transition-transform duration-200 ${
                          troubleshootOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {troubleshootOpen ? (
                      <div
                        data-testid="troubleshoot-content"
                        className="mt-3.5 grid gap-4 border-t border-[var(--subtle-border)] pt-4 text-xs leading-relaxed text-[var(--ink-muted)] sm:grid-cols-2"
                      >
                        <div>
                          <p className="font-display text-xs font-bold text-[var(--ink)]">
                            Chrome download prompt
                          </p>
                          <p className="mt-1">
                            Android displays this standard prompt for every direct APK outside Google Play. Tap <strong className="text-[var(--ink)]">Download anyway</strong> to continue safely.
                          </p>
                        </div>
                        <div>
                          <p className="font-display text-xs font-bold text-[var(--ink)]">
                            Android 13+ Restricted Settings
                          </p>
                          <p className="mt-1">
                            If Accessibility looks greyed out, open <em className="text-[var(--ink)]">Settings → Apps → GambleAware → top-right ⋮ menu → Allow restricted settings</em>, then enable GambleAware Shield.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-7 border-t border-[var(--subtle-border)] pt-5">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <p className="font-display text-sm font-bold text-[var(--ink)]">
                          Top {TOP_BETTING_DOMAINS_FOR_IOS.length} Betting Domains for iPhone
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                          Paste directly into Screen Time → Never Allow.
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="copy-ios-domains-btn"
                        onClick={handleCopyIosDomains}
                        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] whitespace-nowrap transition-opacity hover:opacity-90 sm:w-auto"
                      >
                        {copiedIosList ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copied 22 Domains</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy All 22 Domains</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-3 font-mono text-[11px] leading-relaxed break-words text-[var(--ink-muted)]">
                      {TOP_BETTING_DOMAINS_FOR_IOS.join(' · ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confidential Recovery Helplines — Full-Width Hairline Directory */}
        <div className="mt-12 border-t border-[var(--subtle-border)] pt-10 sm:mt-14">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
                <HeartHandshake className="h-4 w-4 shrink-0" />
                <span>Always Reachable · Safe-Support Guard</span>
              </p>
              <h3 className="mt-1.5 font-display text-xl font-bold tracking-tight text-[var(--ink)]">
                Confidential Recovery Helplines
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-muted)]">
              Never blocked by GambleAware — free, private, and available whenever you need support.
            </p>
          </div>

          <div className="mt-6 grid gap-y-6 border-t border-[var(--subtle-border)] pt-6 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-[var(--subtle-border)]">
            {helplines.map((item, index) => (
              <div
                key={item.id}
                className={`flex min-w-0 flex-col justify-between ${
                  index === 0 ? 'lg:pr-6' : index === helplines.length - 1 ? 'lg:pl-6' : 'lg:px-6'
                }`}
              >
                <div>
                  <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
                    {item.region}
                  </p>
                  <p className="mt-1.5 font-display text-sm font-bold text-[var(--ink)]">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
                  {item.phone ? (
                    <a
                      href={`tel:${item.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 font-mono text-[var(--accent-ink)] hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="tabular-nums">{item.phone}</span>
                    </a>
                  ) : null}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--ink)] hover:text-[var(--accent-ink)] hover:underline"
                    >
                      <span>Website</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
